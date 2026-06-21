import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import prisma from '../prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

const router = Router()

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT,
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
})

const upload = multer({ storage: multer.memoryStorage() })

async function uploadToS3(file, filename) {
  const uploader = new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET,
      Key: filename,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    },
  })
  await uploader.done()
  return `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${filename}`
}

function extractS3Key(url) {
  if (!url) return null
  const bucket = process.env.S3_BUCKET
  const marker = `/${bucket}/`
  const idx = url.indexOf(marker)
  return idx !== -1 ? url.slice(idx + marker.length) : null
}

async function deleteFromS3(url) {
  const key = extractS3Key(url)
  if (!key) return
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: key }))
  } catch (err) {
    console.error('Ошибка удаления из S3:', err.message)
  }
}

// GET /courses — публичный список курсов
router.get('/', async (req, res) => {
  const { direction, format, audience, active } = req.query

  const where = {
    ...(direction && { direction }),
    ...(format && { format }),
    ...(audience && { audience }),
    ...(active !== undefined && { isActive: active === 'true' }),
  }

  const courses = await prisma.course.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, title: true, description: true, direction: true,
      format: true, audience: true, startDate: true, endDate: true,
      duration: true, price: true, oldPrice: true, minAge: true, certificate: true,
      imageUrl: true, pdfUrl: true, isActive: true,
      _count: { select: { enrollments: true } },
    },
  })
  res.json(courses)
})

// GET /courses/:id — один курс
router.get('/:id', async (req, res) => {
  const course = await prisma.course.findUnique({
    where: { id: Number(req.params.id) },
    include: { _count: { select: { enrollments: true } } },
  })
  if (!course) return res.status(404).json({ error: 'Курс не найден' })
  res.json(course)
})

// POST /courses — создать курс (editor+)
router.post(
  '/',
  authenticate,
  requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'),
  upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'programFile', maxCount: 1 }]),
  async (req, res) => {
    const { title, description, direction, format, audience, startDate, endDate, duration, price, oldPrice, minAge, certificate, isActive } = req.body
    const files = req.files

    if (!title || !description || !direction || !format || !audience) {
      return res.status(400).json({ error: 'Заполните все обязательные поля' })
    }

    let imageUrl = null
    let pdfUrl = null

    if (files?.imageFile?.[0]) {
      const filename = `courses/${uuidv4()}${path.extname(files.imageFile[0].originalname)}`
      imageUrl = await uploadToS3(files.imageFile[0], filename)
    }

    if (files?.programFile?.[0]) {
      const filename = `programs/${uuidv4()}${path.extname(files.programFile[0].originalname)}`
      pdfUrl = await uploadToS3(files.programFile[0], filename)
    }

    const course = await prisma.course.create({
      data: {
        title,
        description,
        direction,
        format,
        audience,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration,
        price: price ? parseFloat(price) : null,
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        minAge: minAge || null,
        certificate: certificate || null,
        imageUrl,
        pdfUrl,
        isActive: isActive !== 'false',
      },
    })
    res.status(201).json(course)
  }
)

// PUT /courses/:id — обновить курс (editor+)
router.put(
  '/:id',
  authenticate,
  requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'),
  upload.fields([{ name: 'imageFile', maxCount: 1 }, { name: 'programFile', maxCount: 1 }]),
  async (req, res) => {
    const id = Number(req.params.id)
    const { title, description, direction, format, audience, startDate, endDate, duration, price, oldPrice, minAge, certificate, isActive } = req.body
    const files = req.files

    const existing = await prisma.course.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: 'Курс не найден' })

    let imageUrl = existing.imageUrl
    let pdfUrl = existing.pdfUrl

    if (files?.imageFile?.[0]) {
      await deleteFromS3(existing.imageUrl)
      const filename = `courses/${uuidv4()}${path.extname(files.imageFile[0].originalname)}`
      imageUrl = await uploadToS3(files.imageFile[0], filename)
    }

    if (files?.programFile?.[0]) {
      await deleteFromS3(existing.pdfUrl)
      const filename = `programs/${uuidv4()}${path.extname(files.programFile[0].originalname)}`
      pdfUrl = await uploadToS3(files.programFile[0], filename)
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        title, description, direction, format, audience,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        duration,
        price: price ? parseFloat(price) : null,
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        minAge: minAge || null,
        certificate: certificate || null,
        imageUrl, pdfUrl,
        isActive: isActive !== undefined ? isActive !== 'false' : existing.isActive,
      },
    })
    res.json(course)
  }
)

// DELETE /courses/:id — удалить курс (admin+)
router.delete('/:id', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const id = Number(req.params.id)
  const existing = await prisma.course.findUnique({ where: { id } })
  if (!existing) return res.status(404).json({ error: 'Курс не найден' })

  await deleteFromS3(existing.imageUrl)
  await deleteFromS3(existing.pdfUrl)
  await prisma.course.delete({ where: { id } })

  res.json({ message: 'Курс удалён' })
})

export default router

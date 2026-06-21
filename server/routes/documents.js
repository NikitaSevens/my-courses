import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import prisma from '../prisma.js'
import { authenticate } from '../middleware/auth.js'
import { generateDocxFromTemplate } from '../utils/generateDocxFromTemplate.js'
import { sendDocumentEmail } from '../utils/email.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

// GET /documents/my — мои документы
router.get('/my', authenticate, async (req, res) => {
  const documents = await prisma.document.findMany({
    where: { userId: req.user.id },
    include: { course: { select: { id: true, title: true } } },
    orderBy: { createdAt: 'desc' },
  })
  res.json(documents)
})

// POST /documents/send — сгенерировать и отправить заявку (старый /send-doc)
router.post('/send', async (req, res) => {
  try {
    const data = req.body
    const outputDir = path.join(__dirname, '../output')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)

    const filename = `doc_${Date.now()}.docx`
    const filePath = path.join(outputDir, filename)

    await generateDocxFromTemplate(data, filePath)

    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER
    console.log('Отправка документа на:', adminEmail)
    const emailResult = await sendDocumentEmail(adminEmail, filePath, data.courseName || data.course || 'Курс')
    console.log('Результат отправки:', JSON.stringify(emailResult))

    fs.unlinkSync(filePath)

    if (data.userId && data.courseId) {
      await prisma.document.create({
        data: {
          userId: Number(data.userId),
          courseId: Number(data.courseId),
          status: 'SENT',
        },
      })
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('Ошибка при отправке документа:', err)
    res.status(500).json({ error: 'Ошибка при отправке документа' })
  }
})

export default router

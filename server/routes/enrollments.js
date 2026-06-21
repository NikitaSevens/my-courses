import { Router } from 'express'
import prisma from '../prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

const router = Router()

// GET /enrollments/my — мои записи на курсы
router.get('/my', authenticate, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { userId: req.user.id },
    include: {
      course: {
        select: {
          id: true, title: true, direction: true, format: true,
          audience: true, startDate: true, endDate: true,
          duration: true, price: true, imageUrl: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(enrollments)
})

// POST /enrollments/:courseId — записаться на курс
router.post('/:courseId', authenticate, async (req, res) => {
  const courseId = Number(req.params.courseId)

  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return res.status(404).json({ error: 'Курс не найден' })
  if (!course.isActive) return res.status(400).json({ error: 'Запись на этот курс закрыта' })

  const existing = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } },
  })
  if (existing) return res.status(409).json({ error: 'Вы уже записаны на этот курс' })

  const enrollment = await prisma.enrollment.create({
    data: { userId: req.user.id, courseId },
    include: { course: { select: { id: true, title: true } } },
  })
  res.status(201).json(enrollment)
})

// DELETE /enrollments/:courseId — отменить запись
router.delete('/:courseId', authenticate, async (req, res) => {
  const courseId = Number(req.params.courseId)

  const enrollment = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.user.id, courseId } },
  })
  if (!enrollment) return res.status(404).json({ error: 'Запись не найдена' })

  await prisma.enrollment.delete({
    where: { userId_courseId: { userId: req.user.id, courseId } },
  })
  res.json({ message: 'Запись отменена' })
})

// GET /enrollments/course/:courseId — все записавшиеся на курс (admin+)
router.get('/course/:courseId', authenticate, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  const courseId = Number(req.params.courseId)
  const enrollments = await prisma.enrollment.findMany({
    where: { courseId },
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true, middleName: true,
          email: true, phone: true, birthDate: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
  res.json(enrollments)
})

// PUT /enrollments/:id/status — изменить статус записи (admin+)
router.put('/:id/status', authenticate, requireRole('EDITOR', 'ADMIN', 'SUPERADMIN'), async (req, res) => {
  const { status } = req.body
  const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED']
  if (!validStatuses.includes(status)) return res.status(400).json({ error: 'Недопустимый статус' })

  const enrollment = await prisma.enrollment.findUnique({ where: { id: Number(req.params.id) } })
  if (!enrollment) return res.status(404).json({ error: 'Запись не найдена' })

  const updated = await prisma.enrollment.update({
    where: { id: Number(req.params.id) },
    data: { status },
  })
  res.json(updated)
})

// DELETE /enrollments/admin/:id — удалить запись (admin+)
router.delete('/admin/:id', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const enrollment = await prisma.enrollment.findUnique({ where: { id: Number(req.params.id) } })
  if (!enrollment) return res.status(404).json({ error: 'Запись не найдена' })

  await prisma.enrollment.delete({ where: { id: Number(req.params.id) } })
  res.json({ message: 'Запись удалена' })
})

export default router

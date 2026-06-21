import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/roles.js'

const router = Router()

const ROLE_HIERARCHY = { USER: 0, EDITOR: 1, ADMIN: 2, SUPERADMIN: 3 }

// GET /users/me — свой профиль
router.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      middleName: true, phone: true, birthDate: true,
      snils: true, address: true, role: true, isEmailVerified: true, createdAt: true,
    },
  })
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  res.json(user)
})

// PUT /users/me — обновить свой профиль
router.put('/me', authenticate, async (req, res) => {
  const { firstName, lastName, middleName, phone, birthDate, snils, address } = req.body

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: { firstName, lastName, middleName, phone, birthDate: birthDate ? new Date(birthDate) : undefined, snils, address },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      middleName: true, phone: true, birthDate: true, snils: true, address: true, role: true,
    },
  })
  res.json(user)
})

// PUT /users/me/password — сменить пароль
router.put('/me/password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Заполните все поля' })
  if (newPassword.length < 8) return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' })

  const user = await prisma.user.findUnique({ where: { id: req.user.id } })
  const valid = await bcrypt.compare(currentPassword, user.password)
  if (!valid) return res.status(400).json({ error: 'Текущий пароль неверный' })

  const hashed = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

  res.json({ message: 'Пароль изменён' })
})

// GET /users — список всех пользователей (только admin+)
router.get('/', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const { search, role, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    ...(search && {
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(role && { role }),
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, isEmailVerified: true, isBlocked: true, createdAt: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.user.count({ where }),
  ])

  res.json({ users, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
})

// GET /users/:id — профиль пользователя (admin+)
router.get('/:id', authenticate, requireRole('ADMIN', 'SUPERADMIN'), async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: Number(req.params.id) },
    select: {
      id: true, email: true, firstName: true, lastName: true,
      middleName: true, phone: true, birthDate: true,
      snils: true, address: true, role: true, isEmailVerified: true, createdAt: true,
      enrollments: { include: { course: { select: { id: true, title: true } } } },
    },
  })
  if (!user) return res.status(404).json({ error: 'Пользователь не найден' })
  res.json(user)
})

// PUT /users/:id/block — заблокировать / разблокировать (только superadmin)
router.put('/:id/block', authenticate, requireRole('SUPERADMIN'), async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.user.id) return res.status(400).json({ error: 'Нельзя заблокировать самого себя' })

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' })

  if (target.role === 'SUPERADMIN') {
    return res.status(403).json({ error: 'Нельзя заблокировать суперадмина' })
  }

  const { isBlocked } = req.body
  const user = await prisma.user.update({
    where: { id },
    data: { isBlocked: Boolean(isBlocked) },
    select: { id: true, isBlocked: true },
  })

  // инвалидируем все refresh-токены заблокированного пользователя
  if (user.isBlocked) {
    await prisma.refreshToken.deleteMany({ where: { userId: id } })
  }

  res.json(user)
})

// PUT /users/:id/role — изменить роль (только superadmin)
router.put('/:id/role', authenticate, requireRole('SUPERADMIN'), async (req, res) => {
  const { role } = req.body
  const validRoles = ['USER', 'EDITOR', 'ADMIN', 'SUPERADMIN']
  if (!validRoles.includes(role)) return res.status(400).json({ error: 'Недопустимая роль' })

  const target = await prisma.user.findUnique({ where: { id: Number(req.params.id) } })
  if (!target) return res.status(404).json({ error: 'Пользователь не найден' })

  if (ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[req.user.role]) {
    return res.status(403).json({ error: 'Нельзя изменить роль пользователя с равными или более высокими правами' })
  }

  const user = await prisma.user.update({
    where: { id: Number(req.params.id) },
    data: { role },
    select: { id: true, email: true, role: true },
  })
  res.json(user)
})

export default router

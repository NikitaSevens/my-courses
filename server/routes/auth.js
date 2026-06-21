import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../prisma.js'
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateSecureToken } from '../utils/jwt.js'
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/email.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

// POST /auth/register
router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, middleName } = req.body

  if (!email || !password || !firstName || !lastName) {
    return res.status(400).json({ error: 'Заполните все обязательные поля' })
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' })
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return res.status(409).json({ error: 'Пользователь с таким email уже существует' })
  }

  const hashed = await bcrypt.hash(password, 10)
  const verificationToken = generateSecureToken()
  const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000)

  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      firstName,
      lastName,
      middleName,
      isEmailVerified: true,
    },
  })

  res.status(201).json({ message: 'Регистрация успешна. Теперь вы можете войти.' })
})

// GET /auth/verify-email?token=...
router.get('/verify-email', async (req, res) => {
  const { token } = req.query
  if (!token) return res.status(400).json({ error: 'Токен не указан' })

  const user = await prisma.user.findUnique({ where: { verificationToken: token } })

  if (!user || user.verificationTokenExpiry < new Date()) {
    return res.status(400).json({ error: 'Ссылка недействительна или истекла' })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      isEmailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  })

  res.json({ message: 'Email успешно подтверждён' })
})

// POST /auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).json({ error: 'Введите email и пароль' })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) return res.status(401).json({ error: 'Неверный email или пароль' })

  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(401).json({ error: 'Неверный email или пароль' })

  if (user.isBlocked) {
    return res.status(403).json({ error: 'Ваш аккаунт заблокирован. Обратитесь к администратору на эту почту loknoi729@gmail.com.' })
  }

  // Email verification temporarily disabled

  const payload = { id: user.id, email: user.email, role: user.role }
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    },
  })
})

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body
  if (!refreshToken) return res.status(400).json({ error: 'Refresh токен не предоставлен' })

  let payload
  try {
    payload = verifyRefreshToken(refreshToken)
  } catch {
    return res.status(401).json({ error: 'Недействительный refresh токен' })
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } })
  if (!stored || stored.expiresAt < new Date()) {
    return res.status(401).json({ error: 'Refresh токен истёк или не найден' })
  }

  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user) return res.status(401).json({ error: 'Пользователь не найден' })

  const newPayload = { id: user.id, email: user.email, role: user.role }
  const newAccessToken = generateAccessToken(newPayload)
  const newRefreshToken = generateRefreshToken(newPayload)

  await prisma.refreshToken.delete({ where: { token: refreshToken } })
  await prisma.refreshToken.create({
    data: {
      token: newRefreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })

  res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
})

// POST /auth/logout
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } })
  }
  res.json({ message: 'Выход выполнен' })
})

// POST /auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Введите email' })

  const user = await prisma.user.findUnique({ where: { email } })
  // Не раскрываем существует ли пользователь
  if (user) {
    const token = generateSecureToken()
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetTokenExpiry: expiry },
    })

    try {
      await sendPasswordResetEmail(email, token)
    } catch (err) {
      console.error('Ошибка отправки письма:', err.message)
    }
  }

  res.json({ message: 'Если email зарегистрирован — письмо отправлено' })
})

// POST /auth/reset-password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body
  if (!token || !password) return res.status(400).json({ error: 'Укажите токен и новый пароль' })
  if (password.length < 8) return res.status(400).json({ error: 'Пароль должен содержать не менее 8 символов' })

  const user = await prisma.user.findUnique({ where: { passwordResetToken: token } })
  if (!user || user.passwordResetTokenExpiry < new Date()) {
    return res.status(400).json({ error: 'Ссылка недействительна или истекла' })
  }

  const hashed = await bcrypt.hash(password, 10)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      passwordResetToken: null,
      passwordResetTokenExpiry: null,
    },
  })

  await prisma.refreshToken.deleteMany({ where: { userId: user.id } })

  res.json({ message: 'Пароль успешно изменён' })
})

export default router

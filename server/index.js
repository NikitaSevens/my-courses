import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

import authRoutes from './routes/auth.js'
import courseRoutes from './routes/courses.js'
import userRoutes from './routes/users.js'
import enrollmentRoutes from './routes/enrollments.js'
import documentRoutes from './routes/documents.js'

const app = express()

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // В продакшене фронтенд на том же домене — разрешаем
    if (!origin) return callback(null, true)
    if (process.env.NODE_ENV === 'production') return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    console.warn('CORS блокировка для:', origin)
    return callback(new Error('CORS запрещён'), false)
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

app.use(express.json())

app.use('/auth', authRoutes)
app.use('/courses', courseRoutes)
app.use('/users', userRoutes)
app.use('/enrollments', enrollmentRoutes)
app.use('/documents', documentRoutes)

// Обратная совместимость: старый /send-doc
app.use('/send-doc', (req, res, next) => {
  req.url = '/send'
  documentRoutes(req, res, next)
})

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
  app.get('/{*path}', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'))
  })
}

app.use((err, req, res, next) => {
  if (err.message === 'CORS запрещён') {
    return res.status(403).json({ error: 'Запрещённый источник (CORS)' })
  }
  console.error(err)
  res.status(500).json({ error: 'Внутренняя ошибка сервера' })
})

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`))

import { verifyAccessToken } from '../utils/jwt.js'

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Токен не предоставлен' })
  }

  try {
    const token = authHeader.split(' ')[1]
    req.user = verifyAccessToken(token)
    next()
  } catch {
    return res.status(401).json({ error: 'Недействительный или истёкший токен' })
  }
}

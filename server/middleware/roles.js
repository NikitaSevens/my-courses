export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Не авторизован' })
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Недостаточно прав' })
    }
    next()
  }
}

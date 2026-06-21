import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production'

export function generateAccessToken(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' })
}

export function verifyAccessToken(token) {
  return jwt.verify(token, ACCESS_SECRET)
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, REFRESH_SECRET)
}

export function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex')
}

import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CheckCircle, XCircle, Loader } from 'lucide-react'
import { api } from '../../api/client'
import './Auth.css'

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = params.get('token')
    if (!token) { setStatus('error'); setMessage('Ссылка недействительна'); return }

    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('ok'))
      .catch(err => {
        setStatus('error')
        setMessage(err.response?.data?.error || 'Ссылка истекла или уже использована')
      })
  }, [params])

  return (
    <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg-soft)', fontFamily: 'var(--font)' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        {status === 'loading' && (
          <>
            <Loader size={48} style={{ color: 'var(--blue-600)', margin: '0 auto 20px', animation: 'spin .7s linear infinite', display: 'block' }} />
            <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Проверяем ссылку…</h2>
          </>
        )}
        {status === 'ok' && (
          <>
            <CheckCircle size={56} style={{ color: '#1F8A5B', margin: '0 auto 20px', display: 'block' }} />
            <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Email подтверждён!</h2>
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 16 }}>Теперь вы можете войти в личный кабинет.</p>
            <Link className="btn btn-primary btn-lg" to="/login" style={{ marginTop: 28, display: 'inline-flex' }}>
              Войти
            </Link>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle size={56} style={{ color: 'var(--err)', margin: '0 auto 20px', display: 'block' }} />
            <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Ссылка недействительна</h2>
            <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 16 }}>{message}</p>
            <Link className="btn btn-primary btn-lg" to="/login" style={{ marginTop: 28, display: 'inline-flex' }}>
              На страницу входа
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

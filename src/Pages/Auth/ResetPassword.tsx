import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { api } from '../../api/client'
import './Auth.css'

export default function ResetPassword() {
  const [params] = useSearchParams()
  const token = params.get('token')

  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  if (!token) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg-soft)', fontFamily: 'var(--font)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <XCircle size={56} style={{ color: 'var(--err)', margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Ссылка недействительна</h2>
          <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 16 }}>Запросите новую ссылку для сброса пароля.</p>
          <Link className="btn btn-primary btn-lg" to="/login" style={{ marginTop: 28, display: 'inline-flex' }}>На страницу входа</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: 'var(--bg-soft)', fontFamily: 'var(--font)' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
          <CheckCircle size={56} style={{ color: '#1F8A5B', margin: '0 auto 20px', display: 'block' }} />
          <h2 style={{ fontSize: 28, letterSpacing: '-0.03em', margin: 0 }}>Пароль изменён!</h2>
          <p style={{ marginTop: 14, color: 'var(--muted)', fontSize: 16 }}>Теперь вы можете войти с новым паролем.</p>
          <Link className="btn btn-primary btn-lg" to="/login" style={{ marginTop: 28, display: 'inline-flex' }}>Войти</Link>
        </div>
      </div>
    )
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (pass.length < 8) { setError('Минимум 8 символов'); return }
    if (pass !== confirm) { setError('Пароли не совпадают'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password: pass })
      setDone(true)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ссылка истекла или уже использована')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth__brand">
        <Link className="logo" to="/">
          <span className="logo__mark" />My<b>-</b>Course
        </Link>
        <div className="brand__mid">
          <h2 className="brand__head">Придумайте надёжный пароль</h2>
          <p className="brand__sub">Минимум 8 символов. Используйте цифры и заглавные буквы для надёжности.</p>
        </div>
      </aside>

      <main className="auth__main">
        <div className="auth__top">
          <Link className="logo logo-mobile" to="/">
            <span className="logo__mark" />My<b>-</b>Course
          </Link>
        </div>

        <div className="auth__stage">
          <div className="auth__card">
            <span className="view__eyebrow"><Lock size={17} /> Сброс пароля</span>
            <h1 className="view__h1">Новый пароль</h1>
            <p className="view__lead">Введите новый пароль для вашего аккаунта.</p>

            <form className="form" onSubmit={submit} noValidate>
              {error && (
                <div className="server-err"><AlertCircle size={17} /> {error}</div>
              )}

              <div className="field">
                <label>Новый пароль</label>
                <div className="input-wrap">
                  <span className="lead-ico"><Lock size={19} /></span>
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Минимум 8 символов"
                    autoComplete="new-password"
                    value={pass}
                    onChange={e => { setPass(e.target.value); setError('') }}
                  />
                  <button type="button" className="toggle-btn" onClick={() => setShowPass(s => !s)}>
                    {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <div className="field">
                <label>Повторите пароль</label>
                <div className="input-wrap">
                  <span className="lead-ico"><Lock size={19} /></span>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => { setConfirm(e.target.value); setError('') }}
                  />
                  <button type="button" className="toggle-btn" onClick={() => setShowConfirm(s => !s)}>
                    {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                {loading ? <span className="spin" /> : 'Сохранить пароль'}
              </button>
            </form>

            <p className="switch-note">
              Вспомнили пароль? <Link to="/login">Войти</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}

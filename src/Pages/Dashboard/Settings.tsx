import { useState } from 'react'
import { Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

export default function Settings() {
  const { logout } = useAuth()
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const changePassword = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (newPass.length < 8) { setMsg({ type: 'err', text: 'Минимум 8 символов' }); return }
    if (newPass !== confirm) { setMsg({ type: 'err', text: 'Пароли не совпадают' }); return }
    setSaving(true)
    setMsg(null)
    try {
      await api.put('/users/me/password', { currentPassword: oldPass, newPassword: newPass })
      setMsg({ type: 'ok', text: 'Пароль изменён. Войдите снова.' })
      setOldPass(''); setNewPass(''); setConfirm('')
      setTimeout(() => logout(), 2000)
    } catch (err: any) {
      setMsg({ type: 'err', text: err.response?.data?.error || 'Ошибка смены пароля' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="section-head">
        <h2>Настройки</h2>
        <p>Управление паролем и аккаунтом</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '28px', maxWidth: 480 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lock size={18} style={{ color: 'var(--blue-600)' }} /> Смена пароля
        </h3>

        {msg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 'var(--r-xs)', marginBottom: 16, background: msg.type === 'ok' ? '#D1E7DD' : '#F8D7DA', color: msg.type === 'ok' ? '#0A3622' : '#721C24', fontSize: 14 }}>
            {msg.type === 'ok' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg.text}
          </div>
        )}

        <form onSubmit={changePassword} noValidate>
          <div className="profile-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="form-group">
              <label>Текущий пароль</label>
              <input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} placeholder="••••••••" required />
            </div>
            <div className="form-group">
              <label>Новый пароль</label>
              <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Минимум 8 символов" required />
            </div>
            <div className="form-group">
              <label>Повторите новый пароль</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
            </div>
          </div>
          <div className="save-bar">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spin" /> : 'Изменить пароль'}
            </button>
          </div>
        </form>
      </div>
    </>
  )
}

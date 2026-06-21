import { useState, useEffect } from 'react'
import { CheckCircle, AlertCircle } from 'lucide-react'
import { api } from '../../api/client'

interface FormState {
  firstName: string
  lastName: string
  middleName: string
  phone: string
  birthDate: string
  snils: string
  address: string
  email: string
}

type Errors = Partial<Record<keyof FormState, string>>

/* ── Formatters ─────────────────────────────────────────── */
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  const d = digits.startsWith('8') ? '7' + digits.slice(1) : digits.startsWith('7') ? digits : '7' + digits
  const n = d.slice(0, 11)
  if (n.length === 0) return ''
  let result = '+7'
  if (n.length > 1) result += ' (' + n.slice(1, 4)
  if (n.length >= 4) result += ') ' + n.slice(4, 7)
  if (n.length >= 7) result += '-' + n.slice(7, 9)
  if (n.length >= 9) result += '-' + n.slice(9, 11)
  return result
}

function formatSnils(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  let result = digits.slice(0, 3)
  if (digits.length > 3) result += '-' + digits.slice(3, 6)
  if (digits.length > 6) result += '-' + digits.slice(6, 9)
  if (digits.length > 9) result += ' ' + digits.slice(9, 11)
  return result
}

/* ── Validators ─────────────────────────────────────────── */
const NAME_RE = /^[А-ЯЁа-яёA-Za-z\-\s]+$/

function validateForm(form: FormState): Errors {
  const e: Errors = {}

  if (!form.lastName.trim()) {
    e.lastName = 'Обязательное поле'
  } else if (!NAME_RE.test(form.lastName)) {
    e.lastName = 'Только буквы и дефис'
  } else if (form.lastName.trim().length < 2) {
    e.lastName = 'Минимум 2 символа'
  }

  if (!form.firstName.trim()) {
    e.firstName = 'Обязательное поле'
  } else if (!NAME_RE.test(form.firstName)) {
    e.firstName = 'Только буквы и дефис'
  } else if (form.firstName.trim().length < 2) {
    e.firstName = 'Минимум 2 символа'
  }

  if (form.middleName && !NAME_RE.test(form.middleName)) {
    e.middleName = 'Только буквы и дефис'
  }

  if (form.phone) {
    const digits = form.phone.replace(/\D/g, '')
    if (digits.length !== 11) e.phone = 'Введите полный номер (+7 XXX XXX-XX-XX)'
  }

  if (form.birthDate) {
    const d = new Date(form.birthDate)
    const now = new Date()
    const minAge = new Date()
    minAge.setFullYear(now.getFullYear() - 100)
    if (d > now) {
      e.birthDate = 'Дата рождения не может быть в будущем'
    } else if (d < minAge) {
      e.birthDate = 'Проверьте дату рождения'
    }
  }

  if (form.snils) {
    const digits = form.snils.replace(/\D/g, '')
    if (digits.length !== 11) e.snils = 'СНИЛС — 11 цифр (XXX-XXX-XXX XX)'
  }

  if (form.address && form.address.trim().length < 5) {
    e.address = 'Укажите полный адрес'
  }

  return e
}

/* ── Error tip ──────────────────────────────────────────── */
function ErrTip({ msg }: { msg?: string }) {
  if (!msg) return null
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontSize: 12, marginTop: 4 }}>
      <AlertCircle size={13} /> {msg}
    </span>
  )
}

export default function Profile() {
  const [form, setForm] = useState<FormState>({
    firstName: '', lastName: '', middleName: '',
    phone: '', birthDate: '', snils: '', address: '', email: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState<Set<keyof FormState>>(new Set())

  useEffect(() => {
    api.get('/users/me').then(r => {
      const d = r.data
      setForm({
        firstName: d.firstName ?? '',
        lastName: d.lastName ?? '',
        middleName: d.middleName ?? '',
        phone: d.phone ? formatPhone(d.phone) : '',
        birthDate: d.birthDate ? d.birthDate.slice(0, 10) : '',
        snils: d.snils ? formatSnils(d.snils) : '',
        address: d.address ?? '',
        email: d.email ?? '',
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value
    if (k === 'phone') val = formatPhone(val)
    if (k === 'snils') val = formatSnils(val)
    const next = { ...form, [k]: val }
    setForm(next)
    if (touched.has(k)) {
      const errs = validateForm(next)
      setErrors(prev => ({ ...prev, [k]: errs[k] }))
    }
  }

  const blur = (k: keyof FormState) => () => {
    setTouched(prev => new Set([...prev, k]))
    const errs = validateForm(form)
    setErrors(prev => ({ ...prev, [k]: errs[k] }))
  }

  const inputStyle = (k: keyof FormState) => ({
    padding: '10px 14px',
    border: `1px solid ${errors[k] ? '#dc2626' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)' as const,
    fontSize: 15,
    fontFamily: 'var(--font)',
    color: 'var(--text)',
    background: '#fff',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box' as const,
    transition: 'border-color .15s, box-shadow .15s',
  })

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const allKeys: (keyof FormState)[] = ['lastName', 'firstName', 'middleName', 'phone', 'birthDate', 'snils', 'address']
    setTouched(new Set(allKeys))
    const errs = validateForm(form)
    setErrors(errs)
    if (Object.keys(errs).length) return

    setSaving(true)
    try {
      await api.put('/users/me', {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || undefined,
        phone: form.phone ? form.phone.replace(/\D/g, '') : undefined,
        birthDate: form.birthDate || undefined,
        snils: form.snils ? form.snils.replace(/\D/g, '') : undefined,
        address: form.address.trim() || undefined,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '40px 0' }}>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 16, borderRadius: 'var(--r-xs)' }} />)}
    </div>
  )

  return (
    <>
      <div className="section-head">
        <h2>Личные данные</h2>
        <p>Заполните профиль — это нужно для оформления документов</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: '28px' }}>
        <form onSubmit={save} noValidate>
          <div className="profile-grid">

            <div className="form-group">
              <label>Фамилия *</label>
              <input value={form.lastName} onChange={set('lastName')} onBlur={blur('lastName')}
                placeholder="Иванов" style={inputStyle('lastName')} />
              <ErrTip msg={errors.lastName} />
            </div>

            <div className="form-group">
              <label>Имя *</label>
              <input value={form.firstName} onChange={set('firstName')} onBlur={blur('firstName')}
                placeholder="Иван" style={inputStyle('firstName')} />
              <ErrTip msg={errors.firstName} />
            </div>

            <div className="form-group">
              <label>Отчество</label>
              <input value={form.middleName} onChange={set('middleName')} onBlur={blur('middleName')}
                placeholder="Иванович" style={inputStyle('middleName')} />
              <ErrTip msg={errors.middleName} />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input value={form.email} disabled
                style={{ ...inputStyle('email'), background: 'var(--bg-soft)', color: 'var(--muted)' }} />
            </div>

            <div className="form-group">
              <label>Телефон</label>
              <input value={form.phone} onChange={set('phone')} onBlur={blur('phone')}
                placeholder="+7 (900) 000-00-00" type="tel" style={inputStyle('phone')} />
              <ErrTip msg={errors.phone} />
            </div>

            <div className="form-group">
              <label>Дата рождения</label>
              <input value={form.birthDate} onChange={set('birthDate')} onBlur={blur('birthDate')}
                type="date" style={inputStyle('birthDate')} />
              <ErrTip msg={errors.birthDate} />
            </div>

            <div className="form-group">
              <label>СНИЛС</label>
              <input value={form.snils} onChange={set('snils')} onBlur={blur('snils')}
                placeholder="000-000-000 00" style={inputStyle('snils')} />
              <ErrTip msg={errors.snils} />
            </div>

            <div className="form-group full">
              <label>Адрес регистрации</label>
              <input value={form.address} onChange={set('address')} onBlur={blur('address')}
                placeholder="г. Саратов, ул. Примерная, д. 1, кв. 1" style={inputStyle('address')} />
              <ErrTip msg={errors.address} />
            </div>

          </div>

          <div className="save-bar">
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spin" /> : 'Сохранить изменения'}
            </button>
            {saved && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#1F8A5B', fontSize: 14, fontWeight: 600 }}>
                <CheckCircle size={16} /> Сохранено
              </span>
            )}
          </div>
        </form>
      </div>
    </>
  )
}

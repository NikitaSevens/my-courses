import { useState, useEffect } from 'react'
import { X, AlertCircle, ChevronRight, ChevronLeft, CheckCircle, Loader } from 'lucide-react'
import { api } from '../../api/client'

/* ── Types ──────────────────────────────────────────────── */
interface CourseInfo {
  id: number
  title: string
  price?: number | null
  startDate?: string | null
  endDate?: string | null
  duration?: string | null
  format?: string | null
}

interface Props {
  course: CourseInfo
  onClose: () => void
  onSuccess: () => void
}

/* ── Helpers ────────────────────────────────────────────── */
function calcAge(dateStr: string): number {
  if (!dateStr) return 99
  const b = new Date(dateStr)
  const n = new Date()
  let age = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) age--
  return age
}

function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, '')
  const n = (d.startsWith('8') ? '7' + d.slice(1) : d.startsWith('7') ? d : '7' + d).slice(0, 11)
  if (!n.length) return ''
  let r = '+7'
  if (n.length > 1) r += ' (' + n.slice(1, 4)
  if (n.length >= 4) r += ') ' + n.slice(4, 7)
  if (n.length >= 7) r += '-' + n.slice(7, 9)
  if (n.length >= 9) r += '-' + n.slice(9, 11)
  return r
}

function formatSnils(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 11)
  let r = d.slice(0, 3)
  if (d.length > 3) r += '-' + d.slice(3, 6)
  if (d.length > 6) r += '-' + d.slice(6, 9)
  if (d.length > 9) r += ' ' + d.slice(9, 11)
  return r
}

function formatPassportSeries(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4)
  return d.length > 2 ? d.slice(0, 2) + ' ' + d.slice(2) : d
}

/* ── Field component ────────────────────────────────────── */
function Field({ label, error, required, children }: {
  label: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted)' }}>
        {label}{required && ' *'}
      </label>
      {children}
      {error && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontSize: 12 }}>
          <AlertCircle size={12} /> {error}
        </span>
      )}
    </div>
  )
}

const inp = (err?: string): React.CSSProperties => ({
  padding: '10px 13px',
  border: `1px solid ${err ? '#dc2626' : 'var(--border)'}`,
  borderRadius: 'var(--r-xs)',
  fontSize: 14,
  fontFamily: 'var(--font)',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
  color: 'var(--text)',
})

const sel: React.CSSProperties = {
  padding: '10px 13px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-xs)',
  fontSize: 14,
  fontFamily: 'var(--font)',
  outline: 'none',
  width: '100%',
  background: '#fff',
  cursor: 'pointer',
}

/* ── State types ────────────────────────────────────────── */
interface Step1 {
  lastName: string; firstName: string; middleName: string
  birthDate: string; phone: string; email: string; snils: string
  fundingType: string; placeOfStudy: string
}

interface Step2 {
  documentType: string
  docSeries: string; docNumber: string; docDate: string; docIssuedBy: string
  birthCertNumber: string; birthCertDate: string; birthCertPlace: string
  passportAddress: string; notLivingByPassport: boolean; customAddress: string
}

interface ParentData {
  fio: string; phone: string; email: string; birthDate: string
  passportSeries: string; passportNumber: string; passportIssuedBy: string; address: string
}

/* ── Main component ─────────────────────────────────────── */
export default function EnrollModal({ course, onClose, onSuccess }: Props) {
  const [step, setStep] = useState(1)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [errors1, setErrors1] = useState<Partial<Record<keyof Step1, string>>>({})
  const [errors2, setErrors2] = useState<Partial<Record<keyof Step2 | 'parent', string>>>({})

  // auto-detect funding from course price: null/0 = budget, >0 = commercial
  const autoFunding = course.price == null || course.price === 0 ? 'budget' : 'commercial'

  const [s1, setS1] = useState<Step1>({
    lastName: '', firstName: '', middleName: '',
    birthDate: '', phone: '', email: '', snils: '',
    fundingType: autoFunding, placeOfStudy: '',
  })

  const [s2, setS2] = useState<Step2>({
    documentType: '', docSeries: '', docNumber: '', docDate: '',
    docIssuedBy: '', birthCertNumber: '', birthCertDate: '', birthCertPlace: '',
    passportAddress: '', notLivingByPassport: false, customAddress: '',
  })

  const [parent, setParent] = useState<ParentData>({
    fio: '', phone: '', email: '', birthDate: '',
    passportSeries: '', passportNumber: '', passportIssuedBy: '', address: '',
  })

  const age = calcAge(s1.birthDate)
  const needParent = age < 18

  useEffect(() => {
    api.get('/users/me').then(r => {
      const d = r.data
      setS1(prev => ({
        ...prev,
        lastName: d.lastName ?? '',
        firstName: d.firstName ?? '',
        middleName: d.middleName ?? '',
        birthDate: d.birthDate ? d.birthDate.slice(0, 10) : '',
        phone: d.phone ? formatPhone(d.phone) : '',
        email: d.email ?? '',
        snils: d.snils ? formatSnils(d.snils) : '',
        passportAddress: d.address ?? '',
      } as Step1))
    }).catch(console.error).finally(() => setLoadingProfile(false))
  }, [])

  /* ── Validation ─────────────────────────────────────────── */
  const validateStep1 = (): boolean => {
    const e: typeof errors1 = {}
    const NAME_RE = /^[А-ЯЁа-яёA-Za-z\-\s]+$/
    if (!s1.lastName.trim()) e.lastName = 'Обязательное поле'
    else if (s1.lastName.trim().length < 2) e.lastName = 'Минимум 2 символа'
    else if (!NAME_RE.test(s1.lastName)) e.lastName = 'Только буквы и дефис'
    if (!s1.firstName.trim()) e.firstName = 'Обязательное поле'
    else if (s1.firstName.trim().length < 2) e.firstName = 'Минимум 2 символа'
    else if (!NAME_RE.test(s1.firstName)) e.firstName = 'Только буквы и дефис'
    if (!s1.birthDate) {
      e.birthDate = 'Укажите дату рождения'
    } else {
      const a = calcAge(s1.birthDate)
      if (a < 16) e.birthDate = 'Минимальный возраст для записи — 16 лет'
      else if (a > 80) e.birthDate = 'Проверьте дату рождения'
    }
    if (!s1.phone) e.phone = 'Обязательное поле'
    else if (s1.phone.replace(/\D/g, '').length !== 11) e.phone = 'Введите полный номер (+7 XXX XXX-XX-XX)'
    if (!s1.snils) e.snils = 'Обязательное поле'
    else if (s1.snils.replace(/\D/g, '').length !== 11) e.snils = 'СНИЛС — 11 цифр'
    if (!s1.fundingType) e.fundingType = 'Выберите тип финансирования'
    setErrors1(e)
    return Object.keys(e).length === 0
  }

  const validateStep2 = (): boolean => {
    const e: typeof errors2 = {}
    if (!s2.documentType) { e.documentType = 'Выберите тип документа'; setErrors2(e); return false }
    if (s2.documentType === 'passport') {
      if (s2.docSeries.replace(/\D/g, '').length !== 4) e.docSeries = 'Серия — 4 цифры'
      if (s2.docNumber.replace(/\D/g, '').length !== 6) e.docNumber = 'Номер — 6 цифр'
      if (!s2.docDate) e.docDate = 'Укажите дату выдачи'
      else if (new Date(s2.docDate) > new Date()) e.docDate = 'Дата выдачи не может быть в будущем'
      if (!s2.docIssuedBy.trim()) e.docIssuedBy = 'Укажите кем выдан документ'
    } else {
      if (!s2.birthCertNumber.trim()) e.birthCertNumber = 'Укажите номер свидетельства'
    }
    if (!s2.passportAddress.trim()) e.passportAddress = 'Укажите адрес регистрации'
    if (s2.notLivingByPassport && !s2.customAddress.trim()) e.customAddress = 'Укажите фактический адрес'
    if (needParent) {
      const parts = parent.fio.trim().split(/\s+/)
      if (parts.length < 2) {
        e.parent = 'Укажите ФИО родителя (минимум Фамилия Имя)'
      } else if (!parent.phone || parent.phone.replace(/\D/g, '').length !== 11) {
        e.parent = 'Укажите телефон родителя (11 цифр)'
      } else if (parent.birthDate) {
        const parentAge = calcAge(parent.birthDate)
        const userAge = calcAge(s1.birthDate)
        if (parentAge < 18) {
          e.parent = 'Возраст родителя должен быть не менее 18 лет'
        } else if (new Date(parent.birthDate) >= new Date(s1.birthDate)) {
          e.parent = 'Родитель не может быть моложе самого учащегося'
        } else if (parentAge - userAge < 14) {
          e.parent = 'Разница в возрасте между родителем и учащимся должна быть не менее 14 лет'
        }
      }
    }
    setErrors2(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ─────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!validateStep2()) return
    setSubmitting(true)
    try {
      // 1. Create enrollment
      await api.post(`/enrollments/${course.id}`)

      // 2. Send document
      const fullName = s1.lastName.trim() + ' ' + s1.firstName.trim() + (s1.middleName ? ' ' + s1.middleName.trim() : '')
      const fmt = (d?: string | null) => d ? d.slice(0, 10).split('-').reverse().join('.') : ''
      const FORMAT_RU: Record<string, string> = { ONLINE: 'Дистанционно', OFFLINE: 'Очно', MIXED: 'Смешанная' }
      await api.post('/documents/send', {
        name: fullName,
        lastName: s1.lastName.trim(),
        firstName: s1.firstName.trim(),
        middleName: s1.middleName.trim(),
        birthDate: s1.birthDate,
        phone: s1.phone.replace(/\D/g, ''),
        email: s1.email,
        snils: s1.snils.replace(/\D/g, ''),
        fundingType: s1.fundingType,
        placeOfStudy: s1.placeOfStudy,
        course: course.title,
        courseName: course.title,
        courseId: course.id,
        startDate: fmt(course.startDate),
        endDate: fmt(course.endDate),
        duration: course.duration ?? '',
        courseFormat: course.format ? (FORMAT_RU[course.format] ?? course.format) : '',
        age,
        // Document data
        documentType: s2.documentType,
        docSeries: s2.docSeries.replace(/\s/g, ''),
        docNumber: s2.docNumber,
        docDate: s2.docDate,
        docIssuedBy: s2.docIssuedBy,
        birthCertNumber: s2.birthCertNumber,
        birthCertDate: s2.birthCertDate,
        birthCertPlace: s2.birthCertPlace,
        passportAddress: s2.passportAddress,
        customAddress: s2.notLivingByPassport ? s2.customAddress : s2.passportAddress,
        adress: s2.notLivingByPassport ? s2.customAddress : s2.passportAddress,
        // Parent data
        parentFio: parent.fio,
        parentPhone: parent.phone.replace(/\D/g, ''),
        parentEmail: parent.email,
        parentBirthCertNumber: parent.birthDate,
        parentPassport: (parent.passportSeries + parent.passportNumber).replace(/\s/g, ''),
        parentIssuedBy: parent.passportIssuedBy,
        parentAddress: parent.address,
      })

      setDone(true)
      setTimeout(() => { onSuccess(); onClose() }, 2500)
    } catch (err: any) {
      const msg = err.response?.data?.error || ''
      if (msg.includes('уже записаны') || err.response?.status === 409) {
        // Already enrolled — still try to send doc
        alert('Вы уже записаны на этот курс. Заявка не была создана повторно.')
      } else {
        alert(msg || 'Ошибка отправки. Попробуйте снова.')
      }
      setSubmitting(false)
    }
  }

  /* ── Render helpers ─────────────────────────────────────── */
  const grid2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }
  const full: React.CSSProperties = { gridColumn: '1 / -1' }

  if (done) return (
    <Overlay onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <CheckCircle size={60} style={{ color: '#1F8A5B', margin: '0 auto 16px', display: 'block' }} />
        <h2 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>Заявка отправлена!</h2>
        <p style={{ color: 'var(--muted)', margin: 0 }}>
          Договор направлен администратору. Статус записи: <strong>На рассмотрении</strong>
        </p>
      </div>
    </Overlay>
  )

  return (
    <Overlay onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 3 }}>
            Запись на курс
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{course.title}</h2>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', padding: 4 }}>
          <X size={20} />
        </button>
      </div>

      {/* Steps indicator */}
      <div style={{ padding: '14px 24px 0', display: 'flex', gap: 8 }}>
        {['Личные данные', 'Документ'].map((label, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ height: 3, borderRadius: 999, background: step > i ? 'var(--blue-600)' : 'var(--border)', transition: 'background .3s' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: step > i ? 'var(--blue-700)' : 'var(--muted)', letterSpacing: '.02em' }}>
              Шаг {i + 1} · {label}
            </span>
          </div>
        ))}
      </div>

      {/* Body */}
      <div style={{ overflowY: 'auto', padding: '20px 24px', flex: 1 }}>
        {loadingProfile ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <Loader size={32} style={{ color: 'var(--blue-600)', animation: '_spin .8s linear infinite' }} />
          </div>
        ) : step === 1 ? (
          <div style={grid2}>
            <Field label="Фамилия" required error={errors1.lastName}>
              <input style={inp(errors1.lastName)} value={s1.lastName}
                onChange={e => { setS1(p => ({ ...p, lastName: e.target.value })); setErrors1(p => ({ ...p, lastName: '' })) }}
                placeholder="Иванов" />
            </Field>
            <Field label="Имя" required error={errors1.firstName}>
              <input style={inp(errors1.firstName)} value={s1.firstName}
                onChange={e => { setS1(p => ({ ...p, firstName: e.target.value })); setErrors1(p => ({ ...p, firstName: '' })) }}
                placeholder="Иван" />
            </Field>
            <Field label="Отчество" error={errors1.middleName}>
              <input style={inp()} value={s1.middleName}
                onChange={e => setS1(p => ({ ...p, middleName: e.target.value }))}
                placeholder="Иванович" />
            </Field>
            <Field label="Дата рождения" required error={errors1.birthDate}>
              <input style={inp(errors1.birthDate)} value={s1.birthDate} type="date"
                onChange={e => { setS1(p => ({ ...p, birthDate: e.target.value })); setErrors1(p => ({ ...p, birthDate: '' })) }} />
            </Field>
            <Field label="Телефон" required error={errors1.phone}>
              <input style={inp(errors1.phone)} value={s1.phone} type="tel" placeholder="+7 (900) 000-00-00"
                onChange={e => { setS1(p => ({ ...p, phone: formatPhone(e.target.value) })); setErrors1(p => ({ ...p, phone: '' })) }} />
            </Field>
            <Field label="Email" error={undefined}>
              <input style={{ ...inp(), background: 'var(--bg-soft)', color: 'var(--muted)' }} value={s1.email} disabled />
            </Field>
            <Field label="СНИЛС" required error={errors1.snils}>
              <input style={inp(errors1.snils)} value={s1.snils} placeholder="000-000-000 00"
                onChange={e => { setS1(p => ({ ...p, snils: formatSnils(e.target.value) })); setErrors1(p => ({ ...p, snils: '' })) }} />
            </Field>
            <Field label="Место работы / учёбы" error={undefined}>
              <input style={inp()} value={s1.placeOfStudy} placeholder="МОУ СОШ №1 г. Саратова"
                onChange={e => setS1(p => ({ ...p, placeOfStudy: e.target.value }))} />
            </Field>
            <div style={full}>
              <Field label="Тип финансирования" required error={errors1.fundingType}>
                {course.price != null ? (
                  /* auto-detected from course price — read-only */
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      style={{ ...inp(), background: 'var(--bg-soft)', color: 'var(--text)', flex: 1 }}
                      value={course.price === 0 ? 'Бюджет (бесплатно)' : `Коммерция (${course.price.toLocaleString('ru-RU')} ₽)`}
                      disabled
                    />
                    <span style={{ fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>
                      Определено автоматически
                    </span>
                  </div>
                ) : (
                  <select style={{ ...sel, borderColor: errors1.fundingType ? '#dc2626' : 'var(--border)' }}
                    value={s1.fundingType}
                    onChange={e => { setS1(p => ({ ...p, fundingType: e.target.value })); setErrors1(p => ({ ...p, fundingType: '' })) }}>
                    <option value="">Выберите…</option>
                    <option value="budget">Бюджет</option>
                    <option value="commercial">Коммерция</option>
                  </select>
                )}
                {errors1.fundingType && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontSize: 12, marginTop: 4 }}><AlertCircle size={12} />{errors1.fundingType}</span>}
              </Field>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Тип документа" required error={errors2.documentType}>
              <select style={{ ...sel, borderColor: errors2.documentType ? '#dc2626' : 'var(--border)' }}
                value={s2.documentType}
                onChange={e => { setS2(p => ({ ...p, documentType: e.target.value })); setErrors2(p => ({ ...p, documentType: '' })) }}>
                <option value="">Выберите…</option>
                <option value="passport">Паспорт РФ</option>
                <option value="birthCert">Свидетельство о рождении</option>
              </select>
              {errors2.documentType && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#dc2626', fontSize: 12, marginTop: 4 }}><AlertCircle size={12} />{errors2.documentType}</span>}
            </Field>

            {s2.documentType === 'passport' && (
              <div style={grid2}>
                <Field label="Серия" required error={errors2.docSeries}>
                  <input style={inp(errors2.docSeries)} value={s2.docSeries} placeholder="12 34" maxLength={5}
                    onChange={e => { setS2(p => ({ ...p, docSeries: formatPassportSeries(e.target.value) })); setErrors2(p => ({ ...p, docSeries: '' })) }} />
                </Field>
                <Field label="Номер" required error={errors2.docNumber}>
                  <input style={inp(errors2.docNumber)} value={s2.docNumber} placeholder="123456" maxLength={6}
                    onChange={e => { setS2(p => ({ ...p, docNumber: e.target.value.replace(/\D/g, '').slice(0, 6) })); setErrors2(p => ({ ...p, docNumber: '' })) }} />
                </Field>
                <Field label="Дата выдачи" required error={errors2.docDate}>
                  <input style={inp(errors2.docDate)} value={s2.docDate} type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={e => { setS2(p => ({ ...p, docDate: e.target.value })); setErrors2(p => ({ ...p, docDate: '' })) }} />
                </Field>
                <Field label="Кем выдан" required error={errors2.docIssuedBy}>
                  <input style={inp(errors2.docIssuedBy)} value={s2.docIssuedBy} placeholder="ГУ МВД России по…"
                    onChange={e => { setS2(p => ({ ...p, docIssuedBy: e.target.value })); setErrors2(p => ({ ...p, docIssuedBy: '' })) }} />
                </Field>
              </div>
            )}

            {s2.documentType === 'birthCert' && (
              <div style={grid2}>
                <Field label="Серия и номер свидетельства" required error={errors2.birthCertNumber}>
                  <input style={inp(errors2.birthCertNumber)} value={s2.birthCertNumber} placeholder="III-АН № 222222"
                    onChange={e => { setS2(p => ({ ...p, birthCertNumber: e.target.value })); setErrors2(p => ({ ...p, birthCertNumber: '' })) }} />
                </Field>
                <Field label="Дата выдачи" error={undefined}>
                  <input style={inp()} value={s2.birthCertDate} type="date"
                    onChange={e => setS2(p => ({ ...p, birthCertDate: e.target.value }))} />
                </Field>
                <div style={full}>
                  <Field label="Место государственной регистрации" error={undefined}>
                    <input style={inp()} value={s2.birthCertPlace} placeholder="Отдел ЗАГС г. Саратова"
                      onChange={e => setS2(p => ({ ...p, birthCertPlace: e.target.value }))} />
                  </Field>
                </div>
              </div>
            )}

            {s2.documentType && (
              <>
                <Field label="Адрес регистрации (по документу)" required error={errors2.passportAddress}>
                  <input style={inp(errors2.passportAddress)} value={s2.passportAddress}
                    placeholder="г. Саратов, ул. Примерная, д. 1, кв. 1"
                    onChange={e => { setS2(p => ({ ...p, passportAddress: e.target.value })); setErrors2(p => ({ ...p, passportAddress: '' })) }} />
                </Field>

                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14 }}>
                  <input type="checkbox" checked={s2.notLivingByPassport}
                    onChange={e => setS2(p => ({ ...p, notLivingByPassport: e.target.checked }))} />
                  Фактически проживаю по другому адресу
                </label>

                {s2.notLivingByPassport && (
                  <Field label="Адрес фактического проживания" error={undefined}>
                    <input style={inp()} value={s2.customAddress}
                      placeholder="г. Саратов, ул. Другая, д. 2, кв. 3"
                      onChange={e => setS2(p => ({ ...p, customAddress: e.target.value }))} />
                  </Field>
                )}

                {needParent && (
                  <div style={{ background: 'var(--blue-50)', borderRadius: 'var(--r-sm)', padding: 16, border: '1px solid var(--blue-100)' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--blue-700)', marginBottom: 14, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                      Данные родителя / законного представителя
                    </div>
                    {errors2.parent && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontSize: 13, marginBottom: 10 }}>
                        <AlertCircle size={14} /> {errors2.parent}
                      </div>
                    )}
                    <div style={grid2}>
                      <div style={full}>
                        <Field label="ФИО родителя" required error={undefined}>
                          <input style={inp()} value={parent.fio} placeholder="Иванов Иван Иванович"
                            onChange={e => setParent(p => ({ ...p, fio: e.target.value }))} />
                        </Field>
                      </div>
                      <Field label="Телефон" required error={undefined}>
                        <input style={inp()} value={parent.phone} type="tel" placeholder="+7 (900) 000-00-00"
                          onChange={e => setParent(p => ({ ...p, phone: formatPhone(e.target.value) }))} />
                      </Field>
                      <Field label="Email" error={undefined}>
                        <input style={inp()} value={parent.email} type="email" placeholder="parent@mail.ru"
                          onChange={e => setParent(p => ({ ...p, email: e.target.value }))} />
                      </Field>
                      <Field label="Дата рождения родителя" error={undefined}>
                        <input style={inp()} value={parent.birthDate} type="date"
                          max={new Date().toISOString().slice(0, 10)}
                          onChange={e => setParent(p => ({ ...p, birthDate: e.target.value }))} />
                      </Field>
                      <Field label="Серия и номер паспорта" error={undefined}>
                        <input style={inp()} value={parent.passportSeries + (parent.passportNumber ? ' ' + parent.passportNumber : '')}
                          placeholder="1234 567890" maxLength={11}
                          onChange={e => {
                            const d = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setParent(p => ({ ...p, passportSeries: d.slice(0, 4), passportNumber: d.slice(4) }))
                          }} />
                      </Field>
                      <Field label="Кем выдан паспорт" error={undefined}>
                        <input style={inp()} value={parent.passportIssuedBy} placeholder="ГУ МВД России…"
                          onChange={e => setParent(p => ({ ...p, passportIssuedBy: e.target.value }))} />
                      </Field>
                      <div style={full}>
                        <Field label="Адрес проживания родителя" error={undefined}>
                          <input style={inp()} value={parent.address} placeholder="г. Саратов, ул. …"
                            onChange={e => setParent(p => ({ ...p, address: e.target.value }))} />
                        </Field>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, flexShrink: 0, justifyContent: 'space-between' }}>
        {step === 2 ? (
          <button className="btn btn-ghost btn-sm" onClick={() => setStep(1)}>
            <ChevronLeft size={16} /> Назад
          </button>
        ) : <div />}

        {step === 1 ? (
          <button className="btn btn-primary btn-sm" onClick={() => { if (validateStep1()) setStep(2) }}>
            Далее <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={submitting}>
            {submitting ? <><span className="spin" /> Отправка…</> : <><CheckCircle size={15} /> Отправить заявку</>}
          </button>
        )}
      </div>
    </Overlay>
  )
}

/* ── Overlay wrapper ────────────────────────────────────── */
function Overlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(2px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: '#fff', borderRadius: 'var(--r)',
        width: '100%', maxWidth: 640, maxHeight: '90dvh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 24px 80px rgba(0,0,0,.22)',
        fontFamily: 'var(--font)',
      }}>
        {children}
      </div>
    </div>
  )
}

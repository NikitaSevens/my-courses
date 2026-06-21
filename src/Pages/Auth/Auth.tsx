import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogIn, UserPlus, KeyRound, Mail, Lock, Eye, EyeOff,
  ArrowRight, ArrowLeft, Check, AlertCircle,
  MailCheck, MailOpen, CheckCircle, User, X, Headphones,
} from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import './Auth.css'

type Screen = 'login' | 'register' | 'forgot' | 'sent' | 'check'

/* ── Toast ─────────────────────────────────────────────── */
function useToast() {
  const [msg, setMsg] = useState('')
  const [visible, setVisible] = useState(false)

  const show = (text: string) => {
    setMsg(text)
    setVisible(true)
    setTimeout(() => setVisible(false), 3000)
  }

  return { msg, visible, show }
}

/* ── Password strength ──────────────────────────────────── */
function strengthLevel(p: string): number {
  if (p.length < 6) return p.length > 0 ? 1 : 0
  let score = 0
  if (p.length >= 8) score++
  if (/[A-ZА-Я]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-zА-Яа-я0-9]/.test(p)) score++
  return Math.max(1, score)
}

/* ── Shared field component ─────────────────────────────── */
interface FieldProps {
  label?: React.ReactNode
  icon: React.ReactNode
  error?: string
  children: React.ReactNode
}
function Field({ label, icon, error, children }: FieldProps) {
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div className={`input-wrap${error ? ' field-err' : ''}`}>
        <span className="lead-ico">{icon}</span>
        {children}
      </div>
      {error && (
        <span className="err-msg show">
          <AlertCircle size={14} /> {error}
        </span>
      )}
    </div>
  )
}

/* ── Login screen ───────────────────────────────────────── */
function LoginScreen({ goTo }: { goTo: (s: Screen) => void }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverErr, setServerErr] = useState('')

  const validate = () => {
    const e: Record<string, string> = {}
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Введите корректный email'
    if (!pass) e.pass = 'Введите пароль'
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    setServerErr('')
    try {
      await login(email, pass)
      navigate('/dashboard')
    } catch (err: any) {
      setServerErr(err.response?.data?.error || 'Ошибка входа')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth__card" key="login">
      <span className="view__eyebrow"><LogIn size={17} /> Личный кабинет</span>
      <h1 className="view__h1">С возвращением 👋</h1>
      <p className="view__lead">Войдите, чтобы продолжить обучение.</p>

      <form className="form" onSubmit={submit} noValidate>
        {serverErr && (
          <div className="server-err"><AlertCircle size={17} /> {serverErr}</div>
        )}

        <Field label="Email" icon={<Mail size={19} />} error={errors.email}>
          <input
            type="email" placeholder="you@example.ru" autoComplete="email"
            value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
          />
        </Field>

        <div className="field">
          <div className="field-row">
            <label>Пароль</label>
            <button type="button" className="link" onClick={() => goTo('forgot')}>Забыли пароль?</button>
          </div>
          <div className={`input-wrap${errors.pass ? ' field-err' : ''}`}>
            <span className="lead-ico"><Lock size={19} /></span>
            <input
              type={showPass ? 'text' : 'password'} placeholder="••••••••" autoComplete="current-password"
              value={pass} onChange={e => { setPass(e.target.value); setErrors(p => ({ ...p, pass: '' })) }}
            />
            <button type="button" className="toggle-btn" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.pass && <span className="err-msg show"><AlertCircle size={14} /> {errors.pass}</span>}
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spin" /> : <><span>Войти</span> <ArrowRight size={19} /></>}
        </button>
      </form>

      <p className="switch-note">
        Нет аккаунта?{' '}
        <button onClick={() => goTo('register')}>Зарегистрируйтесь</button>
      </p>
    </div>
  )
}

/* ── Register screen ────────────────────────────────────── */
function RegisterScreen({ goTo, setRegEmail, onOpenTerms }: { goTo: (s: Screen) => void; setRegEmail: (e: string) => void; onOpenTerms: () => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [consent, setConsent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [serverErr, setServerErr] = useState('')
  const strength = pass ? strengthLevel(pass) : 0

  const validate = () => {
    const e: Record<string, string> = {}
    const parts = name.trim().split(/\s+/)
    if (parts.length < 2) e.name = 'Укажите фамилию и имя'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Введите корректный email'
    if (pass.length < 8) e.pass = 'Минимум 8 символов'
    if (pass !== confirm) e.confirm = 'Пароли не совпадают'
    if (!consent) e.consent = 'Необходимо согласие'
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return
    setLoading(true)
    setServerErr('')
    try {
      const parts = name.trim().split(/\s+/)
      const lastName = parts[0]
      const firstName = parts[1]
      const middleName = parts[2]
      await api.post('/auth/register', { email, password: pass, firstName, lastName, middleName })
      setRegEmail(email)
      goTo('check')
    } catch (err: any) {
      setServerErr(err.response?.data?.error || 'Ошибка регистрации')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth__card" key="register">
      <span className="view__eyebrow"><UserPlus size={17} /> Создание аккаунта</span>
      <h1 className="view__h1">Создайте аккаунт</h1>
      <p className="view__lead">Это бесплатно и займёт меньше минуты.</p>

      <form className="form" onSubmit={submit} noValidate>
        {serverErr && <div className="server-err"><AlertCircle size={17} /> {serverErr}</div>}

        <Field label="ФИО" icon={<LogIn size={19} />} error={errors.name}>
          <input
            type="text" placeholder="Иванов Иван Иванович" autoComplete="name"
            value={name} onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })) }}
          />
        </Field>

        <Field label="Email" icon={<Mail size={19} />} error={errors.email}>
          <input
            type="email" placeholder="you@example.ru" autoComplete="email"
            value={email} onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: '' })) }}
          />
        </Field>

        <div className="field">
          <label>Пароль</label>
          <div className={`input-wrap${errors.pass ? ' field-err' : ''}`}>
            <span className="lead-ico"><Lock size={19} /></span>
            <input
              type={showPass ? 'text' : 'password'} placeholder="Минимум 8 символов" autoComplete="new-password"
              value={pass} onChange={e => { setPass(e.target.value); setErrors(p => ({ ...p, pass: '' })) }}
            />
            <button type="button" className="toggle-btn" onClick={() => setShowPass(s => !s)}>
              {showPass ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          <div className={`strength${pass ? ' show' : ''}`} data-lvl={strength}>
            <i /><i /><i /><i />
          </div>
          {errors.pass && <span className="err-msg show"><AlertCircle size={14} /> {errors.pass}</span>}
        </div>

        <div className="field">
          <label>Повторите пароль</label>
          <div className={`input-wrap${errors.confirm ? ' field-err' : ''}`}>
            <span className="lead-ico"><Lock size={19} /></span>
            <input
              type={showConfirm ? 'text' : 'password'} placeholder="••••••••" autoComplete="new-password"
              value={confirm} onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: '' })) }}
            />
            <button type="button" className="toggle-btn" onClick={() => setShowConfirm(s => !s)}>
              {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.confirm && <span className="err-msg show"><AlertCircle size={14} /> {errors.confirm}</span>}
        </div>

        <label className={`check${errors.consent ? ' check-err' : ''}`}>
          <input type="checkbox" checked={consent} onChange={e => { setConsent(e.target.checked); setErrors(p => ({ ...p, consent: '' })) }} />
          <span className="box"><Check size={14} /></span>
          <span className="txt">Я согласен на обработку персональных данных и принимаю{' '}
            <button type="button" className="link" onClick={onOpenTerms}>условия использования</button>
          </span>
        </label>

        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spin" /> : 'Создать аккаунт'}
        </button>
      </form>

      <p className="switch-note">
        Уже есть аккаунт? <button onClick={() => goTo('login')}>Войдите</button>
      </p>
    </div>
  )
}

/* ── Forgot screen ──────────────────────────────────────── */
function ForgotScreen({ goTo, setForgotEmail }: { goTo: (s: Screen) => void; setForgotEmail: (e: string) => void }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Введите корректный email'); return }
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setForgotEmail(email)
      goTo('sent')
    } catch {
      goTo('sent') // не раскрываем наличие email
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth__card" key="forgot">
      <button className="back-btn" onClick={() => goTo('login')}>
        <ArrowLeft size={17} /> Назад ко входу
      </button>
      <span className="view__eyebrow"><KeyRound size={17} /> Восстановление</span>
      <h1 className="view__h1">Забыли пароль?</h1>
      <p className="view__lead">Укажите email — пришлём ссылку для сброса пароля.</p>

      <form className="form" onSubmit={submit} noValidate>
        <Field label="Email" icon={<Mail size={19} />} error={error}>
          <input
            type="email" placeholder="you@example.ru" autoComplete="email"
            value={email} onChange={e => { setEmail(e.target.value); setError('') }}
          />
        </Field>
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
          {loading ? <span className="spin" /> : 'Отправить ссылку'}
        </button>
      </form>
    </div>
  )
}

/* ── Info screen (sent / check email) ───────────────────── */
function InfoScreen({
  icon, title, lead, email, primaryLabel, primaryHref,
  secondaryLabel, onSecondary, resendLabel, onResend,
}: {
  icon: React.ReactNode; title: string; lead: string; email: string
  primaryLabel: string; primaryHref?: string
  secondaryLabel: string; onSecondary: () => void
  resendLabel: string; onResend: () => void
}) {
  return (
    <div className="auth__card info" key={title}>
      <div className="info__ico">{icon}</div>
      <h2>{title}</h2>
      <p className="info__lead">{lead} <b>{email}</b></p>
      <div className="info__actions">
        {primaryHref
          ? <a className="btn btn-primary btn-lg btn-block" href={primaryHref} target="_blank" rel="noreferrer">{primaryLabel}</a>
          : <button className="btn btn-primary btn-lg btn-block" onClick={onResend}>{primaryLabel}</button>
        }
        <button className="btn btn-ghost btn-lg btn-block" onClick={onSecondary}>{secondaryLabel}</button>
      </div>
      <p className="info__resend">
        Письмо не пришло? <button onClick={onResend}>{resendLabel}</button>
      </p>
    </div>
  )
}

/* ── Terms of Use popup ─────────────────────────────────── */
function TermsPopup({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="support-backdrop">
      <div className="support-popup terms-popup" ref={ref}>
        <button className="support-popup__close" onClick={onClose}><X size={18} /></button>
        <h3>Условия использования и обработка персональных данных</h3>

        <div className="terms-body">
          <p><strong>1. Общие положения</strong></p>
          <p>Используя платформу ЦОПП Академия (далее — «Платформа»), вы соглашаетесь с настоящими условиями. Платформа предназначена для организации обучения и записи на курсы профессиональной подготовки.</p>

          <p><strong>2. Персональные данные</strong></p>
          <p>При регистрации вы предоставляете: фамилию, имя, отчество, адрес электронной почты, номер телефона и иные сведения, необходимые для оформления учебной документации.</p>

          <p><strong>3. Цели обработки</strong></p>
          <p>Ваши данные используются исключительно для: записи на курсы, формирования договоров и документов об образовании (удостоверений, свидетельств, сертификатов), а также для информирования об учебном процессе.</p>

          <p><strong>4. Сроки хранения</strong></p>
          <p>Персональные данные хранятся до момента, когда они перестают быть необходимыми — как правило, до завершения обучения и оформления всех документов. После этого данные удаляются или обезличиваются в соответствии с требованиями законодательства Российской Федерации.</p>

          <p><strong>5. Передача третьим лицам</strong></p>
          <p>Мы не передаём ваши данные третьим лицам без вашего согласия, за исключением случаев, предусмотренных законодательством РФ.</p>

          <p><strong>6. Ваши права</strong></p>
          <p>Вы вправе в любой момент запросить доступ к своим данным, потребовать их исправления или удаления, направив запрос на почту <a href="mailto:loknoi729@gmail.com">loknoi729@gmail.com</a>.</p>

          <p><strong>7. Согласие</strong></p>
          <p>Нажимая «Создать аккаунт», вы подтверждаете, что ознакомились с настоящими условиями и даёте согласие на обработку персональных данных.</p>
        </div>

        <button className="btn btn-primary btn-block" style={{ marginTop: 20 }} onClick={onClose}>
          Понятно
        </button>
      </div>
    </div>
  )
}

/* ── Support popup ──────────────────────────────────────── */
function SupportPopup({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div className="support-backdrop">
      <div className="support-popup" ref={ref}>
        <button className="support-popup__close" onClick={onClose}><X size={18} /></button>
        <div className="support-popup__ico"><Headphones size={28} /></div>
        <h3>Служба поддержки</h3>
        <p>
          Напишите нам на почту:{' '}
          <a href="mailto:loknoi729@gmail.com">loknoi729@gmail.com</a>
        </p>
        <p>
          Мы отвечаем в течение <strong>30 минут</strong> в рабочее время.
          Время ответа зависит от загруженности службы поддержки и в некоторых случаях
          может составлять до <strong>24 часов</strong>.
        </p>
        <p className="support-popup__note">
          Рабочие часы: пн–пт, 09:00–18:00 (МСК)
        </p>
      </div>
    </div>
  )
}

/* ── Brand panel ────────────────────────────────────────── */
function Brand() {
  return (
    <aside className="auth__brand">
      <Link className="logo" to="/">
        <span className="logo__mark" />My<b>-</b>Course
      </Link>
      <div className="brand__mid">
        <h2 className="brand__head">Новая профессия начинается здесь</h2>
        <p className="brand__sub">Войдите в личный кабинет, чтобы записываться на курсы, отслеживать прогресс и получать документы.</p>
        <ul className="brand__list">
          <li><span className="chk"><Check size={16} /></span>120+ курсов: от IT до рабочих профессий</li>
          <li><span className="chk"><Check size={16} /></span>Бесплатное обучение по программам ЦОПП</li>
          <li><span className="chk"><Check size={16} /></span>Документ о квалификации после выпуска</li>
        </ul>
      </div>
      <div className="brand__quote">
        <p className="q">«Записалась на курс токаря через платформу за пять минут — и уже через два месяца вышла на завод с разрядом.»</p>
        <div className="who">
          <span className="ava"><User size={20} /></span>
          <div><b>Марина К.</b><span>выпускница, Саратов</span></div>
        </div>
      </div>
    </aside>
  )
}

/* ── Auth page ──────────────────────────────────────────── */
export default function Auth() {
  const location = useLocation()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [screen, setScreen] = useState<Screen>(() =>
    location.hash === '#register' ? 'register' : 'login'
  )
  const [forgotEmail, setForgotEmail] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [showSupport, setShowSupport] = useState(false)
  const [showTerms, setShowTerms] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const goTo = (s: Screen) => setScreen(s)

  const handleResend = async (type: 'forgot' | 'check') => {
    const email = type === 'forgot' ? forgotEmail : regEmail
    if (!email) return
    try {
      if (type === 'forgot') await api.post('/auth/forgot-password', { email })
      else await api.post('/auth/register/resend', { email })
      toast.show('Письмо отправлено повторно')
    } catch {
      toast.show('Не удалось отправить письмо')
    }
  }

  return (
    <div className="auth-page">
      <Brand />

      <main className="auth__main">
        <div className="auth__top">
          <Link className="logo logo-mobile" to="/">
            <span className="logo__mark" />My<b>-</b>Course
          </Link>
          <span className="help"><span className="help-prefix">Нужна помощь? </span><button className="link" onClick={() => setShowSupport(true)}>Поддержка</button></span>
        </div>

        <div className="auth__stage">
          {screen === 'login' && <LoginScreen goTo={goTo} />}
          {screen === 'register' && <RegisterScreen goTo={goTo} setRegEmail={setRegEmail} onOpenTerms={() => setShowTerms(true)} />}
          {screen === 'forgot' && <ForgotScreen goTo={goTo} setForgotEmail={setForgotEmail} />}
          {screen === 'sent' && (
            <InfoScreen
              icon={<MailCheck size={42} />}
              title="Ссылка отправлена"
              lead="Мы отправили ссылку для сброса пароля на"
              email={forgotEmail}
              primaryLabel="Открыть почту"
              primaryHref={`https://mail.${forgotEmail.split('@')[1]}`}
              secondaryLabel="Вернуться ко входу"
              onSecondary={() => goTo('login')}
              resendLabel="Отправить ещё раз"
              onResend={() => handleResend('forgot')}
            />
          )}
          {screen === 'check' && (
            <InfoScreen
              icon={<MailOpen size={42} />}
              title="Проверьте почту"
              lead="Мы отправили письмо для подтверждения на"
              email={regEmail}
              primaryLabel="Открыть почту"
              primaryHref={`https://mail.${regEmail.split('@')[1]}`}
              secondaryLabel="Перейти ко входу"
              onSecondary={() => goTo('login')}
              resendLabel="Отправить повторно"
              onResend={() => handleResend('check')}
            />
          )}
        </div>
      </main>

      <div className={`toast${toast.visible ? ' show' : ''}`}>
        <CheckCircle size={17} /> <span>{toast.msg}</span>
      </div>

      {showSupport && <SupportPopup onClose={() => setShowSupport(false)} />}
      {showTerms && <TermsPopup onClose={() => setShowTerms(false)} />}
    </div>
  )
}

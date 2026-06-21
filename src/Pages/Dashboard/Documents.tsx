import { useEffect, useState } from 'react'
import { FileText, Download, Clock, MapPin, Wifi, BookOpen } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Enrollment {
  id: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED'
  createdAt: string
  course: {
    id: number
    title: string
    direction: string | null
    format: string
    audience: string | null
    duration: string | null
    price: number | null
    startDate: string | null
    imageUrl: string | null
  }
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'На рассмотрении',
  ACTIVE: 'Зачислен',
  COMPLETED: 'Завершён',
  REJECTED: 'Отклонён',
}
const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge status-pending',
  ACTIVE: 'badge status-active',
  COMPLETED: 'badge status-completed',
  REJECTED: 'badge status-rejected',
}
const AUD_LABEL: Record<string, string> = { SCHOOL: 'Школьникам', STUDENT: 'Студентам', ADULT: 'Взрослым' }
const FORMAT_LABEL: Record<string, string> = { ONLINE: 'Онлайн', OFFLINE: 'Очно' }

function printConfirmation(en: Enrollment, userName: string) {
  const isFree = !en.course.price || en.course.price === 0
  const enrollDate = new Date(en.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const startDate = en.course.startDate
    ? new Date(en.course.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'по расписанию'

  const html = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Подтверждение записи — ${en.course.title}</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1a1a2e; font-size: 15px; line-height: 1.6; }
  h1 { font-size: 22px; font-weight: 800; margin-bottom: 4px; }
  .sub { color: #666; font-size: 14px; margin-bottom: 32px; }
  .block { background: #f5f7fa; border-radius: 12px; padding: 20px 24px; margin-bottom: 16px; }
  .block h2 { font-size: 14px; font-weight: 700; color: #666; text-transform: uppercase; letter-spacing: .06em; margin: 0 0 12px; }
  .row { display: flex; gap: 16px; margin-bottom: 8px; }
  .row b { width: 160px; flex-shrink: 0; color: #333; }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 13px; font-weight: 700; background: #d1e7dd; color: #0a3622; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #888; }
  @media print { body { margin: 20px; } }
</style>
</head>
<body>
  <h1>Подтверждение записи на курс</h1>
  <p class="sub">ЦОПП Академия Саратов · My-Course</p>

  <div class="block">
    <h2>Слушатель</h2>
    <div class="row"><b>ФИО</b> <span>${userName}</span></div>
    <div class="row"><b>Дата записи</b> <span>${enrollDate}</span></div>
    <div class="row"><b>Статус</b> <span class="badge">${STATUS_LABEL[en.status]}</span></div>
  </div>

  <div class="block">
    <h2>Курс</h2>
    <div class="row"><b>Название</b> <span>${en.course.title}</span></div>
    ${en.course.direction ? `<div class="row"><b>Направление</b> <span>${en.course.direction}</span></div>` : ''}
    ${en.course.format ? `<div class="row"><b>Формат</b> <span>${FORMAT_LABEL[en.course.format] ?? en.course.format}</span></div>` : ''}
    ${en.course.audience ? `<div class="row"><b>Аудитория</b> <span>${AUD_LABEL[en.course.audience] ?? en.course.audience}</span></div>` : ''}
    ${en.course.duration ? `<div class="row"><b>Длительность</b> <span>${en.course.duration}</span></div>` : ''}
    <div class="row"><b>Стоимость</b> <span>${isFree ? 'Бесплатно' : `${en.course.price!.toLocaleString('ru-RU')} ₽`}</span></div>
    <div class="row"><b>Начало обучения</b> <span>${startDate}</span></div>
  </div>

  <p>Настоящий документ подтверждает факт регистрации слушателя на указанный курс. Зачисление производится после проверки заявки администратором.</p>

  <div class="footer">
    Документ сформирован автоматически платформой My-Course (ЦОПП Академия Саратов) · ${new Date().toLocaleDateString('ru-RU')}
  </div>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) {
    win.onload = () => { win.print(); URL.revokeObjectURL(url) }
  }
}

export default function Documents() {
  const { user } = useAuth()
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/enrollments/my').then(r => setEnrollments(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const userName = user ? `${user.lastName ?? ''} ${user.firstName ?? ''}`.trim() : 'Слушатель'

  if (loading) return (
    <div>
      <div className="section-head"><h2>Мои документы</h2></div>
      {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 80, marginBottom: 12, borderRadius: 'var(--r-sm)' }} />)}
    </div>
  )

  return (
    <>
      <div className="section-head">
        <h2>Мои документы</h2>
        <p>Подтверждения о записи на курсы — доступны для скачивания и печати</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="empty-state">
          <FileText size={56} />
          <h3>Документов пока нет</h3>
          <p>Документы появятся после записи на курс</p>
        </div>
      ) : (
        <div className="doc-list">
          {enrollments.map(en => (
            <div key={en.id} className="doc-item">
              <div className="doc-item__top">
                <div className="doc-item__icon">
                  {en.course.imageUrl
                    ? <img src={en.course.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={22} />
                  }
                </div>
                <div className="doc-item__info">
                  <p className="doc-item__name">Подтверждение записи</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', margin: '0 0 6px', lineHeight: 1.3 }}>
                    {en.course.title}
                  </p>
                  <div className="doc-item__meta">
                    {en.course.format && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        {en.course.format === 'ONLINE' ? <Wifi size={12} /> : <MapPin size={12} />}
                        {FORMAT_LABEL[en.course.format] ?? en.course.format}
                      </span>
                    )}
                    {en.course.duration && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} /> {en.course.duration}
                      </span>
                    )}
                    <span>
                      {new Date(en.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="doc-item__bottom">
                <span className={STATUS_CLASS[en.status]}>{STATUS_LABEL[en.status]}</span>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  onClick={() => printConfirmation(en, userName)}
                >
                  <Download size={14} /> Скачать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

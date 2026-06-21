import { useEffect, useState } from 'react'
import { BookOpen, Calendar, Clock } from 'lucide-react'
import { api } from '../../api/client'

interface Enrollment {
  id: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'REJECTED'
  course: {
    id: number
    title: string
    format: string
    duration: string | null
    startDate: string | null
    endDate: string | null
    imageUrl: string | null
  }
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'На рассмотрении',
  ACTIVE: 'Активно',
  COMPLETED: 'Завершено',
  REJECTED: 'Отклонено',
}

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'badge status-pending',
  ACTIVE: 'badge status-active',
  COMPLETED: 'badge status-completed',
  REJECTED: 'badge status-rejected',
}

const FORMAT_LABEL: Record<string, string> = {
  ONLINE: 'Онлайн',
  OFFLINE: 'Очно',
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')

  useEffect(() => {
    api.get('/enrollments/my')
      .then(r => setEnrollments(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filters = [
    { key: 'ALL', label: 'Все' },
    { key: 'ACTIVE', label: 'Активные' },
    { key: 'PENDING', label: 'На рассмотрении' },
    { key: 'COMPLETED', label: 'Завершённые' },
  ]

  const visible = filter === 'ALL' ? enrollments : enrollments.filter(e => e.status === filter)

  return (
    <>
      <div className="section-head">
        <h2>Мои курсы</h2>
        <p>Курсы, на которые вы записались</p>
      </div>

      {!loading && enrollments.length > 0 && (
        <div className="filters">
          {filters.map(f => (
            <button
              key={f.key}
              className={`filter-btn${filter === f.key ? ' active' : ''}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="course-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="course-card">
              <div className="skeleton" style={{ height: 160 }} />
              <div className="course-card__body">
                <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={56} />
          <h3>{enrollments.length === 0 ? 'Вы ещё не записаны на курсы' : 'Нет курсов в этом разделе'}</h3>
          <p>{enrollments.length === 0 ? 'Перейдите в каталог и выберите подходящий курс' : 'Попробуйте другой фильтр'}</p>
          {enrollments.length === 0 && (
            <a href="/dashboard/catalog" className="btn btn-primary">Перейти в каталог</a>
          )}
        </div>
      ) : (
        <div className="course-grid">
          {visible.map(e => (
            <div key={e.id} className="course-card">
              {e.course.imageUrl ? (
                <img src={e.course.imageUrl} alt={e.course.title} className="course-card__img" />
              ) : (
                <div className="course-card__img"><BookOpen /></div>
              )}
              <div className="course-card__body">
                <div className="course-card__badges">
                  <span className={STATUS_CLASS[e.status]}>{STATUS_LABEL[e.status]}</span>
                  {e.course.format && (
                    <span className="badge">{FORMAT_LABEL[e.course.format] ?? e.course.format}</span>
                  )}
                </div>
                <h3 className="course-card__title">{e.course.title}</h3>
                <div className="course-card__meta">
                  {e.course.duration && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> {e.course.duration}
                    </span>
                  )}
                  {e.course.startDate && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={14} />
                      {new Date(e.course.startDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

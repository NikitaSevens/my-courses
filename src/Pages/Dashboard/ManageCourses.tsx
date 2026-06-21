import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, Pencil, Trash2, Users, BookOpen, ToggleLeft, ToggleRight, ChevronDown } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface Course {
  id: number
  title: string
  direction: string
  format: 'ONLINE' | 'OFFLINE'
  audience: 'SCHOOL' | 'STUDENT' | 'ADULT'
  isActive: boolean
  startDate: string | null
  imageUrl: string | null
  _count: { enrollments: number }
}

const FORMAT_LABEL: Record<string, string> = { ONLINE: 'Онлайн', OFFLINE: 'Очно' }
const AUD_LABEL: Record<string, string> = { SCHOOL: 'Школьникам', STUDENT: 'Студентам', ADULT: 'Взрослым' }

export default function ManageCourses() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [expandedEnrollments, setExpandedEnrollments] = useState<number | null>(null)
  const [enrollments, setEnrollments] = useState<Record<number, any[]>>({})
  const [loadingEnroll, setLoadingEnroll] = useState(false)

  const isAdmin = ['ADMIN', 'SUPERADMIN'].includes(user?.role ?? '')

  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const deleteCourse = async (id: number, title: string) => {
    if (!confirm(`Удалить курс «${title}»? Это удалит все записи на него.`)) return
    setDeleting(id)
    try {
      await api.delete(`/courses/${id}`)
      setCourses(cs => cs.filter(c => c.id !== id))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка удаления')
    } finally {
      setDeleting(null)
    }
  }

  const toggleActive = async (course: Course) => {
    try {
      const fd = new FormData()
      fd.append('title', course.title)
      fd.append('isActive', String(!course.isActive))
      const updated = await api.put(`/courses/${course.id}`, fd)
      setCourses(cs => cs.map(c => c.id === course.id ? { ...c, isActive: updated.data.isActive } : c))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  const loadEnrollments = async (courseId: number) => {
    if (expandedEnrollments === courseId) { setExpandedEnrollments(null); return }
    setExpandedEnrollments(courseId)
    if (enrollments[courseId]) return
    setLoadingEnroll(true)
    try {
      const r = await api.get(`/enrollments/course/${courseId}`)
      setEnrollments(e => ({ ...e, [courseId]: r.data }))
    } catch { /* ignore */ }
    finally { setLoadingEnroll(false) }
  }

  const changeStatus = async (enrollId: number, status: string, courseId: number) => {
    try {
      await api.put(`/enrollments/${enrollId}/status`, { status })
      setEnrollments(e => ({
        ...e,
        [courseId]: e[courseId].map((en: any) => en.id === enrollId ? { ...en, status } : en),
      }))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка')
    }
  }

  const STATUS_OPTS = ['PENDING', 'ACTIVE', 'COMPLETED', 'REJECTED']
  const STATUS_LABEL: Record<string, string> = { PENDING: 'На рассмотрении', ACTIVE: 'Активно', COMPLETED: 'Завершено', REJECTED: 'Отклонено' }
  const STATUS_CLASS: Record<string, string> = { PENDING: 'badge status-pending', ACTIVE: 'badge status-active', COMPLETED: 'badge status-completed', REJECTED: 'badge status-rejected' }

  if (loading) return (
    <div>
      <div className="section-head"><h2>Управление курсами</h2></div>
      {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 72, marginBottom: 12, borderRadius: 'var(--r-sm)' }} />)}
    </div>
  )

  return (
    <>
      <div className="section-head section-head--flex" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h2>Управление курсами</h2>
          <p>Создавайте, редактируйте и управляйте курсами</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/dashboard/manage-courses/new')} style={{ flexShrink: 0 }}>
          <PlusCircle size={17} /> Создать курс
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <BookOpen size={56} />
          <h3>Курсов пока нет</h3>
          <p>Нажмите «Создать курс» в правом верхнем углу</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {courses.map(c => (
            <div key={c.id} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
              {/* Course row */}
              <div className="mc-row" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
                {/* Thumbnail */}
                <div style={{ width: 52, height: 52, borderRadius: 'var(--r-xs)', background: 'var(--blue-50)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue-300)' }}>
                  {c.imageUrl
                    ? <img src={c.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <BookOpen size={22} />
                  }
                </div>

                {/* Info */}
                <div className="mc-row__info" style={{ flex: 1, minWidth: 0 }}>
                  <div className="mc-row__title" style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.title}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <span className="badge">{FORMAT_LABEL[c.format]}</span>
                    <span className="badge">{AUD_LABEL[c.audience]}</span>
                    <span className={`badge ${c.isActive ? 'status-active' : 'status-rejected'}`}>
                      {c.isActive ? 'Активен' : 'Скрыт'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="mc-row__actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  {/* Enrollments toggle */}
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    onClick={() => loadEnrollments(c.id)}
                  >
                    <Users size={15} /> {c._count.enrollments}
                    <ChevronDown size={14} style={{ transition: '.2s', transform: expandedEnrollments === c.id ? 'rotate(180deg)' : 'none' }} />
                  </button>

                  {/* Toggle active */}
                  <button
                    className="btn btn-ghost btn-sm"
                    title={c.isActive ? 'Скрыть курс' : 'Опубликовать курс'}
                    onClick={() => toggleActive(c)}
                    style={{ color: c.isActive ? 'var(--blue-600)' : 'var(--muted)' }}
                  >
                    {c.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    title="Редактировать"
                    onClick={() => navigate(`/dashboard/manage-courses/${c.id}/edit`)}
                  >
                    <Pencil size={15} />
                  </button>

                  {isAdmin && (
                    <button
                      className="btn btn-ghost btn-sm"
                      title="Удалить"
                      style={{ color: '#dc2626' }}
                      disabled={deleting === c.id}
                      onClick={() => deleteCourse(c.id, c.title)}
                    >
                      {deleting === c.id ? <span className="spin" style={{ borderTopColor: '#dc2626' }} /> : <Trash2 size={15} />}
                    </button>
                  )}
                </div>
              </div>

              {/* Enrollments panel */}
              {expandedEnrollments === c.id && (
                <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                  {loadingEnroll && !enrollments[c.id] ? (
                    <div style={{ padding: '16px 18px', color: 'var(--muted)', fontSize: 14 }}>Загрузка…</div>
                  ) : !enrollments[c.id] || enrollments[c.id].length === 0 ? (
                    <div style={{ padding: '16px 18px', color: 'var(--muted)', fontSize: 14 }}>Заявок нет</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                      <thead>
                        <tr style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}>
                          <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Слушатель</th>
                          <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Email</th>
                          <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Статус</th>
                          <th style={{ padding: '10px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Действие</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enrollments[c.id].map((en: any) => (
                          <tr key={en.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '10px 18px' }}>
                              {en.user.lastName} {en.user.firstName} {en.user.middleName ?? ''}
                            </td>
                            <td style={{ padding: '10px 18px', color: 'var(--muted)' }}>{en.user.email}</td>
                            <td style={{ padding: '10px 18px' }}>
                              <span className={STATUS_CLASS[en.status]}>{STATUS_LABEL[en.status]}</span>
                            </td>
                            <td style={{ padding: '10px 18px' }}>
                              <select
                                value={en.status}
                                onChange={e => changeStatus(en.id, e.target.value, c.id)}
                                style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', padding: '4px 8px', fontSize: 13, fontFamily: 'var(--font)', background: '#fff', cursor: 'pointer' }}
                              >
                                {STATUS_OPTS.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

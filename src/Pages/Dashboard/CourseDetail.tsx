import { useEffect, useState, useRef, type ReactNode } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, BookOpen, Clock, Calendar, Users, Download,
  MapPin, GraduationCap, CheckCircle
} from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import EnrollModal from './EnrollModal'

interface Course {
  id: number
  title: string
  description: string | null
  direction: string | null
  format: string
  audience: string | null
  duration: string | null
  price: number | null
  startDate: string | null
  endDate: string | null
  imageUrl: string | null
  pdfUrl: string | null
  isActive: boolean
  _count: { enrollments: number }
}

const FORMAT_LABEL: Record<string, string> = { ONLINE: 'Онлайн', OFFLINE: 'Очно', MIXED: 'Смешанная' }
const AUD_LABEL: Record<string, string> = { SCHOOL: 'Школьникам', STUDENT: 'Студентам', ADULT: 'Взрослым', ALL: 'Всем' }

const DIRECTION_LABEL: Record<string, string> = {
  IT: 'Информационные технологии',
  DESIGN: 'Дизайн',
  BUSINESS: 'Бизнес и управление',
  ENGINEERING: 'Инженерия',
  PEDAGOGY: 'Педагогика',
  MEDICINE: 'Медицина',
  LAW: 'Право',
  OTHER: 'Другое',
}

function fmtDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [course, setCourse] = useState<Course | null>(null)
  const [enrolled, setEnrolled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [titleSticky, setTitleSticky] = useState(false)
  const titleRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get('/enrollments/my'),
    ]).then(([c, e]) => {
      setCourse(c.data)
      setEnrolled(e.data.some((en: any) => en.course.id === Number(id)))
    }).catch(() => navigate('/dashboard/catalog'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!titleRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => setTitleSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-60px 0px 0px 0px' }
    )
    observer.observe(titleRef.current)
    return () => observer.disconnect()
  }, [course])

  if (loading) return (
    <div>
      <div className="skeleton" style={{ height: 320, borderRadius: 'var(--r-sm)', marginBottom: 24 }} />
      <div className="skeleton" style={{ height: 28, width: '60%', marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 16, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 16, width: '80%' }} />
    </div>
  )

  if (!course) return null

  const isFree = course.price == null || course.price === 0
  const priceLabel = isFree ? 'Бесплатно' : `${course.price!.toLocaleString('ru-RU')} ₽`

  return (
    <>
      {/* Sticky title strip — появляется когда основной h1 уходит вверх */}
      <div className="cd-sticky-title" style={{
        position: 'sticky', top: 60, zIndex: 90,
        background: '#fff', borderBottom: '1px solid var(--border)',
        padding: '0 0',
        height: titleSticky ? 52 : 0,
        overflow: 'hidden',
        transition: 'height .2s ease',
        display: 'flex', alignItems: 'center',
        marginLeft: -32, marginRight: -32, paddingLeft: 32, paddingRight: 32,
      }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {course.title}
        </span>
      </div>

      {/* Back */}
      <button
        className="btn btn-ghost btn-sm"
        style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, marginTop: 20 }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Назад
      </button>

      <div className="cd-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'start' }}>

        {/* LEFT — main info */}
        <div>
          {/* Image */}
          {course.imageUrl ? (
            <img
              src={course.imageUrl}
              alt={course.title}
              style={{ width: '100%', height: 300, objectFit: 'cover', borderRadius: 'var(--r-sm)', marginBottom: 24 }}
            />
          ) : (
            <div style={{
              width: '100%', height: 220, borderRadius: 'var(--r-sm)', marginBottom: 24,
              background: 'var(--blue-50)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'var(--blue-300)',
            }}>
              <BookOpen size={64} />
            </div>
          )}

          {/* Badges */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
            {course.direction && (
              <span className="badge" style={{ background: 'var(--blue-50)', color: 'var(--blue-700)' }}>
                {DIRECTION_LABEL[course.direction] ?? course.direction}
              </span>
            )}
            {course.format && <span className="badge">{FORMAT_LABEL[course.format] ?? course.format}</span>}
            {course.audience && <span className="badge">{AUD_LABEL[course.audience] ?? course.audience}</span>}
            {!course.isActive && (
              <span className="badge" style={{ background: '#fef2f2', color: '#dc2626' }}>Набор закрыт</span>
            )}
          </div>

          {/* Title — наблюдается IntersectionObserver */}
          <h1 ref={titleRef} style={{ fontSize: 26, fontWeight: 800, lineHeight: 1.25, margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            {course.title}
          </h1>

          {/* Description */}
          {course.description && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: 'var(--text)' }}>
                О курсе
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--muted)', margin: 0, whiteSpace: 'pre-wrap' }}>
                {course.description}
              </p>
            </div>
          )}

          {/* PDF download */}
          {course.pdfUrl && (
            <a
              href={course.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
            >
              <Download size={16} /> Скачать программу курса (PDF)
            </a>
          )}
        </div>

        {/* RIGHT — sticky sidebar card */}
        <div className="cd-sidebar" style={{
          position: 'sticky', top: 24,
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--r)', padding: 24,
          boxShadow: '0 4px 24px rgba(0,0,0,.06)',
        }}>
          {/* Price */}
          <div style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: isFree ? 22 : 28,
              fontWeight: 800,
              color: isFree ? '#1F8A5B' : 'var(--text)',
              letterSpacing: '-0.02em',
            }}>
              {priceLabel}
            </div>
            {!isFree && (
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Коммерческое обучение</div>
            )}
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 24 }}>
            {course.duration && (
              <MetaRow icon={<Clock size={16} />} label="Длительность" value={course.duration} />
            )}
            {course.startDate && (
              <MetaRow icon={<Calendar size={16} />} label="Начало" value={fmtDate(course.startDate)!} />
            )}
            {course.endDate && (
              <MetaRow icon={<Calendar size={16} />} label="Окончание" value={fmtDate(course.endDate)!} />
            )}
            {course.format && (
              <MetaRow icon={<MapPin size={16} />} label="Формат" value={FORMAT_LABEL[course.format] ?? course.format} />
            )}
            {course.audience && (
              <MetaRow icon={<GraduationCap size={16} />} label="Для кого" value={AUD_LABEL[course.audience] ?? course.audience} />
            )}
            {course._count.enrollments > 0 && (
              <MetaRow icon={<Users size={16} />} label="Записались" value={`${course._count.enrollments} чел.`} />
            )}
          </div>

          {/* Enroll button */}
          {user && (
            enrolled ? (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '12px 0', borderRadius: 'var(--r-sm)',
                background: '#f0fdf4', color: '#1F8A5B',
                fontWeight: 700, fontSize: 15,
              }}>
                <CheckCircle size={18} /> Вы записаны
              </div>
            ) : course.isActive ? (
              <button
                className="btn btn-primary btn-block"
                style={{ height: 46, fontSize: 15, fontWeight: 700 }}
                onClick={() => setEnrolling(true)}
              >
                Записаться на курс
              </button>
            ) : (
              <div style={{
                textAlign: 'center', padding: '12px 0',
                color: 'var(--muted)', fontSize: 14,
              }}>
                Набор на курс закрыт
              </div>
            )
          )}
        </div>
      </div>

      {/* Enroll modal */}
      {enrolling && (
        <EnrollModal
          course={course}
          onClose={() => setEnrolling(false)}
          onSuccess={() => setEnrolled(true)}
        />
      )}
    </>
  )
}

function MetaRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      <span style={{ color: 'var(--muted)', marginTop: 1, flexShrink: 0 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value}</div>
      </div>
    </div>
  )
}

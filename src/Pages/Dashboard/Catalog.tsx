import { useEffect, useState, useMemo } from 'react'
import { BookOpen, Clock, Search, ChevronRight, X, SlidersHorizontal, Wifi, MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  oldPrice: number | null
  startDate: string | null
  imageUrl: string | null
}

type SortKey = 'new' | 'cheap' | 'expensive' | 'free'
type FormatFilter = 'ALL' | 'ONLINE' | 'OFFLINE'
type AudienceFilter = 'ALL' | 'SCHOOL' | 'STUDENT' | 'ADULT'

const FORMAT_LABEL: Record<string, string> = { ONLINE: 'Онлайн', OFFLINE: 'Очно' }
const AUD_LABEL: Record<string, string> = { SCHOOL: 'Школьникам', STUDENT: 'Студентам', ADULT: 'Взрослым' }

const SEL: React.CSSProperties = {
  height: 42,
  padding: '0 36px 0 14px',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-xs)',
  fontSize: 14,
  fontFamily: 'var(--font)',
  background: '#fff',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'auto' as const,
}

export default function Catalog() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolled, setEnrolled] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [enrollingCourse, setEnrollingCourse] = useState<Course | null>(null)

  const [search, setSearch] = useState('')
  const [filterFormat, setFilterFormat] = useState<FormatFilter>('ALL')
  const [filterAudience, setFilterAudience] = useState<AudienceFilter>('ALL')
  const [filterDirection, setFilterDirection] = useState('')
  const [sort, setSort] = useState<SortKey>('new')

  useEffect(() => {
    Promise.all([
      api.get('/courses'),
      api.get('/enrollments/my'),
    ]).then(([c, e]) => {
      setCourses(c.data)
      setEnrolled(new Set(e.data.map((en: any) => en.course.id)))
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const directions = useMemo(() =>
    [...new Set(courses.map(c => c.direction).filter(Boolean))].sort() as string[],
    [courses]
  )

  const filtered = useMemo(() => {
    let r = [...courses]
    if (search)               r = r.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || (c.direction ?? '').toLowerCase().includes(search.toLowerCase()))
    if (filterFormat !== 'ALL')   r = r.filter(c => c.format === filterFormat)
    if (filterAudience !== 'ALL') r = r.filter(c => c.audience === filterAudience)
    if (filterDirection)          r = r.filter(c => c.direction === filterDirection)
    if (sort === 'cheap')     r.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'expensive') r.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === 'free')      r = [...r.filter(c => !c.price || c.price === 0), ...r.filter(c => c.price && c.price > 0)]
    return r
  }, [courses, search, filterFormat, filterAudience, filterDirection, sort])

  const hasFilters = search || filterFormat !== 'ALL' || filterAudience !== 'ALL' || filterDirection || sort !== 'new'
  const clearFilters = () => { setSearch(''); setFilterFormat('ALL'); setFilterAudience('ALL'); setFilterDirection(''); setSort('new') }

  return (
    <>
      <div className="section-head">
        <h2>Каталог курсов</h2>
        <p>Выберите курс и запишитесь на обучение</p>
      </div>

      {/* ── Фильтры ── */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Поиск */}
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск курсов…"
            style={{ width: '100%', paddingLeft: 40, paddingRight: 14, height: 42, border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box', background: '#fff' }}
          />
        </div>

        {/* Направление */}
        <select value={filterDirection} onChange={e => setFilterDirection(e.target.value)} style={SEL}>
          <option value="">Все направления</option>
          {directions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Формат */}
        <select value={filterFormat} onChange={e => setFilterFormat(e.target.value as FormatFilter)} style={SEL}>
          <option value="ALL">Все форматы</option>
          <option value="ONLINE">Онлайн</option>
          <option value="OFFLINE">Очно</option>
        </select>

        {/* Аудитория */}
        <select value={filterAudience} onChange={e => setFilterAudience(e.target.value as AudienceFilter)} style={SEL}>
          <option value="ALL">Все слушатели</option>
          <option value="SCHOOL">Школьникам</option>
          <option value="STUDENT">Студентам</option>
          <option value="ADULT">Взрослым</option>
        </select>

        {/* Сортировка */}
        <select value={sort} onChange={e => setSort(e.target.value as SortKey)} style={SEL}>
          <option value="new">Новые</option>
          <option value="cheap">Сначала дешевле</option>
          <option value="expensive">Сначала дороже</option>
          <option value="free">Бесплатные сначала</option>
        </select>

        {/* Сброс */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            style={{ height: 42, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', fontSize: 13, fontFamily: 'var(--font)', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', whiteSpace: 'nowrap' }}
          >
            <X size={15} /> Сбросить
          </button>
        )}
      </div>

      {/* ── Результаты ── */}
      {loading ? (
        <div className="course-grid">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="course-card">
              <div className="skeleton" style={{ height: 160 }} />
              <div className="course-card__body">
                <div className="skeleton" style={{ height: 14, marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 14, width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <SlidersHorizontal size={48} style={{ opacity: 0.35 }} />
          <h3>{courses.length === 0 ? 'Курсы ещё не добавлены' : 'Ничего не найдено'}</h3>
          {hasFilters && <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>Сбросить фильтры</button>}
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Найдено курсов: {filtered.length}</p>
          <div className="course-grid">
            {filtered.map(c => {
              const isFree = !c.price || c.price === 0
              return (
                <div key={c.id} className="course-card">
                  {c.imageUrl
                    ? <img src={c.imageUrl} alt={c.title} className="course-card__img" />
                    : <div className="course-card__img"><BookOpen /></div>
                  }
                  <div className="course-card__body">
                    <div className="course-card__badges">
                      {c.format && (
                        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {c.format === 'ONLINE' ? <Wifi size={12} /> : <MapPin size={12} />}
                          {FORMAT_LABEL[c.format] ?? c.format}
                        </span>
                      )}
                      {c.audience && <span className="badge">{AUD_LABEL[c.audience] ?? c.audience}</span>}
                    </div>
                    {c.direction && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue-600)', letterSpacing: 0.5, textTransform: 'uppercase', margin: '6px 0 4px' }}>
                        {c.direction}
                      </div>
                    )}
                    <h3 className="course-card__title">{c.title}</h3>
                    {c.duration && (
                      <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Clock size={13} /> {c.duration}
                      </div>
                    )}
                    <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                      {/* Цена */}
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontWeight: 700, fontSize: 16, color: isFree ? '#16a34a' : 'var(--text)' }}>
                          {isFree ? 'Бесплатно' : `${c.price!.toLocaleString('ru-RU')} ₽`}
                        </span>
                        {c.oldPrice && (
                          <span style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'line-through', marginLeft: 8 }}>
                            {c.oldPrice.toLocaleString('ru-RU')} ₽
                          </span>
                        )}
                      </div>
                      {/* Кнопки */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={() => navigate(`/dashboard/courses/${c.id}`)}
                        >
                          Подробнее <ChevronRight size={14} />
                        </button>
                        <button
                          className={`btn ${enrolled.has(c.id) ? 'btn-ghost' : 'btn-primary'} btn-sm`}
                          style={{ flex: 1 }}
                          disabled={enrolled.has(c.id) || !user}
                          onClick={() => !enrolled.has(c.id) && setEnrollingCourse(c)}
                        >
                          {enrolled.has(c.id) ? 'Записан' : 'Записаться'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {enrollingCourse && (
        <EnrollModal
          course={enrollingCourse}
          onClose={() => setEnrollingCourse(null)}
          onSuccess={() => setEnrolled(s => new Set([...s, enrollingCourse.id]))}
        />
      )}
    </>
  )
}

import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import {
  Sparkles, ArrowRight, BadgeCheck, Wallet,
  Code2, PenTool, Cog, Flame, HardHat, Truck, Calculator, Camera,
  Wifi, MapPin, Clock, Users, Award, Heart,
  Search, ClipboardPen, GraduationCap,
  Backpack, BookOpen, Briefcase,
  ChevronDown, ShieldCheck, MessageCircle, Send, Play, Mail,
  SlidersHorizontal, X,
} from 'lucide-react'
import './Landing.css'

/* ─── Types ─────────────────────────────────────────────── */
interface ApiCourse {
  id: number
  title: string
  description: string | null
  direction: string
  format: 'ONLINE' | 'OFFLINE'
  audience: string
  duration: string | null
  price: number | null
  oldPrice: number | null
  minAge: string | null
  certificate: string | null
  imageUrl: string | null
  isActive: boolean
}

type SortKey = 'new' | 'cheap' | 'expensive' | 'free'
type FormatFilter = 'ALL' | 'ONLINE' | 'OFFLINE'
type AudienceFilter = 'ALL' | 'SCHOOL' | 'STUDENT' | 'ADULT'

/* ─── Direction → icon / desc map ──────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const DIR_META: Record<string, { icon: any; desc: string }> = {
  'Информационные технологии': { icon: Code2,        desc: 'Веб, Python, тестирование, аналитика данных' },
  'Инженерия':                 { icon: Cog,           desc: 'Токарь, фрезеровщик, оператор ЧПУ, слесарь' },
  'Педагогика':                { icon: GraduationCap, desc: 'Воспитатели, преподаватели, кураторы' },
  'Медицина':                  { icon: Heart,         desc: 'Медсестра, фельдшер, первая помощь' },
  'Право':                     { icon: ShieldCheck,   desc: 'Юриспруденция, нотариат, охрана труда' },
  'Экономика':                 { icon: Calculator,    desc: '1С, бухгалтерия, налоги, кадры' },
  'Менеджмент':                { icon: Briefcase,     desc: 'Управление проектами, HR, маркетинг' },
  'Психология':                { icon: BookOpen,      desc: 'Практическая психология, коучинг' },
  'Дизайн':                    { icon: PenTool,       desc: 'UX/UI, графика, 3D, моушн и веб-дизайн' },
  'Сварка и металл':           { icon: Flame,         desc: 'Ручная и аргонодуговая сварка, разряды' },
  'Строительство':             { icon: HardHat,       desc: 'Отделка, монтаж, сметное дело' },
  'Транспорт':                 { icon: Truck,         desc: 'Логистика, водительские категории, склад' },
  'Творчество':                { icon: Camera,        desc: 'Фото, видео, контент, SMM' },
  'Другое':                    { icon: Sparkles,      desc: 'Дополнительные и смежные профессии' },
}
const DEFAULT_DIR_META = { icon: Sparkles, desc: 'Профессиональные курсы' }

/* ─── Data ─────────────────────────────────────────────── */
const faqs = [
  { q: 'Сколько стоит обучение?', a: 'Многие курсы бесплатны по программам ЦОПП и нацпроектам. Остальные доступны со скидкой. Стоимость всегда указана в карточке курса.' },
  { q: 'Нужно ли специальное образование для записи?', a: 'Для большинства курсов достаточно базового образования и желания учиться. Для отдельных рабочих профессий есть возрастные ограничения — они указаны в карточке.' },
  { q: 'Какой документ я получу после курса?', a: 'В зависимости от программы — удостоверение о повышении квалификации, диплом о профпереподготовке или свидетельство о присвоении разряда. Все документы установленного образца.' },
  { q: 'Можно ли учиться онлайн?', a: 'Да. IT, дизайн и многие теоретические курсы проходят полностью онлайн. Рабочие профессии включают очную практику на оборудовании партнёров.' },
  { q: 'Помогаете ли с трудоустройством?', a: 'Да. 92% выпускников трудоустраиваются по профессии. Мы сотрудничаем с 40+ работодателями региона и помогаем с резюме и собеседованиями.' },
  { q: 'Сколько длится обучение?', a: 'От 2 недель до 6 месяцев в зависимости от программы. Точная длительность и расписание указаны в карточке каждого курса.' },
]

/* ─── Header ────────────────────────────────────────────── */
function Header() {
  const [scrolled, setScrolled] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8)
    handler()
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    const closeOnResize = () => { if (window.innerWidth > 920) setDrawerOpen(false) }
    window.addEventListener('resize', closeOnResize)
    return () => window.removeEventListener('resize', closeOnResize)
  }, [])

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  const close = () => setDrawerOpen(false)

  return (
    <>
      <header className={`header${scrolled ? ' scrolled' : ''}`} id="header">
        <div className="wrap header__bar">
          <a className="logo" href="#top" aria-label="My-Course — на главную">
            <span className="logo__mark" />
            My<b>-</b>Course
          </a>
          <nav className="nav">
            <a href="#top">Главная</a>
            <a href="#courses">Курсы</a>
            <a href="#about">О нас</a>
            <a href="#footer">Контакты</a>
          </nav>
          <div className="header__actions">
            <Link className="btn btn-ghost btn-sm" to="/login">Войти</Link>
            <Link className="btn btn-primary btn-sm" to="/register">Зарегистрироваться</Link>
            <button
              className={`burger${drawerOpen ? ' open' : ''}`}
              aria-label="Меню"
              aria-expanded={drawerOpen}
              onClick={() => setDrawerOpen(o => !o)}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`drawer${drawerOpen ? ' open' : ''}`}>
        <a href="#top" onClick={close}>Главная</a>
        <a href="#courses" onClick={close}>Курсы</a>
        <a href="#about" onClick={close}>О нас</a>
        <a href="#footer" onClick={close}>Контакты</a>
        <div className="drawer__cta">
          <Link className="btn btn-ghost" to="/login" onClick={close}>Войти</Link>
          <Link className="btn btn-primary" to="/register" onClick={close}>Зарегистрироваться</Link>
        </div>
      </div>
    </>
  )
}

/* ─── FAQ Item ──────────────────────────────────────────── */
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  const answerRef = useRef<HTMLDivElement>(null)

  return (
    <div className={`faq-item${open ? ' open' : ''}`}>
      <button className="faq-q" onClick={() => setOpen(o => !o)}>
        {q}
        <span className="pm"><ChevronDown size={18} /></span>
      </button>
      <div
        className="faq-a"
        ref={answerRef}
        style={{ maxHeight: open ? answerRef.current?.scrollHeight : 0 }}
      >
        <p>{a}</p>
      </div>
    </div>
  )
}

/* ─── Course Detail Panel ───────────────────────────────── */
const AUD_LABEL: Record<string, string> = { SCHOOL: 'Школьникам', STUDENT: 'Студентам', ADULT: 'Взрослым' }

function CourseDetailPanel({ course, onClose }: { course: ApiCourse; onClose: () => void }) {
  const isFree = !course.price || course.price === 0
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="cdp-backdrop" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cdp-panel" ref={ref}>
        <button className="cdp-close" onClick={onClose} aria-label="Закрыть"><X size={20} /></button>

        {course.imageUrl
          ? <img src={course.imageUrl} alt={course.title} className="cdp-img" />
          : <div className="cdp-img cdp-img--placeholder"><BookOpen size={40} /></div>
        }

        <div className="cdp-body">
          <span className="cdp-dir">{course.direction}</span>
          <h2 className="cdp-title">{course.title}</h2>

          <div className="cdp-price">
            {isFree
              ? <span className="cdp-price__free">Бесплатно</span>
              : <span className="cdp-price__paid">{course.price!.toLocaleString('ru-RU')} ₽</span>
            }
            {course.oldPrice && <s className="cdp-price__old">{course.oldPrice.toLocaleString('ru-RU')} ₽</s>}
          </div>

          <div className="cdp-meta">
            {course.format && (
              <div className="cdp-meta__row">
                {course.format === 'ONLINE' ? <Wifi size={16} /> : <MapPin size={16} />}
                <span>{course.format === 'ONLINE' ? 'Онлайн' : 'Очно'}</span>
              </div>
            )}
            {course.audience && (
              <div className="cdp-meta__row">
                <Users size={16} />
                <span>{AUD_LABEL[course.audience] ?? course.audience}</span>
              </div>
            )}
            {course.duration && (
              <div className="cdp-meta__row">
                <Clock size={16} />
                <span>{course.duration}</span>
              </div>
            )}
            {course.minAge && (
              <div className="cdp-meta__row">
                <Users size={16} />
                <span>{course.minAge}</span>
              </div>
            )}
            {course.certificate && (
              <div className="cdp-meta__row">
                <Award size={16} />
                <span>{course.certificate}</span>
              </div>
            )}
          </div>

          {course.description && (
            <div className="cdp-desc">
              <p className="cdp-desc__label">О курсе</p>
              <p className="cdp-desc__text">{course.description}</p>
            </div>
          )}

          <div className="cdp-actions">
            <Link className="btn btn-primary btn-lg" to="/register" style={{ flex: 1, justifyContent: 'center' }}>
              Записаться на курс
            </Link>
            <Link className="btn btn-ghost btn-lg" to={`/dashboard/courses/${course.id}`} style={{ flex: 1, justifyContent: 'center' }}>
              Открыть в кабинете
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Course Card ───────────────────────────────────────── */
function CourseCard({ course, onDetail }: { course: ApiCourse; onDetail: (c: ApiCourse) => void }) {
  const [liked, setLiked] = useState(false)
  const isFree = !course.price || course.price === 0
  const priceLabel = isFree ? 'Бесплатно' : `${course.price!.toLocaleString('ru-RU')} ₽`
  const oldPriceLabel = course.oldPrice ? `${course.oldPrice.toLocaleString('ru-RU')} ₽` : null

  return (
    <article className="card course">
      <div className="ph course__cover">
        {course.imageUrl
          ? <img src={course.imageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <span style={{ color: 'var(--muted)', fontSize: 13 }}>{course.direction}</span>
        }
        <div className="badges">
          {course.format === 'ONLINE'
            ? <span className="badge badge-online"><Wifi size={14} /> Онлайн</span>
            : <span className="badge badge-offline"><MapPin size={14} /> Очно</span>
          }
          {isFree && <span className="badge badge-free">Бесплатно</span>}
        </div>
        <button
          className={`course__heart${liked ? ' active' : ''}`}
          aria-label="В избранное"
          onClick={() => setLiked(l => !l)}
        >
          <Heart size={19} />
        </button>
      </div>
      <div className="course__body">
        <span className="course__dir">{course.direction}</span>
        <h3>{course.title}</h3>
        <div className="course__meta">
          {course.duration && <span><Clock size={16} /> {course.duration}</span>}
          {course.minAge && <span><Users size={16} /> {course.minAge}</span>}
          {course.certificate && <span><Award size={16} /> {course.certificate}</span>}
        </div>
        <div className="course__foot">
          <div className="course__price">
            <b>{priceLabel}</b>
            {oldPriceLabel && <s>{oldPriceLabel}</s>}
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => onDetail(course)}>Подробнее</button>
        </div>
      </div>
    </article>
  )
}

/* ─── Avatars ───────────────────────────────────────────── */
const AVATAR_COLORS = ['#6366f1', '#f59e0b', '#10b981', '#3b82f6', '#ec4899']
function AvatarBubbles() {
  return (
    <div className="avatars">
      {AVATAR_COLORS.map((color, i) => (
        <span
          key={i}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 32, height: 32, borderRadius: '50%',
            background: color, border: '2px solid #fff',
            marginLeft: i === 0 ? 0 : -8, zIndex: 5 - i,
            position: 'relative',
          }}
        >
          <Users size={15} color="#fff" />
        </span>
      ))}
    </div>
  )
}

/* ─── Landing Page ──────────────────────────────────────── */
export default function Landing() {
  const [courses, setCourses] = useState<ApiCourse[]>([])
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('new')
  const [filterFormat, setFilterFormat] = useState<FormatFilter>('ALL')
  const [filterAudience, setFilterAudience] = useState<AudienceFilter>('ALL')
  const [filterDirection, setFilterDirection] = useState('')

  useEffect(() => {
    api.get('/courses?active=true').then(r => setCourses(r.data)).catch(() => {})
  }, [])

  /* ── Direction counts from real data ── */
  const directionCounts = useMemo(() =>
    courses.reduce<Record<string, number>>((acc, c) => {
      acc[c.direction] = (acc[c.direction] || 0) + 1
      return acc
    }, {}), [courses])

  const uniqueDirections = useMemo(() =>
    Object.entries(directionCounts).sort((a, b) => b[1] - a[1]),
    [directionCounts])

  /* ── Filtered + sorted courses ── */
  const filteredCourses = useMemo(() => {
    let r = [...courses]
    if (search)           r = r.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.direction.toLowerCase().includes(search.toLowerCase()))
    if (filterFormat !== 'ALL')    r = r.filter(c => c.format === filterFormat)
    if (filterAudience !== 'ALL')  r = r.filter(c => c.audience === filterAudience)
    if (filterDirection)           r = r.filter(c => c.direction === filterDirection)
    if (sort === 'cheap')     r.sort((a, b) => (a.price ?? 0) - (b.price ?? 0))
    if (sort === 'expensive') r.sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
    if (sort === 'free')      r = [...r.filter(c => !c.price || c.price === 0), ...r.filter(c => c.price && c.price > 0)]
    return r
  }, [courses, search, filterFormat, filterAudience, filterDirection, sort])

  const [showAll, setShowAll] = useState(false)
  const [detailCourse, setDetailCourse] = useState<ApiCourse | null>(null)

  const hasActiveFilters = search || filterFormat !== 'ALL' || filterAudience !== 'ALL' || filterDirection

  const displayedCourses = (hasActiveFilters || showAll) ? filteredCourses : filteredCourses.slice(0, 3)
  const hiddenCount = filteredCourses.length - 3

  const scrollToCourses = (dir?: string, aud?: AudienceFilter) => {
    // Сбрасываем все фильтры перед применением нового
    setSearch('')
    setFilterFormat('ALL')
    setSort('new')
    if (dir !== undefined) {
      setFilterDirection(dir)
      setFilterAudience('ALL')
    }
    if (aud !== undefined) {
      setFilterAudience(aud)
      setFilterDirection('')
    }
    setTimeout(() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  const clearFilters = () => {
    setSearch(''); setFilterFormat('ALL'); setFilterAudience('ALL'); setFilterDirection(''); setSort('new'); setShowAll(false)
  }

  return (
    <>
      <Header />
      <main id="top">

        {/* ── Hero ── */}
        <section className="hero">
          <div className="hero__bg" />
          <div className="wrap">
            <div className="hero__grid">
              <div className="hero__copy">
                <div className="hero__pill">
                  <b><Sparkles size={13} /> ЦОПП Академия</b>
                  <span className="pill-txt">Саратов · обучение для жизни</span>
                </div>
                <h1>Новая профессия <span className="grad">начинается здесь</span></h1>
                <p className="hero__sub">
                  Бесплатные и льготные курсы от Центра опережающей профессиональной подготовки.
                  От IT и дизайна до токаря и сварщика — выберите направление и получите документ о квалификации.
                </p>
                <div className="hero__btns">
                  <a className="btn btn-primary btn-lg" href="#courses">
                    Выбрать курс <ArrowRight size={19} />
                  </a>
                  <a className="btn btn-ghost btn-lg" href="#how">Узнать подробнее</a>
                </div>
                <div className="hero__trust">
                  <AvatarBubbles />
                  <span>8 000+ выпускников уже нашли своё дело</span>
                </div>
              </div>

              <div className="hero__visual">
                {/* Сохрани фото public/hero-students.jpg — тогда градиент скроется */}
                <div className="hero__photo" style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(145deg,#ede9fe 0%,#c7d2fe 45%,#bfdbfe 100%)', borderRadius: 24 }}>
                  {/* Декор — скрывается под фото */}
                  <div style={{ position:'absolute', width:260, height:260, borderRadius:'50%', background:'rgba(99,102,241,.13)', top:-60, right:-60, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'rgba(139,92,246,.1)', bottom:-40, left:-40, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, pointerEvents:'none' }}>
                    <GraduationCap size={90} style={{ color:'#6366f1', opacity:.22 }} />
                    <span style={{ fontSize:13, fontWeight:700, letterSpacing:2, color:'#818cf8', textTransform:'uppercase' }}>ЦОПП Академия</span>
                  </div>
                  {/* Фото поверх декора */}
                  <img
                    src="/hero-students.jpg"
                    alt="Студенты в аудитории"
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:24 }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div className="hero__card hero__card--a">
                  <div className="ico ico-blue"><BadgeCheck size={22} /></div>
                  <div><small>Документ</small><strong>Гос. образца</strong></div>
                </div>
                <div className="hero__card hero__card--b">
                  <div className="ico ico-green"><Wallet size={22} /></div>
                  <div><small>Стоимость</small><strong>Бесплатно</strong></div>
                </div>
              </div>
            </div>

            <div className="stats">
              <div className="stat"><b>{courses.length || '120'}+</b><span>курсов в каталоге</span></div>
              <div className="stat"><b>8 000+</b><span>выпускников</span></div>
              <div className="stat"><b>{uniqueDirections.length || '24'}</b><span>направления</span></div>
              <div className="stat"><b>92%</b><span>трудоустройство</span></div>
            </div>
          </div>
        </section>

        {/* ── Categories ── */}
        <section className="section" id="cats">
          <div className="wrap">
            <div className="section-head">
              <span className="eyebrow">Направления</span>
              <h2 className="section-title">Выберите сферу, в которой хотите расти</h2>
              <p className="section-sub">Каждое направление — это десятки курсов с практикой, наставниками и реальными работодателями-партнёрами.</p>
            </div>
            <div className="cats">
              {uniqueDirections.length > 0
                ? uniqueDirections.map(([dir, count]) => {
                    const meta = DIR_META[dir] ?? DEFAULT_DIR_META
                    const Icon = meta.icon
                    return (
                      <button key={dir} className="cat" onClick={() => scrollToCourses(dir, 'ALL')}>
                        <div className="cat__ico"><Icon size={25} /></div>
                        <h3>{dir}</h3>
                        <p>{meta.desc}</p>
                        <span className="cat__count">{count} курсов <ArrowRight size={16} /></span>
                      </button>
                    )
                  })
                : /* Заглушка пока курсов нет */
                  [
                    { icon: Code2, title: 'Информационные технологии', desc: 'Веб, Python, тестирование, аналитика данных' },
                    { icon: Cog,   title: 'Инженерия',                 desc: 'Токарь, фрезеровщик, оператор ЧПУ' },
                    { icon: PenTool, title: 'Дизайн',                  desc: 'UX/UI, графика, 3D, моушн и веб-дизайн' },
                    { icon: Calculator, title: 'Экономика',            desc: '1С, бухгалтерия, налоги, кадры' },
                  ].map(({ icon: Icon, title, desc }) => (
                    <button key={title} className="cat" onClick={() => scrollToCourses(title, 'ALL')}>
                      <div className="cat__ico"><Icon size={25} /></div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                      <span className="cat__count">0 курсов <ArrowRight size={16} /></span>
                    </button>
                  ))
              }
            </div>
          </div>
        </section>

        {/* ── All Courses with search/filter ── */}
        <section className="section" id="courses" style={{ background: 'var(--bg-soft)' }}>
          <div className="wrap">
            <div className="courses-head">
              <div className="section-head" style={{ marginBottom: 0 }}>
                <span className="eyebrow">Каталог курсов</span>
                <h2 className="section-title">
                  {filterDirection ? filterDirection : filterAudience !== 'ALL'
                    ? filterAudience === 'SCHOOL' ? 'Для школьников'
                    : filterAudience === 'STUDENT' ? 'Для студентов' : 'Для взрослых'
                    : 'Все доступные курсы'}
                </h2>
              </div>
            </div>

            {/* Search + Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }} />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Поиск курсов…"
                  style={{ width: '100%', paddingLeft: 40, paddingRight: 14, height: 42, border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <select
                value={filterDirection}
                onChange={e => setFilterDirection(e.target.value)}
                style={{ height: 42, padding: '0 36px 0 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}
              >
                <option value="">Все направления</option>
                {uniqueDirections.map(([dir]) => (
                  <option key={dir} value={dir}>{dir}</option>
                ))}
              </select>

              <select
                value={filterFormat}
                onChange={e => setFilterFormat(e.target.value as FormatFilter)}
                style={{ height: 42, padding: '0 36px 0 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}
              >
                <option value="ALL">Все форматы</option>
                <option value="ONLINE">Онлайн</option>
                <option value="OFFLINE">Очно</option>
              </select>

              <select
                value={filterAudience}
                onChange={e => setFilterAudience(e.target.value as AudienceFilter)}
                style={{ height: 42, padding: '0 36px 0 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}
              >
                <option value="ALL">Все слушатели</option>
                <option value="SCHOOL">Школьникам</option>
                <option value="STUDENT">Студентам</option>
                <option value="ADULT">Взрослым</option>
              </select>

              <select
                value={sort}
                onChange={e => setSort(e.target.value as SortKey)}
                style={{ height: 42, padding: '0 36px 0 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, background: '#fff', cursor: 'pointer' }}
              >
                <option value="new">Новые</option>
                <option value="cheap">Сначала дешевле</option>
                <option value="expensive">Сначала дороже</option>
                <option value="free">Бесплатные сначала</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{ height: 42, padding: '0 14px', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--muted)', whiteSpace: 'nowrap' }}
                >
                  <X size={15} /> Сбросить
                </button>
              )}
            </div>

            {filterDirection && (
              <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Направление:</span>
                <span style={{ fontSize: 13, background: 'var(--blue-50)', color: 'var(--blue-700)', padding: '4px 10px', borderRadius: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {filterDirection}
                  <button onClick={() => setFilterDirection('')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0, color: 'var(--blue-500)' }}><X size={13} /></button>
                </span>
              </div>
            )}

            {filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
                <SlidersHorizontal size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
                <p style={{ fontSize: 16, marginBottom: 8 }}>
                  {courses.length === 0 ? 'Курсы появятся здесь после добавления администратором' : 'Ничего не найдено по вашему запросу'}
                </p>
                {courses.length > 0 && <button onClick={clearFilters} className="btn btn-ghost btn-sm">Сбросить фильтры</button>}
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 16 }}>Найдено курсов: {filteredCourses.length}</p>
                <div className={`courses${!hasActiveFilters && !showAll ? ' courses--preview' : ''}`}>
                  {displayedCourses.map(c => <CourseCard key={c.id} course={c} onDetail={setDetailCourse} />)}
                </div>
                {!hasActiveFilters && !showAll && hiddenCount > 0 && (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <button
                      className="btn btn-ghost btn-lg"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '12px 28px' }}
                      onClick={() => setShowAll(true)}
                    >
                      Показать ещё {hiddenCount} курсов <ArrowRight size={17} />
                    </button>
                  </div>
                )}
                {!hasActiveFilters && showAll && (
                  <div style={{ textAlign: 'center', marginTop: 32 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => { setShowAll(false); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' }) }}
                    >
                      Свернуть
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* ── How It Works ── */}
        <section className="section" id="how">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">Как это работает</span>
              <h2 className="section-title">Три шага до новой профессии</h2>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step__num">
                  <Search size={32} />
                  <i>1</i>
                </div>
                <h3>Выберите курс</h3>
                <p>Подберите направление и программу в каталоге — по формату, длительности и возрасту.</p>
              </div>
              <div className="step">
                <div className="step__num">
                  <ClipboardPen size={32} />
                  <i>2</i>
                </div>
                <h3>Заполните заявку</h3>
                <p>Оставьте онлайн-заявку за пару минут. Документы формируются автоматически.</p>
              </div>
              <div className="step">
                <div className="step__num">
                  <GraduationCap size={32} />
                  <i>3</i>
                </div>
                <h3>Учитесь и получайте документ</h3>
                <p>Пройдите обучение с наставником и получите документ о квалификации.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── About ── */}
        <section className="section" id="about" style={{ background: 'var(--bg-soft)' }}>
          <div className="wrap">
            <div className="about__grid">
              <div className="about__visual">
                {/* Сохрани фото public/about-building.jpg — тогда градиент скроется */}
                <div className="about__visual-wrap">
                  <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'rgba(255,255,255,.07)', top:-50, right:-50, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,.05)', bottom:30, left:-30, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, pointerEvents:'none' }}>
                    <span style={{ fontSize:11, fontWeight:700, letterSpacing:3, color:'rgba(255,255,255,.55)', textTransform:'uppercase' }}>Саратов</span>
                    <span style={{ fontSize:28, fontWeight:900, color:'#fff', lineHeight:1.15, textAlign:'center' }}>АКАДЕМИЯ<br/>БУДУЩЕГО</span>
                  </div>
                  <img
                    src="/about-building.jpg"
                    alt="Здание академии"
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', borderRadius:'var(--r-xl)' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
                  />
                </div>
                <div className="about__badge">
                  <b>15 лет</b>
                  <span>готовим специалистов</span>
                </div>
              </div>
              <div className="about__copy">
                <span className="eyebrow">О нас</span>
                <h2 className="section-title">Центр опережающей профессиональной подготовки</h2>
                <p className="section-sub">
                  My-Course — образовательная платформа ЦОПП Академии в Саратове. Мы помогаем школьникам,
                  студентам и взрослым осваивать востребованные профессии вместе с работодателями региона —
                  быстро, практично и с гарантией качества.
                </p>
                <div className="about__facts">
                  <div className="fact"><b>24</b><span>направления подготовки</span></div>
                  <div className="fact"><b>40+</b><span>партнёров-работодателей</span></div>
                  <div className="fact"><b>8 000+</b><span>выпускников</span></div>
                  <div className="fact"><b>92%</b><span>трудоустроены по профессии</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Audience ── */}
        <section className="section" id="audience">
          <div className="wrap">
            <div className="section-head center">
              <span className="eyebrow">Для кого</span>
              <h2 className="section-title">Курсы для любого этапа пути</h2>
            </div>
            <div className="aud">
              <div className="aud-card">
                <div className="aud-card__ico"><Backpack size={28} /></div>
                <h3>Школьникам</h3>
                <p>Профориентация и первые профессиональные навыки. Попробуйте сферу до поступления и поймите, что вам по душе.</p>
                <button className="aud-card__link" onClick={() => scrollToCourses('', 'SCHOOL')}>
                  Курсы для школьников <ArrowRight size={17} />
                </button>
              </div>
              <div className="aud-card dark">
                <div className="aud-card__ico"><BookOpen size={28} /></div>
                <h3>Студентам</h3>
                <p>Дополнительная профессия параллельно учёбе. Усильте резюме практическими навыками и начните зарабатывать раньше.</p>
                <button className="aud-card__link" onClick={() => scrollToCourses('', 'STUDENT')}>
                  Курсы для студентов <ArrowRight size={17} />
                </button>
              </div>
              <div className="aud-card">
                <div className="aud-card__ico"><Briefcase size={28} /></div>
                <h3>Взрослым и специалистам</h3>
                <p>Переподготовка и повышение квалификации. Смените профессию или получите допуск к работе на производстве.</p>
                <button className="aud-card__link" onClick={() => scrollToCourses('', 'ADULT')}>
                  Курсы для взрослых <ArrowRight size={17} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="section faq-section" id="faq">
          <div className="wrap">
            <div className="faq__grid">
              <div className="faq__intro">
                <span className="eyebrow" style={{ color: 'var(--blue-300)' }}>FAQ</span>
                <h2>Частые вопросы</h2>
                <p>Не нашли ответ? Напишите нам — поможем выбрать курс и оформить заявку.</p>
                <a className="btn btn-white" href="#footer">
                  Задать вопрос <MessageCircle size={19} />
                </a>
              </div>
              <div className="faq__list">
                {faqs.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="section" style={{ paddingTop: 'clamp(56px,8vw,100px)' }}>
          <div className="wrap">
            <div className="cta-block">
              <h2>Готовы начать? Запишитесь сегодня</h2>
              <p>Создайте аккаунт за минуту и оформите заявку на первый курс. Это бесплатно и ни к чему не обязывает.</p>
              <div className="btn-row">
                <Link className="btn btn-white btn-lg" to="/register">Зарегистрироваться бесплатно</Link>
                <a className="btn btn-lg" href="#courses" style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}>
                  Смотреть каталог
                </a>
              </div>
              <div className="note">
                <ShieldCheck size={16} /> Без оплаты и скрытых условий
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="footer" id="footer">
        <div className="wrap">
          <div className="footer__grid">
            <div className="footer__about">
              <a className="logo" href="#top">
                <span className="logo__mark" />My<b>-</b>Course
              </a>
              <p>Образовательная платформа ЦОПП Академии. Профессиональные курсы для школьников, студентов и взрослых в Саратове и онлайн.</p>
              <div className="footer__social">
                <a href="#" aria-label="ВКонтакте"><MessageCircle size={19} /></a>
                <a href="#" aria-label="Telegram"><Send size={19} /></a>
                <a href="#" aria-label="YouTube"><Play size={19} /></a>
                <a href="#" aria-label="Почта"><Mail size={19} /></a>
              </div>
            </div>
            <div className="footer__col">
              <h4>Платформа</h4>
              <a href="#courses">Каталог курсов</a>
              <a href="#how">Как это работает</a>
              <a href="#about">О нас</a>
              <a href="#faq">Вопросы и ответы</a>
            </div>
            <div className="footer__col">
              <h4>Направления</h4>
              {uniqueDirections.slice(0, 4).map(([dir]) => (
                <button key={dir} onClick={() => scrollToCourses(dir, 'ALL')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: 'inherit', textAlign: 'left' }}>{dir}</button>
              ))}
            </div>
            <div className="footer__col">
              <h4>Контакты</h4>
              <a href="#">г. Саратов, ул. Примерная, 1</a>
              <a href="#">+7 (8452) 00-00-00</a>
              <a href="#">info@my-course.ru</a>
              <a href="#">Пн–Пт, 9:00–18:00</a>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© 2026 My-Course · ЦОПП Академия. Все права защищены.</span>
            <span style={{ display: 'flex', gap: 20 }}>
              <a href="#">Политика конфиденциальности</a>
              <a href="#">Договор оферты</a>
            </span>
          </div>
        </div>
      </footer>

      {detailCourse && <CourseDetailPanel course={detailCourse} onClose={() => setDetailCourse(null)} />}
    </>
  )
}

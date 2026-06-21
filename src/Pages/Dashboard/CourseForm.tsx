import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, X, FileText, Image } from 'lucide-react'
import { api } from '../../api/client'

interface FormState {
  title: string
  description: string
  direction: string
  format: string
  audience: string
  startDate: string
  endDate: string
  duration: string
  price: string
  oldPrice: string
  minAge: string
  certificate: string
  isActive: boolean
}

const EMPTY: FormState = {
  title: '', description: '', direction: '', format: 'ONLINE', audience: 'ADULT',
  startDate: '', endDate: '', duration: '', price: '', oldPrice: '', minAge: '', certificate: '', isActive: true,
}

const DIRECTIONS = [
  'Информационные технологии', 'Педагогика', 'Медицина', 'Право', 'Экономика',
  'Менеджмент', 'Психология', 'Инженерия', 'Другое',
]

export default function CourseForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const navigate = useNavigate()

  const [form, setForm] = useState<FormState>(EMPTY)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [programFile, setProgramFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null)
  const [existingPdfUrl, setExistingPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const imgRef = useRef<HTMLInputElement>(null)
  const pdfRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isEdit) return
    api.get(`/courses/${id}`).then(r => {
      const c = r.data
      setForm({
        title: c.title ?? '',
        description: c.description ?? '',
        direction: c.direction ?? '',
        format: c.format ?? 'ONLINE',
        audience: c.audience ?? 'ADULT',
        startDate: c.startDate ? c.startDate.slice(0, 10) : '',
        endDate: c.endDate ? c.endDate.slice(0, 10) : '',
        duration: c.duration ?? '',
        price: c.price != null ? String(c.price) : '',
        oldPrice: c.oldPrice != null ? String(c.oldPrice) : '',
        minAge: c.minAge ?? '',
        certificate: c.certificate ?? '',
        isActive: c.isActive ?? true,
      })
      setExistingImageUrl(c.imageUrl)
      setExistingPdfUrl(c.pdfUrl)
      setImagePreview(c.imageUrl)
    }).catch(() => navigate('/dashboard/manage-courses'))
      .finally(() => setLoading(false))
  }, [id, isEdit, navigate])

  const set = (k: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setForm(f => ({ ...f, [k]: val }))
    setErrors(er => ({ ...er, [k]: '' }))
  }

  const pickImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const pickPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setProgramFile(file)
  }

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) e.title = 'Обязательное поле'
    if (!form.description.trim()) e.description = 'Обязательное поле'
    if (!form.direction) e.direction = 'Выберите направление'
    return e
  }

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault()
    const e = validate()
    setErrors(e)
    if (Object.keys(e).length) return

    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('direction', form.direction)
      fd.append('format', form.format)
      fd.append('audience', form.audience)
      if (form.startDate) fd.append('startDate', form.startDate)
      if (form.endDate) fd.append('endDate', form.endDate)
      if (form.duration) fd.append('duration', form.duration)
      if (form.price) fd.append('price', form.price)
      if (form.oldPrice) fd.append('oldPrice', form.oldPrice)
      if (form.minAge) fd.append('minAge', form.minAge)
      if (form.certificate) fd.append('certificate', form.certificate)
      fd.append('isActive', String(form.isActive))
      if (imageFile) fd.append('imageFile', imageFile)
      if (programFile) fd.append('programFile', programFile)

      if (isEdit) {
        await api.put(`/courses/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } else {
        await api.post('/courses', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      }

      navigate('/dashboard/manage-courses')
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div>
      {[1, 2, 3, 4].map(i => <div key={i} className="skeleton" style={{ height: 52, marginBottom: 16, borderRadius: 'var(--r-xs)' }} />)}
    </div>
  )

  return (
    <>
      <div className="section-head" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/manage-courses')} style={{ padding: '0 10px' }}>
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 style={{ margin: 0 }}>{isEdit ? 'Редактировать курс' : 'Создать курс'}</h2>
          <p style={{ margin: 0 }}>{isEdit ? 'Измените данные и сохраните' : 'Заполните информацию о новом курсе'}</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        <div className="cf-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 24, alignItems: 'start' }}>

          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Основная информация</h3>

              <div className="profile-grid">
                <div className="form-group full">
                  <label>Название курса *</label>
                  <input value={form.title} onChange={set('title')} placeholder="Например: Python для начинающих" />
                  {errors.title && <span style={{ color: 'var(--err)', fontSize: 12 }}>{errors.title}</span>}
                </div>

                <div className="form-group full">
                  <label>Описание *</label>
                  <textarea
                    value={form.description}
                    onChange={set('description')}
                    placeholder="Краткое описание курса…"
                    rows={4}
                    style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 15, fontFamily: 'var(--font)', resize: 'vertical', outline: 'none', transition: 'border-color .15s, box-shadow .15s' }}
                    onFocus={e => e.target.style.borderColor = 'var(--blue-500)'}
                    onBlur={e => e.target.style.borderColor = 'var(--border)'}
                  />
                  {errors.description && <span style={{ color: 'var(--err)', fontSize: 12 }}>{errors.description}</span>}
                </div>

                <div className="form-group">
                  <label>Направление *</label>
                  <select value={form.direction} onChange={set('direction')}>
                    <option value="">Выберите…</option>
                    {DIRECTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  {errors.direction && <span style={{ color: 'var(--err)', fontSize: 12 }}>{errors.direction}</span>}
                </div>

                <div className="form-group">
                  <label>Длительность</label>
                  <input value={form.duration} onChange={set('duration')} placeholder="Например: 72 часа" />
                </div>

                <div className="form-group">
                  <label>Формат</label>
                  <select value={form.format} onChange={set('format')}>
                    <option value="ONLINE">Онлайн</option>
                    <option value="OFFLINE">Очно</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Аудитория</label>
                  <select value={form.audience} onChange={set('audience')}>
                    <option value="ADULT">Взрослым</option>
                    <option value="STUDENT">Студентам</option>
                    <option value="SCHOOL">Школьникам</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Дата начала</label>
                  <input type="date" value={form.startDate} onChange={set('startDate')} />
                </div>

                <div className="form-group">
                  <label>Дата окончания</label>
                  <input type="date" value={form.endDate} onChange={set('endDate')} />
                </div>

                <div className="form-group">
                  <label>Стоимость (₽)</label>
                  <input type="number" value={form.price} onChange={set('price')} placeholder="0 — бесплатно" min="0" />
                </div>

                <div className="form-group">
                  <label>Старая цена (₽) — зачёркнутая</label>
                  <input type="number" value={form.oldPrice} onChange={set('oldPrice')} placeholder="Например: 26000" min="0" />
                </div>

                <div className="form-group">
                  <label>Минимальный возраст</label>
                  <input value={form.minAge} onChange={set('minAge')} placeholder="Например: с 16 лет" />
                </div>

                <div className="form-group">
                  <label>Документ об окончании</label>
                  <input value={form.certificate} onChange={set('certificate')} placeholder="Например: Удостоверение" />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Image upload */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Обложка курса</h3>
              <input ref={imgRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickImage} />

              {imagePreview ? (
                <div style={{ position: 'relative', borderRadius: 'var(--r-sm)', overflow: 'hidden', aspectRatio: '16/9' }}>
                  <img src={imagePreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(existingImageUrl); imgRef.current && (imgRef.current.value = '') }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => imgRef.current?.click()}
                  style={{ width: '100%', aspectRatio: '16/9', border: '2px dashed var(--border)', borderRadius: 'var(--r-sm)', background: 'var(--bg-soft)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--muted)', transition: 'border-color .15s' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = 'var(--blue-400)')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <Image size={32} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Загрузить обложку</span>
                  <span style={{ fontSize: 12 }}>JPG, PNG, WebP</span>
                </button>
              )}

              {imageFile && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => imgRef.current?.click()}>
                  <Upload size={15} /> Заменить
                </button>
              )}
              {!imageFile && (
                <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} onClick={() => imgRef.current?.click()}>
                  <Upload size={15} /> {existingImageUrl ? 'Заменить' : 'Загрузить'}
                </button>
              )}
            </div>

            {/* PDF upload */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 24 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Программа курса (PDF)</h3>
              <input ref={pdfRef} type="file" accept=".pdf" style={{ display: 'none' }} onChange={pickPdf} />

              {programFile ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--blue-50)', borderRadius: 'var(--r-xs)' }}>
                  <FileText size={20} style={{ color: 'var(--blue-600)', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{programFile.name}</span>
                  <button type="button" onClick={() => { setProgramFile(null); pdfRef.current && (pdfRef.current.value = '') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)' }}>
                    <X size={16} />
                  </button>
                </div>
              ) : existingPdfUrl ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'var(--blue-50)', borderRadius: 'var(--r-xs)' }}>
                  <FileText size={20} style={{ color: 'var(--blue-600)', flexShrink: 0 }} />
                  <a href={existingPdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--blue-700)', flex: 1 }}>Текущая программа</a>
                </div>
              ) : null}

              <button type="button" className="btn btn-ghost btn-sm" style={{ marginTop: programFile || existingPdfUrl ? 10 : 0, width: '100%', justifyContent: 'center' }} onClick={() => pdfRef.current?.click()}>
                <Upload size={15} /> {existingPdfUrl || programFile ? 'Заменить PDF' : 'Загрузить PDF'}
              </button>
            </div>

            {/* Status */}
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', padding: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>Курс активен</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                    Виден пользователям в каталоге
                  </div>
                </div>
              </label>
            </div>

            {/* Submit */}
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ width: '100%', justifyContent: 'center' }}>
              {saving ? <span className="spin" /> : isEdit ? 'Сохранить изменения' : 'Создать курс'}
            </button>
          </div>
        </div>
      </form>
    </>
  )
}

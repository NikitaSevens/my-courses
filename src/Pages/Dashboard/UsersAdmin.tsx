import { useEffect, useState, useCallback } from 'react'
import { Search, Shield, ShieldCheck, ShieldAlert, User, Ban, ShieldOff } from 'lucide-react'
import { api } from '../../api/client'
import { useAuth } from '../../context/AuthContext'

interface UserRow {
  id: number
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
  isBlocked: boolean
  createdAt: string
  _count: { enrollments: number }
}

const ROLES = ['USER', 'EDITOR', 'ADMIN', 'SUPERADMIN']
const ROLE_LABEL: Record<string, string> = { USER: 'Слушатель', EDITOR: 'Редактор', ADMIN: 'Администратор', SUPERADMIN: 'Суперадмин' }
const ROLE_COLOR: Record<string, string> = { USER: '', EDITOR: 'status-active', ADMIN: 'status-completed', SUPERADMIN: 'status-rejected' }
const ROLE_ICON: Record<string, React.ReactNode> = {
  USER: <User size={13} />,
  EDITOR: <Shield size={13} />,
  ADMIN: <ShieldCheck size={13} />,
  SUPERADMIN: <ShieldAlert size={13} />,
}

export default function UsersAdmin() {
  const { user: me } = useAuth()
  const [users, setUsers] = useState<UserRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [changingRole, setChangingRole] = useState<number | null>(null)
  const [blockingId, setBlockingId] = useState<number | null>(null)

  const isSuperadmin = me?.role === 'SUPERADMIN'

  const load = useCallback(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.append('search', search)
    if (roleFilter) params.append('role', roleFilter)
    params.append('page', String(page))
    params.append('limit', '20')

    api.get(`/users?${params.toString()}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search, roleFilter, page])

  useEffect(() => { load() }, [load])

  const toggleBlock = async (u: UserRow) => {
    const action = u.isBlocked ? 'разблокировать' : 'заблокировать'
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} пользователя ${u.firstName} ${u.lastName}?`)) return
    setBlockingId(u.id)
    try {
      await api.put(`/users/${u.id}/block`, { isBlocked: !u.isBlocked })
      setUsers(us => us.map(x => x.id === u.id ? { ...x, isBlocked: !u.isBlocked } : x))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка')
    } finally {
      setBlockingId(null)
    }
  }

  const changeRole = async (userId: number, role: string) => {
    if (!confirm(`Изменить роль на «${ROLE_LABEL[role]}»?`)) return
    setChangingRole(userId)
    try {
      await api.put(`/users/${userId}/role`, { role })
      setUsers(us => us.map(u => u.id === userId ? { ...u, role } : u))
    } catch (err: any) {
      alert(err.response?.data?.error || 'Ошибка смены роли')
    } finally {
      setChangingRole(null)
    }
  }

  const pages = Math.ceil(total / 20)

  return (
    <>
      <div className="section-head">
        <h2>Пользователи</h2>
        <p>Управление аккаунтами и ролями — {total} пользователей</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            style={{ width: '100%', padding: '9px 14px 9px 38px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontFamily: 'var(--font)', outline: 'none', boxSizing: 'border-box' }}
            placeholder="Поиск по имени или email…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={e => { setRoleFilter(e.target.value); setPage(1) }}
          style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 14, fontFamily: 'var(--font)', background: '#fff', outline: 'none', cursor: 'pointer' }}
        >
          <option value="">Все роли</option>
          {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--r-xl)', overflow: 'hidden' }}>
        <div className="table-scroll-wrap">
        {loading ? (
          <div style={{ padding: 24 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--r-xs)' }} />)}
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state"><User size={48} /><h3>Пользователи не найдены</h3></div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-soft)' }}>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Пользователь</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Email</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Роль</th>
                <th style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)' }}>Курсы</th>
                <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)' }}>Зарегистрирован</th>
                {isSuperadmin && <th style={{ padding: '12px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Изменить роль</th>}
                {isSuperadmin && <th style={{ padding: '12px 12px', textAlign: 'center', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Блокировка</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border)', opacity: u.isBlocked ? 0.6 : 1, background: u.isBlocked ? '#fff5f5' : undefined }}>
                  <td style={{ padding: '12px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.isBlocked ? '#fee2e2' : 'var(--blue-100)', color: u.isBlocked ? '#dc2626' : 'var(--blue-700)', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                        {u.firstName[0]}{u.lastName[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{u.lastName} {u.firstName}</div>
                        {u.isBlocked && (
                          <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', borderRadius: 4, padding: '1px 6px', display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Ban size={10} /> Заблокирован
                          </div>
                        )}
                        {!u.isEmailVerified && !u.isBlocked && (
                          <div style={{ fontSize: 11, color: '#856404', background: '#FFF3CD', borderRadius: 4, padding: '1px 6px', display: 'inline-block', marginTop: 2 }}>
                            Email не подтверждён
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 18px', color: 'var(--muted)' }}>{u.email}</td>
                  <td style={{ padding: '12px 18px' }}>
                    <span className={`badge ${ROLE_COLOR[u.role]}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {ROLE_ICON[u.role]} {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 18px', textAlign: 'center', fontWeight: 600, color: 'var(--blue-700)' }}>
                    {u._count.enrollments}
                  </td>
                  <td style={{ padding: '12px 18px', color: 'var(--muted)', fontSize: 13 }}>
                    {new Date(u.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  {isSuperadmin && (
                    <td style={{ padding: '8px 12px' }}>
                      {u.id !== me?.id ? (
                        changingRole === u.id ? (
                          <span className="spin" style={{ borderTopColor: 'var(--blue-600)' }} />
                        ) : (
                          <select
                            value={u.role}
                            onChange={e => changeRole(u.id, e.target.value)}
                            style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-xs)', padding: '5px 8px', fontSize: 13, fontFamily: 'var(--font)', background: '#fff', cursor: 'pointer', maxWidth: 140 }}
                          >
                            {ROLES.map(r => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                          </select>
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Вы</span>
                      )}
                    </td>
                  )}
                  {isSuperadmin && (
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      {u.id !== me?.id && u.role !== 'SUPERADMIN' ? (
                        blockingId === u.id ? (
                          <span className="spin" style={{ borderTopColor: '#dc2626' }} />
                        ) : (
                          <button
                            onClick={() => toggleBlock(u)}
                            title={u.isBlocked ? 'Разблокировать пользователя' : 'Заблокировать пользователя'}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '5px 10px', borderRadius: 'var(--r-xs)', fontSize: 12, fontWeight: 600,
                              cursor: 'pointer', border: '1px solid', whiteSpace: 'nowrap',
                              borderColor: u.isBlocked ? '#16a34a' : '#dc2626',
                              color: u.isBlocked ? '#16a34a' : '#dc2626',
                              background: u.isBlocked ? '#f0fdf4' : '#fff5f5',
                              fontFamily: 'var(--font)',
                            }}
                          >
                            {u.isBlocked
                              ? <><ShieldOff size={12} /> Разблок.</>
                              : <><Ban size={12} /> Блок.</>
                            }
                          </button>
                        )
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--muted)' }}>—</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`filter-btn${page === p ? ' active' : ''}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

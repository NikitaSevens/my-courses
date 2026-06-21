import { useState } from 'react'
import { NavLink, Outlet, useNavigate, Navigate } from 'react-router-dom'
import {
  BookOpen, Search, FileText, User, Settings,
  LogOut, Menu, X, LayoutDashboard, Users, PlusCircle,
  GraduationCap,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import './Dashboard.css'

const ROLE_LABELS: Record<string, string> = {
  USER: 'Слушатель',
  EDITOR: 'Редактор',
  ADMIN: 'Администратор',
  SUPERADMIN: 'Суперадмин',
}

export default function Dashboard() {
  const { user, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [sideOpen, setSideOpen] = useState(false)

  if (!isAuthenticated) return <Navigate to="/login" replace />

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : '??'

  const isEditor = ['EDITOR', 'ADMIN', 'SUPERADMIN'].includes(user?.role ?? '')
  const isAdmin  = ['ADMIN', 'SUPERADMIN'].includes(user?.role ?? '')

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <div className="dash">
      {/* overlay for mobile */}
      {sideOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 199 }}
          onClick={() => setSideOpen(false)}
        />
      )}

      <aside className={`sidebar${sideOpen ? ' open' : ''}`}>
        <div className="sidebar__logo">
          <a className="sidebar__logo-link" href="/">
            <span>А</span> Академия
          </a>
        </div>

        <div className="sidebar__user">
          <div className="sidebar__avatar">{initials}</div>
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{user?.firstName} {user?.lastName}</div>
            <div className="sidebar__user-role">{ROLE_LABELS[user?.role ?? 'USER']}</div>
          </div>
        </div>

        <nav className="sidebar__nav">
          <div className="sidebar__section-title">Обучение</div>

          <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            to="/dashboard" end onClick={() => setSideOpen(false)}>
            <LayoutDashboard size={18} /> Мои курсы
          </NavLink>

          <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            to="/dashboard/catalog" onClick={() => setSideOpen(false)}>
            <Search size={18} /> Каталог курсов
          </NavLink>

          <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            to="/dashboard/documents" onClick={() => setSideOpen(false)}>
            <FileText size={18} /> Мои документы
          </NavLink>

          <div className="sidebar__section-title" style={{ marginTop: 8 }}>Личное</div>

          <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            to="/dashboard/profile" onClick={() => setSideOpen(false)}>
            <User size={18} /> Личные данные
          </NavLink>

          <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
            to="/dashboard/settings" onClick={() => setSideOpen(false)}>
            <Settings size={18} /> Настройки
          </NavLink>

          {isEditor && (
            <>
              <div className="sidebar__section-title" style={{ marginTop: 8 }}>Управление</div>
              <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
                to="/dashboard/manage-courses" onClick={() => setSideOpen(false)}>
                <BookOpen size={18} /> Курсы
              </NavLink>
              <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
                to="/dashboard/manage-courses/new" onClick={() => setSideOpen(false)}>
                <PlusCircle size={18} /> Создать курс
              </NavLink>
            </>
          )}

          {isAdmin && (
            <NavLink className={({ isActive }) => `sidebar__link${isActive ? ' active' : ''}`}
              to="/dashboard/users" onClick={() => setSideOpen(false)}>
              <Users size={18} /> Пользователи
            </NavLink>
          )}
        </nav>

        <div className="sidebar__footer">
          <button className="sidebar__link" onClick={handleLogout} style={{ color: '#dc2626' }}>
            <LogOut size={18} /> Выйти
          </button>
        </div>
      </aside>

      <div className="dash__main">
        <header className="dash__topbar">
          <button className="sidebar-toggle" onClick={() => setSideOpen(s => !s)}>
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="dash__topbar-title">
            <GraduationCap size={20} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle', color: 'var(--blue-600)' }} />
            ЦОПП Академия Саратов
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="sidebar__avatar" style={{ width: 34, height: 34, fontSize: 13 }}>{initials}</div>
          </div>
        </header>

        <main className="dash__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

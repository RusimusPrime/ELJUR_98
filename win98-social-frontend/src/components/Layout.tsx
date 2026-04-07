import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Badge } from './Win98';

const nav = [
  { to: '/', label: 'Лента' },
  { to: '/messages', label: 'Сообщения' },
  { to: '/groups', label: 'Группы' },
  { to: '/search', label: 'Поиск' },
  { to: '/profile', label: 'Профиль' },
  { to: '/admin', label: 'Админ' },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <div className="desktop">
      <aside className="sidebar">
        <div className="desktop-icon">ELJUR 98</div>
        <div className="sidebar-panel">
          <div className="sidebar-title">Пользователь</div>
          <div>{user?.full_name}</div>
          <Badge>{user?.role ?? 'guest'}</Badge>
        </div>
        <nav className="sidebar-nav">
          {nav.map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="win98-button" onClick={logout}>Выйти</button>
      </aside>
      <main className="main-panel">
        <div className="topbar">
          <div>ELJUR 98 · {location.pathname}</div>
          <Link className="topbar-link" to="/groups/new">Создать группу</Link>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

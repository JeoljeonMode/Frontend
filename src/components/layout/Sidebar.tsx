import { Camera, FileClock, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

interface Props {
  open: boolean;
  onToggle: () => void;
}

export function Sidebar({ open, onToggle }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`control-rail${open ? '' : ' collapsed'}`}>
      <div className="sidebar-top">
        {open && (
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 48 48" role="img">
                <path d="M24 4 39 9v12c0 9.5-5.9 17.9-15 21-9.1-3.1-15-11.5-15-21V9l15-5Z" />
                <path d="M16 27h16M17 22h14c2 0 3 1 3 3v6M14 31h20M18 18h4" />
              </svg>
            </span>
            <div>
              <strong>BedSafe AI</strong>
              <span>Fall Risk Monitor</span>
            </div>
          </div>
        )}
        <button className="sidebar-toggle" onClick={onToggle} aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}>
          {open ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
      </div>

      <nav className="rail-nav" aria-label="메인 메뉴">
        <NavLink to="/" end title="대시보드">
          <LayoutDashboard size={18} />
          {open && <span>대시보드</span>}
        </NavLink>
        <NavLink to="/beds" title="병상 목록">
          <Camera size={18} />
          {open && <span>병상 목록</span>}
        </NavLink>
        <NavLink to="/events" title="이벤트 로그">
          <FileClock size={18} />
          {open && <span>이벤트 로그</span>}
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {open && user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.displayName}</span>
            <span className="sidebar-user-role">{user.role === 'ADMIN' ? '관리자' : '직원'}</span>
          </div>
        )}
        <button className="sidebar-toggle sidebar-logout" onClick={handleLogout} title="로그아웃">
          <LogOut size={18} />
          {open && <span>로그아웃</span>}
        </button>
      </div>
    </aside>
  );
}

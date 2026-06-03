import { Camera, FileClock, LayoutDashboard, LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';

interface Props {
  open: boolean;
  onToggle: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({ open, onToggle, mobileOpen, onMobileClose }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`control-rail${open ? '' : ' collapsed'}${mobileOpen ? ' mobile-open' : ''}`}>
      <div className="sidebar-top">
        {/* Desktop: show brand + toggle; Mobile: show brand + close button */}
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
        {/* Desktop toggle */}
        <button className="sidebar-toggle desktop-only" onClick={onToggle} aria-label={open ? '사이드바 접기' : '사이드바 펼치기'}>
          {open ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
        </button>
        {/* Mobile close */}
        <button className="sidebar-toggle mobile-close-btn" onClick={onMobileClose} aria-label="닫기">
          <X size={18} />
        </button>
      </div>

      <nav className="rail-nav" aria-label="메인 메뉴">
        <NavLink to="/" end title="대시보드" onClick={onMobileClose}>
          <LayoutDashboard size={18} />
          <span>대시보드</span>
        </NavLink>
        <NavLink to="/beds" title="병상 목록" onClick={onMobileClose}>
          <Camera size={18} />
          <span>병상 목록</span>
        </NavLink>
        <NavLink to="/events" title="이벤트 로그" onClick={onMobileClose}>
          <FileClock size={18} />
          <span>이벤트 로그</span>
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user">
            <span className="sidebar-user-name">{user.displayName}</span>
            <span className="sidebar-user-role">{user.role === 'ADMIN' ? '관리자' : '직원'}</span>
          </div>
        )}
        <button className="sidebar-logout" onClick={handleLogout} title="로그아웃">
          <LogOut size={16} />
          <span>로그아웃</span>
        </button>
      </div>
    </aside>
  );
}

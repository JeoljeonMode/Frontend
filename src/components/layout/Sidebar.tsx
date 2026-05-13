import { Camera, FileClock, LayoutDashboard, Radio } from 'lucide-react';
import { NavLink } from 'react-router-dom';

interface Props {
  backendConnected: boolean;
}

export function Sidebar({ backendConnected }: Props) {
  return (
    <aside className="control-rail">
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

      <nav className="rail-nav" aria-label="메인 메뉴">
        <NavLink to="/" end>
          <LayoutDashboard size={18} />
          대시보드
        </NavLink>
        <NavLink to="/beds">
          <Camera size={18} />
          병상 목록
        </NavLink>
        <NavLink to="/events">
          <FileClock size={18} />
          이벤트 로그
        </NavLink>
      </nav>

      <div className="api-card">
        <div className="api-status">
          <Radio size={17} />
          <span>{backendConnected ? '백엔드 연결됨' : 'Mock Stream'}</span>
        </div>
        <p>
          {backendConnected
            ? '백엔드 서버와 SSE 실시간 연결 중입니다.'
            : '백엔드 미연결 — Mock 데이터로 시연 중입니다.'}
        </p>
      </div>
    </aside>
  );
}

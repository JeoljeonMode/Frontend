import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  LayoutDashboard,
  Search,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';

const stats = [
  { label: '진행 중 프로젝트', value: '12', delta: '+3', icon: LayoutDashboard },
  { label: '이번 주 완료율', value: '84%', delta: '+11%', icon: CheckCircle2 },
  { label: '활성 사용자', value: '1,248', delta: '+8%', icon: Users },
  { label: '평균 응답 시간', value: '1.8s', delta: '-0.4s', icon: Clock3 },
];

const milestones = [
  { name: '데이터 수집 모듈 연동', owner: 'Backend', status: '완료', progress: 100 },
  { name: 'React 대시보드 프로토타입', owner: 'Frontend', status: '진행 중', progress: 68 },
  { name: '모델 추론 API 연결', owner: 'AI', status: '검토', progress: 42 },
  { name: '사용자 테스트 시나리오', owner: 'PM', status: '대기', progress: 18 },
];

const alerts = [
  'API 응답 지연이 최근 24시간 평균보다 높습니다.',
  '테스트 커버리지 리포트가 업데이트되었습니다.',
  '다음 발표 자료 마감이 3일 남았습니다.',
];

export function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">IC</span>
          <div>
            <strong>INHA Capstone</strong>
            <span>Project Console</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="주요 메뉴">
          <a className="nav-item active" href="#dashboard">
            <LayoutDashboard size={18} />
            대시보드
          </a>
          <a className="nav-item" href="#schedule">
            <CalendarDays size={18} />
            일정
          </a>
          <a className="nav-item" href="#analytics">
            <Activity size={18} />
            분석
          </a>
          <a className="nav-item" href="#settings">
            <Settings size={18} />
            설정
          </a>
        </nav>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>캡스톤 프로젝트 운영 현황</h1>
          </div>
          <div className="topbar-actions">
            <label className="search">
              <Search size={18} />
              <input placeholder="프로젝트, 담당자 검색" />
            </label>
            <button className="icon-button" aria-label="알림">
              <Bell size={19} />
            </button>
            <button className="profile-button">
              Team A
              <ChevronDown size={16} />
            </button>
          </div>
        </header>

        <section className="stats-grid" aria-label="핵심 지표">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <article className="stat-card" key={item.label}>
                <div className="stat-icon">
                  <Icon size={20} />
                </div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.delta} 지난주 대비</small>
              </article>
            );
          })}
        </section>

        <section className="content-grid">
          <article className="panel project-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Milestones</p>
                <h2>주요 작업 진행률</h2>
              </div>
              <button className="text-button">전체 보기</button>
            </div>

            <div className="milestone-list">
              {milestones.map((item) => (
                <div className="milestone" key={item.name}>
                  <div className="milestone-row">
                    <div>
                      <strong>{item.name}</strong>
                      <span>{item.owner}</span>
                    </div>
                    <em>{item.status}</em>
                  </div>
                  <div className="progress-track" aria-label={`${item.name} ${item.progress}%`}>
                    <span style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Health</p>
                <h2>시스템 상태</h2>
              </div>
              <TrendingUp size={22} />
            </div>
            <div className="health-score">
              <strong>92</strong>
              <span>Stable</span>
            </div>
            <ul className="alert-list">
              {alerts.map((alert) => (
                <li key={alert}>{alert}</li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  );
}

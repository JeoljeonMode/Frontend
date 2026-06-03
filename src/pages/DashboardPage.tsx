import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bed, Bell, CheckCheck, CheckCircle2, CircleDot, MessageCircle, ShieldAlert, ShieldCheck, Siren, UserCheck, UserX, X } from 'lucide-react';
import { postDemoEvent } from '../api/eventsApi';
import { VideoFeedPanel } from '../components/VideoFeedPanel';
import { QAPanel } from '../components/QAPanel';
import { useBackendContext, TopbarSlotContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { formatTime, initialSnapshots, levelMeta, nextScenario, poseLabel, positionLabel } from '../mock/mockData';
import type { RiskLevel, Snapshot } from '../types';

export function DashboardPage() {
  const { backendConnected, setBackendConnected, current, setCurrent, events, setEvents, pushSnapshot } = useBackendContext();
  const [autoRefresh, setAutoRefresh] = useState(!backendConnected);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [unreadIds, setUnreadIds] = useState<string[]>(
    initialSnapshots.filter((e) => e.level !== 'normal').map((e) => e.id),
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialSnapshots[0].id);
  const [chatOpen, setChatOpen] = useState(false);

  const onSSEEvent = useCallback((snap: Snapshot) => {
    pushSnapshot(snap);
    if (snap.level !== 'normal') setUnreadIds((p) => [snap.id, ...p].slice(0, 12));
  }, [pushSnapshot]);

  const onSSEDisconnect = useCallback(() => setBackendConnected(false), [setBackendConnected]);
  useSSE(backendConnected, onSSEEvent, onSSEDisconnect);

  useEffect(() => {
    setAutoRefresh(!backendConnected);
  }, [backendConnected]);

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => {
      setScenarioIndex((prev) => {
        const next = prev + 1;
        const snap = nextScenario(next);
        setCurrent(snap);
        setEvents((items) => [snap, ...items].slice(0, 8));
        if (snap.level !== 'normal') setUnreadIds((p) => [snap.id, ...p].slice(0, 12));
        return next;
      });
    }, 6000);
    return () => clearInterval(t);
  }, [autoRefresh, setCurrent, setEvents]);

  const riskCounts = useMemo(() => ({
    danger: events.filter((e) => e.level === 'danger').length,
    caution: events.filter((e) => e.level === 'caution').length,
    normal: events.filter((e) => e.level === 'normal').length,
  }), [events]);

  const handleScenario = async (level: RiskLevel) => {
    if (backendConnected) { await postDemoEvent(); return; }
    const idx = initialSnapshots.findIndex((s) => s.level === level);
    const snap = nextScenario(idx >= 0 ? idx : 0);
    setCurrent(snap);
    setEvents((items) => [snap, ...items].slice(0, 8));
    setSelectedId(snap.id);
    if (snap.level !== 'normal') { setUnreadIds((p) => [snap.id, ...p].slice(0, 12)); setNotifOpen(true); }
    setAutoRefresh(false);
  };

  const unreadCount = unreadIds.length;
  const selectedAlert = events.find((e) => e.id === selectedId) ?? events[0];
  const LevelIcon = levelMeta[current.level].icon;
  const { setTopbarRight } = useContext(TopbarSlotContext);

  /* Inject bell into mobile topbar */
  useEffect(() => {
    setTopbarRight(
      <button
        className="icon-button alert-trigger mobile-bell"
        onClick={() => setNotifOpen((v) => !v)}
        aria-label="알림"
      >
        <Bell size={17} />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
    );
    return () => setTopbarRight(null);
  }, [unreadCount, setTopbarRight]);

  const inspectAlert = (id: string) => {
    setSelectedId(id);
    setUnreadIds((p) => p.filter((x) => x !== id));
    setNotifOpen(true);
  };

  return (
    <>
      {/* Header */}
      <header className="dashboard-header">
        <div>
          <h1>실시간 낙상 위험 대시보드</h1>
          <span className="timestamp">마지막 업데이트 {formatTime(current.timestamp)}</span>
        </div>
        <div className="header-actions">
          <button className={autoRefresh ? 'toggle active' : 'toggle'} onClick={() => setAutoRefresh((v) => !v)}>
            <CircleDot size={14} /> 자동 갱신 #{scenarioIndex + 1}
          </button>
          <button className="icon-button alert-trigger" aria-label="알림" onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={17} />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>
      </header>

      {/* Status bar — replaces the old 4-card summary strip */}
      <div className={`status-bar ${current.level}`}>
        <div className={`status-risk ${current.level}`}>
          <LevelIcon size={20} />
          <div>
            <span className="status-risk-label">{levelMeta[current.level].tone}</span>
            <strong className="status-risk-score">
              {current.score}<small>/10</small>
            </strong>
          </div>
          <span className={`status-risk-pill ${current.level}`}>{levelMeta[current.level].label}</span>
        </div>
        <div className="status-sep" />
        <div className="status-items">
          <div className="status-item">
            <span className="status-item-icon"><Bed size={13} /></span>
            <div>
              <span className="status-item-label">병상 · 카메라</span>
              <span className="status-item-value">{current.bedId} · {current.cameraId}</span>
            </div>
          </div>
          <div className="status-sep" />
          <div className={`status-item${!current.guardrailUp ? ' warn' : ''}`}>
            <span className="status-item-icon">
              {current.guardrailUp ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            </span>
            <div>
              <span className="status-item-label">가드레일</span>
              <span className="status-item-value">{current.guardrailUp ? '올라감' : '내려감'}</span>
            </div>
          </div>
          <div className="status-sep" />
          <div className={`status-item${!current.caregiverPresent ? ' warn' : ''}`}>
            <span className="status-item-icon">
              {current.caregiverPresent ? <UserCheck size={13} /> : <UserX size={13} />}
            </span>
            <div>
              <span className="status-item-label">보호 인력</span>
              <span className="status-item-value">{current.caregiverPresent ? '감지됨' : '미감지'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification drawer */}
      {notifOpen && (
        <aside className="notification-drawer">
          <div className="drawer-header">
            <div><h2>알림</h2></div>
            <div className="drawer-actions">
              <button onClick={() => setUnreadIds([])}><CheckCheck size={15} />모두 읽음</button>
              <button className="drawer-close" onClick={() => setNotifOpen(false)}><X size={17} /></button>
            </div>
          </div>
          <div className="alert-detail">
            <span className={`alert-severity ${selectedAlert.level}`}><Siren size={14} />{levelMeta[selectedAlert.level].label}</span>
            <strong>{selectedAlert.summary}</strong>
            <p>{selectedAlert.factors.join(', ') || '위험 인자 없음'}</p>
            <dl>
              <div><dt>발생 시각</dt><dd>{formatTime(selectedAlert.timestamp)}</dd></div>
              <div><dt>병상</dt><dd>{selectedAlert.bedId}</dd></div>
              <div><dt>환자</dt><dd>{selectedAlert.patientName}</dd></div>
            </dl>
          </div>
          <div className="notification-list">
            {events.filter((e) => e.level !== 'normal').map((e) => (
              <button className={unreadIds.includes(e.id) ? 'notification-item unread' : 'notification-item'} key={e.id} onClick={() => inspectAlert(e.id)}>
                <span className={`event-dot ${e.level}`} style={{ flexShrink: 0 }} />
                <div><strong>{e.summary}</strong><small>{formatTime(e.timestamp)} · {e.factors[0]}</small></div>
              </button>
            ))}
          </div>
        </aside>
      )}

      {/* Main workspace */}
      <section className="dash-workspace">
        <VideoFeedPanel current={current} onScenario={handleScenario} />
        <aside className="dash-right">
          <article className="panel">
            <div className="panel-header">
              <h2>위험 인자</h2>
              <span className="score-badge"><b>{current.score}</b><span style={{ opacity: 0.6, fontSize: '0.82em' }}>/10</span></span>
            </div>
            <div className="factor-list">
              {current.factors.length ? current.factors.map((f) => (
                <div className="factor-item" key={f}><AlertTriangle size={15} /><span>{f}</span></div>
              )) : (
                <div className="factor-item calm"><CheckCircle2 size={15} /><span>현재 감지된 위험 인자가 없습니다.</span></div>
              )}
            </div>
          </article>
          <article className="panel">
            <div className="panel-header"><h2>환자 상태</h2></div>
            <dl className="state-list">
              <div><dt>관리 환자</dt><dd>{current.patientName}</dd></div>
              <div><dt>환자 위치</dt><dd>{positionLabel[current.position]}</dd></div>
              <div><dt>자세 상태</dt><dd>{poseLabel[current.pose]}</dd></div>
              <div><dt>요약</dt><dd>{current.summary}</dd></div>
            </dl>
          </article>
        </aside>
      </section>

      {/* Event history — full width */}
      <section className="dash-events">
        <article className="panel">
          <div className="panel-header">
            <h2>이벤트 이력</h2>
            <div className="count-group">
              <span className="danger">{riskCounts.danger}</span>
              <span className="caution">{riskCounts.caution}</span>
              <span className="normal">{riskCounts.normal}</span>
            </div>
          </div>
          <div className="event-table">
            {events.map((e) => (
              <button className="event-row" key={e.id} onClick={() => inspectAlert(e.id)}>
                <span className={`event-dot ${e.level}`} style={{ flexShrink: 0 }} />
                <div>
                  <strong>{e.summary}</strong>
                  <span>{formatTime(e.timestamp)} · {e.patientName} · {e.factors.join(', ') || '정상'}</span>
                </div>
                <em>{levelMeta[e.level].label}</em>
              </button>
            ))}
          </div>
        </article>
      </section>

      {/* Floating Chat FAB */}
      <button
        className={`chat-fab${chatOpen ? ' active' : ''}`}
        onClick={() => setChatOpen((v) => !v)}
        aria-label="AI 질의응답"
      >
        {chatOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat Drawer — slides in from right */}
      <aside className={`chat-drawer${chatOpen ? ' open' : ''}`}>
        <div className="chat-drawer-head">
          <div>
            <strong>AI 상태 질의</strong>
            <span>현재 병상 상태에 대해 질문하세요</span>
          </div>
          <button className="chat-drawer-close" onClick={() => setChatOpen(false)}>
            <X size={15} />
          </button>
        </div>
        <QAPanel current={current} backendConnected={backendConnected} bare />
      </aside>
    </>
  );
}

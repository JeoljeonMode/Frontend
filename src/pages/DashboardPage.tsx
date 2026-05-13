import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Bed, Bell, CheckCircle2, CheckCheck, CircleDot, ShieldAlert, ShieldCheck, Siren, UserCheck, UserX, X } from 'lucide-react';
import { postDemoEvent } from '../api/eventsApi';
import { VideoFeedPanel } from '../components/VideoFeedPanel';
import { QAPanel } from '../components/QAPanel';
import { useBackendContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { formatTime, initialSnapshots, levelMeta, nextScenario, poseLabel, positionLabel } from '../mock/mockData';
import type { RiskLevel, Snapshot } from '../types';

type ChatMsg = { role: 'user' | 'system'; text: string };

export function DashboardPage() {
  const { backendConnected, setBackendConnected, current, setCurrent, events, setEvents, pushSnapshot } = useBackendContext();
  const [autoRefresh, setAutoRefresh] = useState(!backendConnected);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [unreadIds, setUnreadIds] = useState<string[]>(
    initialSnapshots.filter((e) => e.level !== 'normal').map((e) => e.id),
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(initialSnapshots[0].id);

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

  const inspectAlert = (id: string) => {
    setSelectedId(id);
    setUnreadIds((p) => p.filter((x) => x !== id));
    setNotifOpen(true);
  };

  return (
    <>
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Nursing Home Bed Monitoring</p>
          <h1>실시간 낙상 위험 감지 대시보드</h1>
          <span className="timestamp">마지막 업데이트 {formatTime(current.timestamp)}</span>
        </div>
        <div className="header-actions">
          <button className={autoRefresh ? 'toggle active' : 'toggle'} onClick={() => setAutoRefresh((v) => !v)}>
            <CircleDot size={16} />자동 갱신 #{scenarioIndex + 1}
          </button>
          <button className="icon-button alert-trigger" aria-label="알림" onClick={() => setNotifOpen((v) => !v)}>
            <Bell size={19} />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>
      </header>

      {notifOpen && (
        <aside className="notification-drawer">
          <div className="drawer-header">
            <div><p className="eyebrow">Notifications</p><h2>알림 확인</h2></div>
            <div className="drawer-actions">
              <button onClick={() => setUnreadIds([])}><CheckCheck size={16} />모두 읽음</button>
              <button className="drawer-close" onClick={() => setNotifOpen(false)}><X size={18} /></button>
            </div>
          </div>
          <div className="alert-detail">
            <span className={`alert-severity ${selectedAlert.level}`}><Siren size={16} />{levelMeta[selectedAlert.level].label}</span>
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

      <section className="summary-strip">
        <article className={`risk-card ${current.level}`}>
          <div className="risk-card-head"><LevelIcon size={24} /><span>{levelMeta[current.level].tone}</span></div>
          <strong>{levelMeta[current.level].label}</strong>
          <p>위험 점수 {current.score}점</p>
        </article>
        <article className="metric-card"><Bed size={22} /><span>병상 / 카메라</span><strong>{current.bedId} · {current.cameraId}</strong></article>
        <article className="metric-card">
          {current.guardrailUp ? <ShieldCheck size={22} /> : <ShieldAlert size={22} />}
          <span>가드레일</span><strong>{current.guardrailUp ? '올라감' : '내려감'}</strong>
        </article>
        <article className="metric-card">
          {current.caregiverPresent ? <UserCheck size={22} /> : <UserX size={22} />}
          <span>보호 인력</span><strong>{current.caregiverPresent ? '감지됨' : '미감지'}</strong>
        </article>
      </section>

      <section className="workspace">
        <VideoFeedPanel current={current} onScenario={handleScenario} />
        <aside className="analysis-stack">
          <article className="panel">
            <div className="panel-header">
              <div><p className="eyebrow">Risk Factors</p><h2>위험 인자</h2></div>
              <span className="score-badge"><b>{current.score}</b><span style={{ opacity: 0.6, fontSize: '0.82em' }}>/10</span></span>
            </div>
            <div className="factor-list">
              {current.factors.length ? current.factors.map((f) => (
                <div className="factor-item" key={f}><AlertTriangle size={17} /><span>{f}</span></div>
              )) : (
                <div className="factor-item calm"><CheckCircle2 size={17} /><span>현재 감지된 위험 인자가 없습니다.</span></div>
              )}
            </div>
          </article>
          <article className="panel">
            <div className="panel-header"><div><p className="eyebrow">Snapshot</p><h2>환자 상태</h2></div></div>
            <dl className="state-list">
              <div><dt>관리 환자</dt><dd>{current.patientName}</dd></div>
              <div><dt>환자 위치</dt><dd>{positionLabel[current.position]}</dd></div>
              <div><dt>자세 상태</dt><dd>{poseLabel[current.pose]}</dd></div>
              <div><dt>요약</dt><dd>{current.summary}</dd></div>
            </dl>
          </article>
        </aside>
      </section>

      <section className="lower-grid">
        <article className="panel">
          <div className="panel-header">
            <div><p className="eyebrow">Alert History</p><h2>경고 및 이벤트 이력</h2></div>
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
        <QAPanel current={current} backendConnected={backendConnected} />
      </section>
    </>
  );
}

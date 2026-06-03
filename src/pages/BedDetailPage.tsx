import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MessageCircle, ShieldAlert, ShieldCheck, UserCheck, UserX, X } from 'lucide-react';
import { fetchBeds, fetchEvents, toSnapshot } from '../api/eventsApi';
import { VideoFeedPanel } from '../components/VideoFeedPanel';
import { QAPanel } from '../components/QAPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { formatTime, getMockHistory, initialSnapshots, levelMeta, ROOMS, poseLabel, positionLabel } from '../mock/mockData';
import type { Snapshot } from '../types';

export function BedDetailPage() {
  const { bedId } = useParams<{ bedId: string }>();
  const { backendConnected, setBackendConnected } = useBackendContext();
  const navigate = useNavigate();

  const currentRoom = ROOMS.find(r => r.bedIds.includes(bedId as never)) ?? ROOMS[0];

  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>(
    Object.fromEntries(initialSnapshots.map(s => [s.bedId, s]))
  );

  const mockForBed = initialSnapshots.find(s => s.bedId === bedId) ?? initialSnapshots[0];
  const [current, setCurrent] = useState<Snapshot>(mockForBed);
  const [history, setHistory] = useState<Snapshot[]>(() => getMockHistory(bedId ?? ''));
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const snap = snapshots[bedId ?? ''] ?? mockForBed;
    setCurrent(snap);
    setHistory(getMockHistory(bedId ?? ''));
  }, [bedId]);

  useEffect(() => {
    if (!backendConnected) return;
    (async () => {
      const beds = await fetchBeds();
      const next = { ...snapshots };
      beds.forEach(b => { next[b.bedId] = toSnapshot(b.status); });
      setSnapshots(next);
      const found = next[bedId ?? ''];
      if (found) setCurrent(found);
      const evts = await fetchEvents(10, bedId);
      if (evts.length > 0) setHistory(evts.map(toSnapshot));
    })();
  }, [backendConnected, bedId]);

  const onSSEEvent = useCallback((snap: Snapshot) => {
    setSnapshots(prev => ({ ...prev, [snap.bedId]: snap }));
    if (snap.bedId === bedId) {
      setCurrent(snap);
      setHistory(prev => [snap, ...prev].slice(0, 10));
    }
  }, [bedId]);

  useSSE(backendConnected, onSSEEvent, () => setBackendConnected(false));

  const LevelIcon = levelMeta[current.level].icon;

  return (
    <>
      <header className="dashboard-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← 대시보드</button>
          <h1>{currentRoom.label}</h1>
          <span className="timestamp">마지막 업데이트 {formatTime(current.timestamp)}</span>
        </div>
        <RiskBadge level={current.level} />
      </header>

      {/* 병실 내 환자 선택 */}
      <div className="ward-nav">
        <div className="ward-nav-rooms">
          <span className="ward-nav-room-label"><strong>{currentRoom.label}</strong></span>
          <span className="ward-nav-camera">{currentRoom.cameraId}</span>
        </div>
        <div className="patient-selector">
          {currentRoom.bedIds.map(bid => {
            const snap = snapshots[bid];
            const level = snap?.level ?? 'normal';
            const isActive = bid === bedId;
            const SnapIcon = levelMeta[level].icon;
            return (
              <button
                key={bid}
                className={`patient-card${isActive ? ` active ${level}` : ''}`}
                onClick={() => navigate(`/beds/${bid}`)}
              >
                <span className={`patient-card-icon ${level}`}><SnapIcon size={14} /></span>
                <div className="patient-card-info">
                  <strong>{snap?.patientName ?? bid}</strong>
                </div>
                <div className="patient-card-score">
                  <strong>{snap?.score ?? 0}</strong>
                  <span>점</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 메인 워크스페이스 */}
      <section className="dash-workspace">
        <VideoFeedPanel current={current} />
        <aside className="dash-right">
          <article className="panel">
            <div className="panel-header">
              <div className="panel-header-left">
                <LevelIcon size={16} style={{ color: `var(--${current.level})` }} />
                <h2>위험 인자</h2>
              </div>
              <span className="score-badge">
                <b>{current.score}</b>
                <span style={{ opacity: 0.55, fontSize: '0.8em' }}>/10</span>
              </span>
            </div>
            <div className="factor-list">
              {current.factors.length ? current.factors.map(f => (
                <div className="factor-item" key={f}><AlertTriangle size={14} /><span>{f}</span></div>
              )) : (
                <div className="factor-item calm"><CheckCircle2 size={14} /><span>감지된 위험 인자 없음</span></div>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header"><h2>환자 상태</h2></div>
            <dl className="state-list">
              <div><dt>관리번호</dt><dd>{current.patientNo}</dd></div>
              <div><dt>관리 환자</dt><dd>{current.patientName}</dd></div>
              <div><dt>환자 위치</dt><dd>{positionLabel[current.position]}</dd></div>
              <div><dt>자세 상태</dt><dd>{poseLabel[current.pose]}</dd></div>
              <div>
                <dt>가드레일</dt>
                <dd style={{ color: current.guardrailUp ? 'var(--normal)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {current.guardrailUp ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                  {current.guardrailUp ? '올라감' : '내려감'}
                </dd>
              </div>
              <div>
                <dt>보호 인력</dt>
                <dd style={{ color: current.caregiverPresent ? 'var(--normal)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {current.caregiverPresent ? <UserCheck size={13} /> : <UserX size={13} />}
                  {current.caregiverPresent ? '감지됨' : '미감지'}
                </dd>
              </div>
            </dl>
          </article>
        </aside>
      </section>

      {/* 최근 이벤트 */}
      <section className="dash-events">
        <article className="panel">
          <div className="panel-header"><h2>최근 이벤트</h2></div>
          <div className="event-table">
            {history.map(e => (
              <div className="event-row" key={e.id} style={{ cursor: 'default' }}>
                <span className={`event-dot ${e.level}`} style={{ flexShrink: 0 }} />
                <div>
                  <strong>{e.summary}</strong>
                  <span>{formatTime(e.timestamp)} · {e.factors.join(', ') || '정상'}</span>
                </div>
                <em>{levelMeta[e.level].label}</em>
              </div>
            ))}
          </div>
        </article>
      </section>

      {/* 채팅 FAB */}
      <button className={`chat-fab${chatOpen ? ' active' : ''}`} onClick={() => setChatOpen(v => !v)} aria-label="AI 질의응답">
        {chatOpen ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* 채팅 드로어 */}
      <aside className={`chat-drawer${chatOpen ? ' open' : ''}`}>
        <div className="chat-drawer-head">
          <div>
            <strong>AI 상태 질의</strong>
            <span>{current.patientName} · {currentRoom.label}</span>
          </div>
          <button className="chat-drawer-close" onClick={() => setChatOpen(false)}><X size={15} /></button>
        </div>
        <QAPanel current={current} backendConnected={backendConnected} bedId={bedId} bare />
      </aside>
    </>
  );
}

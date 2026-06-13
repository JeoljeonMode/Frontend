import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, MessageCircle, ShieldAlert, ShieldCheck, UserCheck, UserX, X } from 'lucide-react';
import { fetchBeds, fetchEvents, toSnapshot } from '../api/eventsApi';
import { VideoFeedPanel } from '../components/VideoFeedPanel';
import { QAPanel } from '../components/QAPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { useRooms } from '../hooks/useRooms';
import { formatTime, levelMeta, poseLabel, positionLabel } from '../mock/mockData';
import type { Snapshot } from '../types';

export function BedDetailPage() {
  const { bedId } = useParams<{ bedId: string }>();
  const { backendConnected, setBackendConnected } = useBackendContext();
  const navigate = useNavigate();
  const { rooms } = useRooms();

  const currentRoom = rooms.find(r => r.bedIds.includes(bedId ?? '')) ?? rooms[0];

  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [current, setCurrent] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    (async () => {
      const beds = await fetchBeds();
      const next = Object.fromEntries(beds.map(b => [b.bedId, toSnapshot(b.status)]));
      setSnapshots(next);
      const found = next[bedId ?? ''];
      setCurrent(found ?? null);
      const evts = await fetchEvents(10, bedId);
      setHistory(evts.map(toSnapshot));
    })();
  }, [bedId]);

  const onSSEEvent = useCallback((snap: Snapshot) => {
    setSnapshots(prev => ({ ...prev, [snap.bedId]: snap }));
    if (snap.bedId === bedId) {
      setCurrent(snap);
      setHistory(prev => [snap, ...prev].slice(0, 10));
    }
  }, [bedId]);

  useSSE(backendConnected, onSSEEvent, () => setBackendConnected(false));

  const currentLevel = current?.level ?? 'normal';
  const LevelIcon = levelMeta[currentLevel].icon;
  const pageTitle = currentRoom?.label ?? bedId ?? '병상 상세';
  const cameraId = currentRoom?.cameraId ?? current?.cameraId ?? '카메라 미등록';

  return (
    <>
      <header className="dashboard-header">
        <div>
          <button className="back-link" onClick={() => navigate('/')}>← 대시보드</button>
          <h1>{pageTitle}</h1>
          <span className="timestamp">
            {current ? `마지막 업데이트 ${formatTime(current.timestamp)}` : '서버 상태 데이터 수신 대기 중'}
          </span>
        </div>
        <RiskBadge level={currentLevel} />
      </header>

      {/* 병실 내 환자 선택 */}
      <div className="ward-nav">
        <div className="ward-nav-rooms">
          <span className="ward-nav-room-label"><strong>{pageTitle}</strong></span>
          <span className="ward-nav-camera">{cameraId}</span>
        </div>
        <div className="patient-selector">
          {(currentRoom?.bedIds ?? (bedId ? [bedId] : [])).map(bid => {
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
        {current ? (
          <VideoFeedPanel current={current} rooms={rooms} />
        ) : (
          <article className="video-panel" id="live">
            <div className="panel-header">
              <h2>실시간 영상</h2>
              <span className="level-pill normal">상태 대기</span>
            </div>
            <div className="video-feed normal">
              <img src={currentRoom?.image ?? '/ward1.png'} alt="병실 카메라 피드" className="feed-img" />
            </div>
          </article>
        )}
        <aside className="dash-right">
          <article className="panel">
            <div className="panel-header">
              <div className="panel-header-left">
                <LevelIcon size={16} style={{ color: `var(--${currentLevel})` }} />
                <h2>위험 인자</h2>
              </div>
              <span className="score-badge">
                <b>{current?.score ?? '-'}</b>
                <span style={{ opacity: 0.55, fontSize: '0.8em' }}>/10</span>
              </span>
            </div>
            <div className="factor-list">
              {current?.factors.length ? current.factors.map(f => (
                <div className="factor-item" key={f}><AlertTriangle size={14} /><span>{f}</span></div>
              )) : (
                <div className="factor-item calm"><CheckCircle2 size={14} /><span>{current ? '감지된 위험 인자 없음' : '서버 상태 데이터 수신 대기 중'}</span></div>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panel-header"><h2>환자 상태</h2></div>
            <dl className="state-list">
              <div><dt>관리번호</dt><dd>{current?.patientNo ?? '-'}</dd></div>
              <div><dt>관리 환자</dt><dd>{current?.patientName ?? '-'}</dd></div>
              <div><dt>환자 위치</dt><dd>{current ? positionLabel[current.position] : '-'}</dd></div>
              <div><dt>자세 상태</dt><dd>{current ? poseLabel[current.pose] : '-'}</dd></div>
              <div>
                <dt>가드레일</dt>
                <dd style={{ color: current?.guardrailUp ? 'var(--normal)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {current?.guardrailUp ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                  {current ? (current.guardrailUp ? '올라감' : '내려감') : '-'}
                </dd>
              </div>
              <div>
                <dt>보호 인력</dt>
                <dd style={{ color: current?.caregiverPresent ? 'var(--normal)' : 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {current?.caregiverPresent ? <UserCheck size={13} /> : <UserX size={13} />}
                  {current ? (current.caregiverPresent ? '감지됨' : '미감지') : '-'}
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
            {history.length === 0 && (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                이벤트 이력이 없습니다.
              </div>
            )}
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
            <span>{current?.patientName ?? bedId ?? '-'} · {pageTitle}</span>
          </div>
          <button className="chat-drawer-close" onClick={() => setChatOpen(false)}><X size={15} /></button>
        </div>
        {current ? (
          <QAPanel current={current} backendConnected={backendConnected} bedId={bedId} rooms={rooms} bare />
        ) : (
          <div className="chat-drawer-body">
            <div className="chat-message system">서버 상태 데이터가 수신되면 AI 질의를 사용할 수 있습니다.</div>
          </div>
        )}
      </aside>
    </>
  );
}

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Siren, X } from 'lucide-react';
import { fetchBeds, toSnapshot } from '../api/eventsApi';
import { useBackendContext, TopbarSlotContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { useRooms } from '../hooks/useRooms';
import { formatTime, levelMeta } from '../mock/mockData';
import type { Snapshot } from '../types';

/* ── 도넛 차트 ── */
function DonutChart({ danger, caution, normal, size = 110 }: {
  danger: number; caution: number; normal: number; size?: number;
}) {
  const total = danger + caution + normal;
  const r = size * 0.36;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const strokeW = size * 0.11;
  const gap = total > 1 ? circumference * 0.018 : 0;

  const segs = [
    { value: danger,  color: 'var(--danger)' },
    { value: caution, color: 'var(--caution)' },
    { value: normal,  color: 'var(--normal)' },
  ];

  let cumulative = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--line)" strokeWidth={strokeW} />
      {total > 0 && segs.map((seg, i) => {
        if (seg.value === 0) { cumulative += 0; return null; }
        const arc = Math.max((seg.value / total) * circumference - gap, 0);
        const el = (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth={strokeW}
            strokeDasharray={`${arc} ${circumference}`}
            strokeDashoffset={-cumulative}
            strokeLinecap="butt"
          />
        );
        cumulative += (seg.value / total) * circumference;
        return el;
      })}
    </svg>
  );
}

export function DashboardPage() {
  const { backendConnected, setBackendConnected, events, pushSnapshot } = useBackendContext();
  const { setTopbarRight } = useContext(TopbarSlotContext);
  const navigate = useNavigate();
  const { rooms } = useRooms();

  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [unreadIds, setUnreadIds] = useState<string[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(events[0]?.id ?? '');

  const unreadCount = unreadIds.length;

  useEffect(() => {
    setTopbarRight(
      <button className="icon-button alert-trigger mobile-bell" onClick={() => setNotifOpen(v => !v)} aria-label="알림">
        <Bell size={17} />
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </button>
    );
    return () => setTopbarRight(null);
  }, [unreadCount, setTopbarRight]);

  const onSSEEvent = useCallback((snap: Snapshot) => {
    pushSnapshot(snap);
    setSnapshots(prev => ({ ...prev, [snap.bedId]: snap }));
    if (snap.level !== 'normal') setUnreadIds(p => [snap.id, ...p].slice(0, 12));
  }, [pushSnapshot]);

  useSSE(backendConnected, onSSEEvent, () => setBackendConnected(false));

  useEffect(() => {
    (async () => {
      const beds = await fetchBeds();
      setSnapshots(Object.fromEntries(beds.map(b => [b.bedId, toSnapshot(b.status)])));
    })();
  }, []);

  const allSnaps = Object.values(snapshots);
  const stats = useMemo(() => ({
    total:   allSnaps.length,
    danger:  allSnaps.filter(s => s.level === 'danger').length,
    caution: allSnaps.filter(s => s.level === 'caution').length,
    normal:  allSnaps.filter(s => s.level === 'normal').length,
  }), [snapshots]);

  const riskCounts = useMemo(() => ({
    danger:  events.filter(e => e.level === 'danger').length,
    caution: events.filter(e => e.level === 'caution').length,
    normal:  events.filter(e => e.level === 'normal').length,
  }), [events]);

  const selectedAlert = events.find(e => e.id === selectedAlertId) ?? events[0];

  const inspectAlert = (id: string) => {
    setSelectedAlertId(id);
    setUnreadIds(p => p.filter(x => x !== id));
    setNotifOpen(true);
  };

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>모니터링 대시보드</h1>
          <span className="timestamp">실시간 낙상 위험 현황</span>
        </div>
        <div className="header-actions">
          <button className="icon-button alert-trigger" aria-label="알림" onClick={() => setNotifOpen(v => !v)}>
            <Bell size={17} />
            {unreadCount > 0 && <span>{unreadCount}</span>}
          </button>
        </div>
      </header>

      {/* 전체 현황 — 도넛 차트 */}
      <div className="dash-stats">
        <div className="dash-stats-chart">
          <DonutChart danger={stats.danger} caution={stats.caution} normal={stats.normal} />
          <div className="dash-stats-center">
            <strong>{stats.total}</strong>
            <span>전체</span>
          </div>
        </div>
        <div className="dash-stats-legend">
          <div className="dash-stat-row danger">
            <span className="dash-stat-dot danger" />
            <span className="dash-stat-label">위험</span>
            <strong>{stats.danger}명</strong>
          </div>
          <div className="dash-stat-row caution">
            <span className="dash-stat-dot caution" />
            <span className="dash-stat-label">주의</span>
            <strong>{stats.caution}명</strong>
          </div>
          <div className="dash-stat-row normal">
            <span className="dash-stat-dot normal" />
            <span className="dash-stat-label">정상</span>
            <strong>{stats.normal}명</strong>
          </div>
        </div>
      </div>

      {/* 병실별 현황 카드 */}
      <div className="dash-rooms">
        {rooms.map(room => {
          const roomSnaps = room.bedIds.map(id => snapshots[id]).filter(Boolean) as Snapshot[];
          const dangerCnt  = roomSnaps.filter(s => s.level === 'danger').length;
          const cautionCnt = roomSnaps.filter(s => s.level === 'caution').length;
          const normalCnt  = roomSnaps.filter(s => s.level === 'normal').length;
          const firstBedId = room.bedIds[0];
          return (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <div className="room-card-title">
                  <strong>{room.label}</strong>
                  <span className="room-card-cam">{room.cameraId}</span>
                </div>
                <div className="room-card-chart">
                  <DonutChart danger={dangerCnt} caution={cautionCnt} normal={normalCnt} size={54} />
                  <div className="room-card-chart-legend">
                    {dangerCnt  > 0 && <span className="rcc-item danger">{dangerCnt} 위험</span>}
                    {cautionCnt > 0 && <span className="rcc-item caution">{cautionCnt} 주의</span>}
                    {normalCnt  > 0 && <span className="rcc-item normal">{normalCnt} 정상</span>}
                  </div>
                </div>
              </div>

              <div className="room-card-list">
                {room.bedIds.length === 0 && (
                  <div className="empty-inline">등록된 병상이 없습니다.</div>
                )}
                {room.bedIds.map(bedId => {
                  const snap = snapshots[bedId];
                  if (!snap) {
                    return (
                      <div key={bedId} className="room-patient-row normal">
                        <span className="rpr-name">{bedId}</span>
                        <span className="rpr-badge normal">상태 대기</span>
                      </div>
                    );
                  }
                  const Icon = levelMeta[snap.level].icon;
                  return (
                    <div key={bedId} className={`room-patient-row ${snap.level}`}>
                      <Icon size={14} />
                      <span className="rpr-name">{snap.patientName}</span>
                      <span className={`rpr-badge ${snap.level}`}>{levelMeta[snap.level].label}</span>
                      <strong className="rpr-score">{snap.score}점</strong>
                    </div>
                  );
                })}
              </div>

              <div className="room-card-footer">
                <button
                  className="room-card-link"
                  disabled={!firstBedId}
                  onClick={() => firstBedId && navigate(`/beds/${firstBedId}`)}
                >
                  {firstBedId ? '병실 상세 보기 →' : '등록된 병상 없음'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 이벤트 이력 */}
      <section className="dash-events">
        <article className="panel">
          <div className="panel-header">
            <h2>전체 이벤트 이력</h2>
            <div className="count-group">
              <span className="danger">{riskCounts.danger}</span>
              <span className="caution">{riskCounts.caution}</span>
              <span className="normal">{riskCounts.normal}</span>
            </div>
          </div>
          <div className="event-table">
            {events.length === 0 && (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
                이벤트 이력이 없습니다.
              </div>
            )}
            {events.map(e => (
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

      {/* 알림 드로어 */}
      {notifOpen && selectedAlert && (
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
              <div><dt>환자</dt><dd>{selectedAlert.patientName}</dd></div>
            </dl>
          </div>
          <div className="notification-list">
            {events.filter(e => e.level !== 'normal').map(e => (
              <button className={unreadIds.includes(e.id) ? 'notification-item unread' : 'notification-item'} key={e.id} onClick={() => inspectAlert(e.id)}>
                <span className={`event-dot ${e.level}`} style={{ flexShrink: 0 }} />
                <div><strong>{e.summary}</strong><small>{formatTime(e.timestamp)} · {e.factors[0]}</small></div>
              </button>
            ))}
          </div>
        </aside>
      )}
    </>
  );
}

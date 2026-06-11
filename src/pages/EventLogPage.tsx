import { useEffect, useState } from 'react';
import { CheckCheck, RefreshCw } from 'lucide-react';
import { acknowledgeEvent, fetchEvents, toSnapshot } from '../api/eventsApi';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { formatDateTime, MOCK_EVENTS, ROOMS } from '../mock/mockData';
import type { Snapshot } from '../types';

type Filter = { riskLevel: string; roomId: string; acknowledged: string };

/* 병실별 bedId 목록을 빠르게 조회하기 위한 맵 */
const roomBedMap: Record<string, string[]> = Object.fromEntries(
  ROOMS.map(r => [r.id, [...r.bedIds]])
);

export function EventLogPage() {
  const { backendConnected } = useBackendContext();
  const [events, setEvents] = useState<Snapshot[]>(MOCK_EVENTS);
  const [filter, setFilter] = useState<Filter>({ riskLevel: '', roomId: '', acknowledged: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const load = async (f: Filter) => {
    if (!backendConnected) {
      let filtered = MOCK_EVENTS;
      if (f.riskLevel) filtered = filtered.filter(e => e.level === f.riskLevel.toLowerCase());
      if (f.roomId) {
        const bedIds = roomBedMap[f.roomId] ?? [];
        filtered = filtered.filter(e => bedIds.includes(e.bedId));
      }
      setEvents(filtered);
      return;
    }
    setLoading(true);
    const data = await fetchEvents(
      PAGE_SIZE,
      undefined,
      f.riskLevel || undefined,
      f.acknowledged === '' ? undefined : f.acknowledged === 'true',
    );
    setEvents(data.map(toSnapshot));
    setLoading(false);
  };

  useEffect(() => { load(filter); }, [backendConnected]);

  const handleAck = async (id: string) => {
    const ok = await acknowledgeEvent(id);
    if (!ok) return;
    setEvents(prev => prev.map(e => (e.id === id ? { ...e, acknowledged: true } : e)));
  };

  const setF = (key: keyof Filter, value: string) => {
    const next = { ...filter, [key]: value };
    setFilter(next);
    setPage(1);
    load(next);
  };

  const riskLevels = [
    { value: '', label: '전체' },
    { value: 'NORMAL', label: '정상' },
    { value: 'CAUTION', label: '주의' },
    { value: 'DANGER', label: '위험' },
  ];

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>이벤트 로그</h1>
          <span className="timestamp">총 {events.length}건</span>
        </div>
        <div className="header-actions">
          <button className="toggle" onClick={() => load(filter)} disabled={loading}>
            <RefreshCw size={15} />새로고침
          </button>
        </div>
      </header>

      <div className="event-log-filters">
        <div className="filter-group">
          <span>위험도</span>
          <div>
            {riskLevels.map(r => (
              <button
                key={r.value}
                className={`filter-btn${r.value ? ` ${r.value.toLowerCase()}` : ''}${filter.riskLevel === r.value ? ' active' : ''}`}
                onClick={() => setF('riskLevel', r.value)}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <span>병실</span>
          <div>
            <button className={`filter-btn${!filter.roomId ? ' active' : ''}`} onClick={() => setF('roomId', '')}>전체</button>
            {ROOMS.map(room => (
              <button
                key={room.id}
                className={`filter-btn${filter.roomId === room.id ? ' active' : ''}`}
                onClick={() => setF('roomId', room.id)}
              >
                {room.label}
              </button>
            ))}
          </div>
        </div>

        {backendConnected && (
          <div className="filter-group">
            <span>처리 여부</span>
            <div>
              {[{ v: '', l: '전체' }, { v: 'false', l: '미처리' }, { v: 'true', l: '처리완료' }].map(({ v, l }) => (
                <button key={v} className={`filter-btn${filter.acknowledged === v ? ' active' : ''}`} onClick={() => setF('acknowledged', v)}>{l}</button>
              ))}
            </div>
          </div>
        )}

        {(filter.riskLevel || filter.roomId || filter.acknowledged) && (
          <button className="filter-btn" onClick={() => {
            const reset = { riskLevel: '', roomId: '', acknowledged: '' };
            setFilter(reset);
            load(reset);
          }}>필터 초기화</button>
        )}
      </div>

      <div className="event-log-table">
        {events.slice(0, page * PAGE_SIZE).map(e => (
          <div className="event-log-row" key={e.id}>
            <span className={`event-dot ${e.level} elr-dot`} />
            <div className="elr-main">
              <div className="elr-top">
                <span className="elr-name">{e.patientName}</span>
                <RiskBadge level={e.level} size="sm" />
                <span className="elr-score">{e.score}점</span>
              </div>
              <p className="elr-factors">{e.factors.join(' · ') || '이상 없음'}</p>
              <div className="elr-meta">
                <span className="elr-time">{formatDateTime(e.timestamp)}</span>
                <span className="elr-no">{e.patientNo}</span>
                {backendConnected && (
                  e.acknowledged ? (
                    <span className="elr-ack done"><CheckCheck size={12} />처리완료</span>
                  ) : (
                    <button className="elr-ack" onClick={() => handleAck(e.id)}>
                      <CheckCheck size={12} />처리완료
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {page * PAGE_SIZE < events.length && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="load-more-btn" onClick={() => setPage(p => p + 1)}>
            더 불러오기 ({events.length - page * PAGE_SIZE}건 남음)
          </button>
        </div>
      )}
    </>
  );
}

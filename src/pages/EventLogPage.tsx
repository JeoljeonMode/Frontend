import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { fetchBeds, fetchEvents, toSnapshot } from '../api/eventsApi';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { formatDateTime, initialSnapshots } from '../mock/mockData';
import type { RiskLevel, Snapshot } from '../types';

type Filter = { riskLevel: string; bedId: string; acknowledged: string };

const MOCK_EVENTS: Snapshot[] = [...initialSnapshots, ...initialSnapshots.map((s, i) => ({
  ...s, id: `mock-${i}`, timestamp: new Date(Date.now() - (i + 1) * 300000).toISOString(),
}))];

export function EventLogPage() {
  const { backendConnected } = useBackendContext();
  const [events, setEvents] = useState<Snapshot[]>(MOCK_EVENTS);
  const [bedOptions, setBedOptions] = useState<string[]>([]);
  const [filter, setFilter] = useState<Filter>({ riskLevel: '', bedId: '', acknowledged: '' });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const loadBeds = async () => {
    if (!backendConnected) return;
    const beds = await fetchBeds();
    setBedOptions(beds.map((b) => b.bedId));
  };

  const load = async (f: Filter, append = false) => {
    if (!backendConnected) {
      let filtered = MOCK_EVENTS;
      if (f.riskLevel) filtered = filtered.filter((e) => e.level === f.riskLevel.toLowerCase());
      if (f.bedId) filtered = filtered.filter((e) => e.bedId === f.bedId);
      setEvents(filtered);
      return;
    }
    setLoading(true);
    const limit = append ? page * PAGE_SIZE + PAGE_SIZE : PAGE_SIZE;
    const data = await fetchEvents(
      limit,
      f.bedId || undefined,
      f.riskLevel || undefined,
      f.acknowledged === '' ? undefined : f.acknowledged === 'true',
    );
    const snaps = data.map(toSnapshot);
    setEvents(append ? snaps : snaps);
    setLoading(false);
  };

  useEffect(() => { loadBeds(); load(filter); }, [backendConnected]);

  const setF = (key: keyof Filter, value: string) => {
    const next = { ...filter, [key]: value };
    setFilter(next);
    setPage(1);
    load(next);
  };

  const riskLevels: { value: string; label: string }[] = [
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
            {riskLevels.map((r) => (
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
          <span>병상</span>
          <div>
            <button className={`filter-btn${!filter.bedId ? ' active' : ''}`} onClick={() => setF('bedId', '')}>전체</button>
            {(bedOptions.length > 0 ? bedOptions : initialSnapshots.map((s) => s.bedId)).map((id) => (
              <button key={id} className={`filter-btn${filter.bedId === id ? ' active' : ''}`} onClick={() => setF('bedId', id)}>{id}</button>
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

        {(filter.riskLevel || filter.bedId || filter.acknowledged) && (
          <button className="filter-btn" onClick={() => { setFilter({ riskLevel: '', bedId: '', acknowledged: '' }); load({ riskLevel: '', bedId: '', acknowledged: '' }); }}>
            필터 초기화
          </button>
        )}
      </div>

      <div className="event-log-table">
        {events.slice(0, page * PAGE_SIZE).map((e) => (
          <div className="event-log-row" key={e.id}>
            <span className={`event-dot ${e.level}`} style={{ flexShrink: 0 }} />
            <span style={{ color: 'var(--muted)', fontSize: 12.5, minWidth: 100, fontVariantNumeric: 'tabular-nums' }}>{formatDateTime(e.timestamp)}</span>
            <span style={{ fontWeight: 600, minWidth: 64, fontSize: 13 }}>{e.bedId}</span>
            <RiskBadge level={e.level} size="sm" />
            <span style={{ fontWeight: 600, minWidth: 38, textAlign: 'right', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>{e.score}점</span>
            <span style={{ flex: 1, fontSize: 12.5, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {e.factors.join(' · ') || '이상 없음'}
            </span>
            <span style={{ fontSize: 12, color: 'var(--muted)', flexShrink: 0 }}>{e.patientName}</span>
          </div>
        ))}
      </div>

      {page * PAGE_SIZE < events.length && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="load-more-btn" onClick={() => setPage((p) => p + 1)}>
            더 불러오기 ({events.length - page * PAGE_SIZE}건 남음)
          </button>
        </div>
      )}
    </>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { fetchBeds, toSnapshot, type BedStatus } from '../api/eventsApi';
import { useBackendContext } from '../components/layout/AppLayout';
import { initialSnapshots, levelMeta, ROOMS } from '../mock/mockData';
import type { Snapshot } from '../types';

export function BedsPage() {
  const { backendConnected } = useBackendContext();
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>(
    Object.fromEntries(initialSnapshots.map(s => [s.bedId, s]))
  );
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!backendConnected) {
      setSnapshots(Object.fromEntries(initialSnapshots.map(s => [s.bedId, s])));
      return;
    }
    setLoading(true);
    const data: BedStatus[] = await fetchBeds();
    if (data.length > 0) {
      const next = { ...Object.fromEntries(initialSnapshots.map(s => [s.bedId, s])) };
      data.forEach(b => { next[b.bedId] = toSnapshot(b.status); });
      setSnapshots(next);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [backendConnected]);

  const totalBeds = ROOMS.reduce((acc, r) => acc + r.bedIds.length, 0);

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>병상 / 카메라 목록</h1>
          <span className="timestamp">{totalBeds}개 병상 · {ROOMS.length}개 병실 모니터링 중</span>
        </div>
        <div className="header-actions">
          <button className="toggle" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />새로고침
          </button>
        </div>
      </header>

      <div className="rooms-list">
        {ROOMS.map(room => (
          <section key={room.id} className="room-section">
            <div className="room-section-header">
              <strong>{room.label}</strong>
              <span>{room.cameraId}</span>
            </div>
            <div className="beds-grid">
              {room.bedIds.map(bedId => {
                const bed = snapshots[bedId];
                if (!bed) return null;
                const meta = levelMeta[bed.level];
                const Icon = meta.icon;
                return (
                  <div
                    className={`bed-card ${bed.level}`}
                    key={bedId}
                    onClick={() => navigate(`/beds/${bedId}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="bed-card-header">
                      <strong>{bed.patientName}</strong>
                      <span className={`level-pill ${bed.level}`} style={{ fontSize: 11, minHeight: 22, padding: '0 8px' }}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="bed-card-body">
                      <div className="bed-card-score-row">
                        <Icon size={16} style={{ color: `var(--${bed.level})` }} />
                        <span className="risk-score">{bed.score}</span>
                        <span className="risk-score-unit">점</span>
                      </div>
                      <p className="bed-card-factors">
                        {bed.factors.length ? bed.factors.slice(0, 2).join(' · ') : '이상 없음'}
                      </p>
                    </div>
                    <div className="bed-card-footer">
                      <span className="bed-patient-no">{bed.patientNo}</span>
                      <span className="bed-card-link">상세 →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { fetchBeds, toSnapshot, type BedStatus } from '../api/eventsApi';
import { useRooms } from '../hooks/useRooms';
import { levelMeta } from '../mock/mockData';
import type { Snapshot } from '../types';

export function BedsPage() {
  const { rooms, loadRooms } = useRooms();
  const [snapshots, setSnapshots] = useState<Record<string, Snapshot>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    await loadRooms();
    setLoading(true);
    const data: BedStatus[] = await fetchBeds();
    setSnapshots(Object.fromEntries(data.map(b => [b.bedId, toSnapshot(b.status)])));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const totalBeds = rooms.reduce((acc, r) => acc + r.bedIds.length, 0);

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>병상 / 카메라 목록</h1>
          <span className="timestamp">{totalBeds}개 병상 · {rooms.length}개 병실 모니터링 중</span>
        </div>
        <div className="header-actions">
          <button className="toggle" onClick={load} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'spin' : ''} />새로고침
          </button>
        </div>
      </header>

      <div className="rooms-list">
        {rooms.map(room => (
          <section key={room.id} className="room-section">
            <div className="room-section-header">
              <strong>{room.label}</strong>
              <span>{room.cameraId}</span>
            </div>
            <div className="beds-grid">
              {room.bedIds.length === 0 && (
                <div className="empty-inline">등록된 병상이 없습니다.</div>
              )}
              {room.bedIds.map(bedId => {
                const bed = snapshots[bedId];
                if (!bed) {
                  return (
                    <div
                      className="bed-card normal"
                      key={bedId}
                      onClick={() => navigate(`/beds/${bedId}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="bed-card-header">
                        <strong>{bedId}</strong>
                        <span className="level-pill normal" style={{ fontSize: 11, minHeight: 22, padding: '0 8px' }}>
                          상태 대기
                        </span>
                      </div>
                      <div className="bed-card-body">
                        <p className="bed-card-factors">서버 상태 데이터 수신 대기 중</p>
                      </div>
                      <div className="bed-card-footer">
                        <span className="bed-patient-no">-</span>
                        <span className="bed-card-link">상세 →</span>
                      </div>
                    </div>
                  );
                }
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

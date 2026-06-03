import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { fetchBeds, toSnapshot, type BedStatus } from '../api/eventsApi';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { calculateRisk, initialSnapshots, levelMeta } from '../mock/mockData';
import type { Snapshot } from '../types';

const mockBeds: Snapshot[] = initialSnapshots;

export function BedsPage() {
  const { backendConnected } = useBackendContext();
  const [beds, setBeds] = useState<Snapshot[]>(mockBeds);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    if (!backendConnected) { setBeds(mockBeds); return; }
    setLoading(true);
    const data: BedStatus[] = await fetchBeds();
    if (data.length > 0) setBeds(data.map((b) => toSnapshot(b.status)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [backendConnected]);

  return (
    <>
      <header className="dashboard-header">
        <div>
          <h1>병상 / 카메라 목록</h1>
          <span className="timestamp">{beds.length}개 병상 모니터링 중</span>
        </div>
        <div className="header-actions">
          <button className="toggle" onClick={load} disabled={loading}>
            <RefreshCw size={15} />새로고침
          </button>
        </div>
      </header>

      <div className="beds-grid">
        {beds.map((bed) => {
          const meta = levelMeta[bed.level];
          const Icon = meta.icon;
          return (
            <div className={`bed-card ${bed.level}`} key={bed.bedId}>
              <div className="bed-card-header">
                <strong>{bed.bedId}</strong>
                <span>{bed.cameraId}</span>
              </div>
              <div className="bed-card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Icon size={18} />
                  <RiskBadge level={bed.level} />
                  <span style={{ fontWeight: 700 }}>{bed.score}점</span>
                </div>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--muted)', lineHeight: 1.4 }}>
                  {bed.factors.length ? bed.factors.slice(0, 2).join(' · ') : '이상 없음'}
                </p>
              </div>
              <div className="bed-card-footer">
                <span>{bed.patientName}</span>
                <button onClick={() => navigate(`/beds/${bed.bedId}`)}>
                  상세 보기 →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

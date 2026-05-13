import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ShieldAlert, ShieldCheck, UserCheck, UserX } from 'lucide-react';
import { fetchBeds, fetchEvents, postDemoEvent, toSnapshot } from '../api/eventsApi';
import { VideoFeedPanel } from '../components/VideoFeedPanel';
import { QAPanel } from '../components/QAPanel';
import { RiskBadge } from '../components/common/RiskBadge';
import { useBackendContext } from '../components/layout/AppLayout';
import { useSSE } from '../hooks/useSSE';
import { formatTime, initialSnapshots, levelMeta, nextScenario, poseLabel, positionLabel } from '../mock/mockData';
import type { RiskLevel, Snapshot } from '../types';

export function BedDetailPage() {
  const { bedId } = useParams<{ bedId: string }>();
  const { backendConnected, setBackendConnected } = useBackendContext();
  const navigate = useNavigate();

  const mockForBed = initialSnapshots.find((s) => s.bedId === bedId) ?? initialSnapshots[0];
  const [current, setCurrent] = useState<Snapshot>(mockForBed);
  const [history, setHistory] = useState<Snapshot[]>([mockForBed]);

  useEffect(() => {
    if (!backendConnected) return;
    (async () => {
      const beds = await fetchBeds();
      const found = beds.find((b) => b.bedId === bedId);
      if (found) setCurrent(toSnapshot(found.status));
      const evts = await fetchEvents(10, bedId);
      if (evts.length > 0) setHistory(evts.map(toSnapshot));
    })();
  }, [backendConnected, bedId]);

  const onSSEEvent = useCallback((snap: Snapshot) => {
    if (snap.bedId !== bedId) return;
    setCurrent(snap);
    setHistory((prev) => [snap, ...prev].slice(0, 10));
  }, [bedId]);

  useSSE(backendConnected, onSSEEvent, () => setBackendConnected(false));

  const handleScenario = async (level: RiskLevel) => {
    if (backendConnected) { await postDemoEvent(); return; }
    const idx = initialSnapshots.findIndex((s) => s.level === level);
    const snap = nextScenario(idx >= 0 ? idx : 0);
    setCurrent({ ...snap, bedId: bedId ?? snap.bedId });
    setHistory((prev) => [snap, ...prev].slice(0, 10));
  };

  const LevelIcon = levelMeta[current.level].icon;

  return (
    <>
      <header className="dashboard-header">
        <div>
          <button className="back-link" onClick={() => navigate('/beds')}>← 병상 목록</button>
          <h1>{bedId} 병상 상세</h1>
          <span className="timestamp">마지막 업데이트 {formatTime(current.timestamp)}</span>
        </div>
        <RiskBadge level={current.level} />
      </header>

      <section className="workspace">
        <VideoFeedPanel current={current} onScenario={handleScenario} />
        <aside className="analysis-stack">
          <article className={`risk-card ${current.level}`}>
            <div className="risk-card-head"><LevelIcon size={24} /><span>{levelMeta[current.level].tone}</span></div>
            <strong>{levelMeta[current.level].label}</strong>
            <p>위험 점수 {current.score}점</p>
          </article>
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
            <div className="panel-header"><div><h2>환자 상태</h2></div></div>
            <dl className="state-list">
              <div><dt>관리 환자</dt><dd>{current.patientName}</dd></div>
              <div><dt>위치</dt><dd>{positionLabel[current.position]}</dd></div>
              <div><dt>자세</dt><dd>{poseLabel[current.pose]}</dd></div>
              <div><dt>가드레일</dt><dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {current.guardrailUp ? <><ShieldCheck size={15} />올라감</> : <><ShieldAlert size={15} />내려감</>}
              </dd></div>
              <div><dt>보호 인력</dt><dd style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {current.caregiverPresent ? <><UserCheck size={15} />감지됨</> : <><UserX size={15} />미감지</>}
              </dd></div>
            </dl>
          </article>
        </aside>
      </section>

      <section className="lower-grid">
        <article className="panel">
          <div className="panel-header"><div><p className="eyebrow">Recent Events</p><h2>최근 이벤트</h2></div></div>
          <div className="event-table">
            {history.map((e) => (
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
        <QAPanel current={current} backendConnected={backendConnected} bedId={bedId} />
      </section>
    </>
  );
}

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

      {/* Status bar */}
      <div className={`status-bar ${current.level}`}>
        <div className={`status-risk ${current.level}`}>
          <LevelIcon size={20} />
          <div>
            <span className="status-risk-label">{levelMeta[current.level].tone}</span>
            <strong className="status-risk-score">
              {current.score}<small>/10</small>
            </strong>
          </div>
          <span className={`status-risk-pill ${current.level}`}>{levelMeta[current.level].label}</span>
        </div>
        <div className="status-sep" />
        <div className="status-items">
          <div className={`status-item${!current.guardrailUp ? ' warn' : ''}`}>
            <span className="status-item-icon">
              {current.guardrailUp ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
            </span>
            <div>
              <span className="status-item-label">가드레일</span>
              <span className="status-item-value">{current.guardrailUp ? '올라감' : '내려감'}</span>
            </div>
          </div>
          <div className="status-sep" />
          <div className={`status-item${!current.caregiverPresent ? ' warn' : ''}`}>
            <span className="status-item-icon">
              {current.caregiverPresent ? <UserCheck size={13} /> : <UserX size={13} />}
            </span>
            <div>
              <span className="status-item-label">보호 인력</span>
              <span className="status-item-value">{current.caregiverPresent ? '감지됨' : '미감지'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main workspace */}
      <section className="dash-workspace">
        <VideoFeedPanel current={current} onScenario={handleScenario} />
        <aside className="dash-right">
          <article className="panel">
            <div className="panel-header">
              <h2>위험 인자</h2>
              <span className="score-badge">
                <b>{current.score}</b>
                <span style={{ opacity: 0.6, fontSize: '0.82em' }}>/10</span>
              </span>
            </div>
            <div className="factor-list">
              {current.factors.length ? current.factors.map((f) => (
                <div className="factor-item" key={f}><AlertTriangle size={15} /><span>{f}</span></div>
              )) : (
                <div className="factor-item calm"><CheckCircle2 size={15} /><span>위험 인자 없음</span></div>
              )}
            </div>
          </article>
          <article className="panel">
            <div className="panel-header"><h2>환자 상태</h2></div>
            <dl className="state-list">
              <div><dt>관리 환자</dt><dd>{current.patientName}</dd></div>
              <div><dt>위치</dt><dd>{positionLabel[current.position]}</dd></div>
              <div><dt>자세</dt><dd>{poseLabel[current.pose]}</dd></div>
              <div><dt>가드레일</dt><dd>{current.guardrailUp ? '올라감' : '내려감'}</dd></div>
              <div><dt>보호 인력</dt><dd>{current.caregiverPresent ? '감지됨' : '미감지'}</dd></div>
            </dl>
          </article>
        </aside>
      </section>

      {/* Recent events + QA */}
      <section className="bed-lower">
        <article className="panel">
          <div className="panel-header"><h2>최근 이벤트</h2></div>
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

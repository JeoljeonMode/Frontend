import { Eye } from 'lucide-react';
import type { RiskLevel, Snapshot } from '../types';
import { formatTime, levelMeta, poseLabel, positionLabel } from '../mock/mockData';

interface Props {
  current: Snapshot;
  onScenario: (level: RiskLevel) => void;
}

export function VideoFeedPanel({ current, onScenario }: Props) {
  return (
    <article className="video-panel" id="live">
      <div className="panel-header">
        <h2>실시간 영상</h2>
        <span className={`level-pill ${current.level}`}>{levelMeta[current.level].label}</span>
      </div>

      <div className={`video-feed ${current.level}`}>
        <div className="camera-overlay">
          <span><Eye size={13} />IMX219 CSI · WARD A</span>
          <span>{formatTime(current.timestamp)} KST</span>
        </div>
        <div className="room-depth">
          <div className="back-wall">
            <span className="room-sign">{current.bedId}</span>
            <span className="wall-monitor">HR 78 · SpO2 97</span>
          </div>
          <div className="floor-plane" />
        </div>
        <div className="bed-frame">
          <div className="bed-headboard" />
          <div className="mattress">
            <div className="pillow" />
            <div className="blanket" />
          </div>
          <span className="bed-label">BED ROI</span>
          <div className={current.guardrailUp ? 'rail rail-left up' : 'rail rail-left'} />
          <div className={current.guardrailUp ? 'rail rail-right up' : 'rail rail-right'} />
          <div className={`patient-marker ${current.position} ${current.pose}`}>
            <span>{poseLabel[current.pose]}</span>
          </div>
        </div>
        <div className={`detect-box ${current.position}`}><span>Patient</span></div>
        <div className="roi-zone left">Edge ROI</div>
        <div className="roi-zone right">Edge ROI</div>
        <div className="scan-line" />
      </div>

      <div className="scenario-buttons">
        <button onClick={() => onScenario('normal')}>정상 샘플</button>
        <button onClick={() => onScenario('caution')}>주의 샘플</button>
        <button onClick={() => onScenario('danger')}>위험 샘플</button>
      </div>
    </article>
  );
}

import { Eye } from 'lucide-react';
import type { RiskLevel, Snapshot } from '../types';
import { formatTime, levelMeta } from '../mock/mockData';

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
        <img src="/ward.png" alt="병실 카메라 피드" className="feed-img" />
        <div className="feed-overlay">
          <div className="feed-overlay-left">
            <span className="feed-badge feed-badge-rec">● REC</span>
            <span className="feed-badge">
              <Eye size={11} />
              IMX219 · WARD A · {current.bedId}
            </span>
          </div>
          <span className="feed-badge">{formatTime(current.timestamp)} KST</span>
        </div>
      </div>

      <div className="scenario-buttons">
        <button onClick={() => onScenario('normal')}>정상 샘플</button>
        <button onClick={() => onScenario('caution')}>주의 샘플</button>
        <button onClick={() => onScenario('danger')}>위험 샘플</button>
      </div>
    </article>
  );
}

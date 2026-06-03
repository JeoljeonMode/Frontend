import { Eye } from 'lucide-react';
import type { Snapshot } from '../types';
import { formatTime, levelMeta, ROOMS } from '../mock/mockData';

interface Props {
  current: Snapshot;
}

export function VideoFeedPanel({ current }: Props) {
  const wardImage = ROOMS.find(r => r.cameraId === current.cameraId)?.image ?? '/ward1.png';

  return (
    <article className="video-panel" id="live">
      <div className="panel-header">
        <h2>실시간 영상</h2>
        <span className={`level-pill ${current.level}`}>{levelMeta[current.level].label}</span>
      </div>

      <div className={`video-feed ${current.level}`}>
        <img src={wardImage} alt="병실 카메라 피드" className="feed-img" />
        <div className="feed-overlay">
          <div className="feed-overlay-left">
            <span className="feed-badge feed-badge-rec">● REC</span>
            <span className="feed-badge">
              <Eye size={11} />
              {current.cameraId} · WARD A
            </span>
          </div>
          <span className="feed-badge">{formatTime(current.timestamp)} KST</span>
        </div>
      </div>
    </article>
  );
}

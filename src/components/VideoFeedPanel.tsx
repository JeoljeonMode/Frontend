import { Eye } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BASE_URL, getToken } from '../api/client';
import { fallbackRooms, type AppRoom } from '../api/roomsApi';
import type { Snapshot } from '../types';
import { formatTime, levelMeta } from '../mock/mockData';

interface Props {
  current: Snapshot;
  rooms?: AppRoom[];
}

export function VideoFeedPanel({ current, rooms = fallbackRooms }: Props) {
  const wardImage = rooms.find(r => r.cameraId === current.cameraId)?.image ?? '/ward1.png';
  const [streamFailed, setStreamFailed] = useState(false);
  const streamSrc = useMemo(() => {
    const token = getToken();
    return token
      ? `${BASE_URL}/api/ai/video-stream?token=${encodeURIComponent(token)}`
      : `${BASE_URL}/api/ai/video-stream`;
  }, []);
  const feedSrc = streamFailed ? wardImage : streamSrc;

  useEffect(() => {
    setStreamFailed(false);
  }, [current.cameraId, current.bedId]);

  return (
    <article className="video-panel" id="live">
      <div className="panel-header">
        <h2>실시간 영상</h2>
        <span className={`level-pill ${current.level}`}>{levelMeta[current.level].label}</span>
      </div>

      <div className={`video-feed ${current.level}`}>
        <img
          src={feedSrc}
          alt="병실 카메라 피드"
          className="feed-img"
          onLoad={() => {
            if (streamFailed) return;
            setStreamFailed(false);
          }}
          onError={() => setStreamFailed(true)}
        />
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

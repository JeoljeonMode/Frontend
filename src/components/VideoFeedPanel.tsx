import { Eye, ImageOff } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { BASE_URL } from '../api/client';
import type { Snapshot } from '../types';
import { formatTime, levelMeta, ROOMS } from '../mock/mockData';

interface Props {
  current: Snapshot;
}

export function VideoFeedPanel({ current }: Props) {
  const wardImage = ROOMS.find(r => r.cameraId === current.cameraId)?.image ?? '/ward1.png';
  const [streamFailed, setStreamFailed] = useState(false);
  const streamSrc = useMemo(() => {
    const params = new URLSearchParams({ cameraId: current.cameraId, bedId: current.bedId });
    return `${BASE_URL}/api/video-stream?${params}`;
  }, [current.cameraId, current.bedId]);
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
          alt={streamFailed ? '병실 기본 이미지' : '병실 카메라 피드'}
          className="feed-img"
          onLoad={() => {
            if (streamFailed) return;
            setStreamFailed(false);
          }}
          onError={() => setStreamFailed(true)}
        />
        <div className="feed-overlay">
          <div className="feed-overlay-left">
            <span className={`feed-badge ${streamFailed ? 'feed-badge-fallback' : 'feed-badge-rec'}`}>
              {streamFailed ? <ImageOff size={11} /> : '● REC'}
              {streamFailed ? '기본 이미지' : ''}
            </span>
            <span className="feed-badge">
              <Eye size={11} />
              {current.cameraId} · WARD A
            </span>
          </div>
          <span className="feed-badge">
            {streamFailed ? '영상 수신 대기' : `${formatTime(current.timestamp)} KST`}
          </span>
        </div>
      </div>
    </article>
  );
}

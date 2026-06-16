import { Eye } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_URL, getToken } from '../api/client';
import { fallbackRooms, type AppRoom } from '../api/roomsApi';
import type { Snapshot } from '../types';
import { levelMeta } from '../mock/mockData';

interface Props {
  current: Snapshot;
  rooms?: AppRoom[];
}

export function VideoFeedPanel({ current, rooms = fallbackRooms }: Props) {
  const wardImage = rooms.find(r => r.cameraId === current.cameraId)?.image ?? '/ward1.png';
  const [now, setNow] = useState(() => new Date());
  const [streamFailed, setStreamFailed] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);
  const streamLoadedRef = useRef(false);
  const streamSrc = useMemo(() => {
    const token = getToken();
    return token
      ? `${BASE_URL}/api/ai/video-stream?token=${encodeURIComponent(token)}`
      : `${BASE_URL}/api/ai/video-stream`;
  }, []);
  const feedSrc = streamFailed ? wardImage : streamSrc;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setStreamFailed(false);
    setStreamLoaded(false);
    streamLoadedRef.current = false;
  }, [current.cameraId, current.bedId]);

  useEffect(() => {
    if (streamFailed) {
      console.warn('[VideoFeed] fallback 이미지 표시:', {
        cameraId: current.cameraId,
        bedId: current.bedId,
        fallbackSrc: wardImage,
      });
      return;
    }

    console.log('[VideoFeed] 스트림 연결 시도:', {
      cameraId: current.cameraId,
      bedId: current.bedId,
      src: streamSrc,
    });

    const timer = window.setTimeout(() => {
      if (streamLoadedRef.current) return;
      console.warn('[VideoFeed] 5초 내 첫 프레임 미수신, fallback 전환:', {
        cameraId: current.cameraId,
        bedId: current.bedId,
      });
      setStreamFailed(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [current.cameraId, current.bedId, streamFailed, streamSrc, wardImage]);

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
            console.log('[VideoFeed] 이미지 로드 완료:', {
              mode: streamFailed ? 'fallback' : 'stream',
              cameraId: current.cameraId,
              bedId: current.bedId,
            });
            if (streamFailed) return;
            streamLoadedRef.current = true;
            setStreamLoaded(true);
            setStreamFailed(false);
          }}
          onError={() => {
            console.warn('[VideoFeed] 이미지 로드 실패, fallback 전환:', {
              cameraId: current.cameraId,
              bedId: current.bedId,
              src: feedSrc,
            });
            setStreamFailed(true);
          }}
        />
        <div className="feed-overlay">
          <div className="feed-overlay-left">
            <span className="feed-badge feed-badge-rec">● REC</span>
            <span className="feed-badge">
              <Eye size={11} />
              {current.cameraId} · WARD A
            </span>
          </div>
          <span className="feed-badge">{now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })} KST</span>
        </div>
      </div>
    </article>
  );
}

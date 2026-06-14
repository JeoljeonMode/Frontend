import { Eye } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BASE_URL, getToken } from '../api/client';
import { fallbackRooms, type AppRoom } from '../api/roomsApi';
import type { Snapshot } from '../types';
import { formatTime, levelMeta } from '../mock/mockData';

interface Props {
  current: Snapshot;
  rooms?: AppRoom[];
}

export function VideoFeedPanel({ current, rooms = fallbackRooms }: Props) {
  const currentRoom = rooms.find(r => r.cameraId === current.cameraId || r.bedIds.includes(current.bedId));
  const wardImage = currentRoom?.image ?? '/ward1.png';
  const cameraEnabled = currentRoom?.cameraEnabled ?? false;
  const [streamFailed, setStreamFailed] = useState(false);
  const [streamLoaded, setStreamLoaded] = useState(false);
  const streamLoadedRef = useRef(false);
  const streamSrc = useMemo(() => {
    if (!cameraEnabled || !currentRoom) return wardImage;
    const token = getToken();
    const params = new URLSearchParams({ roomId: currentRoom.id });
    if (token) params.set('token', token);
    return `${BASE_URL}/api/video-stream?${params}`;
  }, [cameraEnabled, currentRoom, wardImage]);
  const feedSrc = streamFailed || !cameraEnabled ? wardImage : streamSrc;

  useEffect(() => {
    setStreamFailed(false);
    setStreamLoaded(false);
    streamLoadedRef.current = false;
  }, [current.cameraId, current.bedId, cameraEnabled]);

  useEffect(() => {
    if (!cameraEnabled) {
      console.log('[VideoFeed] 카메라 미연동 병실, 정적 이미지 표시:', {
        roomId: currentRoom?.id,
        cameraId: current.cameraId,
        bedId: current.bedId,
      });
      return;
    }

    if (streamFailed) {
      console.warn('[VideoFeed] fallback 이미지 표시:', {
        roomId: currentRoom?.id,
        cameraId: current.cameraId,
        bedId: current.bedId,
        fallbackSrc: wardImage,
      });
      return;
    }

    console.log('[VideoFeed] 스트림 연결 시도:', {
      roomId: currentRoom?.id,
      cameraId: current.cameraId,
      bedId: current.bedId,
      src: streamSrc,
    });

    const timer = window.setTimeout(() => {
      if (streamLoadedRef.current) return;
      console.warn('[VideoFeed] 5초 내 첫 프레임 미수신, fallback 전환:', {
        roomId: currentRoom?.id,
        cameraId: current.cameraId,
        bedId: current.bedId,
      });
      setStreamFailed(true);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [cameraEnabled, currentRoom?.id, current.cameraId, current.bedId, streamFailed, streamSrc, wardImage]);

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
              mode: !cameraEnabled ? 'static' : streamFailed ? 'fallback' : 'stream',
              roomId: currentRoom?.id,
              cameraId: current.cameraId,
              bedId: current.bedId,
            });
            if (streamFailed || !cameraEnabled) return;
            streamLoadedRef.current = true;
            setStreamLoaded(true);
            setStreamFailed(false);
          }}
          onError={() => {
            console.warn('[VideoFeed] 이미지 로드 실패, fallback 전환:', {
              roomId: currentRoom?.id,
              cameraId: current.cameraId,
              bedId: current.bedId,
              src: feedSrc,
            });
            if (cameraEnabled) setStreamFailed(true);
          }}
        />
        <div className="feed-overlay">
          <div className="feed-overlay-left">
            <span className={cameraEnabled ? 'feed-badge feed-badge-rec' : 'feed-badge feed-badge-off'}>
              {cameraEnabled ? '● REC' : '카메라 미연동'}
            </span>
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

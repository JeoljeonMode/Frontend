import { useEffect, useRef } from 'react';
import { BASE_URL, getToken } from '../api/client';
import { toSnapshot } from '../api/eventsApi';
import type { Snapshot } from '../types';

export function useSSE(
  enabled: boolean,
  onEvent: (snapshot: Snapshot) => void,
  onDisconnect?: () => void,
) {
  const onEventRef = useRef(onEvent);
  const onDisconnectRef = useRef(onDisconnect);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    onDisconnectRef.current = onDisconnect;
  }, [onDisconnect]);

  useEffect(() => {
    if (!enabled) {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      return;
    }

    eventSourceRef.current?.close();
    const token = getToken();
    const url = token
      ? `${BASE_URL}/sse/status?token=${encodeURIComponent(token)}`
      : `${BASE_URL}/sse/status`;
    console.log('[SSE] 연결 시작:', url);
    const es = new EventSource(url);
    eventSourceRef.current = es;
    let closedByClient = false;

    es.addEventListener('status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const snapshot = toSnapshot(data);
        console.log('[SSE] 수신:', snapshot.level.toUpperCase(), `(${snapshot.score}점)`);
        onEventRef.current(snapshot);
      } catch {
        console.warn('[SSE] 파싱 실패');
      }
    });

    es.onerror = () => {
      if (closedByClient) return;
      console.warn('[SSE] 연결 끊김');
      onDisconnectRef.current?.();
      es.close();
      if (eventSourceRef.current === es) eventSourceRef.current = null;
    };

    return () => {
      closedByClient = true;
      console.log('[SSE] 연결 해제');
      es.close();
      if (eventSourceRef.current === es) eventSourceRef.current = null;
    };
  }, [enabled]);
}

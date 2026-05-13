import { useEffect } from 'react';
import { BASE_URL } from '../api/client';
import { toSnapshot } from '../api/eventsApi';
import type { Snapshot } from '../types';

export function useSSE(
  enabled: boolean,
  onEvent: (snapshot: Snapshot) => void,
  onDisconnect?: () => void,
) {
  useEffect(() => {
    if (!enabled) return;
    console.log('[SSE] 연결 시작:', `${BASE_URL}/sse/status`);
    const es = new EventSource(`${BASE_URL}/sse/status`);

    es.addEventListener('status', (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        console.log('[SSE] 수신:', data.riskLevel, `(${data.riskScore}점)`);
        onEvent(toSnapshot(data));
      } catch {
        console.warn('[SSE] 파싱 실패');
      }
    });

    es.onerror = () => {
      console.warn('[SSE] 연결 끊김');
      onDisconnect?.();
      es.close();
    };

    return () => {
      console.log('[SSE] 연결 해제');
      es.close();
    };
  }, [enabled, onEvent, onDisconnect]);
}

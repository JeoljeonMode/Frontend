import { useCallback, useEffect, useState } from 'react';
import { fetchCurrentStatus, fetchEvents, toSnapshot } from '../api/eventsApi';
import { initialSnapshots } from '../mock/mockData';
import type { Snapshot } from '../types';

export function useBackend() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [current, setCurrent] = useState<Snapshot>(initialSnapshots[0]);
  const [events, setEvents] = useState<Snapshot[]>(initialSnapshots);

  const pushSnapshot = useCallback((snapshot: Snapshot) => {
    setCurrent(snapshot);
    setEvents((prev) => [snapshot, ...prev].slice(0, 8));
  }, []);

  useEffect(() => {
    (async () => {
      console.log('[useBackend] 백엔드 연결 시도...');
      const [status, history] = await Promise.all([fetchCurrentStatus(), fetchEvents(8)]);
      if (status) {
        console.log('[useBackend] 연결 성공:', status.riskLevel);
        setBackendConnected(true);
        setCurrent(toSnapshot(status));
        if (history.length > 0) {
          setEvents(history.map(toSnapshot));
        }
      } else {
        console.log('[useBackend] 연결 실패 → Mock 모드');
      }
    })();
  }, []);

  return { backendConnected, setBackendConnected, current, setCurrent, events, setEvents, pushSnapshot };
}

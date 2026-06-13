import { useCallback, useEffect, useState } from 'react';
import { fallbackRooms, fetchRooms, type AppRoom } from '../api/roomsApi';

export function useRooms() {
  const [rooms, setRooms] = useState<AppRoom[]>(fallbackRooms);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const loadRooms = useCallback(async () => {
    setLoadingRooms(true);
    const next = await fetchRooms();
    setRooms(next.length > 0 ? next : fallbackRooms);
    setLoadingRooms(false);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return { rooms, loadingRooms, loadRooms };
}

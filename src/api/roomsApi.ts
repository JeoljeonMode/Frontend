import { fetchAdminRooms } from './adminApi';

const roomImages = ['/ward1.png', '/ward2.png', '/ward3.png', '/ward4.png', '/ward5.png'];

export interface AppRoom {
  id: string;
  label: string;
  cameraId: string;
  gender: string;
  capacity: number;
  bedIds: string[];
  image: string;
}

export const fallbackRooms: AppRoom[] = [];

export async function fetchRooms(): Promise<AppRoom[]> {
  const rooms = await fetchAdminRooms();
  return rooms
    .filter((room) => room.roomId)
    .map((room, index) => ({
      id: room.roomId,
      label: room.label || `${room.roomId} 병실`,
      cameraId: room.cameraId,
      gender: room.gender,
      capacity: room.capacity,
      bedIds: room.bedIds ?? [],
      image: roomImages[index % roomImages.length],
    }));
}

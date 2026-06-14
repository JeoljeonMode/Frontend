import { apiFetch } from './client';

export type AdminRole = 'ADMIN' | 'STAFF';

export interface CreateUserPayload {
  username: string;
  password: string;
  displayName: string;
  role: AdminRole;
}

export interface AdminUser {
  id?: string | number;
  username: string;
  displayName: string;
  role: AdminRole;
}

export interface CreateRoomPayload {
  roomId: string;
  label: string;
  cameraId: string;
  gender: string;
  capacity: number;
}

export interface AdminRoom {
  id?: string | number;
  roomId: string;
  label: string;
  cameraId: string;
  gender: string;
  capacity: number;
  cameraEnabled: boolean;
  bedIds?: string[];
}

export interface CreateBedPayload {
  bedId: string;
  roomId: string;
  patientName: string;
  patientNo: string;
}

export interface ApiResult<T> {
  ok: boolean;
  data?: T;
  message?: string;
}

async function readMessage(res: Response): Promise<string> {
  const text = await res.text().catch(() => '');
  if (!text) return `요청에 실패했습니다. (${res.status})`;

  try {
    const data = JSON.parse(text) as { message?: string; error?: string };
    return data.message ?? data.error ?? text;
  } catch {
    return text;
  }
}

async function postJson<T>(path: string, body: unknown): Promise<ApiResult<T>> {
  try {
    const res = await apiFetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return { ok: false, message: await readMessage(res) };
    if (res.status === 204) return { ok: true };
    return { ok: true, data: await res.json() as T };
  } catch {
    return { ok: false, message: '서버에 연결할 수 없습니다.' };
  }
}

export async function createUser(payload: CreateUserPayload): Promise<ApiResult<AdminUser>> {
  return postJson<AdminUser>('/api/users', payload);
}

export async function createRoom(payload: CreateRoomPayload): Promise<ApiResult<AdminRoom>> {
  return postJson<AdminRoom>('/api/rooms', payload);
}

export async function createBed(payload: CreateBedPayload): Promise<ApiResult<CreateBedPayload>> {
  return postJson<CreateBedPayload>('/api/beds', payload);
}

export async function fetchAdminRooms(): Promise<AdminRoom[]> {
  try {
    const res = await apiFetch('/api/rooms', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json() as unknown;
    if (!Array.isArray(data)) return [];

    return data.map((room) => {
      const item = room as Record<string, unknown>;
      const roomId = String(item.roomId ?? item.id ?? '');
      const label = String(item.label ?? item.name ?? `${roomId} 병실`);
      const bedIds = Array.isArray(item.bedIds)
        ? item.bedIds.map(String)
        : Array.isArray(item.beds)
          ? item.beds.map((bed) => String((bed as Record<string, unknown>).bedId ?? (bed as Record<string, unknown>).id ?? ''))
          : undefined;

      return {
        id: item.id as string | number | undefined,
        roomId,
        label,
        cameraId: String(item.cameraId ?? ''),
        gender: String(item.gender ?? ''),
        capacity: Number(item.capacity ?? bedIds?.length ?? 0),
        cameraEnabled: Boolean(item.cameraEnabled ?? item.camera_enabled ?? false),
        bedIds,
      };
    });
  } catch {
    return [];
  }
}

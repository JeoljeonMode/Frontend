import { BASE_URL } from './client';
import type { Snapshot, PatientPosition, PoseStatus, RiskLevel } from '../types';

// Backend response shape
export interface BackendEvent {
  id: string;
  occurredAt: string;
  cameraId: string;
  bedId: string;
  patientName: string;
  patientPosition: string;
  posture: string;
  guardrailUp: boolean;
  caregiverPresent: boolean;
  riskScore: number;
  riskLevel: 'NORMAL' | 'CAUTION' | 'DANGER';
  riskLabel: string;
  riskFactors: string[];
  summary: string;
  frameUrl: string | null;
  acknowledged: boolean;
}

export function toSnapshot(event: BackendEvent): Snapshot {
  return {
    id: event.id,
    bedId: event.bedId,
    cameraId: event.cameraId,
    patientName: event.patientName,
    timestamp: event.occurredAt,
    position: event.patientPosition as PatientPosition,
    pose: event.posture as PoseStatus,
    guardrailUp: event.guardrailUp,
    caregiverPresent: event.caregiverPresent,
    score: event.riskScore,
    level: event.riskLevel.toLowerCase() as RiskLevel,
    factors: event.riskFactors,
    summary: event.summary,
  };
}

export async function fetchCurrentStatus(): Promise<BackendEvent | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/status/current`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.warn('[API] GET /api/status/current 실패:', res.status);
      return null;
    }
    const data = (await res.json()) as BackendEvent;
    console.log('[API] GET /api/status/current →', data.riskLevel, `(${data.riskScore}점)`);
    return data;
  } catch (e) {
    console.warn('[API] GET /api/status/current 연결 실패 (백엔드 미실행?)', e);
    return null;
  }
}

export async function fetchEvents(limit = 20, bedId?: string, riskLevel?: string, acknowledged?: boolean): Promise<BackendEvent[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (bedId) params.set('bedId', bedId);
    if (riskLevel) params.set('riskLevel', riskLevel);
    if (acknowledged !== undefined) params.set('acknowledged', String(acknowledged));
    const res = await fetch(`${BASE_URL}/api/events?${params}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) {
      console.warn('[API] GET /api/events 실패:', res.status);
      return [];
    }
    const data = (await res.json()) as BackendEvent[];
    console.log(`[API] GET /api/events → ${data.length}건`);
    return data;
  } catch (e) {
    console.warn('[API] GET /api/events 연결 실패', e);
    return [];
  }
}

export async function postQuestion(question: string, bedId?: string): Promise<string | null> {
  try {
    console.log('[API] POST /api/questions 질문:', question);
    const res = await fetch(`${BASE_URL}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, bedId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.warn('[API] POST /api/questions 실패:', res.status);
      return null;
    }
    const data = (await res.json()) as { answer: string };
    console.log('[API] POST /api/questions 응답:', data.answer);
    return data.answer;
  } catch (e) {
    console.warn('[API] POST /api/questions 실패', e);
    return null;
  }
}

export interface BedStatus {
  bedId: string;
  status: BackendEvent;
}

export async function fetchBeds(): Promise<BedStatus[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/beds`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = (await res.json()) as BedStatus[];
    console.log(`[API] GET /api/beds → ${data.length}개 병상`);
    return data;
  } catch (e) {
    console.warn('[API] GET /api/beds 실패', e);
    return [];
  }
}

export async function postDemoEvent(): Promise<BackendEvent | null> {
  try {
    console.log('[API] POST /api/demo/events');
    const res = await fetch(`${BASE_URL}/api/demo/events`, {
      method: 'POST',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) {
      console.warn('[API] POST /api/demo/events 실패:', res.status);
      return null;
    }
    const data = (await res.json()) as BackendEvent;
    console.log('[API] POST /api/demo/events →', data.riskLevel, `(${data.riskScore}점)`);
    return data;
  } catch (e) {
    console.warn('[API] POST /api/demo/events 실패', e);
    return null;
  }
}

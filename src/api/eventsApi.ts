import { apiFetch } from './client';
import type { Snapshot, PatientPosition, PoseStatus, RiskLevel } from '../types';

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

export interface BedStatus { bedId: string; status: BackendEvent; }

export function toSnapshot(event: BackendEvent): Snapshot {
  return {
    id: event.id, bedId: event.bedId, cameraId: event.cameraId,
    patientName: event.patientName, timestamp: event.occurredAt,
    position: event.patientPosition as PatientPosition,
    pose: event.posture as PoseStatus, guardrailUp: event.guardrailUp,
    caregiverPresent: event.caregiverPresent, score: event.riskScore,
    level: event.riskLevel.toLowerCase() as RiskLevel,
    factors: event.riskFactors, summary: event.summary,
  };
}

export async function fetchCurrentStatus(): Promise<BackendEvent | null> {
  try {
    const res = await apiFetch('/api/status/current', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) { console.warn('[API] GET /api/status/current 실패:', res.status); return null; }
    const data = await res.json() as BackendEvent;
    console.log('[API] GET /api/status/current →', data.riskLevel, `(${data.riskScore}점)`);
    return data;
  } catch (e) { console.warn('[API] GET /api/status/current 실패', e); return null; }
}

export async function fetchEvents(limit = 20, bedId?: string, riskLevel?: string, acknowledged?: boolean): Promise<BackendEvent[]> {
  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (bedId) params.set('bedId', bedId);
    if (riskLevel) params.set('riskLevel', riskLevel);
    if (acknowledged !== undefined) params.set('acknowledged', String(acknowledged));
    const res = await apiFetch(`/api/events?${params}`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) { console.warn('[API] GET /api/events 실패:', res.status); return []; }
    const data = await res.json() as BackendEvent[];
    console.log(`[API] GET /api/events → ${data.length}건`);
    return data;
  } catch (e) { console.warn('[API] GET /api/events 실패', e); return []; }
}

export async function postQuestion(question: string, bedId?: string): Promise<string | null> {
  try {
    const res = await apiFetch('/api/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, bedId }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { answer: string };
    return data.answer;
  } catch { return null; }
}

export async function fetchBeds(): Promise<BedStatus[]> {
  try {
    const res = await apiFetch('/api/beds', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return [];
    const data = await res.json() as BedStatus[];
    console.log(`[API] GET /api/beds → ${data.length}개 병상`);
    return data;
  } catch (e) { console.warn('[API] GET /api/beds 실패', e); return []; }
}

export async function postDemoEvent(): Promise<BackendEvent | null> {
  try {
    const res = await apiFetch('/api/demo/events', { method: 'POST', signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return await res.json() as BackendEvent;
  } catch { return null; }
}

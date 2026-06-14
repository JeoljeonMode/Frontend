import { apiFetch } from './client';
import type { Snapshot, PatientPosition, PoseStatus, RiskLevel } from '../types';

export interface BackendEvent {
  id: string;
  occurredAt: string;
  cameraId: string;
  bedId: string;
  patientName: string;
  patientNo: string;
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
  acknowledgedAt: string | null;
}

export interface BedStatus { bedId: string; status: BackendEvent; }

export interface AiStatusResponse {
  id?: string;
  occurredAt?: string;
  occurred_at?: string;
  createdAt?: string;
  created_at?: string;
  timestamp?: string;
  cameraId?: string;
  camera_id?: string;
  bedId?: string;
  bed_id?: string;
  patientName?: string;
  patient_name?: string;
  patientNo?: string;
  patient_no?: string;
  patientPosition?: string;
  patient_position?: string;
  posture?: string;
  pose?: string;
  guardrailUp?: boolean;
  guardrail_up?: boolean;
  caregiverPresent?: boolean;
  caregiver_present?: boolean;
  riskScore?: number;
  risk_score?: number;
  score?: number;
  riskLevel?: 'NORMAL' | 'CAUTION' | 'DANGER' | string;
  risk_level?: 'NORMAL' | 'CAUTION' | 'DANGER' | string;
  riskLabel?: string;
  risk_label?: string;
  riskFactors?: string[];
  risk_factors?: string[];
  factors?: string[];
  summary?: string;
  statusText?: string;
  status_text?: string;
  message?: string;
  frameUrl?: string | null;
  frame_url?: string | null;
  acknowledged?: boolean;
  acknowledgedAt?: string | null;
  acknowledged_at?: string | null;
}

function normalizeRiskLevel(value?: string, score = 0, text = ''): 'NORMAL' | 'CAUTION' | 'DANGER' {
  const normalized = value?.toUpperCase();
  if (normalized === 'DANGER' || normalized === 'CAUTION' || normalized === 'NORMAL') return normalized;
  if (text.includes('위험') || text.toUpperCase().includes('DANGER')) return 'DANGER';
  if (text.includes('주의') || text.toUpperCase().includes('CAUTION')) return 'CAUTION';
  if (score >= 6) return 'DANGER';
  if (score >= 3) return 'CAUTION';
  return 'NORMAL';
}

export function aiStatusToBackendEvent(status: AiStatusResponse): BackendEvent {
  const riskScore = Number(status.riskScore ?? status.risk_score ?? status.score ?? 0);
  const patientPosition = status.patientPosition ?? status.patient_position ?? 'center';
  const posture = status.posture ?? status.pose ?? 'lying';
  const summary = status.summary ?? status.statusText ?? status.status_text ?? status.message ?? 'AI 상태 분석 결과를 수신했습니다.';
  const riskLevel = normalizeRiskLevel(status.riskLevel ?? status.risk_level, riskScore, summary);

  return {
    id: status.id ?? `ai-status-${Date.now()}`,
    occurredAt: status.occurredAt ?? status.occurred_at ?? status.createdAt ?? status.created_at ?? status.timestamp ?? new Date().toISOString(),
    cameraId: status.cameraId ?? status.camera_id ?? 'AI-CAM',
    bedId: status.bedId ?? status.bed_id ?? 'AI-STATUS',
    patientName: status.patientName ?? status.patient_name ?? 'AI 분석 대상',
    patientNo: status.patientNo ?? status.patient_no ?? '-',
    patientPosition,
    posture,
    guardrailUp: status.guardrailUp ?? status.guardrail_up ?? true,
    caregiverPresent: status.caregiverPresent ?? status.caregiver_present ?? false,
    riskScore,
    riskLevel,
    riskLabel: status.riskLabel ?? status.risk_label ?? riskLevel,
    riskFactors: status.riskFactors ?? status.risk_factors ?? status.factors ?? [],
    summary,
    frameUrl: status.frameUrl ?? status.frame_url ?? null,
    acknowledged: status.acknowledged ?? false,
    acknowledgedAt: status.acknowledgedAt ?? status.acknowledged_at ?? null,
  };
}

function isAiStatusLike(event: BackendEvent | AiStatusResponse): event is AiStatusResponse {
  return !('riskFactors' in event) || !('patientPosition' in event) || 'risk_level' in event || 'status_text' in event || 'risk_score' in event;
}

export function toSnapshot(event: BackendEvent | AiStatusResponse): Snapshot {
  const normalized = isAiStatusLike(event) ? aiStatusToBackendEvent(event) : event;
  return {
    id: normalized.id, bedId: normalized.bedId, cameraId: normalized.cameraId,
    patientName: normalized.patientName, patientNo: normalized.patientNo || normalized.bedId,
    timestamp: normalized.occurredAt,
    position: normalized.patientPosition as PatientPosition,
    pose: normalized.posture as PoseStatus, guardrailUp: normalized.guardrailUp,
    caregiverPresent: normalized.caregiverPresent, score: normalized.riskScore,
    level: normalized.riskLevel.toLowerCase() as RiskLevel,
    factors: normalized.riskFactors, summary: normalized.summary,
    acknowledged: normalized.acknowledged,
  };
}

export async function fetchCurrentStatus(): Promise<BackendEvent | null> {
  try {
    const res = await apiFetch('/api/ai/status', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) { console.warn('[API] GET /api/ai/status 실패:', res.status); return null; }
    const data = await res.json() as AiStatusResponse;
    const event = aiStatusToBackendEvent(data);
    console.log('[API] GET /api/ai/status →', event.riskLevel, `(${event.riskScore}점)`);
    return event;
  } catch (e) { console.warn('[API] GET /api/ai/status 실패', e); return null; }
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

export async function acknowledgeEvent(eventId: string): Promise<boolean> {
  try {
    const res = await apiFetch(`/api/events/${eventId}/acknowledge`, {
      method: 'PATCH',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) { console.warn('[API] PATCH /api/events/:id/acknowledge 실패:', res.status); return false; }
    const data = await res.json() as { id: string; acknowledged: boolean };
    return data.acknowledged;
  } catch (e) { console.warn('[API] PATCH /api/events/:id/acknowledge 실패', e); return false; }
}

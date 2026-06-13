import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { RiskLevel, PatientPosition, PoseStatus } from '../types';

export const levelMeta: Record<RiskLevel, { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  normal: { label: '정상', tone: '정상 모니터링', icon: CheckCircle2 },
  caution: { label: '주의', tone: '간호사 확인 필요', icon: AlertTriangle },
  danger: { label: '위험', tone: '즉시 대응 필요', icon: ShieldAlert },
};

export const poseLabel: Record<PoseStatus, string> = {
  lying: '누움',
  sitting: '앉음',
  exit_attempt: '이탈 시도',
};

export const positionLabel: Record<PatientPosition, string> = {
  center: '침대 중앙',
  left_edge: '침대 좌측 끝',
  right_edge: '침대 우측 끝',
  out_of_bed: '침대 밖',
};

export function formatTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

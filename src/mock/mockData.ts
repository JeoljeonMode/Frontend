import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { RiskLevel, PatientPosition, PoseStatus, Snapshot } from '../types';

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

export const ROOMS = [
  { id: '301호', label: '301호 병실', cameraId: 'CAM-01', bedIds: ['A-301', 'A-302', 'A-303'] },
  { id: '302호', label: '302호 병실', cameraId: 'CAM-02', bedIds: ['A-304', 'A-305', 'A-306'] },
  { id: '303호', label: '303호 병실', cameraId: 'CAM-03', bedIds: ['A-307', 'A-308', 'A-309'] },
  { id: '304호', label: '304호 병실', cameraId: 'CAM-04', bedIds: ['A-310', 'A-311', 'A-312'] },
] as const;

const now = Date.now();
const t = (offsetMs: number) => new Date(now - offsetMs).toISOString();

const scenarioSeeds: Omit<Snapshot, 'score' | 'level' | 'factors' | 'summary'>[] = [
  /* 301호 (CAM-01) */
  { id: 'e-301a', bedId: 'A-301', cameraId: 'CAM-01', patientName: '김인하', patientNo: '24-3011', timestamp: t(0),      position: 'right_edge', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: false },
  { id: 'e-301b', bedId: 'A-302', cameraId: 'CAM-01', patientName: '박하늘', patientNo: '24-3012', timestamp: t(120000), position: 'left_edge',  pose: 'lying',        guardrailUp: true,  caregiverPresent: false },
  { id: 'e-301c', bedId: 'A-303', cameraId: 'CAM-01', patientName: '이지원', patientNo: '24-3013', timestamp: t(300000), position: 'center',     pose: 'lying',        guardrailUp: true,  caregiverPresent: true  },
  /* 302호 (CAM-02) */
  { id: 'e-302a', bedId: 'A-304', cameraId: 'CAM-02', patientName: '최민수', patientNo: '24-3021', timestamp: t(480000), position: 'out_of_bed', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: true  },
  { id: 'e-302b', bedId: 'A-305', cameraId: 'CAM-02', patientName: '정민준', patientNo: '24-3022', timestamp: t(660000), position: 'left_edge',  pose: 'sitting',      guardrailUp: false, caregiverPresent: false },
  { id: 'e-302c', bedId: 'A-306', cameraId: 'CAM-02', patientName: '한수진', patientNo: '24-3023', timestamp: t(840000), position: 'center',     pose: 'lying',        guardrailUp: true,  caregiverPresent: true  },
  /* 303호 (CAM-03) */
  { id: 'e-303a', bedId: 'A-307', cameraId: 'CAM-03', patientName: '이수민', patientNo: '24-3031', timestamp: t(1020000), position: 'right_edge', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: true  },
  { id: 'e-303b', bedId: 'A-308', cameraId: 'CAM-03', patientName: '박지호', patientNo: '24-3032', timestamp: t(1200000), position: 'center',     pose: 'lying',        guardrailUp: true,  caregiverPresent: true  },
  { id: 'e-303c', bedId: 'A-309', cameraId: 'CAM-03', patientName: '최유진', patientNo: '24-3033', timestamp: t(1380000), position: 'center',     pose: 'lying',        guardrailUp: false, caregiverPresent: false },
  /* 304호 (CAM-04) */
  { id: 'e-304a', bedId: 'A-310', cameraId: 'CAM-04', patientName: '손현우', patientNo: '24-3041', timestamp: t(1560000), position: 'out_of_bed', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: false },
  { id: 'e-304b', bedId: 'A-311', cameraId: 'CAM-04', patientName: '윤지현', patientNo: '24-3042', timestamp: t(1740000), position: 'center',     pose: 'lying',        guardrailUp: true,  caregiverPresent: true  },
  { id: 'e-304c', bedId: 'A-312', cameraId: 'CAM-04', patientName: '정하은', patientNo: '24-3043', timestamp: t(1920000), position: 'left_edge',  pose: 'lying',        guardrailUp: true,  caregiverPresent: false },
];

export function calculateRisk(seed: Omit<Snapshot, 'score' | 'level' | 'factors' | 'summary'>): Snapshot {
  const factors: string[] = [];
  let score = 0;

  if (['left_edge', 'right_edge', 'out_of_bed'].includes(seed.position)) {
    score += 3;
    factors.push(`${positionLabel[seed.position]} 근접`);
  }
  if (!seed.guardrailUp) {
    score += 3;
    factors.push('침대 가드레일 내려감');
  }
  if (['sitting', 'exit_attempt'].includes(seed.pose)) {
    score += 2;
    factors.push(`자세 상태: ${poseLabel[seed.pose]}`);
  }
  if (!seed.caregiverPresent) {
    score += 2;
    factors.push('보호 인력 부재');
  }

  const level: RiskLevel = score >= 6 ? 'danger' : score >= 3 ? 'caution' : 'normal';
  const summary =
    level === 'danger' ? `${seed.bedId} 병상에서 낙상 위험이 높습니다. 즉시 현장 확인이 필요합니다.`
    : level === 'caution' ? `${seed.bedId} 병상에 주의 요인이 감지되었습니다.`
    : `${seed.bedId} 병상은 안정 상태입니다.`;

  return { ...seed, score, level, factors, summary };
}

export function nextScenario(index: number): Snapshot {
  const seed = scenarioSeeds[index % scenarioSeeds.length];
  return calculateRisk({ ...seed, id: `evt-${Date.now()}`, timestamp: new Date().toISOString() });
}

export const initialSnapshots: Snapshot[] = scenarioSeeds.map(calculateRisk);

export function answerQuestion(question: string, snapshot: Snapshot): string {
  const q = question.replace(/\s/g, '').toLowerCase();
  if (!question.trim()) return '질문을 입력하면 현재 상태 기준으로 짧게 답변합니다.';
  if (q.includes('위험') || q.includes('점수')) return `현재 ${snapshot.bedId} 병상은 ${levelMeta[snapshot.level].label} 단계이며 위험 점수는 ${snapshot.score}점입니다.`;
  if (q.includes('가드') || q.includes('레일')) return snapshot.guardrailUp ? '가드레일은 올라가 있어 낙상 방어 상태가 유지되고 있습니다.' : '가드레일이 내려가 있습니다.';
  if (q.includes('보호') || q.includes('간병') || q.includes('인력')) return snapshot.caregiverPresent ? '현재 보호 인력이 감지되어 있습니다.' : '보호 인력이 감지되지 않았습니다.';
  if (q.includes('자세') || q.includes('환자')) return `환자 위치는 ${positionLabel[snapshot.position]}, 자세는 ${poseLabel[snapshot.pose]} 상태입니다.`;
  return `${snapshot.summary} 주요 위험 요인은 ${snapshot.factors.length ? snapshot.factors.join(', ') : '없음'}입니다.`;
}

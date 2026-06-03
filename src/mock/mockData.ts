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
  { id: '101호', label: '101호 병실', cameraId: 'CAM-01', gender: '남자', capacity: 3, bedIds: ['B-101', 'B-102', 'B-103'], image: '/ward1.png' },
  { id: '102호', label: '102호 병실', cameraId: 'CAM-02', gender: '남자', capacity: 3, bedIds: ['B-104', 'B-105', 'B-106'], image: '/ward2.png' },
  { id: '103호', label: '103호 병실', cameraId: 'CAM-03', gender: '남자', capacity: 4, bedIds: ['B-107', 'B-108', 'B-109', 'B-110'], image: '/ward3.png' },
  { id: '201호', label: '201호 병실', cameraId: 'CAM-04', gender: '여자', capacity: 3, bedIds: ['B-201', 'B-202', 'B-203'], image: '/ward4.png' },
  { id: '202호', label: '202호 병실', cameraId: 'CAM-05', gender: '여자', capacity: 2, bedIds: ['B-204', 'B-205'], image: '/ward5.png' },
] as const;

const now = Date.now();
const t = (offsetMs: number) => new Date(now - offsetMs).toISOString();

/*
 * 위험도 분포: danger 2명, caution 2명, normal 11명 (15명 총)
 *
 * 스코어링:
 *   position edge/out_of_bed : +3
 *   guardrailUp false        : +3
 *   pose sitting/exit_attempt: +2
 *   caregiverPresent false   : +1
 *   danger ≥6, caution ≥3, normal <3
 *
 * 101호 — 남자 3인실 (patient1): 아빠다리 앉음 1명(주의), 얌전 2명
 * 102호 — 남자 3인실 (patient2): 앉아서 이상행동 1명(주의), 얌전 2명
 * 103호 — 남자 4인실 (patient3): 얌전 3명, 침상 끝 이탈 기미 1명(위험)
 * 201호 — 여자 3인실 (patient4): 모두 얌전(정상)
 * 202호 — 여자 2인실 (patient5): 얌전 1명, 낙상 직전 1명(위험)
 */
const scenarioSeeds: Omit<Snapshot, 'score' | 'level' | 'factors' | 'summary'>[] = [
  /* ── 101호 남자 3인실 (CAM-01) ── */
  { id: 'e-101a', bedId: 'B-101', cameraId: 'CAM-01', patientName: '김철수', patientNo: '24-1011',
    timestamp: t(0),      position: 'center', pose: 'sitting', guardrailUp: true,  caregiverPresent: false }, // 주의: 0+2+0+1=3
  { id: 'e-101b', bedId: 'B-102', cameraId: 'CAM-01', patientName: '박영호', patientNo: '24-1012',
    timestamp: t(180000), position: 'center', pose: 'lying',   guardrailUp: true,  caregiverPresent: false }, // 정상: 1
  { id: 'e-101c', bedId: 'B-103', cameraId: 'CAM-01', patientName: '이민준', patientNo: '24-1013',
    timestamp: t(360000), position: 'center', pose: 'lying',   guardrailUp: true,  caregiverPresent: true  }, // 정상: 0

  /* ── 102호 남자 3인실 (CAM-02) ── */
  { id: 'e-102a', bedId: 'B-104', cameraId: 'CAM-02', patientName: '최진혁', patientNo: '24-1021',
    timestamp: t(540000), position: 'center', pose: 'lying',   guardrailUp: true,  caregiverPresent: true  }, // 정상: 0
  { id: 'e-102b', bedId: 'B-105', cameraId: 'CAM-02', patientName: '정우성', patientNo: '24-1022',
    timestamp: t(720000), position: 'center', pose: 'sitting', guardrailUp: true,  caregiverPresent: false }, // 주의: 0+2+0+1=3
  { id: 'e-102c', bedId: 'B-106', cameraId: 'CAM-02', patientName: '윤기준', patientNo: '24-1023',
    timestamp: t(900000), position: 'center', pose: 'lying',   guardrailUp: true,  caregiverPresent: false }, // 정상: 1

  /* ── 103호 남자 4인실 (CAM-03) ── */
  { id: 'e-103a', bedId: 'B-107', cameraId: 'CAM-03', patientName: '강민호', patientNo: '24-1031',
    timestamp: t(1080000), position: 'center', pose: 'lying', guardrailUp: true,  caregiverPresent: false }, // 정상: 1
  { id: 'e-103b', bedId: 'B-108', cameraId: 'CAM-03', patientName: '한동훈', patientNo: '24-1032',
    timestamp: t(1260000), position: 'center', pose: 'lying', guardrailUp: true,  caregiverPresent: true  }, // 정상: 0
  { id: 'e-103c', bedId: 'B-109', cameraId: 'CAM-03', patientName: '조재원', patientNo: '24-1033',
    timestamp: t(1440000), position: 'center', pose: 'lying', guardrailUp: true,  caregiverPresent: false }, // 정상: 1
  { id: 'e-103d', bedId: 'B-110', cameraId: 'CAM-03', patientName: '임성규', patientNo: '24-1034',
    timestamp: t(1620000), position: 'right_edge', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: false }, // 위험: 3+2+3+1=9

  /* ── 201호 여자 3인실 (CAM-04) ── */
  { id: 'e-201a', bedId: 'B-201', cameraId: 'CAM-04', patientName: '김지연', patientNo: '24-2011',
    timestamp: t(1800000), position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true  }, // 정상: 0
  { id: 'e-201b', bedId: 'B-202', cameraId: 'CAM-04', patientName: '박서현', patientNo: '24-2012',
    timestamp: t(1980000), position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: false }, // 정상: 1
  { id: 'e-201c', bedId: 'B-203', cameraId: 'CAM-04', patientName: '이수현', patientNo: '24-2013',
    timestamp: t(2160000), position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true  }, // 정상: 0

  /* ── 202호 여자 2인실 (CAM-05) ── */
  { id: 'e-202a', bedId: 'B-204', cameraId: 'CAM-05', patientName: '최민서', patientNo: '24-2021',
    timestamp: t(2340000), position: 'center',    pose: 'lying',        guardrailUp: true,  caregiverPresent: true  }, // 정상: 0
  { id: 'e-202b', bedId: 'B-205', cameraId: 'CAM-05', patientName: '정지현', patientNo: '24-2022',
    timestamp: t(2520000), position: 'out_of_bed', pose: 'exit_attempt', guardrailUp: false, caregiverPresent: false }, // 위험: 3+2+3+1=9
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
    score += 1;
    factors.push('보호 인력 미감지');
  }

  const level: RiskLevel = score >= 6 ? 'danger' : score >= 3 ? 'caution' : 'normal';
  const summary =
    level === 'danger'  ? `${seed.patientName} 환자에서 낙상 위험이 감지되었습니다.\n즉시 현장 확인이 필요합니다.`
    : level === 'caution' ? `${seed.patientName} 환자에서 주의 요인이 감지되었습니다.\n확인이 필요합니다.`
    : `${seed.patientName} 환자는 안정 상태입니다.`;

  return { ...seed, score, level, factors, summary };
}

export function nextScenario(index: number): Snapshot {
  const seed = scenarioSeeds[index % scenarioSeeds.length];
  return calculateRisk({ ...seed, id: `evt-${Date.now()}`, timestamp: new Date().toISOString() });
}

export const initialSnapshots: Snapshot[] = scenarioSeeds.map(calculateRisk);

/* ────────────────────────────────────────────────────────────
   이벤트 이력 더미 데이터
   — 실제 발생 흐름을 반영한 시간순(최신→과거) 이벤트 목록
   danger 환자: 정상→주의→위험 상태 전환 흔적 포함
   ──────────────────────────────────────────────────────────── */

function makeSnap(
  seed: Omit<Snapshot, 'score' | 'level' | 'factors' | 'summary'>,
  idSuffix: string,
  offsetMs: number,
): Snapshot {
  return calculateRisk({
    ...seed,
    id: `evt-${seed.bedId}-${idSuffix}`,
    timestamp: new Date(now - offsetMs).toISOString(),
  });
}

const seeds = Object.fromEntries(
  scenarioSeeds.map(s => [s.bedId, s])
) as Record<string, typeof scenarioSeeds[number]>;

export const MOCK_EVENTS: Snapshot[] = [
  /* ── 최근 위험·주의 이벤트 ── */
  makeSnap(seeds['B-205'], 'r1', 0),                                                     // 정지현 위험(현재)
  makeSnap(seeds['B-110'], 'r2', 5 * 60000),                                             // 임성규 위험(현재)
  makeSnap(seeds['B-101'], 'r3', 12 * 60000),                                            // 김철수 주의(현재)
  makeSnap(seeds['B-105'], 'r4', 18 * 60000),                                            // 정우성 주의(현재)

  /* ── 정상 환자 최근 확인 이벤트 ── */
  makeSnap(seeds['B-102'], 'r5', 25 * 60000),                                            // 박영호 정상
  makeSnap(seeds['B-204'], 'r6', 32 * 60000),                                            // 최민서 정상
  makeSnap(seeds['B-201'], 'r7', 40 * 60000),                                            // 김지연 정상
  makeSnap(seeds['B-107'], 'r8', 48 * 60000),                                            // 강민호 정상

  /* ── 위험 환자 상태 전환 이력 ── */
  // 정지현: 정상 → 주의 → 위험
  makeSnap({ ...seeds['B-205'], position: 'left_edge', pose: 'sitting', guardrailUp: true, caregiverPresent: false }, 'h1', 70 * 60000),
  makeSnap({ ...seeds['B-205'], position: 'center',    pose: 'lying',   guardrailUp: true, caregiverPresent: true  }, 'h2', 120 * 60000),

  // 임성규: 정상 → 주의 → 위험
  makeSnap({ ...seeds['B-110'], position: 'left_edge', pose: 'sitting', guardrailUp: true,  caregiverPresent: false }, 'h3', 90 * 60000),
  makeSnap({ ...seeds['B-110'], position: 'center',    pose: 'lying',   guardrailUp: true,  caregiverPresent: true  }, 'h4', 150 * 60000),

  /* ── 주의 환자 이전 정상 기록 ── */
  makeSnap({ ...seeds['B-101'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true  }, 'h5', 180 * 60000),
  makeSnap({ ...seeds['B-105'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true  }, 'h6', 180 * 60000),

  /* ── 추가 정상 확인 이력 ── */
  makeSnap(seeds['B-103'], 'h7', 200 * 60000),
  makeSnap(seeds['B-104'], 'h8', 210 * 60000),
  makeSnap(seeds['B-108'], 'h9', 220 * 60000),
  makeSnap(seeds['B-202'], 'h10', 230 * 60000),
  makeSnap(seeds['B-203'], 'h11', 240 * 60000),
];

/* 환자별 최근 이벤트 이력 (BedDetailPage용) */
const PATIENT_HISTORY: Record<string, Snapshot[]> = {
  'B-205': [
    makeSnap(seeds['B-205'], 'ph1', 0),
    makeSnap({ ...seeds['B-205'], position: 'left_edge', pose: 'sitting', guardrailUp: true, caregiverPresent: false }, 'ph2', 35 * 60000),
    makeSnap({ ...seeds['B-205'], position: 'center',    pose: 'lying',   guardrailUp: true, caregiverPresent: true  }, 'ph3', 90 * 60000),
    makeSnap({ ...seeds['B-205'], position: 'center',    pose: 'lying',   guardrailUp: true, caregiverPresent: true  }, 'ph4', 180 * 60000),
  ],
  'B-110': [
    makeSnap(seeds['B-110'], 'ph1', 5 * 60000),
    makeSnap({ ...seeds['B-110'], position: 'left_edge', pose: 'sitting', guardrailUp: true,  caregiverPresent: false }, 'ph2', 50 * 60000),
    makeSnap({ ...seeds['B-110'], position: 'center',    pose: 'lying',   guardrailUp: true,  caregiverPresent: true  }, 'ph3', 120 * 60000),
    makeSnap({ ...seeds['B-110'], position: 'center',    pose: 'lying',   guardrailUp: true,  caregiverPresent: true  }, 'ph4', 210 * 60000),
  ],
  'B-101': [
    makeSnap(seeds['B-101'], 'ph1', 12 * 60000),
    makeSnap({ ...seeds['B-101'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'ph2', 100 * 60000),
    makeSnap({ ...seeds['B-101'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'ph3', 200 * 60000),
  ],
  'B-105': [
    makeSnap(seeds['B-105'], 'ph1', 18 * 60000),
    makeSnap({ ...seeds['B-105'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'ph2', 110 * 60000),
    makeSnap({ ...seeds['B-105'], position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'ph3', 200 * 60000),
  ],
};

export function getMockHistory(bedId: string): Snapshot[] {
  if (PATIENT_HISTORY[bedId]) return PATIENT_HISTORY[bedId];
  const current = initialSnapshots.find(s => s.bedId === bedId);
  if (!current) return [];
  const seed = seeds[bedId];
  return [
    current,
    makeSnap({ ...seed, position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'phA', 60 * 60000),
    makeSnap({ ...seed, position: 'center', pose: 'lying', guardrailUp: true, caregiverPresent: true }, 'phB', 120 * 60000),
  ];
}

export function answerQuestion(question: string, snapshot: Snapshot): string {
  const q = question.replace(/\s/g, '').toLowerCase();
  if (!question.trim()) return '질문을 입력하면 현재 상태 기준으로 짧게 답변합니다.';
  if (q.includes('위험') || q.includes('점수')) return `현재 ${snapshot.patientName} 환자는 ${levelMeta[snapshot.level].label} 단계이며 위험 점수는 ${snapshot.score}점입니다.`;
  if (q.includes('가드') || q.includes('레일')) return snapshot.guardrailUp ? '가드레일은 올라가 있어 낙상 방어 상태가 유지되고 있습니다.' : '가드레일이 내려가 있습니다.';
  if (q.includes('보호') || q.includes('간병') || q.includes('인력')) return snapshot.caregiverPresent ? '현재 보호 인력이 감지되어 있습니다.' : '보호 인력이 감지되지 않았습니다.';
  if (q.includes('자세') || q.includes('환자')) return `환자 위치는 ${positionLabel[snapshot.position]}, 자세는 ${poseLabel[snapshot.pose]} 상태입니다.`;
  return `${snapshot.summary} 주요 위험 요인은 ${snapshot.factors.length ? snapshot.factors.join(', ') : '없음'}입니다.`;
}

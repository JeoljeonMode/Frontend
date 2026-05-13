export type RiskLevel = 'normal' | 'caution' | 'danger';
export type PatientPosition = 'center' | 'left_edge' | 'right_edge' | 'out_of_bed';
export type PoseStatus = 'lying' | 'sitting' | 'exit_attempt';

export type Snapshot = {
  id: string;
  bedId: string;
  cameraId: string;
  patientName: string;
  timestamp: string;
  position: PatientPosition;
  pose: PoseStatus;
  guardrailUp: boolean;
  caregiverPresent: boolean;
  score: number;
  level: RiskLevel;
  factors: string[];
  summary: string;
};

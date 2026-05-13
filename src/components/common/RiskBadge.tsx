import type { RiskLevel } from '../../types';
import { levelMeta } from '../../mock/mockData';

interface Props {
  level: RiskLevel;
  size?: 'sm' | 'md';
}

export function RiskBadge({ level, size = 'md' }: Props) {
  const meta = levelMeta[level];
  return (
    <span className={`level-pill ${level}`} style={size === 'sm' ? { fontSize: '12px', minHeight: '26px', padding: '0 8px' } : {}}>
      {meta.label}
    </span>
  );
}

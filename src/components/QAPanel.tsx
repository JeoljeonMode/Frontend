import { Bot } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { postQuestion } from '../api/eventsApi';
import { initialSnapshots, levelMeta, ROOMS, positionLabel, poseLabel } from '../mock/mockData';
import type { Snapshot } from '../types';

interface Props {
  current: Snapshot;
  backendConnected: boolean;
  bedId?: string;
  bare?: boolean;
}

type ChatMessage = { role: 'user' | 'system'; text: string };

function mockAnswer(question: string, current: Snapshot): string {
  const q = question.replace(/\s/g, '').toLowerCase();

  /* 병실 전체 현황 */
  const room = ROOMS.find(r => r.bedIds.includes(current.bedId as never));
  if (!room) return '해당 병실 정보를 찾을 수 없습니다.';

  const roomSnaps = (room.bedIds as readonly string[])
    .map(id => initialSnapshots.find(s => s.bedId === id))
    .filter(Boolean) as Snapshot[];

  const dangerList = roomSnaps.filter(s => s.level === 'danger');
  const cautionList = roomSnaps.filter(s => s.level === 'caution');
  const normalList  = roomSnaps.filter(s => s.level === 'normal');

  /* 병실 전체 요약 */
  if (q.includes('병실') || q.includes('전체') || q.includes('현황') || q.includes('상태')) {
    const lines: string[] = [`${room.label} 현재 현황입니다.`];
    if (dangerList.length)
      lines.push(`위험: ${dangerList.map(s => `${s.patientName}(${s.score}점)`).join(', ')}`);
    if (cautionList.length)
      lines.push(`주의: ${cautionList.map(s => `${s.patientName}(${s.score}점)`).join(', ')}`);
    if (normalList.length)
      lines.push(`정상: ${normalList.map(s => s.patientName).join(', ')}`);
    return lines.join('\n');
  }

  /* 위험 환자 */
  if (q.includes('위험') && !q.includes('점수')) {
    if (!dangerList.length) return `${room.label}에는 현재 위험 환자가 없습니다.`;
    return `위험 환자: ${dangerList.map(s => `${s.patientName} (${s.score}점 — ${s.factors.join(', ')})`).join('\n')}`;
  }

  /* 주의 환자 */
  if (q.includes('주의')) {
    if (!cautionList.length) return `${room.label}에는 현재 주의 환자가 없습니다.`;
    return `주의 환자: ${cautionList.map(s => `${s.patientName} (${s.score}점 — ${s.factors.join(', ')})`).join('\n')}`;
  }

  /* 특정 환자 이름 포함 */
  for (const snap of roomSnaps) {
    const namePart = snap.patientName.slice(1);
    if (q.includes(snap.patientName) || q.includes(namePart)) {
      return `${snap.patientName} 환자는 현재 ${levelMeta[snap.level].label} 상태(${snap.score}점)입니다.\n` +
        `위치: ${positionLabel[snap.position]}, 자세: ${poseLabel[snap.pose]}\n` +
        (snap.factors.length ? `위험 요인: ${snap.factors.join(', ')}` : '위험 요인 없음');
    }
  }

  /* 가드레일 */
  if (q.includes('가드') || q.includes('레일')) {
    const down = roomSnaps.filter(s => !s.guardrailUp);
    if (!down.length) return `${room.label} 전 침상의 가드레일이 올라가 있습니다.`;
    return `가드레일이 내려간 침상: ${down.map(s => s.patientName).join(', ')}`;
  }

  /* 보호 인력 */
  if (q.includes('보호') || q.includes('간병') || q.includes('인력')) {
    const absent = roomSnaps.filter(s => !s.caregiverPresent);
    if (!absent.length) return `${room.label} 전 침상에 보호 인력이 감지되어 있습니다.`;
    return `보호 인력이 없는 침상: ${absent.map(s => s.patientName).join(', ')}`;
  }

  /* 점수/위험도 */
  if (q.includes('점수') || q.includes('위험도')) {
    return roomSnaps
      .sort((a, b) => b.score - a.score)
      .map(s => `${s.patientName}: ${s.score}점 (${levelMeta[s.level].label})`)
      .join('\n');
  }

  /* 현재 선택 환자 fallback */
  return `${current.patientName} 환자는 현재 ${levelMeta[current.level].label} 상태(${current.score}점)입니다.\n` +
    (current.factors.length ? `위험 요인: ${current.factors.join(', ')}` : '위험 요인 없음');
}

export function QAPanel({ current, backendConnected, bedId, bare }: Props) {
  const room = ROOMS.find(r => r.bedIds.includes(current.bedId as never));
  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'system', text: `${room?.label ?? current.bedId} 상태에 대해 질문하세요.\n예: "위험한 환자 있어?", "전체 현황 알려줘"` },
  ]);

  const handleAsk = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;

    setChat(prev => [...prev, { role: 'user', text }]);
    setQuestion('');
    setIsAsking(true);

    const serverAnswer = backendConnected ? await postQuestion(text, bedId) : null;
    const answer = serverAnswer ?? (
      backendConnected
        ? `AI 분석 결과를 받아오지 못해 현재 병실 상태 기준으로 답변합니다.\n${mockAnswer(text, current)}`
        : mockAnswer(text, current)
    );

    setChat(prev => [...prev, { role: 'system', text: answer }]);
    setIsAsking(false);
  };

  const content = (
    <>
      <div className="chat-log">
        {chat.slice(-8).map((msg, i) => (
          <div className={`chat-message ${msg.role}`} key={i} style={{ whiteSpace: 'pre-line' }}>
            {msg.text}
          </div>
        ))}
      </div>
      <form className="question-form" onSubmit={handleAsk}>
        <input
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="예: 위험한 환자 있어?"
          disabled={isAsking}
        />
        <button type="submit" disabled={isAsking}>{isAsking ? '확인 중' : '질문'}</button>
      </form>
    </>
  );

  if (bare) {
    return <div className="chat-drawer-body">{content}</div>;
  }

  return (
    <article className="panel question-panel" id="question">
      <div className="panel-header">
        <h2>상태 질의응답</h2>
        <Bot size={20} />
      </div>
      {content}
    </article>
  );
}

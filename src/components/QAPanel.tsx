import { Bot } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { postQuestion } from '../api/eventsApi';
import { fallbackRooms, type AppRoom } from '../api/roomsApi';
import { levelMeta, positionLabel, poseLabel } from '../mock/mockData';
import type { Snapshot } from '../types';

interface Props {
  current: Snapshot;
  backendConnected: boolean;
  bedId?: string;
  bare?: boolean;
  rooms?: AppRoom[];
}

type ChatMessage = { role: 'user' | 'system'; text: string };

function fallbackAnswer(question: string, current: Snapshot): string {
  const q = question.replace(/\s/g, '').toLowerCase();

  /* 가드레일 */
  if (q.includes('가드') || q.includes('레일')) {
    return current.guardrailUp ? '현재 선택된 침상의 가드레일은 올라가 있습니다.' : '현재 선택된 침상의 가드레일이 내려가 있습니다.';
  }

  /* 보호 인력 */
  if (q.includes('보호') || q.includes('간병') || q.includes('인력')) {
    return current.caregiverPresent ? '현재 보호 인력이 감지되어 있습니다.' : '현재 보호 인력이 감지되지 않았습니다.';
  }

  /* 점수/위험도 */
  if (q.includes('점수') || q.includes('위험도')) {
    return `${current.patientName}: ${current.score}점 (${levelMeta[current.level].label})`;
  }

  /* 현재 선택 환자 fallback */
  return `${current.patientName} 환자는 현재 ${levelMeta[current.level].label} 상태(${current.score}점)입니다.\n` +
    (current.factors.length ? `위험 요인: ${current.factors.join(', ')}` : '위험 요인 없음');
}

export function QAPanel({ current, backendConnected, bedId, bare, rooms = fallbackRooms }: Props) {
  const room = rooms.find(r => r.bedIds.includes(current.bedId));
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
        ? `AI 분석 결과를 받아오지 못해 현재 선택된 침상 상태 기준으로 답변합니다.\n${fallbackAnswer(text, current)}`
        : fallbackAnswer(text, current)
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

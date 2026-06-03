import { Bot } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { postQuestion } from '../api/eventsApi';
import { answerQuestion } from '../mock/mockData';
import type { Snapshot } from '../types';

interface Props {
  current: Snapshot;
  backendConnected: boolean;
  bedId?: string;
  bare?: boolean;
}

type ChatMessage = { role: 'user' | 'system'; text: string };

export function QAPanel({ current, backendConnected, bedId, bare }: Props) {
  const [question, setQuestion] = useState('');
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: 'system', text: `${current.bedId} 병상의 현재 상태를 질문할 수 있습니다.` },
  ]);

  const handleAsk = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;

    setChat((prev) => [...prev, { role: 'user', text }]);
    const answer = backendConnected
      ? ((await postQuestion(text, bedId)) ?? answerQuestion(text, current))
      : answerQuestion(text, current);
    setChat((prev) => [...prev, { role: 'system', text: answer }]);
    setQuestion('');
  };

  const content = (
    <>
      <div className="chat-log">
        {chat.slice(-6).map((msg, i) => (
          <div className={`chat-message ${msg.role}`} key={i}>{msg.text}</div>
        ))}
      </div>
      <form className="question-form" onSubmit={handleAsk}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="예: 지금 위험한 이유가 뭐야?"
        />
        <button type="submit">질문</button>
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

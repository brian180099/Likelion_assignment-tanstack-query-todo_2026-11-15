import { useState } from 'react';

export default function TodoForm({ disabled, onAdd }: { disabled: boolean; onAdd: (title: string) => Promise<void> }) {
  const [title, setTitle] = useState('');
  return <form className="todo-form" onSubmit={async (event) => {
    event.preventDefault();
    if (disabled || !title.trim()) return;
    try { await onAdd(title.trim()); setTitle(''); } catch { /* App의 alert에 오류 표시 */ }
  }}>
    <label className="sr-only" htmlFor="todo-title">새로운 할 일</label>
    <input id="todo-title" name="title" placeholder="오늘 할 일을 입력하세요" autoComplete="off" value={title} onChange={(event) => setTitle(event.target.value)} disabled={disabled} />
    <button type="submit" disabled={disabled || !title.trim()}>추가</button>
  </form>;
}


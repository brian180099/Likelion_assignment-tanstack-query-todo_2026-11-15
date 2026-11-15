import type { Todo } from '../types/todo';
const URL = 'http://localhost:3000/todos';

export async function fetchTodos({ signal }: { signal: AbortSignal }): Promise<Todo[]> {
  const response = await fetch(URL, { signal });
  if (!response.ok) throw new Error('할 일 목록을 불러오지 못했습니다. API 서버를 확인해 주세요.');
  return response.json();
}
export async function createTodo(title: string): Promise<Todo> {
  const response = await fetch(URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, completed: false }),
  });
  if (!response.ok) throw new Error('할 일을 추가하지 못했습니다.');
  return response.json();
}
export async function updateTodo({ id, completed }: Pick<Todo, 'id' | 'completed'>): Promise<Todo> {
  const response = await fetch(URL + '/' + encodeURIComponent(id), {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });
  if (!response.ok) throw new Error('완료 상태를 변경하지 못했습니다.');
  return response.json();
}
export async function deleteTodo(id: string): Promise<string> {
  const response = await fetch(URL + '/' + encodeURIComponent(id), { method: 'DELETE' });
  if (!response.ok) throw new Error('할 일을 삭제하지 못했습니다.');
  return id;
}


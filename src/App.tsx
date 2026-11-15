import { useState } from 'react';
import { useIsMutating, useQuery } from '@tanstack/react-query';
import { fetchTodos } from './api/todo';
import { todoMutationKey, todosKey, useTodoMutations } from './hooks/useTodos';
import TodoForm from './components/TodoForm';
import TodoList from './components/TodoList';

export default function App() {
  const [polling, setPolling] = useState(false);
  const [notice, setNotice] = useState('');
  const mutations = useTodoMutations();
  const busy = useIsMutating({ mutationKey: todoMutationKey }) > 0;
  const query = useQuery({
    queryKey: todosKey,
    queryFn: fetchTodos,
    refetchInterval: polling && !busy ? 5000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const todos = query.data ?? [];
  const error = mutations.add.error ?? mutations.update.error ?? mutations.remove.error;
  const resetErrors = () => {
    mutations.add.reset(); mutations.update.reset(); mutations.remove.reset();
  };
  return (
    <main className="todo-card">
      <header className="todo-header">
        <p className="eyebrow">MUTSA · TANSTACK QUERY</p>
        <h1>오늘의 할 일</h1>
        <p className="description">작은 계획을 하나씩, 오늘도 차근차근.</p>
      </header>
      <TodoForm disabled={busy || !query.data} onAdd={async (title) => {
        resetErrors();
        await mutations.add.mutateAsync(title);
        setNotice('새 할 일을 추가했어요.');
      }} />
      <section className="sync-panel" aria-label="자동 새로고침 설정">
        <label><input type="checkbox" checked={polling} onChange={(e) => setPolling(e.target.checked)} /> 자동 새로고침 · 5초</label>
        <p>{polling ? (busy ? '변경 사항 저장 중 · 자동 조회 일시 정지' : '다른 곳에서 바뀐 할 일도 자동으로 가져와요.') : '필요할 때 켜서 서버의 최신 목록을 확인하세요.'}</p>
        <span role="status">{query.isFetching ? '서버에서 불러오는 중…' : query.dataUpdatedAt ? '최근 갱신 ' + new Date(query.dataUpdatedAt).toLocaleTimeString('ko-KR') : '서버 연결 대기 중'}</span>
      </section>
      <div className="list-heading"><h2>할 일 목록</h2><span>{todos.filter((todo) => todo.completed).length} / {todos.length} 완료</span></div>
      {query.isPending && <p role="status">할 일을 불러오고 있어요.</p>}
      {query.isError && <div role="alert"><p>{query.error.message}</p><button disabled={busy || query.isFetching} onClick={() => void query.refetch()}>다시 시도</button></div>}
      {error && <p role="alert">{error.message}</p>}
      {query.data && <TodoList todos={todos} disabled={busy} onToggle={(todo) => {
        resetErrors();
        mutations.update.mutate({ id: todo.id, completed: !todo.completed });
      }} onDelete={(id) => {
        resetErrors();
        mutations.remove.mutate(id, { onSuccess: () => setNotice('할 일을 삭제했어요. 목록 캐시를 갱신했습니다.') });
      }} />}
      <p className="feedback" role="status">{notice}</p>
      <footer className="starter-notice">멋사 과제 · Todo 삭제 & 쿼리 폴링</footer>
    </main>
  );
}


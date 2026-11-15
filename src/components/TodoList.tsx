import type { Todo } from '../types/todo';
interface Props {
  todos: Todo[];
  disabled: boolean;
  onToggle: (todo: Todo) => void;
  onDelete: (id: string) => void;
}
export default function TodoList({ todos, disabled, onToggle, onDelete }: Props) {
  if (!todos.length) return <p className="empty-message">아직 등록된 할 일이 없어요.</p>;
  return <ul className="todo-list">{todos.map((todo) => <li className="todo-item" key={todo.id}>
    <label className="todo-label">
      <input type="checkbox" checked={todo.completed} disabled={disabled} onChange={() => { if (!disabled) onToggle(todo); }} />
      <span className={todo.completed ? 'completed' : ''}>{todo.title}</span>
    </label>
    <button className="delete-button" type="button" aria-label={todo.title + ' 삭제'} disabled={disabled} onClick={() => { if (!disabled) onDelete(todo.id); }}>삭제</button>
  </li>)}</ul>;
}


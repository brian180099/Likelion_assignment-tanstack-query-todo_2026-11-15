import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTodo, deleteTodo, updateTodo } from '../api/todo';
import type { Todo } from '../types/todo';

export const todosKey = ['todos'] as const;
export const todoMutationKey = ['todo-mutation'] as const;

export function useTodoMutations() {
  const client = useQueryClient();
  const add = useMutation({
    mutationKey: todoMutationKey,
    mutationFn: createTodo,
    onSuccess: async (todo) => {
      await client.cancelQueries({ queryKey: todosKey });
      client.setQueryData<Todo[]>(todosKey, (current = []) => [...current, todo]);
    },
  });
  const update = useMutation({
    mutationKey: todoMutationKey,
    mutationFn: updateTodo,
    onMutate: async (changed) => {
      await client.cancelQueries({ queryKey: todosKey });
      const previous = client.getQueryData<Todo[]>(todosKey);
      client.setQueryData<Todo[]>(todosKey, (current) => current?.map((todo) =>
        todo.id === changed.id ? { ...todo, completed: changed.completed } : todo));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(todosKey, context.previous);
    },
    onSettled: () => client.invalidateQueries({ queryKey: todosKey }),
  });
  const remove = useMutation({
    mutationKey: todoMutationKey,
    mutationFn: deleteTodo,
    onSuccess: async (deletedId) => {
      // 진행 중이던 조회가 삭제 전 목록으로 캐시를 덮어쓰지 않도록 취소한다.
      await client.cancelQueries({ queryKey: todosKey });
      client.setQueryData<Todo[]>(todosKey, (current) =>
        current?.filter((todo) => todo.id !== deletedId));
      // 삭제는 invalidateQueries 없이 성공 응답의 ID로 캐시를 직접 갱신한다.
    },
  });
  return { add, update, remove };
}


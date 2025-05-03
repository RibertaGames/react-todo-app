'use client';
import React from 'react';
import { Todo } from '../page';

type TodoItemProps = {
  todo: Todo;
  editingId: number | null;
  toggleDone: (id: number, current: boolean) => void;
  startEdit: (todo: Todo) => void;
  saveEdit: () => void;
  deleteTodo: (id: number) => void;
};

export default function TodoItem({
  todo,
  editingId,
  toggleDone,
  startEdit,
  saveEdit,
  deleteTodo,
}: TodoItemProps) {
  return (
    <li className="flex items-center justify-between bg-white shadow-sm rounded p-3 border border-gray-200">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={todo.is_done}
          onChange={() => toggleDone(todo.id, todo.is_done)}
          className="w-4 h-4"
        />
        <span
          className={`${
            todo.is_done ? 'line-through text-gray-400' : ''
          } text-base`}
        >
          {todo.text}
        </span>
      </div>

      <div className="flex gap-2">
        {editingId === todo.id ? (
          <button
            onClick={saveEdit}
            className="px-2 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            保存
          </button>
        ) : (
          <button
            onClick={() => startEdit(todo)}
            className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            編集
          </button>
        )}
        <button
          onClick={() => deleteTodo(todo.id)}
          className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
        >
          削除
        </button>
      </div>
    </li>
  );
}

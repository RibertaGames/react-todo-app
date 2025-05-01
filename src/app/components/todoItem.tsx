'use client';
import React from 'react';
import {Todo} from '../page';
  
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
      <li key={todo.id}>
        <input
          type="checkbox"
          checked={todo.is_done}
          onChange={() => toggleDone(todo.id, todo.is_done)}
          style={{ marginRight: '8px' }}
        />
        {editingId === todo.id ? (
          <button onClick={saveEdit}>保存</button>
        ) : (
          <button onClick={() => startEdit(todo)}>編集</button>
        )}
        <button onClick={() => deleteTodo(todo.id)}>削除</button>
  
        <span style={{ textDecoration: todo.is_done ? 'line-through' : 'none' }}>
          {todo.text}
        </span>
      </li>
    );
  }
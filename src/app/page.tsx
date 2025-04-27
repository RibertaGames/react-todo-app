'use client';
import { useEffect, useState } from 'react';

type Todo = {
  id: number;
  text: string;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');

  // 初回ロード時にTODOを取得
  useEffect(() => {
    fetch('/api/todos')
      .then(res => res.json())
      .then(data => setTodos(data.todos));
  }, []);

  const addTodo = async () => {
    if (!text.trim()) return;
    const res = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const newTodo = await res.json();
    setTodos(prev => [...prev, newTodo]);
    setText('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>TODOアプリ</h1>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="やることを書く"
        style={{ marginRight: '10px' }}
      />
      <button onClick={addTodo}>追加</button>

      <ul style={{ marginTop: '20px' }}>
        {todos.map(todo => (
          <li key={todo.id}>{todo.text}</li>
        ))}
      </ul>
    </div>
  );
}

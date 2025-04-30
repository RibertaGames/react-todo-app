'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type Todo = {
  id: number;
  text: string;
  is_done: boolean;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);

  // 初回ロード時にTODOを取得（Supabaseから）
  useEffect(() => {
    const fetchTodos = async () => {
      const { data, error } = await supabase
        .from('todos')
        .select('*');

      if (error) {
        console.error('データ取得エラー:', error);
        return;
      }

      if (data) {
        setTodos(data);
      }
    };

    fetchTodos();
  }, []);

  //TODO追加機能
  const addTodo = async () => {
    if (!text.trim()) return;
    
    const { data, error } = await supabase
      .from('todos')
      .insert([{ text, is_done: false }])
      .select();

    if (error) {
      console.error('追加エラー:', error);
      return;
    }

    if (data) {
      console.log('保存成功', data[0]);
      setTodos(prev => [...prev, data[0]]);
      setText('');
    }
  };

  // TODO完了機能
  const toggleDone = async (id: number, currentStatus: boolean) => {
    console.log(id,currentStatus);
    const { data, error } = await supabase
      .from('todos')
      .update({ is_done: !currentStatus })
      .eq('id', id)
      .select();
  
    if (error) {
      console.error('更新エラー:', error);
      return;
    }
  
    if (data) {
      // 状態更新
      setTodos(prev =>
        prev.map(todo =>
          todo.id === id ? { ...todo, is_done: !currentStatus } : todo
        )
      );
    }
  };

  //編集機能
  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setText(todo.text);
  };

  //編集の保存機能
  const saveEdit = async () => {
    if (!text.trim() || editingId === null) return;
  
    const { data, error } = await supabase
      .from('todos')
      .update({ text })
      .eq('id', editingId)
      .select();
  
    if (error) {
      console.error('更新エラー:', error);
      return;
    }
  
    if (data) {
      setTodos(prev =>
        prev.map(todo => (todo.id === editingId ? data[0] : todo))
      );
      setText('');
      setEditingId(null);
    }
  };

  //削除機能
  const deleteTodo = async (id: number) => {
    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id);
  
    if (error) {
      console.error('削除エラー:', error);
      return;
    }
  
    setTodos(prev => prev.filter(todo => todo.id !== id));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>TODOアプリ</h1>
      <input
        type="text"
        value={text ?? ''}
        onChange={(e) => setText(e.target.value)}
        placeholder="やることを書く"
        style={{ marginRight: '10px' }}
      />
      <button onClick={addTodo}>追加</button>

      <ul style={{ marginTop: '20px' }}>
        {todos.map(todo => (
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
        ))}
      </ul>

    </div>
  );
}

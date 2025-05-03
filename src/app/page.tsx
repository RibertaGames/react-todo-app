'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TodoItem from './components/todoItem';

export type Todo = {
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
        .select('*')
        .order('created_at', { ascending: true });

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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">TODOアプリ</h1>
      <div className="flex items-center gap-2 mb-6">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="やることを書く"
          className="border border-gray-300 rounded px-3 py-1 flex-grow"
        />
        <button onClick={addTodo} className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600">
          追加
        </button>
      </div>

      <div className="flex gap-8">
        <div className="w-1/2">
          <h2 className="text-lg font-semibold mb-2">未完了</h2>
          <ul className="space-y-2">
            {todos.filter((t) => !t.is_done).map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                editingId={editingId}
                toggleDone={toggleDone}
                startEdit={startEdit}
                saveEdit={saveEdit}
                deleteTodo={deleteTodo}
              />
            ))}
          </ul>
        </div>

        <div className="w-1/2">
          <h2 className="text-lg font-semibold mb-2">完了</h2>
          <ul className="space-y-2">
            {todos.filter((t) => t.is_done).map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                editingId={editingId}
                toggleDone={toggleDone}
                startEdit={startEdit}
                saveEdit={saveEdit}
                deleteTodo={deleteTodo}
              />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

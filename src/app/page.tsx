'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import TodoItem from './components/todoItem';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { motion, AnimatePresence } from 'framer-motion';
import RoutineTaskManagerModal from './modal/RoutineTaskModal'

export type Todo = {
  id: number;
  text: string;
  is_done: boolean;
  is_routine: boolean;
  created_at: string;
};

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [taskType, setTaskType] = useState<'todo' | 'routine'>('todo');
  const [date, setDate] = useState<Date | null>(new Date());
  const [repeatType, setRepeatType] = useState<'daily' | 'weekly'>('daily');
  const [repeatWeekType, setRepeatWeekType] = useState<number[]>([]); // 週の曜日（weeklyのみ）
  const [isHeaderButtonOpen, setHeaderButtonOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // 初回ロード時にTODOを取得（Supabaseから）
  useEffect(() => {
    generateRoutineTodos();
    fetchTodos();
  }, []);

  //TODOを取得
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

  //TODO追加機能
  const addTodo = async () => {
    if (!text.trim() || !date) return;

    if (taskType === 'todo') {
      const { data, error} = await supabase.from('todos').insert([
        {
          text,
          is_done: false,
          created_at: dayjs(date).toISOString(),
        },
      ]).select();

      if (error) {
        console.error('追加エラー:', error);
        return;
      }

      setTodos(prev => [...prev, ...data]);

    } else {

      if (repeatType === 'weekly' && repeatWeekType.length === 0) {
        alert('曜日を1つ以上選択してください');
        return;
      }

      const inserts = repeatType === 'weekly'
      ? [{
          text,
          created_at: dayjs(date).toISOString(),
          updated_at: null,
          repeat_type: 'weekly',
          repeat_week_type: repeatWeekType,
        }]
      : [{
          text,
          created_at: dayjs(date).toISOString(),
          updated_at: null,
          repeat_type: 'daily',
          repeat_week_type: null,
        }];

      const { data, error } = await supabase.from('routine_tasks').insert(inserts).select();

      if (error) {
        console.error('ルーティンタスク追加エラー:', error);
        return;
      }
      setRepeatWeekType([]);
      setRepeatType('daily');

      //TODOに追加できたら追加する
      generateRoutineTodos();
    }

    setText('');
    setDate(new Date());
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

  // グループ化
  const groupedTodos = todos.reduce((acc, todo) => {
    const dateKey = dayjs(todo.created_at).format('YYYY-MM-DD');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(todo);
    return acc;
  }, {} as Record<string, Todo[]>);

  // ソート
  const sortedDates = Object.keys(groupedTodos).sort((a, b) =>
    dayjs(b).diff(dayjs(a))
  );

  // 曜日選択トグル関数
  const toggleDay = (day: number) => {
    setRepeatWeekType(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  // ルーティンワーク処理
  const generateRoutineTodos = async () => {
    const today = dayjs().startOf('day'); // 今日の日付を0時に固定（重複防止用）
    const weekday = today.day(); // 今日の曜日（0=日曜, 1=月曜,...）
  
    // ルーティンタスク一覧を取得
    const { data: routines, error } = await supabase
      .from('routine_tasks')
      .select('*');
  
    if (error) {
      console.error('ルーティン取得エラー:', error);
      return;
    }
  
    for (const routine of routines || []) {
      const last = routine.updated_at
        ? dayjs(routine.updated_at)
        : null;
  
      // 今日追加すべきルーティンかどうかを判定
      const isDaily = routine.repeat_type === 'daily';
      const isWeekly = routine.repeat_type === 'weekly' && routine.repeat_week_type?.includes(weekday);
  
      const alreadyGeneratedToday = last?.isSame(today, 'day');
  
      if ((isDaily || isWeekly) && !alreadyGeneratedToday) {
        // todos テーブルに追加
        const { data, error} = await supabase.from('todos').insert({
          text: routine.text,
          is_done: false,
          created_at: today.toISOString(),
          is_routine: true, // routinesから来たと分かるように
        }).select();

        if (error) {
          console.error('ルーティン追加エラー:', error);
          return;
        }
  
        await supabase
          .from('routine_tasks')
          .update({ updated_at: today.format('YYYY-MM-DD') })
          .eq('id', routine.id);

        setTodos(prev => [...prev, ...data]);
      }
    }
  };

  return (
    <div>
      <div className="p-6 space-y-6">

        {/* ヘッダー */}
        <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center rounded">
          <h1 className="text-2xl font-bold text-gray-800">TODOアプリ</h1>

          <div className="relative">
            <button
              onClick={() => setHeaderButtonOpen(!isHeaderButtonOpen)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
            >
              設定 ▼
            </button>

            {isHeaderButtonOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-lg z-10">
                <button
                  onClick={() => {
                    setHeaderButtonOpen(false);
                    setShowSettings(true);
                  }}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                >
                  設定を開く
                </button>
                <button
                  onClick={() => setHeaderButtonOpen(false)}
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-800"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>

        {/* タスク登録フォーム */}
        <div className="flex flex-col space-y-2">
            <label>タスク内容</label>
            <input
              className="border px-3 py-2 mr-4 w-full max-w-md"
              type="text"
              placeholder="やることを書く"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
    
            <label>タスク種別</label>
            <div className="flex gap-4">
              <label>
                <input
                  type="radio"
                  value="todo"
                  checked={taskType === 'todo'}
                  onChange={() => setTaskType('todo')}
                />
                通常TODO
              </label>
              <label>
                <input
                  type="radio"
                  value="routine"
                  checked={taskType === 'routine'}
                  onChange={() => setTaskType('routine')}
                />
                ルーティン
              </label>
              {taskType === 'routine' && (
                <>
                  <label>繰り返しタイプ</label>
                  <select value={repeatType} onChange={e => setRepeatType(e.target.value as 'daily' | 'weekly')}>
                    <option value="daily">毎日</option>
                    <option value="weekly">毎週</option>
                  </select>

                  {repeatType === 'weekly' && (
                    <div>
                      <label>曜日を選択</label>
                      {['日', '月', '火', '水', '木', '金', '土'].map((dayName, i) => (
                        <label key={i} style={{ marginRight: 8 }}>
                          <input
                            type="checkbox"
                            checked={repeatWeekType.includes(i)}
                            onChange={() => toggleDay(i)}
                          />
                          {dayName}
                        </label>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
    
            <label>実行日</label>
            <DatePicker
              selected={date}
              onChange={(date) => setDate(date)}
              className="border px-3 py-2 rounded"
              dateFormat="yyyy/MM/dd"
            />
    
            <button
              className="bg-blue-500 text-white px-3 py-2 rounded max-w-md mt-4 hover:bg-blue-600"
              onClick={addTodo}
            >
              追加
            </button>
        </div>

        {/* 日付グループごとに表示 */}
        {sortedDates.map(date => (
          <div key={date} className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">{dayjs(date).format('YYYY年MM月DD日')}</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-gray-600 font-semibold mb-2">未完了</h3>
                <ul className="space-y-2">
                  {groupedTodos[date]
                    .filter(todo => !todo.is_done)
                    .filter(todo => !todo.is_routine)
                    .map(todo => (
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
                    {groupedTodos[date].some(todo => !todo.is_done && todo.is_routine) && (
                      <hr className="my-4 border-t border-gray-300" />
                    )}
                    {groupedTodos[date]
                    .filter(todo => !todo.is_done)
                    .filter(todo => todo.is_routine)
                    .map(todo => (
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
              <div>
                <h3 className="text-gray-600 font-semibold mb-2">完了済み</h3>
                <ul className="space-y-2">
                  {groupedTodos[date]
                    .filter(todo => todo.is_done)
                    .filter(todo => !todo.is_routine)
                    .map(todo => (
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

                    {groupedTodos[date].some(todo => todo.is_done && todo.is_routine) && (
                      // <h4 className='text-gray-500 font-semibold mb-2'>ルーティンワーク</h4>
                      <hr className="my-4 border-t border-gray-300" />
                    )}
                    {groupedTodos[date]
                    .filter(todo => todo.is_done)
                    .filter(todo => todo.is_routine)
                    .map(todo => (
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
        ))}
      </div>

        {/* 設定モーダル */}
        <RoutineTaskManagerModal show={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
}

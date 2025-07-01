"use client";

import { supabase } from "../../lib/supabaseClient";
import { useEffect, useCallback, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { encryptText, decryptText } from "../components/CryptoJS";

type Props = {
  user_id: string;
  show: boolean;
  onClose: () => void;
};

type RoutineTask = {
  id: number;
  text: string;
  repeat_type: "daily" | "weekly" | null;
  repeat_week_type: number[] | null;
  user_id: string;
};

export default function RoutineTaskManagerModal({
  user_id,
  show,
  onClose,
}: Props) {
  const [tasks, setTasks] = useState<RoutineTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const WEEKDAYS_JP = ["日", "月", "火", "水", "木", "金", "土"];

  //ルーティンワークを取得
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("routine_tasks")
      .select("*")
      .eq("user_id", user_id)
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      // 複合化
      const decryptedData = (data as RoutineTask[]).map((task) => ({
        ...task,
        text: decryptText(task.text, user_id),
      }));
      setTasks(decryptedData);
    }
    setLoading(false);
  }, [user_id]);

  useEffect(() => {
    if (show) fetchTasks();
  }, [show, fetchTasks]);

  const handleDelete = async (id: number) => {
    const { error } = await supabase
      .from("routine_tasks")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      console.error("削除エラー:", error);
      return;
    }
    setTasks((tasks) => tasks.filter((task) => task.id !== id));
  };

  const handleUpdate = async (task: RoutineTask) => {
    const taskPlainText = task.text;
    //暗号化
    task.text = encryptText(task.text.trim(), user_id);
    const { error } = await supabase
      .from("routine_tasks")
      .update(task)
      .eq("id", task.id)
      .eq("user_id", user_id);
    setEditingTaskId(null);

    if (error) {
      console.error("更新エラー:", error);
      return;
    }

    setTasks((tasks) =>
      tasks.map((t) => (t.id == task.id ? { ...t, text: taskPlainText } : t))
    );
  };

  const toggleWeekday = (task: RoutineTask, day: number) => {
    if (!task.repeat_week_type) task.repeat_week_type = [];
    const updated = task.repeat_week_type.includes(day)
      ? task.repeat_week_type.filter((d) => d !== day)
      : [...task.repeat_week_type, day];
    return { ...task, repeat_week_type: updated };
  };

  const formatRepeat = (task: RoutineTask) => {
    if (task.repeat_type === "daily") return "毎日";
    if (task.repeat_type === "weekly" && task.repeat_week_type) {
      return task.repeat_week_type
        .sort((a, b) => a - b)
        .map((i) => WEEKDAYS_JP[i])
        .join("・");
    }
    return "なし";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white rounded-lg p-6 shadow-lg max-w-xl w-full relative text-gray-800 max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">ルーティンタスクの管理</h2>

            {loading ? (
              <p>読み込み中...</p>
            ) : (
              <div className="space-y-4">
                {tasks.map((task) =>
                  editingTaskId === task.id ? (
                    <div key={task.id} className="border p-4 rounded space-y-2">
                      <input
                        className="border px-2 py-1 w-full"
                        value={task.text}
                        onChange={(e) =>
                          setTasks((tasks) =>
                            tasks.map((task) =>
                              task.id === task.id
                                ? { ...task, text: e.target.value }
                                : task
                            )
                          )
                        }
                      />
                      <select
                        value={task.repeat_type || ""}
                        onChange={(e) =>
                          setTasks((prev) =>
                            prev.map((task) =>
                              task.id === task.id
                                ? {
                                    ...task,
                                    repeat_type: e.target.value as
                                      | "daily"
                                      | "weekly",
                                  }
                                : task
                            )
                          )
                        }
                      >
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                      </select>

                      {task.repeat_type === "weekly" && (
                        <div>
                          {WEEKDAYS_JP.map((d, i) => (
                            <label key={i} className="mr-2">
                              <input
                                type="checkbox"
                                checked={
                                  task.repeat_week_type?.includes(i) || false
                                }
                                onChange={() =>
                                  setTasks((prev) =>
                                    prev.map((t) =>
                                      t.id === task.id ? toggleWeekday(t, i) : t
                                    )
                                  )
                                }
                              />
                              {d}
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          className="bg-green-500 text-white px-3 py-1 rounded"
                          onClick={() => handleUpdate(task)}
                        >
                          保存
                        </button>
                        <button
                          className="text-gray-500 underline"
                          onClick={() => setEditingTaskId(null)}
                        >
                          キャンセル
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={task.id}
                      className="border p-4 rounded flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold">{task.text}</p>
                        <p className="text-sm text-gray-500">
                          繰り返し: {formatRepeat(task)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="text-blue-500 underline"
                          onClick={() => setEditingTaskId(task.id)}
                        >
                          編集
                        </button>
                        <button
                          className="text-red-500 underline"
                          onClick={() => handleDelete(task.id)}
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            <div className="text-right mt-6">
              <button onClick={onClose} className="text-gray-500 underline">
                閉じる
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

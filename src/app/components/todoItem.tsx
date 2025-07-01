"use client";
import React from "react";
import { useState } from "react";
import { Todo } from "../page";
import { supabase } from "../../lib/supabaseClient";
import { encryptText } from "./CryptoJS";

type TodoItemProps = {
  user_id: string;
  todo: Todo;
  setTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
};

export default function TodoItem({ user_id, todo, setTodos }: TodoItemProps) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [text, setText] = useState("");

  // TODO完了機能
  const toggleDone = async (id: number, currentStatus: boolean) => {
    console.log(id, currentStatus);
    const { data, error } = await supabase
      .from("todos")
      .update({ is_done: !currentStatus })
      .eq("id", id)
      .eq("user_id", user_id)
      .select();

    if (error) {
      console.error("更新エラー:", error);
      return;
    }

    if (data) {
      // 状態更新
      setTodos((prev) =>
        prev.map((todo) =>
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

    const encryptedText = encryptText(text.trim(), user_id);
    const { data, error } = await supabase
      .from("todos")
      .update({ text: encryptedText })
      .eq("id", editingId)
      .eq("user_id", user_id)
      .select();

    if (error) {
      console.error("更新エラー:", error);
      return;
    }

    if (data) {
      data[0].text = text.trim();
      setTodos((prev) =>
        prev.map((todo) => (todo.id === editingId ? data[0] : todo))
      );
      setText("");
      setEditingId(null);
    }
  };

  //削除機能
  const deleteTodo = async (id: number) => {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", user_id);

    if (error) {
      console.error("削除エラー:", error);
      return;
    }

    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <li className="flex items-center justify-between bg-white shadow-sm rounded p-3 border border-gray-200">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={todo.is_done}
          onChange={() => toggleDone(todo.id, todo.is_done)}
          className="w-4 h-4"
        />

        {editingId === todo.id ? (
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-gray-600"
            autoFocus
          />
        ) : (
          <span
            className={`${
              todo.is_done ? "line-through text-gray-400" : ""
            } text-base text-black`}
          >
            {todo.text}
          </span>
        )}
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

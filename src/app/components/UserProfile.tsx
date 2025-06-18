// components/UserProfile.tsx
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { User } from "@supabase/supabase-js";

type Props = {
  user: User;
  onClose: () => void;
};

export default function UserProfile({ user, onClose }: Props) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error(error);
      if (data?.user?.user_metadata?.username) {
        setUsername(data.user.user_metadata.username);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      data: { username },
    });

    if (error) {
      console.error("保存エラー:", error);
      alert("保存に失敗しました");
    } else {
      alert("プロフィールを更新しました");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          ユーザープロファイル
        </h2>
        <p className="mb-2 text-gray-600">メールアドレス: {user.email}</p>

        <label className="block text-sm mb-1">表示名</label>
        <input
          type="text"
          className="border px-3 py-2 w-full rounded"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <div className="mt-4 flex justify-between">
          <button
            className="bg-gray-400 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            閉じる
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}

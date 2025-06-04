"use client";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Session } from "@supabase/supabase-js";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);
    };
    init();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleEmailLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert("ログイン失敗: " + error.message);
  };

  const handleLoginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) console.error("ログインエラー:", error.message);
  };

  if (session) {
    return (
      <div className="p-4">
        <p>ログイン中: {session.user.email}</p>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
          }}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          ログアウト
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-4">ログイン</h1>

        <input
          type="email"
          className="border p-2 mb-2 w-full"
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="border p-2 mb-4 w-full"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleEmailLogin}
          className="bg-blue-500 text-white w-full py-2 rounded mb-4"
        >
          メールでログイン
        </button>

        <hr className="my-4" />

        <button
          onClick={handleLoginWithGoogle}
          className="bg-red-500 text-white w-full py-2 rounded"
        >
          Googleでログイン
        </button>
      </div>
    </div>
  );
}

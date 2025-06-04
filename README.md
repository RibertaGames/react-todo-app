# 📝 Todoアプリ - Next.js × Supabase × Vercel

## 📌 概要
シンプルかつ実用的なToDo管理アプリを、モダンな技術スタックで構築しました。  
ユーザーごとにログイン・タスク管理が可能で、認証・データ保存には **Supabase** を使用。  
**Vercel** により高速なデプロイと CI/CD 環境を実現しています。

---

## 🧰 使用技術

### 🔧 フロントエンド

| 技術              | バージョン     | 説明                                         |
|-------------------|----------------|----------------------------------------------|
| React             | 19.0.0         | UI構築。関数コンポーネント中心で構成        |
| Next.js           | 15.3.1         | ページルーティングやAPI構築に対応            |
| TypeScript        | 5.x            | 静的型付けで保守性・開発体験向上             |
| Tailwind CSS      | 4.x            | クラスユーティリティでの高速なUI構築         |
| Framer Motion     | 12.15.0        | アニメーションによる動的なUI表現             |
| React Datepicker  | 8.3.0          | 日付選択コンポーネント                        |
| Day.js            | 1.11.13        | 軽量な日付操作ライブラリ                      |

---

### 🗄️ バックエンド / インフラ

| 技術            | バージョン | 説明                                                                       |
|-----------------|------------|----------------------------------------------------------------------------|
| Supabase        | 最新       | Firebaseの代替となるBaaS。認証・DB管理・APIの統合                         |
| Supabase Auth   | -          | メールリンクを使ったユーザー認証（ログイン・登録）                         |
| PostgreSQL      | -          | Supabaseに内包。RLSでユーザーごとのデータ分離                             |
| Vercel          | -          | Git連携でのCI/CD、自動デプロイ、ホスティング対応                          |

---

## 🧾 データベース構成（PostgreSQL）

### `todos` テーブル

```sql
create table public.todos (
  id uuid not null default gen_random_uuid(),
  text text not null,
  created_at timestamp with time zone null default now(),
  is_done boolean null default false,
  is_routine boolean null default false,
  user_id uuid null,
  constraint todos_pkey primary key (id),
  constraint todos_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade
);
```

### `routine_tasks` テーブル

```sql
create table public.routine_tasks (
  id serial not null,
  text text not null,
  repeat_type text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  repeat_week_type integer[] null,
  user_id uuid null,
  constraint routine_tasks_pkey primary key (id),
  constraint routine_tasks_user_id_fkey foreign key (user_id) references auth.users(id),
  constraint routine_tasks_repeat_type_check check (
    repeat_type = any (array['daily'::text, 'weekly'::text])
  )
);
```
# ✦ Personal Todo App

A private, authenticated todo list with 2FA — built with Next.js, Supabase, and deployed on Vercel.

---

## 🗃️ Step 1 — Supabase Setup

### 1.1 Create a Supabase project
Go to https://supabase.com and create a new project.

### 1.2 Run this SQL in the Supabase SQL Editor

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Todos table
create table todos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  description text,
  completed boolean default false,
  priority text default 'medium',
  due_date date,
  category text,
  created_at timestamp with time zone default now()
);

-- Row Level Security (only YOU can see your todos)
alter table todos enable row level security;

create policy "Users can only access their own todos"
  on todos for all
  using (auth.uid() = user_id);
```

### 1.3 Configure Supabase Auth
1. Go to **Authentication → Providers** → Make sure **Email** is enabled
2. Go to **Authentication → Settings**:
   - Set **Site URL** to your Vercel domain (e.g. `https://my-todo.vercel.app`)
   - Enable **"Enable email OTP"** / **"Email OTP expiry"** (set to 600 seconds)
3. Go to **Authentication → Email Templates** — OTP is pre-configured ✅

### 1.4 Create your user account
In **Supabase → Authentication → Users**, click **"Invite user"** and add your email.
Then set your password via the invite link.

---

## 🚀 Step 2 — Deploy to Vercel

### 2.1 Push to GitHub
```bash
cd todo-app
git init
git add .
git commit -m "Initial commit: Personal Todo App"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

### 2.2 Import to Vercel
1. Go to https://vercel.com/new
2. Import your GitHub repo
3. **Before deploying**, go to **Environment Variables** and add:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your-anon-key` |

Find these in Supabase → **Settings → API**.

4. Click **Deploy** ✅

---

## 🔐 How Authentication Works

1. You enter your **email + password** on the login screen
2. A **6-digit OTP code** is sent to your email
3. You enter the OTP to complete sign-in (2FA)
4. Session is stored securely — you stay logged in

---

## 💻 Local Development

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase keys in .env.local
npm run dev
```

Open http://localhost:3000

---

## ✅ Features

- 🔐 Email + Password + OTP (2FA)
- ✅ Add / Edit / Delete / Complete todos
- 🔴🟡🟢 Priority levels
- 📅 Due dates with overdue detection
- 🏷️ Categories (Work, Personal, Shopping, etc.)
- 🔍 Search + Filter + Sort
- 📊 Progress stats dashboard
- ⌨️ Keyboard shortcut: Press `N` to add task
- 💾 Real-time Supabase backend
- 📱 Fully responsive

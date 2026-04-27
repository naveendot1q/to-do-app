"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { Todo, FilterType, SortType, Priority } from "@/lib/types";
import AddTodo from "@/components/AddTodo";
import TodoItem from "@/components/TodoItem";
import DateBrowser from "@/components/DateBrowser";
import InstallBanner from "@/components/InstallBanner";
import {
  LogOut, Search, SlidersHorizontal,
  CheckCircle2, Clock, AlertTriangle, LayoutList,
} from "lucide-react";

function toLocalDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function Dashboard() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("priority");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toLocalDateStr(new Date()));
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.push("/login"); return; }

      const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
        router.push("/verify-totp"); return;
      }
      if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal1") {
        router.push("/setup-totp"); return;
      }

      setUser({ email: session.user.email });
      fetchTodos(session.user.id);
    })();

    function onKey(e: KeyboardEvent) {
      if (e.key === "n" && !["INPUT", "TEXTAREA"].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        document.getElementById("add-todo-trigger")?.click();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function fetchTodos(userId: string) {
    const { data } = await supabase
      .from("todos").select("*").eq("user_id", userId)
      .order("created_at", { ascending: false });
    setTodos(data || []);
    setLoading(false);
  }

  async function addTodo(todo: {
    title: string; description?: string;
    priority: Priority; due_date?: string; category?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    // Auto-set due_date to selectedDate if none provided
    const due_date = todo.due_date || selectedDate || undefined;
    const { data } = await supabase
      .from("todos")
      .insert({ ...todo, due_date, user_id: session.user.id, completed: false })
      .select().single();
    if (data) setTodos((prev) => [data, ...prev]);
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t)));
  }

  async function deleteTodo(id: string) {
    await supabase.from("todos").delete().eq("id", id);
    setTimeout(() => { setTodos((prev) => prev.filter((t) => t.id !== id)); }, 300);
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    await supabase.from("todos").update(updates).eq("id", id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Task counts by date for dot indicators
  const taskCountsByDate: Record<string, { total: number; completed: number }> = {};
  todos.forEach((t) => {
    if (!t.due_date) return;
    if (!taskCountsByDate[t.due_date]) taskCountsByDate[t.due_date] = { total: 0, completed: 0 };
    taskCountsByDate[t.due_date].total++;
    if (t.completed) taskCountsByDate[t.due_date].completed++;
  });

  // Filter + sort
  const todayStr = toLocalDateStr(new Date());
  const filtered = todos
    .filter((t) => {
      // Date filter
      if (selectedDate) {
        if (t.due_date !== selectedDate) return false;
      }
      // Search
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      // Status filter
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      if (filter === "overdue")
        return !t.completed && t.due_date && new Date(t.due_date) < new Date(todayStr);
      return true;
    })
    .sort((a, b) => {
      if (sort === "priority") {
        const order = { high: 0, medium: 1, low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sort === "due_date") {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  // Stats (always from all todos)
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = todos.filter((t) => !t.completed).length;
  const overdue = todos.filter(
    (t) => !t.completed && t.due_date && new Date(t.due_date) < new Date(todayStr)
  ).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Today-specific stats
  const todayTasks = todos.filter((t) => t.due_date === todayStr);
  const todayDone = todayTasks.filter((t) => t.completed).length;
  const todayProgress = todayTasks.length > 0 ? Math.round((todayDone / todayTasks.length) * 100) : 0;
  const isViewingToday = selectedDate === todayStr;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
    { key: "overdue", label: "Overdue" },
  ];

  // Empty state message
  const emptyMessage = () => {
    if (selectedDate) {
      const isToday = selectedDate === todayStr;
      const label = isToday ? "today" : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (filter === "completed") return { emoji: "✨", title: `No completed tasks for ${label}`, sub: "" };
      if (filter === "active") return { emoji: "🎉", title: `No pending tasks for ${label}!`, sub: isToday ? "All caught up!" : "" };
      return { emoji: isToday ? "☀️" : "📅", title: `No tasks for ${label}`, sub: "Add one below" };
    }
    if (filter === "overdue") return { emoji: "🎉", title: "No overdue tasks!", sub: "" };
    if (filter === "completed") return { emoji: "✨", title: "No completed tasks yet", sub: "" };
    if (search) return { emoji: "🔍", title: "No tasks match your search", sub: "" };
    return { emoji: "📝", title: "No tasks yet", sub: "Press N to add one" };
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--obsidian)" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(232,197,71,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(232,197,71,0.02) 1px, transparent 1px)", backgroundSize: "80px 80px", pointerEvents: "none" }} />

      <div className="max-w-2xl mx-auto px-4 py-8 relative">

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--muted)", fontFamily: "'JetBrains Mono', monospace" }}>✦ PERSONAL WORKSPACE</p>
            <h1 className="text-3xl font-bold" style={{ fontFamily: "'Playfair Display', serif", color: "#fff" }}>
              {greeting()}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>{user?.email}</p>
          </div>
          <button onClick={handleLogout} className="btn-ghost flex items-center gap-2 text-sm">
            <LogOut size={14} /> Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { icon: LayoutList, label: "Total", value: total, color: "var(--soft)" },
            { icon: CheckCircle2, label: "Done", value: completed, color: "var(--success)" },
            { icon: Clock, label: "Pending", value: pending, color: "var(--accent)" },
            { icon: AlertTriangle, label: "Overdue", value: overdue, color: "var(--danger)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass rounded-xl p-3 text-center" style={{ background: "var(--card)" }}>
              <Icon size={16} className="mx-auto mb-1" style={{ color }} />
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-xs" style={{ color: "var(--muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Progress — shows today's if viewing today, else overall */}
        <div className="mb-6">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "var(--muted)" }}>
            <span>{isViewingToday ? `Today's progress · ${todayDone}/${todayTasks.length} tasks` : "Overall progress"}</span>
            <span style={{ color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
              {isViewingToday ? todayProgress : progress}%
            </span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${isViewingToday ? todayProgress : progress}%` }} />
          </div>
        </div>

        {/* Date Browser */}
        <DateBrowser
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          taskCountsByDate={taskCountsByDate}
        />

        {/* Search + Filters */}
        <div className="mb-4 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="input-field text-sm"
                style={{ paddingLeft: "2.25rem", paddingTop: "0.6rem", paddingBottom: "0.6rem" }}
                placeholder="Search tasks..."
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn-ghost flex items-center gap-1.5"
              style={{ borderColor: showFilters ? "var(--accent)" : undefined, color: showFilters ? "var(--accent)" : undefined }}
            >
              <SlidersHorizontal size={14} /> Filter
            </button>
          </div>

          {showFilters && (
            <div className="flex gap-2 flex-wrap animate-slide-down">
              <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--card)" }}>
                {filters.map((f) => (
                  <button
                    key={f.key} onClick={() => setFilter(f.key)}
                    className="text-xs px-3 py-1.5 rounded-md transition-all"
                    style={{
                      background: filter === f.key ? "var(--accent)" : "transparent",
                      color: filter === f.key ? "var(--obsidian)" : "var(--muted)",
                      fontWeight: filter === f.key ? 600 : 400,
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={sort} onChange={(e) => setSort(e.target.value as SortType)}
                className="input-field text-xs" style={{ padding: "0.4rem 0.75rem", width: "auto" }}
              >
                <option value="created_at">Sort: Newest</option>
                <option value="due_date">Sort: Due Date</option>
                <option value="priority">Sort: Priority</option>
              </select>
            </div>
          )}
        </div>

        {/* Add Todo */}
        <div className="mb-4" id="add-todo-trigger">
          <AddTodo onAdd={addTodo} selectedDate={selectedDate} />
        </div>

        {/* Todo List */}
        <div className="space-y-2">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer rounded-xl h-16" style={{ animationDelay: `${i * 0.1}s` }} />
            ))
          ) : filtered.length === 0 ? (
            (() => {
              const { emoji, title, sub } = emptyMessage();
              return (
                <div className="text-center py-16 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <p style={{ fontSize: "2.5rem" }}>{emoji}</p>
                  <p className="mt-3 font-medium" style={{ color: "var(--soft)" }}>{title}</p>
                  {sub && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>{sub}</p>}
                </div>
              );
            })()
          ) : (
            filtered.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} onUpdate={updateTodo} />
            ))
          )}
        </div>

        {filtered.length > 0 && (
          <p className="text-center text-xs mt-6" style={{ color: "var(--border)" }}>
            {filtered.length} task{filtered.length !== 1 ? "s" : ""} · Press N to add
          </p>
        )}
      </div>
      <InstallBanner />
    </div>
  );
}

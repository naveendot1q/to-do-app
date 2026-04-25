import { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/lib/supabase";
import { Todo, Priority } from "@/lib/types";
import { colors, fontSize, radius, spacing } from "@/lib/theme";
import DateBrowser from "@/components/DateBrowser";
import TodoItem from "@/components/TodoItem";
import AddTodoSheet from "@/components/AddTodoSheet";

function toLocalDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function DashboardScreen() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<{ email?: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(() => toLocalDateStr(new Date()));
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const [showAdd, setShowAdd] = useState(false);
  const router = useRouter();

  const todayStr = toLocalDateStr(new Date());

  useEffect(() => {
    init();
  }, []);

  async function init() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace("/login"); return; }

    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === "aal2" && aalData?.currentLevel !== "aal2") {
      router.replace("/verify-totp"); return;
    }
    if (aalData?.currentLevel === "aal1" && aalData?.nextLevel === "aal1") {
      router.replace("/setup-totp"); return;
    }

    setUser({ email: session.user.email });
    await fetchTodos(session.user.id);
  }

  async function fetchTodos(userId?: string) {
    if (!userId) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      userId = session.user.id;
    }
    const { data } = await supabase
      .from("todos").select("*").eq("user_id", userId)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });
    setTodos(data || []);
    setLoading(false);
    setRefreshing(false);
  }

  async function onRefresh() {
    setRefreshing(true);
    await fetchTodos();
  }

  async function addTodo(todo: {
    title: string; description?: string;
    priority: Priority; due_date?: string; category?: string;
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const due_date = todo.due_date || selectedDate || undefined;
    const { data } = await supabase
      .from("todos")
      .insert({ ...todo, due_date, user_id: session.user.id, completed: false })
      .select().single();
    if (data) setTodos((prev) => [data, ...prev]);
    setShowAdd(false);
  }

  async function toggleTodo(id: string, completed: boolean) {
    await supabase.from("todos").update({ completed: !completed }).eq("id", id);
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, completed: !completed } : t));
  }

  async function deleteTodo(id: string) {
    Alert.alert("Delete Task", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          await supabase.from("todos").delete().eq("id", id);
          setTodos((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  }

  async function updateTodo(id: string, updates: Partial<Todo>) {
    await supabase.from("todos").update(updates).eq("id", id);
    setTodos((prev) => prev.map((t) => t.id === id ? { ...t, ...updates } : t));
  }

  async function handleLogout() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => { await supabase.auth.signOut(); router.replace("/login"); },
      },
    ]);
  }

  // Task counts by date
  const taskCountsByDate: Record<string, { total: number; completed: number }> = {};
  todos.forEach((t) => {
    if (!t.due_date) return;
    if (!taskCountsByDate[t.due_date]) taskCountsByDate[t.due_date] = { total: 0, completed: 0 };
    taskCountsByDate[t.due_date].total++;
    if (t.completed) taskCountsByDate[t.due_date].completed++;
  });

  // Priority sort order
  const priorityOrder = { high: 0, medium: 1, low: 2 };

  // Filtered todos
  const filtered = todos
    .filter((t) => {
      if (selectedDate && t.due_date !== selectedDate) return false;
      const matchSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === "active") return !t.completed;
      if (filter === "completed") return t.completed;
      return true;
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Stats
  const total = todos.length;
  const completed = todos.filter((t) => t.completed).length;
  const pending = todos.filter((t) => !t.completed).length;
  const overdue = todos.filter(
    (t) => !t.completed && t.due_date && t.due_date < todayStr
  ).length;

  // Today progress
  const todayTasks = todos.filter((t) => t.due_date === todayStr);
  const todayDone = todayTasks.filter((t) => t.completed).length;
  const todayPct = todayTasks.length > 0 ? todayDone / todayTasks.length : 0;
  const isViewingToday = selectedDate === todayStr;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.badge}>✦ PERSONAL WORKSPACE</Text>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.muted} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: total, color: colors.soft, icon: "list-outline" },
            { label: "Done", value: completed, color: colors.success, icon: "checkmark-circle-outline" },
            { label: "Pending", value: pending, color: colors.accent, icon: "time-outline" },
            { label: "Overdue", value: overdue, color: colors.danger, icon: "alert-circle-outline" },
          ].map(({ label, value, color, icon }) => (
            <View key={label} style={styles.statCard}>
              <Ionicons name={icon as any} size={16} color={color} />
              <Text style={[styles.statValue, { color }]}>{value}</Text>
              <Text style={styles.statLabel}>{label}</Text>
            </View>
          ))}
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {isViewingToday ? `Today · ${todayDone}/${todayTasks.length} tasks` : "Overall progress"}
            </Text>
            <Text style={styles.progressPct}>
              {Math.round((isViewingToday ? todayPct : (total > 0 ? completed / total : 0)) * 100)}%
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, {
              width: `${Math.round((isViewingToday ? todayPct : (total > 0 ? completed / total : 0)) * 100)}%`
            }]} />
          </View>
        </View>

        {/* Date Browser */}
        <DateBrowser
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          taskCountsByDate={taskCountsByDate}
          todayStr={todayStr}
        />

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={16} color={colors.muted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search tasks..."
            placeholderTextColor={colors.muted}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={colors.muted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          {(["all", "active", "completed"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[styles.filterTab, filter === f && styles.filterTabActive]}
            >
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                {f === "all" ? "All" : f === "active" ? "Active" : "Done"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Todo List */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyEmoji}>
              {filter === "completed" ? "✨" : isViewingToday ? "☀️" : "📝"}
            </Text>
            <Text style={styles.emptyTitle}>
              {filter === "completed" ? "No completed tasks" : isViewingToday ? "No tasks for today" : "No tasks found"}
            </Text>
            <Text style={styles.emptySubtitle}>
              {filter === "all" && !search ? "Tap + to add a task" : ""}
            </Text>
          </View>
        ) : (
          filtered.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
              onUpdate={updateTodo}
            />
          ))
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color={colors.obsidian} />
      </TouchableOpacity>

      {/* Add Todo Sheet */}
      <AddTodoSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTodo}
        selectedDate={selectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.obsidian },
  center: { flex: 1, backgroundColor: colors.obsidian, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.lg, paddingTop: 56 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: spacing.lg },
  badge: { fontSize: 10, color: colors.muted, letterSpacing: 1, marginBottom: 2, fontFamily: "monospace" },
  greeting: { fontSize: fontSize.xxl, fontWeight: "700", color: colors.white },
  email: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
  logoutBtn: {
    width: 40, height: 40, borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, alignItems: "center", gap: 2,
  },
  statValue: { fontSize: fontSize.lg, fontWeight: "700" },
  statLabel: { fontSize: 10, color: colors.muted },
  progressWrap: { marginBottom: spacing.lg },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressLabel: { fontSize: fontSize.xs, color: colors.muted },
  progressPct: { fontSize: fontSize.xs, color: colors.accent, fontFamily: "monospace" },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.accent, borderRadius: radius.full },
  searchWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, marginBottom: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: { flex: 1, color: colors.soft, fontSize: fontSize.sm, paddingVertical: spacing.md },
  filterRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  filterTab: {
    flex: 1, paddingVertical: spacing.sm, borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center",
  },
  filterTabActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterTabText: { fontSize: fontSize.sm, color: colors.muted, fontWeight: "500" },
  filterTabTextActive: { color: colors.obsidian, fontWeight: "700" },
  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyEmoji: { fontSize: 40, marginBottom: spacing.md },
  emptyTitle: { fontSize: fontSize.md, color: colors.soft, fontWeight: "600" },
  emptySubtitle: { fontSize: fontSize.sm, color: colors.muted, marginTop: 4 },
  fab: {
    position: "absolute", bottom: 32, right: spacing.lg,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: colors.accent,
    alignItems: "center", justifyContent: "center",
    shadowColor: colors.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
});

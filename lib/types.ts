export type Priority = "high" | "medium" | "low";

export interface Todo {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: Priority;
  due_date?: string;
  start_time?: string; // "HH:MM"
  end_time?: string;   // "HH:MM"
  category?: string;
  created_at: string;
}

export type FilterType = "all" | "active" | "completed" | "overdue";
export type SortType = "created_at" | "due_date" | "priority" | "start_time";

export type AppMood = "calm" | "warning" | "critical" | "success";

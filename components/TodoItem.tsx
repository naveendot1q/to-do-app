"use client";

import { useState } from "react";
import { Trash2, Pencil, Check, X, Calendar, Tag } from "lucide-react";
import { Todo, Priority } from "@/lib/types";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
}

const priorityConfig = {
  high: { label: "High", dot: "#ff4757", class: "priority-high" },
  medium: { label: "Med", dot: "#ffa502", class: "priority-medium" },
  low: { label: "Low", dot: "#2ed573", class: "priority-low" },
};

function isOverdue(dueDate?: string) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description || "");
  const [deleting, setDeleting] = useState(false);

  const overdue = isOverdue(todo.due_date) && !todo.completed;
  const pc = priorityConfig[todo.priority];

  function handleSave() {
    if (!editTitle.trim()) return;
    onUpdate(todo.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
    });
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    await onDelete(todo.id);
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }

  return (
    <div
      className={`todo-card ${todo.completed ? "completed" : ""} animate-fade-in`}
      style={{
        opacity: deleting ? 0 : undefined,
        transition: "opacity 0.3s, transform 0.2s, border-color 0.2s, box-shadow 0.2s",
        borderLeft: `3px solid ${pc.dot}`,
      }}
    >
      {editing ? (
        <div className="space-y-2">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="input-field text-sm"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
          />
          <textarea
            value={editDesc}
            onChange={(e) => setEditDesc(e.target.value)}
            className="input-field text-sm resize-none"
            rows={2}
            placeholder="Description..."
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <Check size={12} /> Save
            </button>
            <button
              onClick={() => setEditing(false)}
              className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
            >
              <X size={12} /> Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggle(todo.id, todo.completed)}
            className="custom-checkbox mt-0.5"
          />

          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-medium leading-snug"
              style={{
                color: todo.completed ? "var(--muted)" : "var(--soft)",
                textDecoration: todo.completed ? "line-through" : "none",
              }}
            >
              {todo.title}
            </p>

            {todo.description && (
              <p
                className="text-xs mt-0.5 leading-relaxed"
                style={{ color: "var(--muted)" }}
              >
                {todo.description}
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {/* Priority badge */}
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${pc.class}`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {pc.label}
              </span>

              {/* Category */}
              {todo.category && (
                <span className="tag-pill flex items-center gap-1">
                  <Tag size={9} />
                  {todo.category}
                </span>
              )}

              {/* Due date */}
              {todo.due_date && (
                <span
                  className="text-xs flex items-center gap-1"
                  style={{ color: overdue ? "var(--danger)" : "var(--muted)" }}
                >
                  <Calendar size={10} />
                  {overdue ? "Overdue · " : ""}
                  {formatDate(todo.due_date)}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
            style={{ opacity: 1 }}
          >
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: "var(--muted)" }}
              title="Edit"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
              style={{ color: "var(--muted)" }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

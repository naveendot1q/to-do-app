import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Todo } from "@/lib/types";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
}

const priorityConfig = {
  high:   { label: "High",   color: colors.danger,        dot: colors.priorityHigh },
  medium: { label: "Med",    color: colors.warning,       dot: colors.priorityMedium },
  low:    { label: "Low",    color: colors.success,       dot: colors.priorityLow },
};

function isOverdue(dueDate?: string, completed?: boolean) {
  if (!dueDate || completed) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate + "T00:00:00") < today;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDesc, setEditDesc] = useState(todo.description || "");

  const pc = priorityConfig[todo.priority];
  const overdue = isOverdue(todo.due_date, todo.completed);

  function saveEdit() {
    if (!editTitle.trim()) return;
    onUpdate(todo.id, { title: editTitle.trim(), description: editDesc.trim() || undefined });
    setEditing(false);
  }

  function formatDate(d: string) {
    return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <View style={[styles.card, todo.completed && styles.cardDone, { borderLeftColor: pc.dot }]}>
      {editing ? (
        <View>
          <TextInput
            style={styles.editInput}
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
            onSubmitEditing={saveEdit}
          />
          <TextInput
            style={[styles.editInput, styles.editDesc]}
            value={editDesc}
            onChangeText={setEditDesc}
            placeholder="Description..."
            placeholderTextColor={colors.muted}
            multiline
          />
          <View style={styles.editActions}>
            <TouchableOpacity onPress={saveEdit} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.row}>
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => onToggle(todo.id, todo.completed)}
            style={[styles.checkbox, todo.completed && styles.checkboxDone]}
            activeOpacity={0.7}
          >
            {todo.completed && <Ionicons name="checkmark" size={12} color={colors.obsidian} />}
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.title, todo.completed && styles.titleDone]} numberOfLines={2}>
              {todo.title}
            </Text>
            {todo.description ? (
              <Text style={styles.desc} numberOfLines={1}>{todo.description}</Text>
            ) : null}

            {/* Meta */}
            <View style={styles.meta}>
              <View style={[styles.priorityBadge, { backgroundColor: `${pc.dot}18`, borderColor: `${pc.dot}30` }]}>
                <Text style={[styles.priorityText, { color: pc.color }]}>{pc.label}</Text>
              </View>
              {todo.category ? (
                <View style={styles.tag}>
                  <Ionicons name="pricetag-outline" size={9} color={colors.muted} />
                  <Text style={styles.tagText}>{todo.category}</Text>
                </View>
              ) : null}
              {todo.due_date ? (
                <View style={styles.dateTag}>
                  <Ionicons name="calendar-outline" size={9} color={overdue ? colors.danger : colors.muted} />
                  <Text style={[styles.dateText, overdue && styles.dateTextOverdue]}>
                    {overdue ? "Overdue · " : ""}{formatDate(todo.due_date)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={15} color={colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(todo.id)} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={15} color={colors.muted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    borderLeftWidth: 3,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardDone: { opacity: 0.5 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  checkbox: {
    width: 20, height: 20, borderRadius: 6,
    borderWidth: 2, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
    marginTop: 2, flexShrink: 0,
  },
  checkboxDone: { backgroundColor: colors.accent, borderColor: colors.accent },
  content: { flex: 1 },
  title: { fontSize: fontSize.sm, fontWeight: "500", color: colors.soft, lineHeight: 20 },
  titleDone: { textDecorationLine: "line-through", color: colors.muted },
  desc: { fontSize: fontSize.xs, color: colors.muted, marginTop: 2 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  priorityBadge: {
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: radius.full, borderWidth: 1,
  },
  priorityText: { fontSize: 10, fontWeight: "600", fontFamily: "monospace" },
  tag: { flexDirection: "row", alignItems: "center", gap: 3 },
  tagText: { fontSize: 10, color: colors.muted },
  dateTag: { flexDirection: "row", alignItems: "center", gap: 3 },
  dateText: { fontSize: 10, color: colors.muted },
  dateTextOverdue: { color: colors.danger },
  actions: { flexDirection: "column", gap: spacing.xs },
  actionBtn: { padding: 4 },
  editInput: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.sm, padding: spacing.sm,
    color: colors.soft, fontSize: fontSize.sm, marginBottom: spacing.sm,
  },
  editDesc: { minHeight: 50, textAlignVertical: "top" },
  editActions: { flexDirection: "row", gap: spacing.sm },
  saveBtn: {
    flex: 1, backgroundColor: colors.accent,
    borderRadius: radius.sm, padding: spacing.sm, alignItems: "center",
  },
  saveBtnText: { color: colors.obsidian, fontWeight: "700", fontSize: fontSize.xs },
  cancelBtn: {
    flex: 1, backgroundColor: colors.surface,
    borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border,
    padding: spacing.sm, alignItems: "center",
  },
  cancelBtnText: { color: colors.muted, fontSize: fontSize.xs },
});

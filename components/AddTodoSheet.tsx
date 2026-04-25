import { useState, useEffect } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Modal, KeyboardAvoidingView, Platform, ScrollView, Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Priority } from "@/lib/types";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

interface AddTodoSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (todo: {
    title: string; description?: string;
    priority: Priority; due_date?: string; category?: string;
  }) => void;
  selectedDate: string | null;
}

const CATEGORIES = ["Work", "Personal", "Shopping", "Health", "Learning", "Other"];
const PRIORITIES: { key: Priority; label: string; color: string }[] = [
  { key: "high",   label: "🔴 High",   color: colors.danger },
  { key: "medium", label: "🟡 Medium", color: colors.warning },
  { key: "low",    label: "🟢 Low",    color: colors.success },
];

export default function AddTodoSheet({ visible, onClose, onAdd, selectedDate }: AddTodoSheetProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (visible) {
      setDueDate(selectedDate || "");
    }
  }, [visible, selectedDate]);

  function handleAdd() {
    if (!title.trim()) return;
    onAdd({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      due_date: dueDate || undefined,
      category: category || undefined,
    });
    reset();
  }

  function reset() {
    setTitle("");
    setDescription("");
    setPriority("medium");
    setDueDate(selectedDate || "");
    setCategory("");
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={styles.backdrop} onPress={handleClose} />
      <KeyboardAvoidingView
        style={styles.sheetWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>New Task</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="What needs to be done?"
              placeholderTextColor={colors.muted}
              autoFocus
            />

            {/* Description */}
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Add a description (optional)"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />

            {/* Priority */}
            <Text style={styles.fieldLabel}>Priority</Text>
            <View style={styles.priorityRow}>
              {PRIORITIES.map((p) => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setPriority(p.key)}
                  style={[styles.priorityBtn, priority === p.key && { borderColor: p.color, backgroundColor: `${p.color}15` }]}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.priorityBtnText, priority === p.key && { color: p.color }]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Due Date */}
            <Text style={styles.fieldLabel}>Due Date</Text>
            <TextInput
              style={styles.input}
              value={dueDate}
              onChangeText={(v) => setDueDate(v)}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              <TouchableOpacity
                onPress={() => setCategory("")}
                style={[styles.catChip, !category && styles.catChipActive]}
              >
                <Text style={[styles.catChipText, !category && styles.catChipTextActive]}>None</Text>
              </TouchableOpacity>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setCategory(c)}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Submit */}
            <TouchableOpacity
              style={[styles.addBtn, !title.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!title.trim()}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={18} color={colors.obsidian} />
              <Text style={styles.addBtnText}>Add Task</Text>
            </TouchableOpacity>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },
  sheetWrap: { position: "absolute", bottom: 0, left: 0, right: 0 },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, borderColor: colors.border,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.md,
  },
  sheetHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.lg },
  sheetTitle: { fontSize: fontSize.lg, fontWeight: "700", color: colors.white },
  closeBtn: {
    width: 32, height: 32, borderRadius: radius.sm,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.md,
    color: colors.soft, fontSize: fontSize.base,
    marginBottom: spacing.md,
  },
  textArea: { minHeight: 60 },
  fieldLabel: { fontSize: fontSize.xs, color: colors.muted, marginBottom: spacing.xs },
  priorityRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  priorityBtn: {
    flex: 1, padding: spacing.sm, borderRadius: radius.sm,
    borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, alignItems: "center",
  },
  priorityBtnText: { fontSize: fontSize.xs, color: colors.muted, fontWeight: "500" },
  catScroll: { marginBottom: spacing.md },
  catChip: {
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: radius.full, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.surface, marginRight: spacing.sm,
  },
  catChipActive: { borderColor: colors.accent, backgroundColor: "rgba(232,197,71,0.1)" },
  catChipText: { fontSize: fontSize.xs, color: colors.muted },
  catChipTextActive: { color: colors.accent, fontWeight: "600" },
  addBtn: {
    backgroundColor: colors.accent, borderRadius: radius.md,
    padding: spacing.md, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: spacing.sm, marginTop: spacing.sm,
  },
  addBtnDisabled: { backgroundColor: colors.muted },
  addBtnText: { color: colors.obsidian, fontWeight: "700", fontSize: fontSize.base },
});

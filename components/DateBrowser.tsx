import { useState, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, fontSize, radius, spacing } from "@/lib/theme";

interface DateBrowserProps {
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
  taskCountsByDate: Record<string, { total: number; completed: number }>;
  todayStr: string;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toStr(d);
}

function toStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMondayOf(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  d.setDate(d.getDate() - ((day + 6) % 7));
  return toStr(d);
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function DateBrowser({ selectedDate, onDateSelect, taskCountsByDate, todayStr }: DateBrowserProps) {
  const [weekMonday, setWeekMonday] = useState(() => getMondayOf(todayStr));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekMonday, i));

  const monthsInWeek = Array.from(new Set(days.map((d) => {
    const dt = new Date(d + "T00:00:00");
    return `${MONTH_NAMES[dt.getMonth()]} ${dt.getFullYear()}`;
  })));
  const headerLabel = monthsInWeek.join(" / ");

  function prevWeek() { setWeekMonday((w) => addDays(w, -7)); }
  function nextWeek() { setWeekMonday((w) => addDays(w, 7)); }

  function jumpToToday() {
    setWeekMonday(getMondayOf(todayStr));
    onDateSelect(todayStr);
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="calendar-outline" size={13} color={colors.accent} />
          <Text style={styles.monthLabel}>{headerLabel}</Text>
        </View>
        <View style={styles.headerRight}>
          {selectedDate !== todayStr && (
            <TouchableOpacity onPress={jumpToToday} style={styles.todayBtn}>
              <Text style={styles.todayBtnText}>Today</Text>
            </TouchableOpacity>
          )}
          {selectedDate !== null && (
            <TouchableOpacity onPress={() => onDateSelect(null)} style={styles.allBtn}>
              <Text style={styles.allBtnText}>All</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={16} color={colors.muted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={nextWeek} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {days.map((dateStr, i) => {
          const dt = new Date(dateStr + "T00:00:00");
          const today = new Date(todayStr + "T00:00:00");
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isPast = dt < today;
          const counts = taskCountsByDate[dateStr];
          const hasTasks = counts && counts.total > 0;
          const allDone = hasTasks && counts.completed === counts.total;

          return (
            <TouchableOpacity
              key={dateStr}
              style={[
                styles.dayCell,
                isSelected && styles.dayCellSelected,
                isToday && !isSelected && styles.dayCellToday,
                i < 6 && styles.dayCellBorder,
              ]}
              onPress={() => onDateSelect(isSelected ? null : dateStr)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dayLabel,
                isSelected && styles.dayLabelSelected,
                isToday && !isSelected && styles.dayLabelToday,
                isPast && !isSelected && !isToday && styles.dayLabelPast,
              ]}>
                {DAY_LABELS[dt.getDay()]}
              </Text>

              <View style={[
                styles.dateCircle,
                isSelected && styles.dateCircleSelected,
                isToday && !isSelected && styles.dateCircleToday,
              ]}>
                <Text style={[
                  styles.dateNum,
                  isSelected && styles.dateNumSelected,
                  isToday && !isSelected && styles.dateNumToday,
                  isPast && !isSelected && !isToday && styles.dateNumPast,
                ]}>
                  {dt.getDate()}
                </Text>
              </View>

              <View style={styles.dotRow}>
                {hasTasks ? (
                  allDone ? (
                    <Text style={styles.checkMark}>✓</Text>
                  ) : (
                    Array.from({ length: Math.min(counts.total - counts.completed, 3) }).map((_, j) => (
                      <View key={j} style={[styles.dot, isSelected && styles.dotSelected]} />
                    ))
                  )
                ) : <View style={styles.dotPlaceholder} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date label */}
      {selectedDate && (
        <View style={styles.selectedLabel}>
          <View style={styles.divider} />
          <Text style={styles.selectedText}>
            {selectedDate === todayStr ? "Today"
              : selectedDate === addDays(todayStr, 1) ? "Tomorrow"
              : selectedDate === addDays(todayStr, -1) ? "Yesterday"
              : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long", month: "long", day: "numeric"
                })}
          </Text>
          <View style={styles.divider} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.lg },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  monthLabel: { fontSize: fontSize.sm, color: colors.soft, fontWeight: "500" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  todayBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    backgroundColor: "rgba(232,197,71,0.1)", borderWidth: 1, borderColor: "rgba(232,197,71,0.25)",
  },
  todayBtnText: { fontSize: fontSize.xs, color: colors.accent, fontWeight: "600" },
  allBtn: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.full,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  allBtnText: { fontSize: fontSize.xs, color: colors.muted },
  navBtn: {
    width: 28, height: 28, borderRadius: radius.sm,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    alignItems: "center", justifyContent: "center",
  },
  weekStrip: {
    flexDirection: "row",
    backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border,
    overflow: "hidden",
  },
  dayCell: {
    flex: 1, paddingVertical: 10, alignItems: "center", gap: 4,
    backgroundColor: "transparent",
  },
  dayCellSelected: { backgroundColor: "rgba(232,197,71,0.12)" },
  dayCellToday: { backgroundColor: "rgba(232,197,71,0.04)" },
  dayCellBorder: { borderRightWidth: 1, borderRightColor: colors.border },
  dayLabel: { fontSize: 9, color: colors.muted, fontFamily: "monospace", letterSpacing: 0.5 },
  dayLabelSelected: { color: colors.accent },
  dayLabelToday: { color: colors.accent },
  dayLabelPast: { color: colors.border },
  dateCircle: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  dateCircleSelected: { backgroundColor: colors.accent },
  dateCircleToday: { backgroundColor: "rgba(232,197,71,0.15)", borderWidth: 1, borderColor: "rgba(232,197,71,0.4)" },
  dateNum: { fontSize: fontSize.sm, fontWeight: "600", color: colors.soft },
  dateNumSelected: { color: colors.obsidian },
  dateNumToday: { color: colors.accent },
  dateNumPast: { color: colors.border },
  dotRow: { height: 8, flexDirection: "row", alignItems: "center", gap: 2 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.muted },
  dotSelected: { backgroundColor: colors.accent },
  dotPlaceholder: { width: 4, height: 4 },
  checkMark: { fontSize: 9, color: colors.success },
  selectedLabel: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  divider: { flex: 1, height: 1, backgroundColor: colors.border },
  selectedText: { fontSize: fontSize.xs, color: colors.muted },
});

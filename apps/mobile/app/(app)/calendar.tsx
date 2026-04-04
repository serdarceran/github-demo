import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { createGoalsApi } from '@goal-tracker/api-client';
import type { Goal } from '@goal-tracker/types';
import {
  buildCalendarGrid,
  getDaySummary,
  MONTH_NAMES,
  DAY_NAMES_SHORT,
  DaySummary,
  DayOverallStatus,
} from '@goal-tracker/core';
import { useApiClient, useAuthStore } from '../../stores/authStore';
import { ScreenContainer } from '../../components/ui';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';

// ─── colour maps ────────────────────────────────────────────────────────────

const cellBg: Record<DayOverallStatus, string> = {
  'all-met':    Colors.success[500] + '33',
  'partial':    Colors.amber[500]   + '33',
  'all-missed': Colors.danger[500]  + '33',
  'future':     Colors.bg.card,
  'no-goals':   Colors.bg.card,
};

const cellDot: Record<DayOverallStatus, string | null> = {
  'all-met':    Colors.success[400],
  'partial':    Colors.amber[400],
  'all-missed': Colors.danger[400],
  'future':     null,
  'no-goals':   null,
};

const entryDot: Record<string, string> = {
  met:          Colors.success[400],
  missed:       Colors.danger[400],
  'not-logged': Colors.danger[400],
  future:       Colors.neutral[700],
};

// ─── DayCell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  dateStr: string | null;
  summary?: DaySummary;
  onPress?: () => void;
}

function DayCell({ dateStr, summary, onPress }: DayCellProps) {
  const todayStr = new Date().toISOString().split('T')[0];

  if (!dateStr) return <View style={styles.cellEmpty} />;

  const isToday = dateStr === todayStr;
  const dayNum = parseInt(dateStr.split('-')[2], 10);
  const status = summary?.overallStatus ?? 'no-goals';
  const dot = cellDot[status];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.cell,
        { backgroundColor: cellBg[status] },
        isToday && styles.cellToday,
        pressed && styles.cellPressed,
      ]}
    >
      <Text style={[styles.cellDay, isToday && styles.cellDayToday]}>{dayNum}</Text>
      {dot && <View style={[styles.cellDot, { backgroundColor: dot }]} />}
    </Pressable>
  );
}

// ─── DayDetailSheet ──────────────────────────────────────────────────────────

interface DayDetailSheetProps {
  summary: DaySummary | null;
  onClose: () => void;
}

function DayDetailSheet({ summary, onClose }: DayDetailSheetProps) {
  if (!summary) return null;

  const [y, m, d] = summary.date.split('-').map(Number);
  const displayDate = new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = summary.date === todayStr;
  const metCount = summary.entries.filter((e) => e.status === 'met').length;

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            {isToday && <Text style={styles.sheetTodayTag}>TODAY</Text>}
            <Text style={styles.sheetDate}>{displayDate}</Text>
            {summary.entries.length > 0 && summary.overallStatus !== 'future' && (
              <Text style={styles.sheetSubtitle}>
                {metCount} / {summary.entries.length} goals met
              </Text>
            )}
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={styles.sheetClose}>
            <Ionicons name="close" size={22} color={Colors.neutral[400]} />
          </Pressable>
        </View>

        {/* Entries */}
        <ScrollView
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {summary.entries.length === 0 ? (
            <Text style={styles.sheetEmpty}>No goals were active on this day.</Text>
          ) : (
            summary.entries.map((entry) => (
              <View key={entry.goal.id} style={styles.entryRow}>
                <View
                  style={[
                    styles.entryDot,
                    { backgroundColor: entryDot[entry.status] ?? Colors.neutral[700] },
                  ]}
                />
                <View style={styles.entryText}>
                  <Text style={styles.entryName}>{entry.goal.name}</Text>
                  {entry.log ? (
                    <Text style={styles.entryLog}>
                      {entry.log.value} / {entry.log.required} {entry.goal.unit}
                      {entry.log.missed && (
                        <Text style={styles.entryMissed}> · missed</Text>
                      )}
                    </Text>
                  ) : entry.status === 'future' ? (
                    <Text style={styles.entryFuture}>Not yet reached</Text>
                  ) : (
                    <Text style={styles.entryNoLog}>No entry recorded</Text>
                  )}
                </View>
                <Ionicons
                  name={
                    entry.status === 'met' ? 'checkmark-circle' :
                    entry.status === 'future' ? 'time-outline' : 'close-circle'
                  }
                  size={20}
                  color={
                    entry.status === 'met' ? Colors.success[400] :
                    entry.status === 'future' ? Colors.neutral[500] : Colors.danger[400]
                  }
                />
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── CalendarScreen ───────────────────────────────────────────────────────────

export default function CalendarScreen() {
  const client = useApiClient();
  const token = useAuthStore((s) => s.token);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: goals = [], isLoading } = useQuery<Goal[]>({
    queryKey: ['goals', token],
    queryFn: () => createGoalsApi(client).list(),
    enabled: !!token,
  });

  const grid = useMemo(
    () => buildCalendarGrid(viewYear, viewMonth),
    [viewYear, viewMonth],
  );

  const selectedSummary = useMemo(
    () => (selectedDate ? getDaySummary(selectedDate, goals) : null),
    [selectedDate, goals],
  );

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
    else setViewMonth((m) => m + 1);
  };
  const jumpToday = () => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        {/* ── Top nav ── */}
        <View style={styles.topNav}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={24} color={Colors.neutral.white} />
          </Pressable>
          <Text style={styles.screenTitle}>CALENDAR</Text>
          <Pressable onPress={jumpToday} hitSlop={12} style={styles.todayBtn}>
            <Text style={styles.todayBtnText}>TODAY</Text>
          </Pressable>
        </View>

        {/* ── Month navigation ── */}
        <View style={styles.monthNav}>
          <Pressable onPress={prevMonth} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={22} color={Colors.neutral[400]} />
          </Pressable>
          <Text style={styles.monthLabel}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <Pressable onPress={nextMonth} hitSlop={12} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={22} color={Colors.neutral[400]} />
          </Pressable>
        </View>

        {/* ── Weekday headers ── */}
        <View style={styles.weekRow}>
          {DAY_NAMES_SHORT.map((name) => (
            <Text key={name} style={styles.weekLabel}>
              {name[0]}
            </Text>
          ))}
        </View>

        {/* ── Grid ── */}
        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={Colors.amber[500]} />
          </View>
        ) : (
          <FlatList
            data={grid}
            keyExtractor={(item, i) => item ?? `pad-${i}`}
            numColumns={7}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <DayCell
                dateStr={item}
                summary={item ? getDaySummary(item, goals) : undefined}
                onPress={item ? () => setSelectedDate(item) : undefined}
              />
            )}
            contentContainerStyle={styles.gridContainer}
          />
        )}

        {/* ── Legend ── */}
        <View style={styles.legend}>
          <LegendDot color={Colors.success[400]} label="All met" />
          <LegendDot color={Colors.amber[400]}   label="Partial" />
          <LegendDot color={Colors.danger[400]}  label="Missed" />
          <View style={styles.legendTodayItem}>
            <View style={styles.legendTodayRing} />
            <Text style={styles.legendLabel}>Today</Text>
          </View>
        </View>
      </View>

      <DayDetailSheet
        summary={selectedSummary}
        onClose={() => setSelectedDate(null)}
      />
    </ScreenContainer>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CELL_SIZE = 44;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Spacing.screen.vertical,
  },

  // Top nav
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  navBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
  },
  todayBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.amber[500],
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtnText: {
    ...Typography.body.label,
    color: Colors.amber[500],
  },

  // Month nav
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  monthLabel: {
    ...Typography.body.lgBold,
    color: Colors.neutral.white,
  },

  // Weekday headers
  weekRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    ...Typography.body.label,
    color: Colors.neutral[500],
  },

  // Grid
  gridContainer: {
    gap: 4,
  },

  // Day cell
  cell: {
    flex: 1,
    height: CELL_SIZE,
    margin: 2,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cellEmpty: {
    flex: 1,
    height: CELL_SIZE,
    margin: 2,
  },
  cellToday: {
    borderWidth: 2,
    borderColor: Colors.amber[500],
  },
  cellPressed: {
    opacity: 0.7,
  },
  cellDay: {
    ...Typography.body.smBold,
    color: Colors.neutral.white,
  },
  cellDayToday: {
    color: Colors.amber[400],
  },
  cellDot: {
    position: 'absolute',
    bottom: 4,
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Legend
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.bg.card,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    ...Typography.body.xs,
    color: Colors.neutral[500],
  },
  legendTodayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendTodayRing: {
    width: 12,
    height: 12,
    borderRadius: BorderRadius.sm,
    borderWidth: 2,
    borderColor: Colors.amber[500],
  },

  // Loading
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },

  // Bottom sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: Colors.bg.card,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingBottom: Spacing.xxl,
    maxHeight: '75%',
    ...Shadows.subtle,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.neutral[700],
    alignSelf: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen.horizontal,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.base,
  },
  sheetTodayTag: {
    ...Typography.body.label,
    color: Colors.amber[500],
    marginBottom: Spacing.xs,
  },
  sheetDate: {
    ...Typography.body.lgBold,
    color: Colors.neutral.white,
  },
  sheetSubtitle: {
    ...Typography.body.sm,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  sheetClose: {
    padding: Spacing.xs,
    marginTop: 2,
  },
  sheetScroll: {
    flexGrow: 0,
  },
  sheetScrollContent: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Spacing.md,
  },
  sheetEmpty: {
    ...Typography.body.md,
    color: Colors.neutral[500],
    textAlign: 'center',
    paddingVertical: Spacing.xl,
  },

  // Entry rows
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bg.base,
  },
  entryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  entryText: {
    flex: 1,
  },
  entryName: {
    ...Typography.body.smBold,
    color: Colors.neutral.white,
  },
  entryLog: {
    ...Typography.body.xs,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  entryMissed: {
    color: Colors.danger[400],
  },
  entryFuture: {
    ...Typography.body.xs,
    color: Colors.neutral[500],
    marginTop: 2,
  },
  entryNoLog: {
    ...Typography.body.xs,
    color: Colors.danger[400],
    marginTop: 2,
  },
});

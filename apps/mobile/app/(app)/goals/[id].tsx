import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { createGoalsApi } from '@goal-tracker/api-client';
import type { Goal } from '@goal-tracker/types';
import { useApiClient } from '../../../stores/authStore';
import {
  ScreenContainer,
  CircularProgressArc,
  StatusBadge,
  MetricRow,
  PrimaryButton,
} from '../../../components/ui';
import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/theme';
import { useCountUp } from '../../../hooks/useCountUp';

type HeatmapStatus = 'met' | 'missed' | 'future';

interface HeatmapDay {
  date: string;
  status: HeatmapStatus;
}

function buildHeatmap(goal: Goal): HeatmapDay[] {
  const today = new Date().toISOString().split('T')[0];
  const days: HeatmapDay[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = goal.logs.find((l) => l.date === dateStr);

    let status: HeatmapStatus;
    if (dateStr > today) {
      status = 'future';
    } else if (log) {
      status = log.missed ? 'missed' : 'met';
    } else {
      status = 'future';
    }

    days.push({ date: dateStr, status });
  }

  return days;
}

const HEATMAP_COLOR: Record<HeatmapStatus, string> = {
  met: '#10B981',
  missed: '#EF4444',
  future: '#1E2D47',
};

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const client = useApiClient();

  const { data: goal, isLoading, error } = useQuery<Goal>({
    queryKey: ['goal', id],
    queryFn: () => createGoalsApi(client).get(id),
    enabled: !!id,
  });

  const today = new Date().toISOString().split('T')[0];

  const daysRemaining = goal
    ? Math.max(
        0,
        Math.ceil(
          (new Date(goal.endDate).getTime() - new Date(today).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  const percent = goal
    ? Math.min(100, Math.round((goal.cumulativeTotal / (goal.dailyTarget * 30)) * 100))
    : 0;

  const loggedToday = goal?.logs.some((l) => l.date === today) ?? false;

  const animatedTotal = useCountUp({ target: goal?.cumulativeTotal ?? 0, duration: 1000 });

  const heatmapData = useMemo<HeatmapDay[]>(
    () => (goal ? buildHeatmap(goal) : []),
    [goal]
  );

  if (isLoading) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.amber[500]} />
        </View>
      </ScreenContainer>
    );
  }

  if (error || !goal) {
    return (
      <ScreenContainer>
        <View style={styles.center}>
          <Text style={styles.errorText}>
            {error ? (error as Error).message : 'Goal not found'}
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  const renderBottomBar = () => {
    if (goal.status !== 'active') {
      const isCompleted = goal.status === 'completed';
      return (
        <View style={styles.stickyBar}>
          <View
            style={[
              styles.infoPill,
              {
                backgroundColor: isCompleted
                  ? `${Colors.success[500]}26`
                  : `${Colors.danger[500]}26`,
                borderColor: isCompleted ? Colors.success[500] : Colors.danger[500],
              },
            ]}
          >
            <Ionicons
              name={isCompleted ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isCompleted ? Colors.success[500] : Colors.danger[500]}
            />
            <Text
              style={[
                styles.infoPillText,
                { color: isCompleted ? Colors.success[500] : Colors.danger[500] },
              ]}
            >
              {isCompleted ? 'GOAL COMPLETED' : 'GOAL FAILED'}
            </Text>
          </View>
        </View>
      );
    }

    if (loggedToday) {
      return (
        <View style={styles.stickyBar}>
          <PrimaryButton
            label="LOGGED TODAY ✓"
            onPress={() => {}}
            variant="ghost"
            fullWidth
            disabled
          />
        </View>
      );
    }

    return (
      <View style={styles.stickyBar}>
        <PrimaryButton
          label="LOG TODAY'S PROGRESS"
          onPress={() => router.push('/(app)/goals/log')}
          variant="amber"
          fullWidth
        />
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* HERO */}
          <View style={styles.hero}>
            <LinearGradient
              colors={['#0D1526', '#060B18']}
              style={StyleSheet.absoluteFill}
            />

            {/* Back button */}
            <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
              <Ionicons name="chevron-back" size={24} color={Colors.neutral.white} />
            </Pressable>

            {/* Arc + percent */}
            <View style={styles.arcWrapper}>
              <CircularProgressArc percent={percent} size={180} strokeWidth={12}>
                <Text style={styles.percentText}>{percent}%</Text>
              </CircularProgressArc>
            </View>

            {/* Goal name */}
            <Text style={styles.goalName}>{goal.name}</Text>

            {/* Status badge centered */}
            <View style={styles.badgeWrapper}>
              <StatusBadge status={goal.status} />
            </View>
          </View>

          {/* BODY */}
          <View style={styles.body}>
            {/* Stats section */}
            <Text style={styles.sectionHeader}>STATS</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <MetricRow
                  label="TOTAL"
                  value={animatedTotal}
                  unit={goal.unit}
                  valueColor={Colors.amber[400]}
                />
              </View>
              <View style={styles.metricCell}>
                <MetricRow
                  label="DEBT"
                  value={goal.totalDebt}
                  unit={goal.unit}
                  valueColor={Colors.danger[400]}
                />
              </View>
              <View style={styles.metricCell}>
                <MetricRow
                  label="STREAK"
                  value={goal.streak}
                  unit="days"
                  valueColor={Colors.success[400]}
                />
              </View>
              <View style={styles.metricCell}>
                <MetricRow
                  label="REMAINING"
                  value={daysRemaining}
                  unit="left"
                  valueColor={Colors.neutral[400]}
                />
              </View>
            </View>

            {/* Multiplier card */}
            {goal.nextDayMultiplier > 1 ? (
              <View style={[styles.multiplierCard, styles.multiplierDanger]}>
                <Ionicons name="warning-outline" size={18} color={Colors.danger[400]} />
                <Text style={[styles.multiplierText, { color: Colors.danger[400] }]}>
                  2× MULTIPLIER ACTIVE
                </Text>
              </View>
            ) : (
              <View style={[styles.multiplierCard, styles.multiplierSuccess]}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success[400]} />
                <Text style={[styles.multiplierText, { color: Colors.success[400] }]}>
                  ON TRACK
                </Text>
              </View>
            )}

            {/* Activity / Heatmap */}
            <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>ACTIVITY</Text>

            <FlatList
              data={heatmapData}
              keyExtractor={(item) => item.date}
              numColumns={7}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View
                  style={[
                    styles.heatCell,
                    { backgroundColor: HEATMAP_COLOR[item.status] },
                  ]}
                />
              )}
              columnWrapperStyle={styles.heatRow}
              contentContainerStyle={styles.heatContainer}
            />
          </View>
        </ScrollView>

        {/* Sticky bottom bar */}
        {renderBottomBar()}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingBottom: 120,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body.md,
    color: Colors.danger[500],
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // HERO
  hero: {
    height: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Spacing.md,
  },
  backButton: {
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.md,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arcWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  percentText: {
    ...Typography.display.xl,
    color: Colors.amber[400],
  },
  goalName: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  badgeWrapper: {
    alignItems: 'center',
  },

  // BODY
  body: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.body.label,
    color: Colors.neutral[500],
    marginBottom: Spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCell: {
    flex: 1,
    minWidth: '40%',
  },

  // Multiplier card
  multiplierCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  multiplierDanger: {
    backgroundColor: `${Colors.danger[500]}1A`,
    borderColor: Colors.danger[500],
  },
  multiplierSuccess: {
    backgroundColor: `${Colors.success[500]}1A`,
    borderColor: Colors.success[500],
  },
  multiplierText: {
    ...Typography.body.smBold,
    letterSpacing: 1,
  },

  // Heatmap
  heatContainer: {
    paddingBottom: Spacing.sm,
  },
  heatRow: {
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  heatCell: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
  },

  // Sticky bottom bar
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.screen.horizontal,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.bg.base,
  },
  infoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  infoPillText: {
    ...Typography.body.smBold,
    letterSpacing: 1,
  },
});

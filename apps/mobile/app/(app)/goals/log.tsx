import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { createGoalsApi } from '@goal-tracker/api-client';
import type { Goal } from '@goal-tracker/types';
import { applyDailyLog, addToDateLog, today as getToday } from '@goal-tracker/core';
import { useApiClient } from '../../../stores/authStore';
import { PrimaryButton, InputField } from '../../../components/ui';
import { Colors, Typography, Spacing, BorderRadius } from '../../../constants/theme';

export default function LogProgressScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const client = useApiClient();
  const queryClient = useQueryClient();

  const [entered, setEntered] = useState('');

  const { data: goal, isLoading, error } = useQuery<Goal>({
    queryKey: ['goal', goalId],
    queryFn: () => createGoalsApi(client).get(goalId),
    enabled: !!goalId,
  });

  const todayLog = goal?.logs.find((l) => l.date === getToday());
  const requiredAmount = todayLog?.required ?? (goal ? goal.dailyTarget * goal.nextDayMultiplier : 0);

  const mutation = useMutation({
    mutationFn: async (value: number) => {
      if (!goal) throw new Error('Goal not loaded');
      const date = getToday();
      const api = createGoalsApi(client);
      const alreadyLogged = goal.logs.some((l) => l.date === date);
      const updated = alreadyLogged
        ? addToDateLog(goal, value, date)
        : applyDailyLog(goal, value, date);
      const log = updated.logs.find((l) => l.date === date)!;
      await Promise.all([
        api.logProgress(goalId, {
          date: log.date,
          value: log.value,
          required: log.required,
          missed: log.missed,
        }),
        api.updateState(goalId, {
          status: updated.status,
          cumulativeTotal: updated.cumulativeTotal,
          totalDebt: updated.totalDebt,
          nextDayMultiplier: updated.nextDayMultiplier,
          streak: updated.streak,
        }),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      queryClient.invalidateQueries({ queryKey: ['goal', goalId] });
      const met = parseFloat(entered) >= requiredAmount;
      Haptics.notificationAsync(
        met ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      );
      router.back();
    },
  });

  function handleSubmit() {
    const value = parseFloat(entered);
    if (isNaN(value) || value < 0) return;
    mutation.mutate(value);
  }

  const isSubmitting = mutation.isPending;
  const enteredValue = parseFloat(entered);
  const showFeedback = entered.trim() !== '';
  const metTarget = showFeedback && !isNaN(enteredValue) && enteredValue >= requiredAmount;
  const shortfall = showFeedback && !isNaN(enteredValue)
    ? Math.max(0, requiredAmount - enteredValue)
    : 0;

  if (isLoading) {
    return (
      <View style={styles.centerState}>
        <ActivityIndicator size="large" color={Colors.amber[500]} />
      </View>
    );
  }

  if (error || !goal) {
    return (
      <View style={styles.centerState}>
        <Text style={styles.errorText}>
          {error ? (error as Error).message : 'Goal not found'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <Text style={styles.goalName} numberOfLines={1}>{goal.name}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.neutral.white} />
        </Pressable>
      </View>

      {/* "Today you need" label */}
      <Text style={styles.sectionLabel}>TODAY YOU NEED</Text>

      {/* Required amount display */}
      <Text style={styles.requiredAmount}>
        {requiredAmount} {goal.unit}
      </Text>

      {/* Penalty badge */}
      {goal.nextDayMultiplier === 2 && (
        <View style={styles.penaltyBadge}>
          <Text style={styles.penaltyBadgeText}>PENALTY ACTIVE — 2× REQUIRED</Text>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputWrapper}>
        <InputField
          label="HOW MUCH DID YOU DO?"
          keyboardType="decimal-pad"
          value={entered}
          onChangeText={setEntered}
        />
      </View>

      {/* Live feedback */}
      {showFeedback && (
        <View style={styles.feedbackRow}>
          {metTarget ? (
            <>
              <Ionicons name="checkmark-circle" size={20} color={Colors.success[500]} />
              <Text style={styles.feedbackSuccess}>DEBT CLEARED</Text>
            </>
          ) : (
            <>
              <Ionicons name="alert-circle" size={20} color={Colors.danger[500]} />
              <Text style={styles.feedbackDanger}>
                {shortfall} {goal.unit} short
              </Text>
            </>
          )}
        </View>
      )}

      {/* Submit button */}
      <View style={styles.submitWrapper}>
        <PrimaryButton
          variant="amber"
          label={isSubmitting ? 'LOGGING...' : 'SUBMIT LOG'}
          onPress={handleSubmit}
          disabled={isSubmitting}
          fullWidth
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    paddingHorizontal: Spacing.screen.horizontal,
    paddingTop: Spacing.xl,
  },
  centerState: {
    flex: 1,
    backgroundColor: Colors.bg.base,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...Typography.body.md,
    color: Colors.danger[500],
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  goalName: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
    flex: 1,
    marginRight: Spacing.md,
  },
  closeButton: {
    padding: Spacing.xs,
  },

  // Section label
  sectionLabel: {
    ...Typography.body.label,
    color: Colors.neutral[500],
    marginTop: Spacing.lg,
  },

  // Required amount
  requiredAmount: {
    ...Typography.display.xl,
    color: Colors.amber[500],
    shadowColor: Colors.amber[500],
    shadowOpacity: 0.8,
    shadowRadius: 12,
    marginTop: Spacing.xs,
  },

  // Penalty badge
  penaltyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.danger[600],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  penaltyBadgeText: {
    ...Typography.body.label,
    color: Colors.neutral.white,
  },

  // Input
  inputWrapper: {
    marginTop: Spacing.lg,
  },

  // Live feedback
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  feedbackSuccess: {
    ...Typography.body.smBold,
    color: Colors.success[500],
  },
  feedbackDanger: {
    ...Typography.body.smBold,
    color: Colors.danger[500],
  },

  // Submit
  submitWrapper: {
    marginTop: Spacing.xl,
  },
});

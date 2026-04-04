import React, { useState } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import type { Goal, Difficulty } from '@goal-tracker/types';
import { createGoalsApi } from '@goal-tracker/api-client';
import type { CreateGoalBody } from '@goal-tracker/api-client';
import { useApiClient } from '../../../stores/authStore';
import {
  ScreenContainer,
  InputField,
  DifficultyPicker,
  PrimaryButton,
  GoalCard,
} from '../../../components/ui';
import {
  Colors,
  Typography,
  Spacing,
} from '../../../constants/theme';

export default function CreateGoalScreen() {
  const client = useApiClient();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [dailyTarget, setDailyTarget] = useState('');
  const [badgeName, setBadgeName] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (body: CreateGoalBody) => createGoalsApi(client).create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(app)');
    },
  });

  function handleSubmit() {
    setSubmitted(true);
    const target = parseFloat(dailyTarget);
    if (!name || !unit || !badgeName || !target || target <= 0) return;
    mutation.mutate({ name, unit, dailyTarget: target, difficulty, badgeName });
  }

  const isLoading = mutation.isPending;

  const parsedTarget = parseFloat(dailyTarget);

  const previewGoal: Goal = {
    id: 'preview',
    name: name || 'Goal Name',
    unit: unit || 'units',
    dailyTarget: parsedTarget > 0 ? parsedTarget : 1,
    difficulty,
    badgeName: badgeName || 'Badge',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 29 * 86400000).toISOString().split('T')[0],
    status: 'active',
    logs: [],
    cumulativeTotal: 0,
    totalDebt: 0,
    nextDayMultiplier: 1,
    streak: 0,
    createdAt: new Date().toISOString(),
  };

  const nameError = submitted && !name ? 'Goal name is required' : undefined;
  const unitError = submitted && !unit ? 'Unit is required' : undefined;
  const dailyTargetError =
    submitted && (!dailyTarget || parsedTarget <= 0 || isNaN(parsedTarget))
      ? 'Must be greater than 0'
      : undefined;
  const badgeNameError = submitted && !badgeName ? 'Badge name is required' : undefined;

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header row */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.neutral.white} />
          </Pressable>
          <Text style={styles.headerTitle}>NEW MISSION</Text>
        </View>

        {/* Input fields */}
        <InputField
          label="GOAL NAME"
          value={name}
          onChangeText={setName}
          error={nameError}
        />

        <InputField
          label="UNIT"
          placeholder="e.g. km"
          value={unit}
          onChangeText={setUnit}
          error={unitError}
        />

        <InputField
          label="DAILY TARGET"
          keyboardType="decimal-pad"
          value={dailyTarget}
          onChangeText={setDailyTarget}
          error={dailyTargetError}
        />

        <InputField
          label="BADGE NAME"
          placeholder="e.g. Marathon Runner"
          value={badgeName}
          onChangeText={setBadgeName}
          error={badgeNameError}
        />

        {/* Difficulty section */}
        <Text style={styles.sectionHeader}>DIFFICULTY</Text>
        <DifficultyPicker value={difficulty} onChange={setDifficulty} />

        {/* Preview section */}
        <Text style={styles.sectionHeader}>PREVIEW</Text>
        <View pointerEvents="none">
          <GoalCard goal={previewGoal} />
        </View>

        {/* Submit button */}
        <View style={styles.submitButton}>
          <PrimaryButton
            variant="amber"
            label={isLoading ? 'LAUNCHING...' : 'LAUNCH MISSION'}
            onPress={handleSubmit}
            disabled={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen.horizontal,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    marginRight: Spacing.sm,
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.display.sm,
    color: Colors.neutral.white,
  },
  sectionHeader: {
    ...Typography.body.label,
    color: Colors.neutral[500],
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  submitButton: {
    marginTop: Spacing.lg,
  },
});

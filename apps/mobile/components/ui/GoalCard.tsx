import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { Goal } from '@goal-tracker/types';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../constants/theme';
import CircularProgressArc from './CircularProgressArc';
import StatusBadge from './StatusBadge';

interface GoalCardProps {
  goal: Goal;
  index?: number;
  onPress?: () => void;
}

export default function GoalCard({ goal, index = 0, onPress }: GoalCardProps) {
  const rawPercent = Math.round((goal.cumulativeTotal / (goal.dailyTarget * 30)) * 100);
  const percent = Math.min(rawPercent, 100);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const pulseOpacity = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 400, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    if (goal.nextDayMultiplier === 2) {
      pulseAnim.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseOpacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        ]),
      );
      pulseAnim.current.start();
    } else {
      pulseAnim.current?.stop();
      pulseOpacity.setValue(1);
    }
    return () => pulseAnim.current?.stop();
  }, [goal.nextDayMultiplier]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
      >
        {/* ROW 1: Name + Streak */}
        <View style={styles.row1}>
          <Text style={styles.goalName} numberOfLines={1}>
            {goal.name}
          </Text>
          <Text style={styles.streak}>
            {'\u{1F525}'} {goal.streak} days
          </Text>
        </View>

        {/* ROW 2: Circular progress arc */}
        <View style={styles.row2}>
          <CircularProgressArc percent={percent} size={80} strokeWidth={7}>
            <Text style={styles.percentText}>{percent}%</Text>
          </CircularProgressArc>
          <Text style={styles.totalText}>
            {goal.cumulativeTotal} {goal.unit}
          </Text>
        </View>

        {/* ROW 3: Status badge + danger multiplier label */}
        <View style={styles.row3}>
          <StatusBadge status={goal.status} />
          {goal.nextDayMultiplier === 2 && (
            <Animated.Text style={[styles.dangerLabel, { opacity: pulseOpacity }]}>
              2× TOMORROW
            </Animated.Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.subtle,
  },
  cardPressed: {
    backgroundColor: Colors.bg.cardHover,
  },
  row1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  goalName: {
    ...Typography.body.lgBold,
    color: Colors.neutral.white,
    flex: 1,
    marginRight: Spacing.sm,
  },
  streak: {
    ...Typography.body.sm,
    color: Colors.amber[500],
  },
  row2: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  percentText: {
    ...Typography.display.sm,
    color: Colors.amber[500],
  },
  totalText: {
    ...Typography.display.sm,
    color: Colors.amber[400],
    marginTop: Spacing.xs,
  },
  row3: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dangerLabel: {
    ...Typography.body.label,
    color: Colors.danger[500],
  },
});

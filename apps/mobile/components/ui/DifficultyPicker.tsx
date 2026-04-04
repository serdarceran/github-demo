import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { ImpactFeedbackStyle } from 'expo-haptics';
import { Colors, Typography, Spacing, Shadows, BorderRadius } from '../../constants/theme';

type Difficulty = 'easy' | 'medium' | 'hard';

interface DifficultyPickerProps {
  value: Difficulty;
  onChange: (value: Difficulty) => void;
}

interface OptionConfig {
  key: Difficulty;
  label: string;
  multiplier: string;
  color: string;
  glow: { shadowColor: string; shadowOffset: { width: number; height: number }; shadowOpacity: number; shadowRadius: number; elevation: number };
  gradientColors: readonly [string, string];
}

const OPTIONS: OptionConfig[] = [
  {
    key: 'easy',
    label: 'EASY',
    multiplier: '1.0×',
    color: Colors.success[500],
    glow: Shadows.successGlow,
    gradientColors: ['transparent', `${Colors.success[500]}1A`],
  },
  {
    key: 'medium',
    label: 'MEDIUM',
    multiplier: '1.15×',
    color: Colors.amber[500],
    glow: Shadows.amberGlow,
    gradientColors: ['transparent', `${Colors.amber[500]}1A`],
  },
  {
    key: 'hard',
    label: 'HARD',
    multiplier: '1.3×',
    color: Colors.danger[500],
    glow: Shadows.dangerGlow,
    gradientColors: ['transparent', `${Colors.danger[500]}1A`],
  },
];

export default function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  const handlePress = (option: Difficulty) => {
    Haptics.impactAsync(ImpactFeedbackStyle.Light);
    onChange(option);
  };

  return (
    <View style={styles.row}>
      {OPTIONS.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            style={styles.cardPressable}
            onPress={() => handlePress(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${option.label} difficulty, ${option.multiplier} multiplier`}
          >
            {selected ? (
              <LinearGradient
                colors={option.gradientColors as unknown as [string, string, ...string[]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={[
                  styles.card,
                  styles.cardSelected,
                  { borderColor: option.color },
                  option.glow,
                ]}
              >
                <CardContent option={option} />
              </LinearGradient>
            ) : (
              <View style={styles.card}>
                <CardContent option={option} />
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function CardContent({ option }: { option: OptionConfig }) {
  return (
    <>
      <Text style={[styles.optionLabel, { color: option.color }]}>
        {option.label}
      </Text>
      <Text style={[styles.multiplier, { color: option.color }]}>
        {option.multiplier}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  cardPressable: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[700],
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSelected: {
    borderWidth: 2,
  },
  optionLabel: {
    ...Typography.body.label,
    marginBottom: Spacing.xs,
  },
  multiplier: {
    ...Typography.display.md,
  },
});

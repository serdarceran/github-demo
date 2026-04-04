import React, { useRef } from 'react';
import { Pressable, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Variant = 'amber' | 'danger' | 'success' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function PrimaryButton({
  label,
  onPress,
  variant = 'amber',
  fullWidth = false,
  disabled = false,
}: PrimaryButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const animatedStyle = { transform: [{ scale }] };

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.96, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, damping: 15, stiffness: 300, useNativeDriver: true }).start();
  };

  const containerStyle = [
    styles.base,
    styles[variant],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
  ];

  const labelStyle = [
    styles.label,
    styles[`${variant}Label` as keyof typeof styles],
  ];

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
    >
      <Animated.View style={[containerStyle, animatedStyle]}>
        <Text style={labelStyle}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  // Variant backgrounds / borders
  amber: {
    backgroundColor: Colors.amber[500],
  },
  danger: {
    backgroundColor: Colors.danger[500],
  },
  success: {
    backgroundColor: Colors.success[500],
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.neutral[500],
  },
  // Label colours
  label: {
    ...Typography.body.lgBold,
    letterSpacing: 1,
  },
  amberLabel: {
    color: Colors.bg.base,
  },
  dangerLabel: {
    color: Colors.neutral.white,
  },
  successLabel: {
    color: Colors.bg.base,
  },
  ghostLabel: {
    color: Colors.neutral[400],
  },
});

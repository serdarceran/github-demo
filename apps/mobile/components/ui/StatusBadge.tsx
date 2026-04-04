import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, BorderRadius } from '../../constants/theme';

type Status = 'active' | 'completed' | 'failed';

interface StatusConfig {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
}

const STATUS_CONFIG: Record<Status, StatusConfig> = {
  active: {
    icon: 'flame-outline',
    color: Colors.amber[500],
    label: 'ACTIVE',
  },
  completed: {
    icon: 'checkmark-circle-outline',
    color: Colors.success[500],
    label: 'COMPLETED',
  },
  failed: {
    icon: 'close-circle-outline',
    color: Colors.danger[500],
    label: 'FAILED',
  },
};

interface StatusBadgeProps {
  status: Status;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: `${config.color}26`, // 15% opacity (~0x26)
          borderColor: config.color,
        },
      ]}
    >
      <Ionicons name={config.icon} size={14} color={config.color} />
      <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    ...Typography.body.label,
  },
});

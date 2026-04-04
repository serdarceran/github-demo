import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface MetricRowProps {
  label: string;
  value: string | number;
  unit?: string;
  valueColor?: string;
}

export default function MetricRow({
  label,
  value,
  unit,
  valueColor = Colors.amber[500],
}: MetricRowProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
      {unit !== undefined && <Text style={styles.unit}>{unit}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  label: {
    ...Typography.body.label,
    color: Colors.neutral[500],
  },
  value: {
    ...Typography.display.md,
    color: Colors.amber[500],
  },
  unit: {
    ...Typography.body.md,
    color: Colors.neutral[400],
    marginBottom: 4,
  },
});

import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';
import { Colors, Typography } from '../../constants/theme';

type SizeKey = 'xl' | 'lg' | 'md' | 'sm';

interface GlowTextProps {
  children: React.ReactNode;
  style?: TextStyle;
  color?: string;
  size?: SizeKey;
}

export default function GlowText({
  children,
  style,
  color = Colors.amber[500],
  size = 'xl',
}: GlowTextProps) {
  const glowStyle: TextStyle = {
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
    color,
  };

  return (
    <Text style={[styles.base, Typography.display[size], glowStyle, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.amber[500],
  },
});

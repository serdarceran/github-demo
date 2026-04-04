import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing } from '../../constants/theme';

interface DangerBannerProps {
  message: string;
}

export default function DangerBanner({ message }: DangerBannerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { opacity }]}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF000020', 'transparent', '#FF000020']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.content}>
          <Ionicons name="warning-outline" size={18} color={Colors.neutral.white} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
  },
  container: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.danger[600],
    paddingHorizontal: Spacing.screen.horizontal,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  message: {
    ...Typography.body.smBold,
    color: Colors.neutral.white,
    flexShrink: 1,
  },
});

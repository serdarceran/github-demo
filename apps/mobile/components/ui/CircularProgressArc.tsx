import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../constants/theme';

interface CircularProgressArcProps {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export default function CircularProgressArc({
  percent,
  size = 120,
  strokeWidth = 10,
  color = Colors.amber[500],
  children,
}: CircularProgressArcProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const targetOffset = circumference * (1 - Math.min(percent, 100) / 100);

  const animatedOffset = useRef(new Animated.Value(circumference)).current;
  const [currentOffset, setCurrentOffset] = useState(circumference);

  useEffect(() => {
    animatedOffset.setValue(circumference);

    const listenerId = animatedOffset.addListener(({ value }) => {
      setCurrentOffset(value);
    });

    Animated.timing(animatedOffset, {
      toValue: targetOffset,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    return () => {
      animatedOffset.removeListener(listenerId);
      animatedOffset.stopAnimation();
    };
  }, [percent, circumference, targetOffset]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: '-90deg' }] }}
      >
        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={Colors.arcTrack}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={0}
        />
        {/* Foreground progress arc */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={currentOffset}
          strokeLinecap="round"
        />
      </Svg>

      {children !== undefined && (
        <View style={styles.childrenContainer}>{children}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  childrenContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

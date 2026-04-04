import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

interface UseCountUpOptions {
  target: number;
  duration?: number;
}

export function useCountUp({ target, duration = 1000 }: UseCountUpOptions): number {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    animatedValue.setValue(0);

    const listenerId = animatedValue.addListener(({ value }) => {
      setCurrent(Math.round(value));
    });

    Animated.timing(animatedValue, {
      toValue: target,
      duration,
      useNativeDriver: false,
    }).start(() => {
      setCurrent(Math.round(target));
    });

    return () => {
      animatedValue.removeListener(listenerId);
      animatedValue.stopAnimation();
    };
  }, [target, duration]);

  return current;
}

export default useCountUp;

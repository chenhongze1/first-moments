import React, { useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ViewStyle,
  TouchableOpacityProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';

// 弹性按钮组件
interface AnimatedButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scaleValue?: number;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  style,
  scaleValue = 0.95,
  springConfig = { damping: 15, stiffness: 150 },
  onPress,
  ...props
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    scale.value = withSpring(scaleValue, springConfig);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springConfig);
  };

  const handlePress = (event: any) => {
    if (onPress) {
      // 添加触觉反馈效果
      scale.value = withSequence(
        withSpring(scaleValue * 0.9, { damping: 20, stiffness: 300 }),
        withSpring(1, springConfig)
      );
      runOnJS(onPress)(event);
    }
  };

  return (
    <TouchableOpacity
      {...props}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

// 淡入动画组件
interface FadeInViewProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: ViewStyle;
}

export const FadeInView: React.FC<FadeInViewProps> = ({
  children,
  duration = 500,
  delay = 0,
  style,
}) => {
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 滑入动画组件
interface SlideInViewProps {
  children: React.ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  duration?: number;
  delay?: number;
  distance?: number;
  style?: ViewStyle;
}

export const SlideInView: React.FC<SlideInViewProps> = ({
  children,
  direction = 'up',
  duration = 500,
  delay = 0,
  distance = 50,
  style,
}) => {
  const translateX = useSharedValue(direction === 'left' ? -distance : direction === 'right' ? distance : 0);
  const translateY = useSharedValue(direction === 'up' ? distance : direction === 'down' ? -distance : 0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      translateX.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      translateY.value = withTiming(0, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
      opacity.value = withTiming(1, {
        duration,
        easing: Easing.out(Easing.cubic),
      });
    }, delay);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 脉冲动画组件
interface PulseViewProps {
  children: React.ReactNode;
  duration?: number;
  minScale?: number;
  maxScale?: number;
  style?: ViewStyle;
}

export const PulseView: React.FC<PulseViewProps> = ({
  children,
  duration = 1000,
  minScale = 1,
  maxScale = 1.05,
  style,
}) => {
  const scale = useSharedValue(minScale);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        withTiming(minScale, { duration: duration / 2, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 旋转动画组件
interface RotateViewProps {
  children: React.ReactNode;
  duration?: number;
  style?: ViewStyle;
}

export const RotateView: React.FC<RotateViewProps> = ({
  children,
  duration = 2000,
  style,
}) => {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotation.value, [0, 1], [0, 360])}deg`,
        },
      ],
    };
  });

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(1, { duration, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 弹跳动画组件
interface BounceViewProps {
  children: React.ReactNode;
  trigger?: boolean;
  style?: ViewStyle;
}

export const BounceView: React.FC<BounceViewProps> = ({
  children,
  trigger = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  useEffect(() => {
    if (trigger) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(0.9, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 8, stiffness: 200 })
      );
    }
  }, [trigger]);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 摇摆动画组件
interface ShakeViewProps {
  children: React.ReactNode;
  trigger?: boolean;
  intensity?: number;
  style?: ViewStyle;
}

export const ShakeView: React.FC<ShakeViewProps> = ({
  children,
  trigger = false,
  intensity = 10,
  style,
}) => {
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  useEffect(() => {
    if (trigger) {
      translateX.value = withSequence(
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(intensity, { duration: 50 }),
        withTiming(-intensity, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
  }, [trigger]);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 进度条动画组件
interface AnimatedProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  borderRadius?: number;
  duration?: number;
  style?: ViewStyle;
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = '#E5E7EB',
  progressColor = '#6366F1',
  borderRadius = 4,
  duration = 500,
  style,
}) => {
  const width = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: `${width.value * 100}%`,
    };
  });

  useEffect(() => {
    width.value = withTiming(progress, {
      duration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  return (
    <View
      style={[
        {
          height,
          backgroundColor,
          borderRadius,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            backgroundColor: progressColor,
            borderRadius,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};
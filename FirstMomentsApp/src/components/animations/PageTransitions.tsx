import React, { useEffect } from 'react';
import { ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// 页面转场动画类型
export type TransitionType = 
  | 'slide'
  | 'fade'
  | 'scale'
  | 'flip'
  | 'push'
  | 'modal';

// 转场方向
export type TransitionDirection = 'left' | 'right' | 'up' | 'down';

// 转场配置
interface TransitionConfig {
  type: TransitionType;
  direction?: TransitionDirection;
  duration?: number;
  easing?: any;
  springConfig?: {
    damping?: number;
    stiffness?: number;
  };
}

// 页面转场容器组件
interface PageTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  config?: TransitionConfig;
  style?: ViewStyle;
  onTransitionEnd?: () => void;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  isVisible,
  config = { type: 'fade', duration: 300 },
  style,
  onTransitionEnd,
}) => {
  const progress = useSharedValue(isVisible ? 1 : 0);

  const animatedStyle = useAnimatedStyle(() => {
    switch (config.type) {
      case 'fade':
        return {
          opacity: progress.value,
        };

      case 'slide': {
        const translateX = interpolate(
          progress.value,
          [0, 1],
          config.direction === 'left' ? [-300, 0] :
          config.direction === 'right' ? [300, 0] : [0, 0]
        );
        const translateY = interpolate(
          progress.value,
          [0, 1],
          config.direction === 'up' ? [-300, 0] :
          config.direction === 'down' ? [300, 0] : [0, 0]
        );
        return {
          transform: [
            { translateX },
            { translateY },
          ],
          opacity: progress.value,
        };
      }

      case 'scale':
        return {
          transform: [
            { scale: interpolate(progress.value, [0, 1], [0.8, 1]) },
          ],
          opacity: progress.value,
        };

      case 'flip': {
        const rotateY = interpolate(
          progress.value,
          [0, 1],
          [90, 0]
        );
        return {
          transform: [
            { rotateY: `${rotateY}deg` },
          ],
          opacity: progress.value,
        };
      }

      case 'push': {
        const translateX = interpolate(
          progress.value,
          [0, 1],
          config.direction === 'left' ? [-100, 0] :
          config.direction === 'right' ? [100, 0] : [0, 0]
        );
        const scale = interpolate(progress.value, [0, 1], [0.95, 1]);
        return {
          transform: [
            { translateX },
            { scale },
          ],
          opacity: progress.value,
        };
      }

      case 'modal': {
        const translateY = interpolate(
          progress.value,
          [0, 1],
          [300, 0]
        );
        const scale = interpolate(progress.value, [0, 1], [0.9, 1]);
        return {
          transform: [
            { translateY },
            { scale },
          ],
          opacity: progress.value,
        };
      }

      default:
        return {
          opacity: progress.value,
        };
    }
  });

  useEffect(() => {
    const targetValue = isVisible ? 1 : 0;
    
    if (config.springConfig) {
      progress.value = withSpring(targetValue, config.springConfig, (finished) => {
        if (finished && onTransitionEnd) {
          runOnJS(onTransitionEnd)();
        }
      });
    } else {
      progress.value = withTiming(targetValue, {
        duration: config.duration || 300,
        easing: config.easing || Easing.out(Easing.cubic),
      }, (finished) => {
        if (finished && onTransitionEnd) {
          runOnJS(onTransitionEnd)();
        }
      });
    }
  }, [isVisible]);

  return (
    <Animated.View style={[style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

// 卡片翻转动画组件
interface FlipCardProps {
  frontContent: React.ReactNode;
  backContent: React.ReactNode;
  isFlipped: boolean;
  style?: ViewStyle;
  duration?: number;
}

export const FlipCard: React.FC<FlipCardProps> = ({
  frontContent,
  backContent,
  isFlipped,
  style,
  duration = 600,
}) => {
  const rotation = useSharedValue(0);

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateY = interpolate(rotation.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${rotateY}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    };
  });

  useEffect(() => {
    rotation.value = withTiming(isFlipped ? 1 : 0, {
      duration,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isFlipped]);

  return (
    <Animated.View style={style}>
      <Animated.View style={frontAnimatedStyle}>
        {frontContent}
      </Animated.View>
      <Animated.View style={backAnimatedStyle}>
        {backContent}
      </Animated.View>
    </Animated.View>
  );
};

// 抽屉动画组件
interface DrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  direction?: 'left' | 'right' | 'top' | 'bottom';
  size?: number;
  style?: ViewStyle;
  overlayStyle?: ViewStyle;
  onClose?: () => void;
}

export const AnimatedDrawer: React.FC<DrawerProps> = ({
  children,
  isOpen,
  direction = 'left',
  size = 300,
  style,
  overlayStyle,
  onClose,
}) => {
  const progress = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);

  const drawerStyle = useAnimatedStyle(() => {
    const translateX = direction === 'left' ? 
      interpolate(progress.value, [0, 1], [-size, 0]) :
      direction === 'right' ?
      interpolate(progress.value, [0, 1], [size, 0]) : 0;
    
    const translateY = direction === 'top' ?
      interpolate(progress.value, [0, 1], [-size, 0]) :
      direction === 'bottom' ?
      interpolate(progress.value, [0, 1], [size, 0]) : 0;

    return {
      transform: [
        { translateX },
        { translateY },
      ],
    };
  });

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayOpacity.value,
    };
  });

  useEffect(() => {
    progress.value = withSpring(isOpen ? 1 : 0, {
      damping: 20,
      stiffness: 90,
    });
    overlayOpacity.value = withTiming(isOpen ? 0.5 : 0, {
      duration: 300,
    });
  }, [isOpen]);

  return (
    <>
      {isOpen && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'black',
              zIndex: 999,
            },
            overlayStyle,
            overlayAnimatedStyle,
          ]}
          onTouchEnd={onClose}
        />
      )}
      <Animated.View
        style={[
          {
            position: 'absolute',
            zIndex: 1000,
            ...(direction === 'left' && { left: 0, top: 0, bottom: 0, width: size }),
            ...(direction === 'right' && { right: 0, top: 0, bottom: 0, width: size }),
            ...(direction === 'top' && { top: 0, left: 0, right: 0, height: size }),
            ...(direction === 'bottom' && { bottom: 0, left: 0, right: 0, height: size }),
          },
          style,
          drawerStyle,
        ]}
      >
        {children}
      </Animated.View>
    </>
  );
};

// 预设转场配置
export const TransitionPresets = {
  slideLeft: {
    type: 'slide' as TransitionType,
    direction: 'left' as TransitionDirection,
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  slideRight: {
    type: 'slide' as TransitionType,
    direction: 'right' as TransitionDirection,
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  slideUp: {
    type: 'slide' as TransitionType,
    direction: 'up' as TransitionDirection,
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  slideDown: {
    type: 'slide' as TransitionType,
    direction: 'down' as TransitionDirection,
    duration: 300,
    easing: Easing.out(Easing.cubic),
  },
  fade: {
    type: 'fade' as TransitionType,
    duration: 250,
    easing: Easing.inOut(Easing.ease),
  },
  scale: {
    type: 'scale' as TransitionType,
    duration: 300,
    springConfig: {
      damping: 15,
      stiffness: 150,
    },
  },
  modal: {
    type: 'modal' as TransitionType,
    duration: 400,
    springConfig: {
      damping: 20,
      stiffness: 90,
    },
  },
};
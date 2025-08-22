import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
  Dimensions,
} from 'react-native';

// 临时样式变量
const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16 };

export interface SkeletonProps {
  active?: boolean;
  avatar?: boolean | {
    active?: boolean;
    shape?: 'circle' | 'square';
    size?: 'small' | 'large' | 'default' | number;
  };
  loading?: boolean;
  paragraph?: boolean | {
    rows?: number;
    width?: string | number | Array<string | number>;
  };
  round?: boolean;
  title?: boolean | {
    width?: string | number;
  };
  children?: React.ReactNode;
  style?: ViewStyle;
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'rectangular' | 'circular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  active = true,
  avatar = false,
  loading = true,
  paragraph = true,
  round = false,
  title = true,
  children,
  style,
  width,
  height,
  variant = 'text',
  animation = 'pulse',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const waveAnimatedValue = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    if (active && animation === 'pulse') {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    }
  }, [active, animation, animatedValue]);

  useEffect(() => {
    if (active && animation === 'wave') {
      const waveAnimation = Animated.loop(
        Animated.timing(waveAnimatedValue, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: false,
        })
      );
      waveAnimation.start();
      return () => waveAnimation.stop();
    }
  }, [active, animation, waveAnimatedValue]);

  if (!loading) {
    return <>{children}</>;
  }

  const getAnimatedStyle = (baseStyle: ViewStyle): ViewStyle => {
    if (!active || animation === 'none') {
      return baseStyle;
    }

    if (animation === 'pulse') {
      const opacity = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
      });
      return {
        ...baseStyle,
        opacity,
      };
    }

    if (animation === 'wave') {
      const screenWidth = Dimensions.get('window').width;
      const translateX = waveAnimatedValue.interpolate({
        inputRange: [-1, 1],
        outputRange: [-screenWidth, screenWidth],
      });
      return {
        ...baseStyle,
        overflow: 'hidden',
      };
    }

    return baseStyle;
  };

  const getSkeletonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.gray[200],
      borderRadius: round || variant === 'circular' ? 50 : borderRadius.sm,
    };

    if (width) {
      baseStyle.width = width as any;
    }
    if (height) {
      baseStyle.height = height as any;
    }

    if (variant === 'text') {
      baseStyle.height = baseStyle.height || 16;
      baseStyle.width = baseStyle.width || '100%';
    } else if (variant === 'rectangular') {
      baseStyle.height = baseStyle.height || 100;
      baseStyle.width = baseStyle.width || '100%';
    } else if (variant === 'circular') {
      const size = baseStyle.width || baseStyle.height || 40;
      baseStyle.width = size;
      baseStyle.height = size;
      baseStyle.borderRadius = typeof size === 'number' ? size / 2 : 50;
    }

    return baseStyle;
  };

  const renderWaveOverlay = () => {
    if (animation !== 'wave' || !active) return null;

    const screenWidth = Dimensions.get('window').width;
    const translateX = waveAnimatedValue.interpolate({
      inputRange: [-1, 1],
      outputRange: [-screenWidth, screenWidth],
    });

    return (
      <Animated.View
        style={[
          styles.waveOverlay,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    );
  };

  const renderAvatar = () => {
    if (!avatar) return null;

    const avatarConfig = typeof avatar === 'object' ? avatar : {};
    const size = typeof avatarConfig.size === 'number' 
      ? avatarConfig.size 
      : avatarConfig.size === 'small' 
        ? 32 
        : avatarConfig.size === 'large' 
          ? 64 
          : 40;

    const avatarStyle: ViewStyle = {
      width: size,
      height: size,
      borderRadius: avatarConfig.shape === 'square' ? borderRadius.sm : size / 2,
      backgroundColor: colors.gray[200],
      marginRight: spacing.md,
    };

    return (
      <Animated.View style={getAnimatedStyle(avatarStyle)}>
        {renderWaveOverlay()}
      </Animated.View>
    );
  };

  const renderTitle = () => {
    if (!title) return null;

    const titleConfig = typeof title === 'object' ? title : {};
    const titleStyle: ViewStyle = {
      height: 16,
      width: (titleConfig.width || '60%') as any,
      backgroundColor: colors.gray[200],
      borderRadius: borderRadius.sm,
      marginBottom: spacing.sm,
    };

    return (
      <Animated.View style={getAnimatedStyle(titleStyle)}>
        {renderWaveOverlay()}
      </Animated.View>
    );
  };

  const renderParagraph = () => {
    if (!paragraph) return null;

    const paragraphConfig = typeof paragraph === 'object' ? paragraph : {};
    const rows = paragraphConfig.rows || 3;
    const widths = paragraphConfig.width || ['100%', '80%', '60%'];

    return (
      <View>
        {Array.from({ length: rows }).map((_, index) => {
          const lineWidth = Array.isArray(widths) 
            ? widths[index] || widths[widths.length - 1]
            : widths;
          
          const lineStyle: ViewStyle = {
            height: 14,
            width: lineWidth as any,
            backgroundColor: colors.gray[200],
            borderRadius: borderRadius.sm,
            marginBottom: index < rows - 1 ? spacing.xs : 0,
          };

          return (
            <Animated.View key={index} style={getAnimatedStyle(lineStyle)}>
              {renderWaveOverlay()}
            </Animated.View>
          );
        })}
      </View>
    );
  };

  // 如果是简单的骨架屏（只有基本属性）
  if (!avatar && !title && !paragraph) {
    return (
      <Animated.View style={[getAnimatedStyle(getSkeletonStyle()), style]}>
        {renderWaveOverlay()}
      </Animated.View>
    );
  }

  // 复合骨架屏
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {renderAvatar()}
        <View style={styles.textContent}>
          {renderTitle()}
          {renderParagraph()}
        </View>
      </View>
    </View>
  );
};

// 预设组件
export const TextSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="text" />
);

export const RectangularSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="rectangular" />
);

export const CircularSkeleton: React.FC<Omit<SkeletonProps, 'variant'>> = (props) => (
  <Skeleton {...props} variant="circular" />
);

export const AvatarSkeleton: React.FC<Omit<SkeletonProps, 'avatar'>> = (props) => (
  <Skeleton {...props} avatar={{ shape: 'circle', size: 'default' }} title={false} paragraph={false} />
);

export const CardSkeleton: React.FC<SkeletonProps> = (props) => (
  <Skeleton
    {...props}
    avatar={{ shape: 'circle', size: 'default' }}
    title={{ width: '60%' }}
    paragraph={{ rows: 3, width: ['100%', '80%', '60%'] }}
  />
);

export const ListItemSkeleton: React.FC<SkeletonProps> = (props) => (
  <Skeleton
    {...props}
    avatar={{ shape: 'square', size: 'default' }}
    title={{ width: '40%' }}
    paragraph={{ rows: 2, width: ['100%', '70%'] }}
  />
);

const styles = StyleSheet.create({
  container: {
    // 基础容器样式
  } as ViewStyle,
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  } as ViewStyle,
  textContent: {
    flex: 1,
  } as ViewStyle,
  waveOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    width: 100,
  } as ViewStyle,
});

export default Skeleton;
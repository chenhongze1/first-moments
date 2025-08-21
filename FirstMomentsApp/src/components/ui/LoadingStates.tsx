import React from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: screenWidth } = Dimensions.get('window');

// 基础加载指示器
interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color = '#007AFF',
  text,
  style,
}) => {
  return (
    <View style={[styles.loadingContainer, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.loadingText}>{text}</Text>}
    </View>
  );
};

// 全屏加载遮罩
interface LoadingOverlayProps {
  visible: boolean;
  text?: string;
  backgroundColor?: string;
  opacity?: number;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  visible,
  text = '加载中...',
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  opacity = 1,
}) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: opacity,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacity, fadeAnim]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { backgroundColor, opacity: fadeAnim, pointerEvents: 'auto' },
      ]}
    >
      <View style={styles.overlayContent}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.overlayText}>{text}</Text>
      </View>
    </Animated.View>
  );
};

// 骨架屏组件
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle: ViewStyle = {
    width: width as any,
    height,
    borderRadius,
    backgroundColor: '#E1E9EE',
  };

  return (
    <Animated.View
      style={[
        skeletonStyle,
        { opacity },
        style,
      ]}
    />
  );
};

// 骨架屏文本行
interface SkeletonTextProps {
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
  style?: ViewStyle;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  lineHeight = 20,
  lastLineWidth = '60%',
  style,
}) => {
  return (
    <View style={style}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height={lineHeight}
          width={index === lines - 1 ? lastLineWidth : '100%'}
          style={{ marginBottom: index < lines - 1 ? 8 : 0 }}
        />
      ))}
    </View>
  );
};

// 卡片骨架屏
export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.skeletonCard, style]}>
      <Skeleton height={200} style={{ marginBottom: 12 }} />
      <SkeletonText lines={2} lineHeight={16} lastLineWidth="70%" />
    </View>
  );
};

// 列表项骨架屏
export const SkeletonListItem: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  return (
    <View style={[styles.skeletonListItem, style]}>
      <Skeleton width={50} height={50} borderRadius={25} />
      <View style={styles.skeletonListContent}>
        <Skeleton height={16} width="80%" style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="60%" />
      </View>
    </View>
  );
};

// 进度条加载
interface ProgressBarProps {
  progress: number; // 0-1
  height?: number;
  backgroundColor?: string;
  progressColor?: string;
  showPercentage?: boolean;
  style?: ViewStyle;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 8,
  backgroundColor = '#E1E9EE',
  progressColor = '#007AFF',
  showPercentage = false,
  style,
}) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, animatedWidth]);

  const widthInterpolation = animatedWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={style}>
      <View
        style={[
          styles.progressContainer,
          { height, backgroundColor, borderRadius: height / 2 },
        ]}
      >
        <Animated.View
          style={[
            styles.progressBar,
            {
              height,
              backgroundColor: progressColor,
              borderRadius: height / 2,
              width: widthInterpolation,
            },
          ]}
        />
      </View>
      {showPercentage && (
        <Text style={styles.progressText}>
          {Math.round(progress * 100)}%
        </Text>
      )}
    </View>
  );
};

// 脉冲加载动画
interface PulseLoaderProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const PulseLoader: React.FC<PulseLoaderProps> = ({
  size = 40,
  color = '#007AFF',
  style,
}) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.pulseContainer, style]}>
      <Animated.View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />
    </View>
  );
};

// 加载状态Hook
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [error, setError] = React.useState<string | null>(null);

  const startLoading = React.useCallback(() => {
    setIsLoading(true);
    setError(null);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
  }, []);

  const setLoadingError = React.useCallback((errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  }, []);

  const reset = React.useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
    reset,
  };
};

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlayContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  overlayText: {
    marginTop: 10,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  skeletonCard: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  skeletonListContent: {
    flex: 1,
    marginLeft: 12,
  },
  progressContainer: {
    overflow: 'hidden',
  },
  progressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  pulseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
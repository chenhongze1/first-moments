import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
} from 'react-native';
// import Svg, { Circle, Path } from 'react-native-svg';
// 注意：需要安装 react-native-svg 依赖
// npm install react-native-svg
// 对于 Expo 项目：expo install react-native-svg

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

export interface ProgressProps {
  percent: number;
  type?: 'line' | 'circle' | 'dashboard';
  status?: 'normal' | 'success' | 'exception' | 'active';
  size?: 'small' | 'medium' | 'large' | number;
  strokeWidth?: number;
  strokeColor?: string | { from: string; to: string; direction?: string };
  trailColor?: string;
  showInfo?: boolean;
  format?: (percent: number) => React.ReactNode;
  animated?: boolean;
  steps?: number;
  strokeLinecap?: 'round' | 'square';
  gapDegree?: number;
  gapPosition?: 'top' | 'bottom' | 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  success?: {
    percent?: number;
    strokeColor?: string;
  };
}

export const Progress: React.FC<ProgressProps> = ({
  percent,
  type = 'line',
  status = 'normal',
  size = 'medium',
  strokeWidth,
  strokeColor,
  trailColor,
  showInfo = true,
  format,
  animated = true,
  steps,
  strokeLinecap = 'round',
  gapDegree = 75,
  gapPosition = 'bottom',
  style,
  textStyle,
  success,
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const { width: screenWidth } = Dimensions.get('window');

  useEffect(() => {
    if (animated) {
      Animated.timing(animatedValue, {
        toValue: percent,
        duration: 1000,
        useNativeDriver: false,
      }).start();
    } else {
      animatedValue.setValue(percent);
    }
  }, [percent, animated]);

  const getStrokeWidth = (): number => {
    if (strokeWidth) return strokeWidth;
    
    if (type === 'line') {
      const sizeMap = { small: 6, medium: 8, large: 10 };
      return typeof size === 'number' ? size : sizeMap[size];
    }
    
    const sizeMap = { small: 6, medium: 8, large: 10 };
    return typeof size === 'number' ? Math.max(6, size / 10) : sizeMap[size];
  };

  const getSize = (): number => {
    if (typeof size === 'number') return size;
    const sizeMap = { small: 80, medium: 120, large: 160 };
    return sizeMap[size];
  };

  const getStrokeColor = (): string => {
    if (strokeColor) {
      return typeof strokeColor === 'string' ? strokeColor : strokeColor.from;
    }
    
    const statusColors = {
      normal: colors.primary,
      success: colors.success,
      exception: colors.error,
      active: colors.primary,
    };
    
    return statusColors[status];
  };

  const getTrailColor = (): string => {
    return trailColor || colors.gray[200];
  };

  const formatText = (value: number): React.ReactNode => {
    if (format) {
      return format(value);
    }
    
    if (status === 'success') {
      return '✓';
    }
    
    if (status === 'exception') {
      return '✗';
    }
    
    return `${Math.round(value)}%`;
  };

  const renderLineProgress = () => {
    const progressWidth = screenWidth - spacing.xl * 2;
    const currentStrokeWidth = getStrokeWidth();
    
    if (steps) {
      return renderStepsProgress();
    }

    return (
      <View style={[styles.lineContainer, style]}>
        <View style={styles.lineProgressContainer}>
          <View
            style={[
              styles.lineTrail,
              {
                height: currentStrokeWidth,
                backgroundColor: getTrailColor(),
                borderRadius: strokeLinecap === 'round' ? currentStrokeWidth / 2 : 0,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.lineProgress,
              {
                height: currentStrokeWidth,
                backgroundColor: getStrokeColor(),
                borderRadius: strokeLinecap === 'round' ? currentStrokeWidth / 2 : 0,
                width: animatedValue.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
          {success && success.percent && (
            <Animated.View
              style={[
                styles.lineProgress,
                {
                  height: currentStrokeWidth,
                  backgroundColor: success.strokeColor || colors.success,
                  borderRadius: strokeLinecap === 'round' ? currentStrokeWidth / 2 : 0,
                  width: `${success.percent}%`,
                },
              ]}
            />
          )}
        </View>
        {showInfo && (
          <View style={styles.lineInfo}>
            <Text style={[styles.lineText, textStyle]}>
              {formatText(percent)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderStepsProgress = () => {
    const stepWidth = (screenWidth - spacing.xl * 2 - (steps! - 1) * spacing.xs) / steps!;
    const completedSteps = Math.floor((percent / 100) * steps!);
    
    return (
      <View style={[styles.stepsContainer, style]}>
        <View style={styles.stepsProgressContainer}>
          {Array.from({ length: steps! }, (_, index) => (
            <View
              key={index}
              style={[
                styles.step,
                {
                  width: stepWidth,
                  height: getStrokeWidth(),
                  backgroundColor: index < completedSteps ? getStrokeColor() : getTrailColor(),
                  borderRadius: strokeLinecap === 'round' ? getStrokeWidth() / 2 : 0,
                  marginRight: index < steps! - 1 ? spacing.xs : 0,
                },
              ]}
            />
          ))}
        </View>
        {showInfo && (
          <View style={styles.lineInfo}>
            <Text style={[styles.lineText, textStyle]}>
              {formatText(percent)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderCircleProgress = () => {
    const circleSize = getSize();
    const radius = (circleSize - getStrokeWidth()) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    
    // 计算间隙
    const gapRad = (gapDegree * Math.PI) / 180;
    const adjustedCircumference = circumference * (1 - gapDegree / 360);
    
    return (
      <View style={[styles.circleContainer, { width: circleSize, height: circleSize }, style]}>
        {/* SVG 圆形进度条需要 react-native-svg 依赖 */}
        <View style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          borderWidth: getStrokeWidth(),
          borderColor: getTrailColor(),
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          <Text style={styles.svgPlaceholder}>
            需要安装 react-native-svg
          </Text>
        </View>
        {showInfo && (
          <View style={styles.circleInfo}>
            <Text style={[styles.circleText, textStyle]}>
              {formatText(percent)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  if (type === 'line') {
    return renderLineProgress();
  }
  
  return renderCircleProgress();
};

// 预设组件
export const LineProgress: React.FC<Omit<ProgressProps, 'type'>> = (props) => (
  <Progress {...props} type="line" />
);

export const CircleProgress: React.FC<Omit<ProgressProps, 'type'>> = (props) => (
  <Progress {...props} type="circle" />
);

export const DashboardProgress: React.FC<Omit<ProgressProps, 'type'>> = (props) => (
  <Progress {...props} type="dashboard" />
);

export const StepsProgress: React.FC<Omit<ProgressProps, 'type'> & { steps: number }> = (props) => (
  <Progress {...props} type="line" />
);

const styles = StyleSheet.create({
  lineContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  lineProgressContainer: {
    flex: 1,
    position: 'relative',
  } as ViewStyle,
  lineTrail: {
    width: '100%',
    position: 'absolute',
  } as ViewStyle,
  lineProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
  } as ViewStyle,
  lineInfo: {
    marginLeft: spacing.sm,
    minWidth: 40,
    alignItems: 'center',
  } as ViewStyle,
  lineText: {
    fontSize: 14,
    color: colors.gray[600],
    fontWeight: '500',
  } as TextStyle,
  stepsContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  stepsProgressContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  step: {
    // 动态样式在组件中设置
  } as ViewStyle,
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  circleInfo: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  } as ViewStyle,
  circleText: {
    fontSize: 16,
    color: colors.gray[600],
    fontWeight: '600',
    textAlign: 'center',
  } as TextStyle,
  svgPlaceholder: {
    fontSize: 12,
    color: colors.gray[500],
    textAlign: 'center',
  } as TextStyle,
});

export default Progress;
import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {
  PanGestureHandler,
  State,
  PanGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

// 临时样式定义，需要根据实际项目调整
const colors = {
  primary: { main: '#007AFF', light: '#E3F2FD' },
  success: { main: '#34C759' },
  error: { main: '#FF3B30' },
  warning: { main: '#FF9500' },
  text: { primary: '#000', secondary: '#666', disabled: '#999' },
  background: { paper: '#FFF', secondary: '#F5F5F5', disabled: '#F0F0F0' },
  border: { main: '#E0E0E0', disabled: '#E0E0E0' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16 };
const textStyles = { body: { fontSize: 16 }, caption: { fontSize: 12 } };

const { width: screenWidth } = Dimensions.get('window');

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  minimumValue?: number;
  maximumValue?: number;
  step?: number;
  disabled?: boolean;
  trackStyle?: ViewStyle;
  thumbStyle?: ViewStyle;
  minimumTrackTintColor?: string;
  maximumTrackTintColor?: string;
  thumbTintColor?: string;
  showValue?: boolean;
  showMinMax?: boolean;
  label?: string;
  formatValue?: (value: number) => string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'range';
  style?: ViewStyle;
  vertical?: boolean;
  inverted?: boolean;
  marks?: Array<{
    value: number;
    label?: string;
  }>;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  onValueChange,
  minimumValue = 0,
  maximumValue = 100,
  step = 1,
  disabled = false,
  trackStyle,
  thumbStyle,
  minimumTrackTintColor = colors.primary.main,
  maximumTrackTintColor = colors.border.main,
  thumbTintColor = colors.primary.main,
  showValue = false,
  showMinMax = false,
  label,
  formatValue,
  size = 'medium',
  variant = 'default',
  style,
  vertical = false,
  inverted = false,
  marks,
}) => {
  const [sliderWidth, setSliderWidth] = useState(screenWidth - 32);
  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          trackHeight: 4,
          thumbSize: 16,
          containerHeight: 40,
        };
      case 'large':
        return {
          trackHeight: 8,
          thumbSize: 28,
          containerHeight: 60,
        };
      default:
        return {
          trackHeight: 6,
          thumbSize: 24,
          containerHeight: 50,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 计算当前位置
  const getPositionFromValue = useCallback(
    (val: number) => {
      const percentage = (val - minimumValue) / (maximumValue - minimumValue);
      return percentage * (sliderWidth - sizeConfig.thumbSize);
    },
    [minimumValue, maximumValue, sliderWidth, sizeConfig.thumbSize]
  );

  // 计算当前值
  const getValueFromPosition = useCallback(
    (position: number) => {
      const percentage = position / (sliderWidth - sizeConfig.thumbSize);
      let val = minimumValue + percentage * (maximumValue - minimumValue);
      
      if (step > 0) {
        val = Math.round(val / step) * step;
      }
      
      return Math.max(minimumValue, Math.min(maximumValue, val));
    },
    [minimumValue, maximumValue, step, sliderWidth, sizeConfig.thumbSize]
  );

  // 初始化位置
  React.useEffect(() => {
    translateX.value = getPositionFromValue(value);
  }, [value, getPositionFromValue, translateX]);

  // 手势处理
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      isDragging.value = true;
    },
    onActive: (event) => {
      const newPosition = Math.max(
        0,
        Math.min(sliderWidth - sizeConfig.thumbSize, event.translationX + translateX.value)
      );
      translateX.value = newPosition;
      
      const newValue = getValueFromPosition(newPosition);
      runOnJS(onValueChange)(newValue);
    },
    onEnd: () => {
      isDragging.value = false;
    },
  });

  // 拇指动画样式
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const scale = isDragging.value ? 1.2 : 1;
    
    return {
      transform: [
        { translateX: translateX.value },
        { scale },
      ],
    };
  });

  // 活动轨道动画样式
  const activeTrackAnimatedStyle = useAnimatedStyle(() => {
    const width = translateX.value + sizeConfig.thumbSize / 2;
    
    return {
      width: Math.max(0, width),
    };
  });

  // 格式化值显示
  const formatDisplayValue = (val: number) => {
    if (formatValue) {
      return formatValue(val);
    }
    return val.toString();
  };

  // 渲染标记
  const renderMarks = () => {
    if (!marks || marks.length === 0) return null;

    return (
      <View style={styles.marksContainer}>
        {marks.map((mark, index) => {
          const position = getPositionFromValue(mark.value);
          return (
            <View
              key={index}
              style={[
                styles.mark,
                {
                  left: position + sizeConfig.thumbSize / 2,
                },
              ]}
            >
              <View style={styles.markDot} />
              {mark.label && (
                <Text style={styles.markLabel}>{mark.label}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  // 渲染值显示
  const renderValueDisplay = () => {
    if (!showValue) return null;

    return (
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>
          {formatDisplayValue(value)}
        </Text>
      </View>
    );
  };

  // 渲染最小最大值
  const renderMinMaxLabels = () => {
    if (!showMinMax) return null;

    return (
      <View style={styles.minMaxContainer}>
        <Text style={styles.minMaxText}>
          {formatDisplayValue(minimumValue)}
        </Text>
        <Text style={styles.minMaxText}>
          {formatDisplayValue(maximumValue)}
        </Text>
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, disabled && styles.disabledLabel]}>
          {label}
        </Text>
      )}
      
      {renderValueDisplay()}
      
      <View
        style={[
          styles.sliderContainer,
          { height: sizeConfig.containerHeight },
          disabled && styles.disabledContainer,
        ]}
        onLayout={(event) => {
          setSliderWidth(event.nativeEvent.layout.width);
        }}
      >
        {/* 背景轨道 */}
        <View
          style={[
            styles.track,
            {
              height: sizeConfig.trackHeight,
              backgroundColor: maximumTrackTintColor,
            },
            trackStyle,
          ]}
        />
        
        {/* 活动轨道 */}
        <Animated.View
          style={[
            styles.activeTrack,
            {
              height: sizeConfig.trackHeight,
              backgroundColor: minimumTrackTintColor,
            },
            activeTrackAnimatedStyle,
          ]}
        />
        
        {/* 标记 */}
        {renderMarks()}
        
        {/* 拇指 */}
        <PanGestureHandler
          onGestureEvent={gestureHandler}
          enabled={!disabled}
        >
          <Animated.View
            style={[
              styles.thumb,
              {
                width: sizeConfig.thumbSize,
                height: sizeConfig.thumbSize,
                backgroundColor: thumbTintColor,
              },
              thumbStyle,
              thumbAnimatedStyle,
            ]}
          >
            {size === 'large' && (
              <Ionicons
                name="ellipse"
                size={8}
                color={colors.background.paper}
              />
            )}
          </Animated.View>
        </PanGestureHandler>
      </View>
      
      {renderMinMaxLabels()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  label: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  valueText: {
    ...textStyles.body,
    color: colors.primary.main,
    fontWeight: '600',
  },
  sliderContainer: {
    justifyContent: 'center',
    position: 'relative',
  },
  disabledContainer: {
    opacity: 0.5,
  },
  track: {
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    right: 0,
  },
  activeTrack: {
    borderRadius: 3,
    position: 'absolute',
    left: 0,
  },
  thumb: {
    borderRadius: 12,
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marksContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  mark: {
    position: 'absolute',
    alignItems: 'center',
  },
  markDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text.secondary,
  },
  markLabel: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  minMaxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  minMaxText: {
    ...textStyles.caption,
    color: colors.text.secondary,
  },
});

// 预设组件
export const RangeSlider: React.FC<SliderProps & {
  lowValue: number;
  highValue: number;
  onRangeChange: (low: number, high: number) => void;
}> = ({ lowValue, highValue, onRangeChange, ...props }) => {
  // 范围滑块的实现会更复杂，这里提供基础结构
  return <Slider {...props} value={lowValue} onValueChange={(value) => onRangeChange(value, highValue)} />;
};

export default Slider;
import React, { useRef, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';
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

export interface SwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  trackColor?: {
    false?: string;
    true?: string;
  };
  thumbColor?: string;
  label?: string;
  description?: string;
  loading?: boolean;
  icon?: {
    true?: string;
    false?: string;
  };
  style?: ViewStyle;
  labelPosition?: 'left' | 'right';
  variant?: 'default' | 'ios' | 'material';
}

export const Switch: React.FC<SwitchProps> = ({
  value,
  onValueChange,
  disabled = false,
  size = 'medium',
  color = colors.primary.main,
  trackColor,
  thumbColor,
  label,
  description,
  loading = false,
  icon,
  style,
  labelPosition = 'right',
  variant = 'default',
}) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  // 动画到新位置
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [value, animatedValue]);

  // 处理按下动画
  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleValue, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  // 处理释放动画
  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // 处理切换
  const handleToggle = () => {
    if (disabled || loading) return;
    onValueChange(!value);
  };

  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          trackWidth: 40,
          trackHeight: 24,
          thumbSize: 20,
          thumbOffset: 2,
        };
      case 'large':
        return {
          trackWidth: 60,
          trackHeight: 36,
          thumbSize: 32,
          thumbOffset: 2,
        };
      default:
        return {
          trackWidth: 50,
          trackHeight: 30,
          thumbSize: 26,
          thumbOffset: 2,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 获取轨道颜色
  const getTrackColor = () => {
    if (disabled) {
      return colors.background.disabled;
    }
    if (value) {
      return trackColor?.true || color;
    }
    return trackColor?.false || colors.border.main;
  };

  // 获取拇指颜色
  const getThumbColor = () => {
    if (disabled) {
      return colors.text.disabled;
    }
    return thumbColor || colors.background.paper;
  };

  // 计算拇指位置
  const thumbTranslateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [sizeConfig.thumbOffset, sizeConfig.trackWidth - sizeConfig.thumbSize - sizeConfig.thumbOffset],
  });

  // 获取轨道样式
  const getTrackStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: sizeConfig.trackWidth,
      height: sizeConfig.trackHeight,
      borderRadius: sizeConfig.trackHeight / 2,
      backgroundColor: getTrackColor(),
      justifyContent: 'center',
      position: 'relative',
    };

    if (variant === 'material') {
      baseStyle.borderWidth = 2;
      baseStyle.borderColor = value ? color : colors.border.main;
    }

    return baseStyle;
  };

  // 获取拇指样式
  const getThumbStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: sizeConfig.thumbSize,
      height: sizeConfig.thumbSize,
      borderRadius: sizeConfig.thumbSize / 2,
      backgroundColor: getThumbColor(),
      position: 'absolute',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
    };

    if (variant === 'material') {
      baseStyle.borderWidth = 1;
      baseStyle.borderColor = colors.border.main;
    }

    return baseStyle;
  };

  // 渲染图标
  const renderIcon = () => {
    if (!icon || loading) return null;
    
    const iconName = value ? icon.true : icon.false;
    if (!iconName) return null;

    return (
      <Ionicons
        name={iconName as any}
        size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
        color={value ? colors.background.paper : colors.text.secondary}
        style={styles.icon}
      />
    );
  };

  // 渲染加载指示器
  const renderLoading = () => {
    if (!loading) return null;

    return (
      <View style={styles.loadingContainer}>
        <Ionicons
          name="refresh"
          size={size === 'small' ? 12 : size === 'large' ? 18 : 14}
          color={colors.text.secondary}
        />
      </View>
    );
  };

  // 渲染标签
  const renderLabel = () => {
    if (!label && !description) return null;

    return (
      <View style={styles.labelContainer}>
        {label && (
          <Text
            style={[
              styles.label,
              disabled && styles.disabledLabel,
            ]}
          >
            {label}
          </Text>
        )}
        {description && (
          <Text
            style={[
              styles.description,
              disabled && styles.disabledDescription,
            ]}
          >
            {description}
          </Text>
        )}
      </View>
    );
  };

  // 渲染开关组件
  const renderSwitch = () => (
    <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
      <TouchableOpacity
        style={[getTrackStyle(), disabled && styles.disabledTrack]}
        onPress={handleToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1}
      >
        {renderIcon()}
        {renderLoading()}
        <Animated.View
          style={[
            getThumbStyle(),
            {
              transform: [{ translateX: thumbTranslateX }],
            },
          ]}
        />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, style]}>
      {labelPosition === 'left' && renderLabel()}
      {renderSwitch()}
      {labelPosition === 'right' && renderLabel()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  label: {
    ...textStyles.body,
    color: colors.text.primary,
  },
  description: {
    ...textStyles.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  disabledDescription: {
    color: colors.text.disabled,
  },
  disabledTrack: {
    opacity: 0.5,
  },
  icon: {
    position: 'absolute',
    alignSelf: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    alignSelf: 'center',
  },
});

// 预设组件
export const ToggleSwitch: React.FC<Omit<SwitchProps, 'variant'>> = (props) => (
  <Switch {...props} variant="default" />
);

export const IOSSwitch: React.FC<Omit<SwitchProps, 'variant'>> = (props) => (
  <Switch {...props} variant="ios" />
);

export const MaterialSwitch: React.FC<Omit<SwitchProps, 'variant'>> = (props) => (
  <Switch {...props} variant="material" />
);

export default Switch;
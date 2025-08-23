import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../../styles';

interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined' | 'filter';
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
  icon?: keyof typeof Ionicons.glyphMap;
  avatar?: React.ReactNode;
  deletable?: boolean;
  onPress?: () => void;
  onDelete?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  animated?: boolean;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  disabled = false,
  variant = 'filled',
  size = 'medium',
  color = 'primary',
  icon,
  avatar,
  deletable = false,
  onPress,
  onDelete,
  style,
  textStyle,
  animated = true,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;

  // 按下动画
  const handlePressIn = () => {
    if (animated && !disabled) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 释放动画
  const handlePressOut = () => {
    if (animated && !disabled) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // 获取颜色配置
  const getColorConfig = () => {
    const colorMap = {
      primary: {
        background: colors.primary,
        text: colors.white,
        border: colors.primary,
      },
      secondary: {
        background: colors.secondary,
        text: colors.white,
        border: colors.secondary,
      },
      success: {
        background: colors.success,
        text: colors.white,
        border: colors.success,
      },
      warning: {
        background: colors.warning,
        text: colors.white,
        border: colors.warning,
      },
      error: {
        background: colors.error,
        text: colors.white,
        border: colors.error,
      },
      info: {
        background: colors.info,
        text: colors.white,
        border: colors.info,
      },
    };

    return colorMap[color];
  };

  // 获取容器样式
  const getContainerStyle = (): ViewStyle => {
    const colorConfig = getColorConfig();
    const baseStyle: ViewStyle = {
      ...styles.container,
      ...(size === 'small' ? styles.smallContainer : 
          size === 'large' ? styles.largeContainer : styles.mediumContainer),
    };

    if (variant === 'filled') {
      baseStyle.backgroundColor = selected ? colorConfig.background : colors.gray100;
      baseStyle.borderColor = selected ? colorConfig.background : colors.gray200;
    } else if (variant === 'outlined') {
      baseStyle.backgroundColor = selected ? colorConfig.background : 'transparent';
      baseStyle.borderColor = colorConfig.border;
      baseStyle.borderWidth = 1;
    } else if (variant === 'filter') {
      baseStyle.backgroundColor = selected ? colorConfig.background : colors.gray50;
      baseStyle.borderColor = selected ? colorConfig.background : colors.gray300;
      baseStyle.borderWidth = 1;
    }

    if (disabled) {
      baseStyle.backgroundColor = colors.gray100;
      baseStyle.borderColor = colors.gray200;
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle => {
    const colorConfig = getColorConfig();
    const baseStyle: TextStyle = {
      ...styles.text,
      ...(size === 'small' ? styles.smallText : 
          size === 'large' ? styles.largeText : styles.mediumText),
    };

    if (variant === 'filled') {
      baseStyle.color = selected ? colorConfig.text : colors.gray700;
    } else {
      baseStyle.color = selected ? colorConfig.text : colorConfig.background;
    }

    if (disabled) {
      baseStyle.color = colors.gray400;
    }

    return baseStyle;
  };

  // 获取图标大小
  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 14;
      case 'large':
        return 20;
      default:
        return 16;
    }
  };

  // 获取图标颜色
  const getIconColor = () => {
    const textStyle = getTextStyle();
    return textStyle.color as string;
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      onPress();
    }
  };

  const handleDeletePress = () => {
    if (!disabled && onDelete) {
      onDelete();
    }
  };

  return (
    <Animated.View
      style={[
        animated && {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={[getContainerStyle(), style]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || !onPress}
        activeOpacity={0.8}
      >
        {/* 头像 */}
        {avatar && (
          <View style={styles.avatar}>
            {avatar}
          </View>
        )}
        
        {/* 图标 */}
        {icon && !avatar && (
          <Ionicons
            name={icon}
            size={getIconSize()}
            color={getIconColor()}
            style={styles.icon}
          />
        )}
        
        {/* 标签文本 */}
        <Text style={[getTextStyle(), textStyle]} numberOfLines={1}>
          {label}
        </Text>
        
        {/* 删除按钮 */}
        {deletable && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeletePress}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="close"
              size={getIconSize()}
              color={getIconColor()}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// 预设组件
export const FilterChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="filter" />
);

export const ActionChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="outlined" />
);

export const ChoiceChip: React.FC<Omit<ChipProps, 'variant'>> = (props) => (
  <Chip {...props} variant="filled" />
);

// Chip组合组件
interface ChipGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  spacing?: number;
  wrap?: boolean;
}

export const ChipGroup: React.FC<ChipGroupProps> = ({
  children,
  style,
  spacing: chipSpacing = spacing.xs,
  wrap = true,
}) => {
  return (
    <View style={[
      styles.chipGroup,
      wrap && styles.chipGroupWrap,
      { gap: chipSpacing },
      style,
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    borderWidth: 0,
  },
  smallContainer: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    minHeight: 24,
  },
  mediumContainer: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  largeContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  text: {
    fontWeight: fontWeight.medium,
    textAlign: 'center',
  },
  smallText: {
    fontSize: fontSize.xs,
  },
  mediumText: {
    fontSize: fontSize.sm,
  },
  largeText: {
    fontSize: fontSize.base,
  },
  icon: {
    marginRight: spacing.xs / 2,
  },
  avatar: {
    marginRight: spacing.xs / 2,
  },
  deleteButton: {
    marginLeft: spacing.xs / 2,
    padding: 2,
  },
  chipGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipGroupWrap: {
    flexWrap: 'wrap',
  },
});

export default Chip;
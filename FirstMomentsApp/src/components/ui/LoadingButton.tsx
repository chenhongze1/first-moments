import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius, fontSize } from '../../styles';

interface LoadingButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
  loadingColor?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
  loadingText,
  loadingColor,
}) => {
  const isDisabled = disabled || loading;

  // 获取按钮样式
  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.button];
    
    // 变体样式
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryButton);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryButton);
        break;
      case 'outline':
        baseStyle.push(styles.outlineButton);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostButton);
        break;
      case 'danger':
        baseStyle.push(styles.dangerButton);
        break;
    }

    // 尺寸样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallButton);
        break;
      case 'large':
        baseStyle.push(styles.largeButton);
        break;
      default:
        baseStyle.push(styles.mediumButton);
    }

    // 全宽样式
    if (fullWidth) {
      baseStyle.push(styles.fullWidthButton);
    }

    // 禁用样式
    if (isDisabled) {
      baseStyle.push(styles.disabledButton);
    }

    return baseStyle;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.buttonText];

    // 变体文本样式
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'ghost':
        baseStyle.push(styles.ghostText);
        break;
      case 'danger':
        baseStyle.push(styles.dangerText);
        break;
    }

    // 尺寸文本样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText);
        break;
      case 'large':
        baseStyle.push(styles.largeText);
        break;
      default:
        baseStyle.push(styles.mediumText);
    }

    // 禁用文本样式
    if (isDisabled) {
      baseStyle.push(styles.disabledText);
    }

    return baseStyle;
  };

  // 获取加载指示器颜色
  const getLoadingColor = () => {
    if (loadingColor) return loadingColor;
    
    switch (variant) {
      case 'primary':
      case 'danger':
        return colors.white;
      case 'secondary':
        return colors.white;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.white;
    }
  };

  // 获取加载指示器大小
  const getLoadingSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  // 渲染按钮内容
  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContent}>
          <ActivityIndicator
            size={getLoadingSize()}
            color={getLoadingColor()}
          />
          {loadingText && (
            <Text style={[getTextStyle(), styles.loadingText, textStyle]}>
              {loadingText}
            </Text>
          )}
        </View>
      );
    }

    return (
      <View style={styles.content}>
        {icon && iconPosition === 'left' && (
          <View style={styles.leftIcon}>{icon}</View>
        )}
        <Text style={[getTextStyle(), textStyle]}>{title}</Text>
        {icon && iconPosition === 'right' && (
          <View style={styles.rightIcon}>{icon}</View>
        )}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={isDisabled ? 1 : 0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // 变体样式
  primaryButton: {
    backgroundColor: colors.primary,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  ghostButton: {
    backgroundColor: 'transparent',
  },
  dangerButton: {
    backgroundColor: colors.error,
  },

  // 尺寸样式
  smallButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 44,
  },
  largeButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    minHeight: 52,
  },

  // 全宽样式
  fullWidthButton: {
    width: '100%',
  },

  // 禁用样式
  disabledButton: {
    opacity: 0.6,
  },

  // 文本样式
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },

  // 变体文本样式
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  outlineText: {
    color: colors.primary,
  },
  ghostText: {
    color: colors.primary,
  },
  dangerText: {
    color: colors.white,
  },

  // 尺寸文本样式
  smallText: {
    fontSize: fontSize.sm,
  },
  mediumText: {
    fontSize: fontSize.base,
  },
  largeText: {
    fontSize: fontSize.lg,
  },

  // 禁用文本样式
  disabledText: {
    opacity: 0.7,
  },

  // 内容布局
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
});

export default LoadingButton;
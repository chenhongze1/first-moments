import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  AccessibilityInfo,
  findNodeHandle,
  StyleSheet,
  Platform,
  Image,
} from 'react-native';
import { colors, spacing, borderRadius } from '../styles';

// 无障碍访问配置
interface AccessibilityConfig {
  label?: string;
  hint?: string;
  role?: 'button' | 'link' | 'text' | 'image' | 'header' | 'summary' | 'none';
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    expanded?: boolean;
    busy?: boolean;
  };
  value?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  actions?: string[];
  liveRegion?: 'none' | 'polite' | 'assertive';
  elementHidden?: boolean;
}

// 增强的可访问按钮组件
interface AccessibleButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  accessibility: AccessibilityConfig;
  style?: any;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onPress,
  accessibility,
  style,
  disabled = false,
  variant = 'primary',
  size = 'medium',
}) => {
  const buttonRef = useRef<any>(null);

  // 构建无障碍属性
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: accessibility.role || 'button',
    accessibilityLabel: accessibility.label,
    accessibilityHint: accessibility.hint,
    accessibilityState: {
      disabled: disabled || accessibility.state?.disabled,
      selected: accessibility.state?.selected,
      checked: accessibility.state?.checked,
      expanded: accessibility.state?.expanded,
      busy: accessibility.state?.busy,
    },
    accessibilityValue: accessibility.value,
    accessibilityActions: accessibility.actions?.map(action => ({ name: action })),
    accessibilityLiveRegion: accessibility.liveRegion,
    accessibilityElementsHidden: accessibility.elementHidden,
    // iOS 特定属性
    ...(Platform.OS === 'ios' && {
      accessibilityTraits: disabled ? ['button', 'disabled'] : ['button'],
    }),
  };

  // 获取按钮样式
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${variant}` as keyof typeof styles], styles[`button_${size}` as keyof typeof styles]];
    if (disabled) {
      baseStyle.push(styles.button_disabled);
    }
    return baseStyle;
  };

  return (
    <TouchableOpacity
      ref={buttonRef}
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled}
      {...accessibilityProps}
    >
      {typeof children === 'string' ? (
        <Text style={[styles.buttonText, styles[`buttonText_${variant}` as keyof typeof styles], disabled && styles.buttonText_disabled]}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
};

// 可访问的文本组件
interface AccessibleTextProps {
  children: React.ReactNode;
  accessibility: AccessibilityConfig;
  style?: any;
  numberOfLines?: number;
  selectable?: boolean;
}

export const AccessibleText: React.FC<AccessibleTextProps> = ({
  children,
  accessibility,
  style,
  numberOfLines,
  selectable = false,
}) => {
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: accessibility.role || 'text',
    accessibilityLabel: accessibility.label || (typeof children === 'string' ? children : undefined),
    accessibilityHint: accessibility.hint,
    accessibilityLiveRegion: accessibility.liveRegion,
  };

  return (
    <Text
      style={style}
      numberOfLines={numberOfLines}
      selectable={selectable}
      {...accessibilityProps}
    >
      {children}
    </Text>
  );
};

// 可访问的图片组件
interface AccessibleImageProps {
  source: any;
  accessibility: AccessibilityConfig;
  style?: any;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

export const AccessibleImage: React.FC<AccessibleImageProps> = ({
  source,
  accessibility,
  style,
  resizeMode = 'cover',
}) => {
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: 'image' as const,
    accessibilityLabel: accessibility.label,
    accessibilityHint: accessibility.hint,
  };

  return (
    <Image
      source={source}
      style={style}
      resizeMode={resizeMode}
      {...accessibilityProps}
    />
  );
};

// 焦点管理Hook
export const useFocusManagement = () => {
  const focusElement = (elementRef: React.RefObject<any>) => {
    if (elementRef.current) {
      const node = findNodeHandle(elementRef.current);
      if (node) {
        AccessibilityInfo.setAccessibilityFocus(node);
      }
    }
  };

  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };

  const isScreenReaderEnabled = async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch {
      return false;
    }
  };

  const isReduceMotionEnabled = async (): Promise<boolean> => {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch {
      return false;
    }
  };

  return {
    focusElement,
    announceForAccessibility,
    isScreenReaderEnabled,
    isReduceMotionEnabled,
  };
};

// 键盘导航支持
interface KeyboardNavigationProps {
  children: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
  focusable?: boolean;
}

export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  onFocus,
  onBlur,
  focusable = true,
}) => {
  const viewRef = useRef<View>(null);

  useEffect(() => {
    if (Platform.OS === 'web') {
      const element = viewRef.current as any;
      if (element && focusable) {
        element.tabIndex = 0;
        element.addEventListener('focus', onFocus);
        element.addEventListener('blur', onBlur);

        return () => {
          element.removeEventListener('focus', onFocus);
          element.removeEventListener('blur', onBlur);
        };
      }
    }
  }, [focusable, onFocus, onBlur]);

  return (
    <View
      ref={viewRef}
      accessible={focusable}
      accessibilityRole="none"
    >
      {children}
    </View>
  );
};

// 跳过链接组件
interface SkipLinkProps {
  targetId: string;
  children: React.ReactNode;
  style?: any;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  children,
  style,
}) => {
  const handlePress = () => {
    // 在Web环境中跳转到目标元素
    if (Platform.OS === 'web') {
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <TouchableOpacity
      style={[styles.skipLink, style]}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="link"
      accessibilityLabel={`跳转到${children}`}
    >
      <Text style={styles.skipLinkText}>{children}</Text>
    </TouchableOpacity>
  );
};

// 语义化容器组件
interface SemanticContainerProps {
  children: React.ReactNode;
  role: 'main' | 'header' | 'footer' | 'navigation' | 'section' | 'article' | 'aside';
  label?: string;
  style?: any;
}

export const SemanticContainer: React.FC<SemanticContainerProps> = ({
  children,
  role,
  label,
  style,
}) => {
  const accessibilityProps = {
    accessible: true,
    accessibilityRole: role === 'main' ? 'none' : role as any,
    accessibilityLabel: label,
  };

  return (
    <View style={style} {...accessibilityProps}>
      {children}
    </View>
  );
};

// 无障碍访问工具函数
export const AccessibilityUtils = {
  // 生成唯一的accessibility ID
  generateId: (prefix: string = 'accessibility'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  // 格式化数字为可读文本
  formatNumberForAccessibility: (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}百万`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}千`;
    }
    return num.toString();
  },

  // 格式化时间为可读文本
  formatTimeForAccessibility: (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else {
      return `${days}天前`;
    }
  },

  // 构建复合标签
  buildCompoundLabel: (parts: (string | undefined)[]): string => {
    return parts.filter(Boolean).join(', ');
  },
};

const styles = StyleSheet.create({
  // 按钮样式
  button: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44, // 最小触摸目标尺寸
  },
  button_primary: {
    backgroundColor: colors.primary,
  },
  button_secondary: {
    backgroundColor: colors.secondary,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  button_small: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 36,
  },
  button_medium: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
  },
  button_large: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 52,
  },
  button_disabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  buttonText_primary: {
    color: colors.white,
  },
  buttonText_secondary: {
    color: colors.white,
  },
  buttonText_outline: {
    color: colors.primary,
  },
  buttonText_ghost: {
    color: colors.primary,
  },
  buttonText_disabled: {
    opacity: 0.7,
  },
  // 跳过链接样式
  skipLink: {
    position: 'absolute',
    top: -100,
    left: spacing.md,
    backgroundColor: colors.primary,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    zIndex: 9999,
  },
  skipLinkText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

export default {
  AccessibleButton,
  AccessibleText,
  AccessibleImage,
  useFocusManagement,
  KeyboardNavigation,
  SkipLink,
  SemanticContainer,
  AccessibilityUtils,
};
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius, fontSize } from '../../styles';

export type BadgeVariant = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'small' | 'medium' | 'large';
export type BadgeShape = 'rounded' | 'square' | 'circle';

interface BadgeProps {
  children?: React.ReactNode;
  text?: string;
  count?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  dot?: boolean;
  showZero?: boolean;
  max?: number;
  offset?: [number, number];
  style?: ViewStyle;
  textStyle?: TextStyle;
  visible?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  text,
  count,
  variant = 'default',
  size = 'medium',
  shape = 'rounded',
  dot = false,
  showZero = false,
  max = 99,
  offset = [0, 0],
  style,
  textStyle,
  visible = true,
}) => {
  // 如果有children，则作为包装器使用
  const isWrapper = !!children;
  
  // 计算显示的内容
  const getDisplayContent = () => {
    if (dot) return null;
    if (text) return text;
    if (count !== undefined) {
      if (count === 0 && !showZero) return null;
      return count > max ? `${max}+` : count.toString();
    }
    return null;
  };

  const displayContent = getDisplayContent();
  
  // 如果不可见或没有内容且不是dot模式，则不渲染
  if (!visible || (!displayContent && !dot)) {
    return isWrapper ? <>{children}</> : null;
  }

  // 获取徽章样式
  const getBadgeStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.badge as ViewStyle];

    // 变体样式
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryBadge as ViewStyle);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryBadge as ViewStyle);
        break;
      case 'success':
        baseStyle.push(styles.successBadge as ViewStyle);
        break;
      case 'warning':
        baseStyle.push(styles.warningBadge as ViewStyle);
        break;
      case 'error':
        baseStyle.push(styles.errorBadge as ViewStyle);
        break;
      case 'info':
        baseStyle.push(styles.infoBadge as ViewStyle);
        break;
      default:
        baseStyle.push(styles.defaultBadge as ViewStyle);
    }

    // 尺寸样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallBadge as ViewStyle);
        break;
      case 'large':
        baseStyle.push(styles.largeBadge as ViewStyle);
        break;
      default:
        baseStyle.push(styles.mediumBadge as ViewStyle);
    }

    // 形状样式
    switch (shape) {
      case 'square':
        baseStyle.push(styles.squareBadge as ViewStyle);
        break;
      case 'circle':
        baseStyle.push(styles.circleBadge as ViewStyle);
        break;
      default:
        baseStyle.push(styles.roundedBadge as ViewStyle);
    }

    // 点状样式
    if (dot) {
      baseStyle.push(styles.dotBadge as ViewStyle);
    }

    // 包装器定位样式
    if (isWrapper) {
      baseStyle.push(styles.wrapperBadge as ViewStyle);
      baseStyle.push({
        top: offset[1],
        right: offset[0],
      });
    }

    return baseStyle;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.text as TextStyle];

    // 变体文本样式
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText as TextStyle);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText as TextStyle);
        break;
      case 'success':
        baseStyle.push(styles.successText as TextStyle);
        break;
      case 'warning':
        baseStyle.push(styles.warningText as TextStyle);
        break;
      case 'error':
        baseStyle.push(styles.errorText as TextStyle);
        break;
      case 'info':
        baseStyle.push(styles.infoText as TextStyle);
        break;
      default:
        baseStyle.push(styles.defaultText as TextStyle);
    }

    // 尺寸文本样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText as TextStyle);
        break;
      case 'large':
        baseStyle.push(styles.largeText as TextStyle);
        break;
      default:
        baseStyle.push(styles.mediumText as TextStyle);
    }

    return baseStyle;
  };

  const badgeElement = (
    <View style={[getBadgeStyle(), style]}>
      {!dot && displayContent && (
        <Text style={[getTextStyle(), textStyle]} numberOfLines={1}>
          {displayContent}
        </Text>
      )}
    </View>
  );

  if (isWrapper) {
    return (
      <View style={styles.wrapper}>
        {children}
        {badgeElement}
      </View>
    );
  }

  return badgeElement;
};

// 预设的徽章组件
export const StatusBadge: React.FC<Omit<BadgeProps, 'variant'> & { status: 'online' | 'offline' | 'busy' | 'away' }> = ({
  status,
  ...props
}) => {
  const variantMap = {
    online: 'success' as BadgeVariant,
    offline: 'default' as BadgeVariant,
    busy: 'error' as BadgeVariant,
    away: 'warning' as BadgeVariant,
  };

  return (
    <Badge
      {...props}
      variant={variantMap[status]}
      dot
    />
  );
};

export const NotificationBadge: React.FC<Omit<BadgeProps, 'variant'> & { count: number }> = ({
  count,
  ...props
}) => {
  return (
    <Badge
      {...props}
      count={count}
      variant="error"
      size="small"
    />
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    display: 'inline-flex',
  },
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    minHeight: 20,
    paddingHorizontal: spacing.xs,
  },
  wrapperBadge: {
    position: 'absolute',
    zIndex: 1,
  },

  // 变体样式
  defaultBadge: {
    backgroundColor: colors.gray400,
  },
  primaryBadge: {
    backgroundColor: colors.primary,
  },
  secondaryBadge: {
    backgroundColor: colors.secondary,
  },
  successBadge: {
    backgroundColor: colors.success,
  },
  warningBadge: {
    backgroundColor: colors.warning,
  },
  errorBadge: {
    backgroundColor: colors.error,
  },
  infoBadge: {
    backgroundColor: colors.info,
  },

  // 尺寸样式
  smallBadge: {
    minWidth: 16,
    minHeight: 16,
    paddingHorizontal: spacing.xs / 2,
  },
  mediumBadge: {
    minWidth: 20,
    minHeight: 20,
    paddingHorizontal: spacing.xs,
  },
  largeBadge: {
    minWidth: 24,
    minHeight: 24,
    paddingHorizontal: spacing.sm,
  },

  // 形状样式
  roundedBadge: {
    borderRadius: borderRadius.full,
  },
  squareBadge: {
    borderRadius: borderRadius.sm,
  },
  circleBadge: {
    borderRadius: 50,
    width: 20,
    height: 20,
    paddingHorizontal: 0,
  },

  // 点状样式
  dotBadge: {
    width: 8,
    height: 8,
    minWidth: 8,
    minHeight: 8,
    borderRadius: 4,
    paddingHorizontal: 0,
  },

  // 文本样式
  text: {
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  // 变体文本样式
  defaultText: {
    color: colors.white,
  },
  primaryText: {
    color: colors.white,
  },
  secondaryText: {
    color: colors.white,
  },
  successText: {
    color: colors.white,
  },
  warningText: {
    color: colors.white,
  },
  errorText: {
    color: colors.white,
  },
  infoText: {
    color: colors.white,
  },

  // 尺寸文本样式
  smallText: {
    fontSize: fontSize.xs,
    lineHeight: 12,
  },
  mediumText: {
    fontSize: fontSize.sm,
    lineHeight: 16,
  },
  largeText: {
    fontSize: fontSize.base,
    lineHeight: 20,
  },
});

export default Badge;
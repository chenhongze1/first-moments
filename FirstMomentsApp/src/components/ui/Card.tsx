import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius } from '../../styles';

// Card 基础接口
interface BaseCardProps {
  children?: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  disabled?: boolean;
  elevation?: 'none' | 'low' | 'medium' | 'high';
  variant?: 'default' | 'outlined' | 'filled';
}

// Card Header 接口
interface CardHeaderProps {
  title?: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  action?: React.ReactNode;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

// Card Content 接口
interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

// Card Actions 接口
interface CardActionsProps {
  children: React.ReactNode;
  style?: ViewStyle;
  alignment?: 'left' | 'center' | 'right' | 'space-between';
}

// Card Media 接口
interface CardMediaProps {
  source: any;
  height?: number;
  style?: ViewStyle;
  resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
}

// 获取阴影样式
const getElevationStyle = (elevation: string) => {
  switch (elevation) {
    case 'low':
      return {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      };
    case 'medium':
      return {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      };
    case 'high':
      return {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
      };
    default:
      return {};
  }
};

// 获取变体样式
const getVariantStyle = (variant: string) => {
  switch (variant) {
    case 'outlined':
      return {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
      };
    case 'filled':
      return {
        backgroundColor: colors.gray50,
      };
    default:
      return {
        backgroundColor: colors.white,
      };
  }
};

// 基础 Card 组件
export const Card: React.FC<BaseCardProps> = ({
  children,
  style,
  onPress,
  disabled = false,
  elevation = 'low',
  variant = 'default',
}) => {
  const elevationStyle = getElevationStyle(elevation);
  const variantStyle = getVariantStyle(variant);

  const cardStyle = [
    styles.card,
    elevationStyle,
    variantStyle,
    disabled && styles.disabled,
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

// Card Header 组件
export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  avatar,
  action,
  style,
  titleStyle,
  subtitleStyle,
}) => {
  return (
    <View style={[styles.header, style]}>
      {avatar && <View style={styles.avatar}>{avatar}</View>}
      
      <View style={styles.headerContent}>
        {title && (
          <Text style={[styles.title, titleStyle]} numberOfLines={1}>
            {title}
          </Text>
        )}
        {subtitle && (
          <Text style={[styles.subtitle, subtitleStyle]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {action && <View style={styles.action}>{action}</View>}
    </View>
  );
};

// Card Content 组件
export const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  return <View style={[styles.content, style]}>{children}</View>;
};

// Card Actions 组件
export const CardActions: React.FC<CardActionsProps> = ({
  children,
  style,
  alignment = 'right',
}) => {
  const getJustifyContent = () => {
    switch (alignment) {
      case 'left':
        return 'flex-start' as const;
      case 'center':
        return 'center' as const;
      case 'space-between':
        return 'space-between' as const;
      default:
        return 'flex-end' as const;
    }
  };

  const alignmentStyle = {
    justifyContent: getJustifyContent(),
  };

  return (
    <View style={[styles.actions, alignmentStyle, style]}>
      {children}
    </View>
  );
};

// Card Media 组件
export const CardMedia: React.FC<CardMediaProps> = ({
  source,
  height = 200,
  style,
  resizeMode = 'cover',
}) => {
  const { Image } = require('react-native');
  
  return (
    <Image
      source={source}
      style={[styles.media, { height }, style]}
      resizeMode={resizeMode}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  avatar: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    ...textStyles.h4,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  action: {
    marginLeft: spacing.md,
  },
  content: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  media: {
    width: '100%',
  },
});

// 导出所有组件
export default {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  CardMedia,
};
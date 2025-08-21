import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ImageStyle,
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

export interface AvatarProps {
  src?: string;
  alt?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge' | number;
  shape?: 'circle' | 'square';
  icon?: React.ReactNode;
  children?: React.ReactNode;
  gap?: number;
  draggable?: boolean;
  crossOrigin?: 'anonymous' | 'use-credentials' | '';
  onError?: () => void;
  onPress?: () => void;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  badge?: {
    count?: number;
    dot?: boolean;
    status?: 'success' | 'processing' | 'default' | 'error' | 'warning';
    color?: string;
    offset?: [number, number];
    size?: 'small' | 'default';
    style?: ViewStyle;
    text?: string;
  };
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt,
  size = 'medium',
  shape = 'circle',
  icon,
  children,
  gap = 4,
  onError,
  onPress,
  style,
  imageStyle,
  textStyle,
  badge,
}) => {
  const getSize = (): number => {
    if (typeof size === 'number') return size;
    const sizeMap = {
      small: 32,
      medium: 40,
      large: 64,
      xlarge: 80,
    };
    return sizeMap[size];
  };

  const avatarSize = getSize();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: avatarSize,
      height: avatarSize,
      borderRadius: shape === 'circle' ? avatarSize / 2 : borderRadius.md,
      backgroundColor: colors.gray[200],
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    };

    return {
      ...baseStyle,
      ...style,
    };
  };

  const getImageStyle = (): ImageStyle => {
    return {
      width: avatarSize,
      height: avatarSize,
      borderRadius: shape === 'circle' ? avatarSize / 2 : borderRadius.md,
      ...imageStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const fontSize = avatarSize * 0.4;
    return {
      fontSize,
      fontWeight: '600',
      color: colors.white,
      ...textStyle,
    };
  };

  const getBadgeStyle = (): ViewStyle => {
    if (!badge) return {};

    const badgeSize = badge.size === 'small' ? 16 : 20;
    const offset = badge.offset || [0, 0];
    
    const statusColors = {
      success: colors.success,
      processing: colors.primary,
      default: colors.gray[400],
      error: colors.error,
      warning: colors.warning,
    };

    return {
      position: 'absolute',
      top: -badgeSize / 2 + offset[1],
      right: -badgeSize / 2 + offset[0],
      width: badge.dot ? badgeSize / 2 : badgeSize,
      height: badge.dot ? badgeSize / 2 : badgeSize,
      borderRadius: badgeSize / 2,
      backgroundColor: badge.color || statusColors[badge.status || 'default'],
      borderWidth: 2,
      borderColor: colors.white,
      alignItems: 'center',
      justifyContent: 'center',
      ...badge.style,
    };
  };

  const getBadgeTextStyle = (): TextStyle => {
    const fontSize = badge?.size === 'small' ? 10 : 12;
    return {
      fontSize,
      fontWeight: '600',
      color: colors.white,
    };
  };

  const renderContent = () => {
    if (src) {
      return (
        <Image
          source={{ uri: src }}
          style={getImageStyle()}
          onError={onError}
          accessibilityLabel={alt}
        />
      );
    }

    if (icon) {
      return icon;
    }

    if (children) {
      if (typeof children === 'string') {
        // 如果是字符串，显示首字母或前两个字符
        const displayText = children.length > 2 ? children.substring(0, 2).toUpperCase() : children.toUpperCase();
        return (
          <Text style={getTextStyle()}>
            {displayText}
          </Text>
        );
      }
      return children;
    }

    // 默认用户图标
    return (
      <Text style={getTextStyle()}>👤</Text>
    );
  };

  const renderBadge = () => {
    if (!badge) return null;

    if (badge.dot) {
      return <View style={getBadgeStyle()} />;
    }

    if (badge.count !== undefined) {
      const displayCount = badge.count > 99 ? '99+' : badge.count.toString();
      return (
        <View style={getBadgeStyle()}>
          <Text style={getBadgeTextStyle()}>
            {displayCount}
          </Text>
        </View>
      );
    }

    if (badge.text) {
      return (
        <View style={getBadgeStyle()}>
          <Text style={getBadgeTextStyle()}>
            {badge.text}
          </Text>
        </View>
      );
    }

    return <View style={getBadgeStyle()} />;
  };

  const AvatarComponent = onPress ? TouchableOpacity : View;

  return (
    <View style={styles.container}>
      <AvatarComponent
        style={getContainerStyle()}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        {renderContent()}
      </AvatarComponent>
      {renderBadge()}
    </View>
  );
};

// 预设组件
export const UserAvatar: React.FC<Omit<AvatarProps, 'icon'>> = (props) => (
  <Avatar {...props} icon={<Text style={{ fontSize: props.size === 'small' ? 16 : 20 }}>👤</Text>} />
);

export const GroupAvatar: React.FC<Omit<AvatarProps, 'shape'>> = (props) => (
  <Avatar {...props} shape="square" />
);

export interface AvatarGroupProps {
  children: React.ReactElement<AvatarProps>[];
  maxCount?: number;
  maxPopoverPlacement?: 'top' | 'bottom';
  maxPopoverTrigger?: 'hover' | 'focus' | 'click';
  maxStyle?: ViewStyle;
  size?: AvatarProps['size'];
  style?: ViewStyle;
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  maxCount,
  maxStyle,
  size,
  style,
}) => {
  const avatars = React.Children.toArray(children) as React.ReactElement<AvatarProps>[];
  const displayAvatars = maxCount ? avatars.slice(0, maxCount) : avatars;
  const remainingCount = maxCount ? Math.max(0, avatars.length - maxCount) : 0;

  const getOverlapOffset = (): number => {
    const avatarSize = typeof size === 'number' ? size : {
      small: 32,
      medium: 40,
      large: 64,
      xlarge: 80,
    }[size || 'medium'];
    return avatarSize * 0.25;
  };

  return (
    <View style={[styles.groupContainer, style]}>
      {displayAvatars.map((avatar, index) => (
        <View
          key={index}
          style={[
            styles.groupItem,
            {
              marginLeft: index > 0 ? -getOverlapOffset() : 0,
              zIndex: displayAvatars.length - index,
            },
          ]}
        >
          {React.cloneElement(avatar, {
            size: size || avatar.props.size,
            style: {
              borderWidth: 2,
              borderColor: colors.white,
              ...avatar.props.style,
            },
          })}
        </View>
      ))}
      {remainingCount > 0 && (
        <View
          style={[
            styles.groupItem,
            {
              marginLeft: -getOverlapOffset(),
              zIndex: 0,
            },
          ]}
        >
          <Avatar
            size={size}
            style={{
              borderWidth: 2,
              borderColor: colors.white,
              backgroundColor: colors.gray[400],
              ...maxStyle,
            }}
          >
            +{remainingCount}
          </Avatar>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  } as ViewStyle,
  groupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  groupItem: {
    // 动态样式在组件中设置
  } as ViewStyle,
});

export default Avatar;
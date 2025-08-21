import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface TagProps {
  children: React.ReactNode;
  closable?: boolean;
  onClose?: () => void;
  color?: string;
  variant?: 'default' | 'outlined' | 'filled' | 'ghost';
  size?: 'small' | 'default' | 'large';
  shape?: 'default' | 'round';
  checkable?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
  closeIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress?: () => void;
}

const Tag: React.FC<TagProps> = ({
  children,
  closable = false,
  onClose,
  color,
  variant = 'default',
  size = 'default',
  shape = 'default',
  checkable = false,
  checked = false,
  onChange,
  disabled = false,
  icon,
  closeIcon,
  style,
  textStyle,
  onPress,
}) => {
  const handlePress = () => {
    if (disabled) return;
    
    if (checkable && onChange) {
      onChange(!checked);
    }
    
    if (onPress) {
      onPress();
    }
  };

  const handleClose = (e: any) => {
    e.stopPropagation();
    if (onClose) {
      onClose();
    }
  };

  const getTagStyle = (): ViewStyle => {
    const sizeKey = `tag${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles;
    const shapeKey = shape === 'default' ? 'tagDefaultShape' : `tag${shape.charAt(0).toUpperCase() + shape.slice(1)}` as keyof typeof styles;
    
    const baseStyle = {
      ...styles.tag,
      ...styles[sizeKey],
      ...styles[shapeKey],
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles.tagDisabled,
      };
    }

    if (checkable && checked) {
      return {
        ...baseStyle,
        ...styles.tagChecked,
      };
    }

    const variantKey = variant === 'default' ? 'tagDefaultVariant' : `tag${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles;
    const variantStyle = styles[variantKey] as ViewStyle;
    
    if (color) {
      if (variant === 'filled') {
        baseStyle.backgroundColor = color;
      } else if (variant === 'outlined') {
        baseStyle.borderColor = color;
      }
    }

    return {
      ...baseStyle,
      ...variantStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = {
      ...styles.text,
      ...styles[`text${size.charAt(0).toUpperCase() + size.slice(1)}` as keyof typeof styles],
    };

    if (disabled) {
      return {
        ...baseStyle,
        ...styles.textDisabled,
      };
    }

    if (checkable && checked) {
      return {
        ...baseStyle,
        ...styles.textChecked,
      };
    }

    const variantTextKey = variant === 'default' ? 'textDefaultVariant' : `text${variant.charAt(0).toUpperCase() + variant.slice(1)}` as keyof typeof styles;
    const variantTextStyle = styles[variantTextKey] as TextStyle;
    
    if (color && variant === 'outlined') {
      baseStyle.color = color;
    }

    return {
      ...baseStyle,
      ...variantTextStyle,
    };
  };

  const TagComponent = (checkable || onPress) ? TouchableOpacity : View;

  return (
    <TagComponent
      style={[getTagStyle(), style]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {icon && <View style={styles.icon}>{icon}</View>}
      
      <Text style={[getTextStyle(), textStyle]}>
        {children}
      </Text>
      
      {closable && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          {closeIcon || <Text style={styles.closeIcon}>×</Text>}
        </TouchableOpacity>
      )}
    </TagComponent>
  );
};

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d9d9d9',
    backgroundColor: '#fafafa',
    alignSelf: 'flex-start',
  },
  tagSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  tagDefault: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagLarge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  tagDefaultShape: {
    borderRadius: 4,
  },
  tagRound: {
    borderRadius: 20,
  },
  tagDefaultVariant: {
    backgroundColor: '#fafafa',
    borderColor: '#d9d9d9',
  },
  tagOutlined: {
    backgroundColor: 'transparent',
    borderColor: '#d9d9d9',
  },
  tagFilled: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  tagGhost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
  },
  tagChecked: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  tagDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#d9d9d9',
    opacity: 0.5,
  },
  text: {
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#666666',
  },
  textSmall: {
    fontSize: 10,
  },
  textDefault: {
    fontSize: 12,
  },
  textLarge: {
    fontSize: 14,
  },
  textDefaultVariant: {
    color: '#666666',
  },
  textOutlined: {
    color: '#666666',
  },
  textFilled: {
    color: '#ffffff',
  },
  textGhost: {
    color: '#666666',
  },
  textChecked: {
    color: '#ffffff',
  },
  textDisabled: {
    color: '#bfbfbf',
  },
  icon: {
    marginRight: 4,
  },
  closeButton: {
    marginLeft: 4,
    padding: 2,
  },
  closeIcon: {
    fontSize: 12,
    color: '#999999',
    fontWeight: 'bold' as const,
  },
});

// Preset components
export const CheckableTag: React.FC<Omit<TagProps, 'checkable'>> = (props) => (
  <Tag {...props} checkable />
);

export const ClosableTag: React.FC<Omit<TagProps, 'closable'>> = (props) => (
  <Tag {...props} closable />
);

export const OutlinedTag: React.FC<Omit<TagProps, 'variant'>> = (props) => (
  <Tag {...props} variant="outlined" />
);

export const FilledTag: React.FC<Omit<TagProps, 'variant'>> = (props) => (
  <Tag {...props} variant="filled" />
);

export const GhostTag: React.FC<Omit<TagProps, 'variant'>> = (props) => (
  <Tag {...props} variant="ghost" />
);

export const RoundTag: React.FC<Omit<TagProps, 'shape'>> = (props) => (
  <Tag {...props} shape="round" />
);

export default Tag;
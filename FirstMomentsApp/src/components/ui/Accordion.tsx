import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  TextStyle,
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

export interface AccordionItem {
  key: string;
  title: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  disabled?: boolean;
  subtitle?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultActiveKeys?: string[];
  activeKeys?: string[];
  onChange?: (activeKeys: string[]) => void;
  variant?: 'default' | 'bordered' | 'filled' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
  expandIcon?: React.ReactNode;
  collapseIcon?: React.ReactNode;
  showExpandIcon?: boolean;
  expandIconPosition?: 'left' | 'right';
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
  disabledStyle?: ViewStyle;
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  multiple = false,
  defaultActiveKeys = [],
  activeKeys,
  onChange,
  variant = 'default',
  size = 'medium',
  animated = true,
  expandIcon,
  collapseIcon,
  showExpandIcon = true,
  expandIconPosition = 'right',
  style,
  itemStyle,
  headerStyle,
  contentStyle,
  titleStyle,
  subtitleStyle,
  disabledStyle,
}) => {
  const [internalActiveKeys, setInternalActiveKeys] = useState<string[]>(defaultActiveKeys);
  const animatedValues = useRef<{ [key: string]: Animated.Value }>({}).current;

  // 初始化动画值
  items.forEach(item => {
    if (!animatedValues[item.key]) {
      const isActive = (activeKeys || internalActiveKeys).includes(item.key);
      animatedValues[item.key] = new Animated.Value(isActive ? 1 : 0);
    }
  });

  const currentActiveKeys = activeKeys || internalActiveKeys;

  const handleItemPress = (key: string) => {
    const item = items.find(item => item.key === key);
    if (item?.disabled) return;

    let newActiveKeys: string[];

    if (multiple) {
      if (currentActiveKeys.includes(key)) {
        newActiveKeys = currentActiveKeys.filter(k => k !== key);
      } else {
        newActiveKeys = [...currentActiveKeys, key];
      }
    } else {
      newActiveKeys = currentActiveKeys.includes(key) ? [] : [key];
    }

    if (!activeKeys) {
      setInternalActiveKeys(newActiveKeys);
    }
    onChange?.(newActiveKeys);

    // 动画处理
    if (animated) {
      const isExpanding = newActiveKeys.includes(key);
      Animated.timing(animatedValues[key], {
        toValue: isExpanding ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const getContainerStyle = (): ViewStyle => {
    const variantStyles = {
      default: styles.defaultContainer,
      bordered: styles.borderedContainer,
      filled: styles.filledContainer,
      ghost: styles.ghostContainer,
    };

    return {
      ...styles.container,
      ...variantStyles[variant],
      ...style,
    };
  };

  const getItemStyle = (item: AccordionItem): ViewStyle => {
    const variantStyles = {
      default: styles.defaultItem,
      bordered: styles.borderedItem,
      filled: styles.filledItem,
      ghost: styles.ghostItem,
    };

    return {
      ...styles.item,
      ...variantStyles[variant],
      ...(item.disabled && { ...styles.disabledItem, ...disabledStyle }),
      ...itemStyle,
    };
  };

  const getHeaderStyle = (item: AccordionItem, isActive: boolean): ViewStyle => {
    const sizeStyles = {
      small: styles.smallHeader,
      medium: styles.mediumHeader,
      large: styles.largeHeader,
    };

    const variantStyles = {
      default: isActive ? styles.activeDefaultHeader : styles.defaultHeader,
      bordered: isActive ? styles.activeBorderedHeader : styles.borderedHeader,
      filled: isActive ? styles.activeFilledHeader : styles.filledHeader,
      ghost: isActive ? styles.activeGhostHeader : styles.ghostHeader,
    };

    return {
      ...styles.header,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(item.disabled && styles.disabledHeader),
      ...headerStyle,
    };
  };

  const getTitleStyle = (item: AccordionItem): TextStyle => {
    const sizeStyles = {
      small: styles.smallTitle,
      medium: styles.mediumTitle,
      large: styles.largeTitle,
    };

    return {
      ...styles.title,
      ...sizeStyles[size],
      ...(item.disabled && styles.disabledTitle),
      ...titleStyle,
    };
  };

  const getSubtitleStyle = (item: AccordionItem): TextStyle => {
    const sizeStyles = {
      small: styles.smallSubtitle,
      medium: styles.mediumSubtitle,
      large: styles.largeSubtitle,
    };

    return {
      ...styles.subtitle,
      ...sizeStyles[size],
      ...(item.disabled && styles.disabledSubtitle),
      ...subtitleStyle,
    };
  };

  const renderExpandIcon = (isActive: boolean) => {
    if (!showExpandIcon) return null;

    if (expandIcon && collapseIcon) {
      return isActive ? collapseIcon : expandIcon;
    }

    // 默认箭头图标
    return (
      <Animated.View
        style={{
          transform: [
            {
              rotate: animated
                ? animatedValues[currentActiveKeys[0] || ''] || new Animated.Value(0)
                : new Animated.Value(isActive ? 1 : 0),
            },
          ],
        }}
      >
        <Text style={styles.defaultExpandIcon}>▼</Text>
      </Animated.View>
    );
  };

  const renderItem = (item: AccordionItem) => {
    const isActive = currentActiveKeys.includes(item.key);
    const animatedValue = animatedValues[item.key];

    return (
      <View key={item.key} style={getItemStyle(item)}>
        <TouchableOpacity
          style={getHeaderStyle(item, isActive)}
          onPress={() => handleItemPress(item.key)}
          disabled={item.disabled}
          activeOpacity={0.7}
        >
          {expandIconPosition === 'left' && renderExpandIcon(isActive)}
          
          {item.icon && (
            <View style={styles.itemIcon}>
              {item.icon}
            </View>
          )}
          
          <View style={styles.titleContainer}>
            <Text style={getTitleStyle(item)}>
              {item.title}
            </Text>
            {item.subtitle && (
              <Text style={getSubtitleStyle(item)}>
                {item.subtitle}
              </Text>
            )}
          </View>
          
          {expandIconPosition === 'right' && renderExpandIcon(isActive)}
        </TouchableOpacity>
        
        {animated ? (
          <Animated.View
            style={{
              maxHeight: animatedValue.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1000], // 足够大的值
              }),
              opacity: animatedValue,
              overflow: 'hidden',
            }}
          >
            <View style={{ ...styles.content, ...contentStyle }}>
              {item.content}
            </View>
          </Animated.View>
        ) : (
          isActive && (
            <View style={{ ...styles.content, ...contentStyle }}>
              {item.content}
            </View>
          )
        )}
      </View>
    );
  };

  return (
    <View style={getContainerStyle()}>
      {items.map(renderItem)}
    </View>
  );
};

// 预设组件
export const SimpleAccordion: React.FC<Omit<AccordionProps, 'variant'>> = (props) => (
  <Accordion {...props} variant="ghost" showExpandIcon={false} />
);

export const BorderedAccordion: React.FC<Omit<AccordionProps, 'variant'>> = (props) => (
  <Accordion {...props} variant="bordered" />
);

export const FilledAccordion: React.FC<Omit<AccordionProps, 'variant'>> = (props) => (
  <Accordion {...props} variant="filled" />
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
  } as ViewStyle,
  defaultContainer: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  borderedContainer: {
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  filledContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  ghostContainer: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  item: {
    marginBottom: spacing.xs,
  } as ViewStyle,
  defaultItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  } as ViewStyle,
  borderedItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  } as ViewStyle,
  filledItem: {
    backgroundColor: colors.white,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  } as ViewStyle,
  ghostItem: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  disabledItem: {
    opacity: 0.5,
  } as ViewStyle,
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  } as ViewStyle,
  smallHeader: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  mediumHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  largeHeader: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } as ViewStyle,
  defaultHeader: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeDefaultHeader: {
    backgroundColor: colors.gray[50],
  } as ViewStyle,
  borderedHeader: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeBorderedHeader: {
    backgroundColor: colors.gray[50],
  } as ViewStyle,
  filledHeader: {
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  activeFilledHeader: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  ghostHeader: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeGhostHeader: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  disabledHeader: {
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  itemIcon: {
    marginRight: spacing.sm,
  } as ViewStyle,
  titleContainer: {
    flex: 1,
  } as ViewStyle,
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray[900],
  } as TextStyle,
  smallTitle: {
    fontSize: 14,
  } as TextStyle,
  mediumTitle: {
    fontSize: 16,
  } as TextStyle,
  largeTitle: {
    fontSize: 18,
  } as TextStyle,
  disabledTitle: {
    color: colors.gray[400],
  } as TextStyle,
  subtitle: {
    fontSize: 14,
    color: colors.gray[600],
    marginTop: spacing.xs,
  } as TextStyle,
  smallSubtitle: {
    fontSize: 12,
  } as TextStyle,
  mediumSubtitle: {
    fontSize: 14,
  } as TextStyle,
  largeSubtitle: {
    fontSize: 16,
  } as TextStyle,
  disabledSubtitle: {
    color: colors.gray[400],
  } as TextStyle,
  defaultExpandIcon: {
    fontSize: 12,
    color: colors.gray[600],
  } as TextStyle,
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
  } as ViewStyle,
});

export default Accordion;
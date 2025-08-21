import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
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
const textStyles = {
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16 },
  caption: { fontSize: 12 },
};

const { width: screenWidth } = Dimensions.get('window');

export interface TabItem {
  key: string;
  title: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
  content?: React.ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  activeKey?: string;
  defaultActiveKey?: string;
  onChange?: (key: string) => void;
  variant?: 'default' | 'pills' | 'underline' | 'card' | 'button';
  size?: 'small' | 'medium' | 'large';
  position?: 'top' | 'bottom';
  scrollable?: boolean;
  centered?: boolean;
  animated?: boolean;
  showContent?: boolean;
  tabBarStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
  contentStyle?: ViewStyle;
  indicatorStyle?: ViewStyle;
  badgeStyle?: ViewStyle;
  badgeTextStyle?: TextStyle;
}

export const Tabs: React.FC<TabsProps> = ({
  items,
  activeKey,
  defaultActiveKey,
  onChange,
  variant = 'default',
  size = 'medium',
  position = 'top',
  scrollable = false,
  centered = false,
  animated = true,
  showContent = true,
  tabBarStyle,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
  contentStyle,
  indicatorStyle,
  badgeStyle,
  badgeTextStyle,
}) => {
  const [currentActiveKey, setCurrentActiveKey] = useState(
    activeKey || defaultActiveKey || items[0]?.key
  );
  const [tabLayouts, setTabLayouts] = useState<{ [key: string]: { x: number; width: number } }>({});
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeKey !== undefined) {
      setCurrentActiveKey(activeKey);
    }
  }, [activeKey]);

  useEffect(() => {
    if (animated && tabLayouts[currentActiveKey]) {
      Animated.spring(indicatorAnim, {
        toValue: tabLayouts[currentActiveKey].x,
        useNativeDriver: false,
        tension: 100,
        friction: 8,
      }).start();
    }
  }, [currentActiveKey, tabLayouts, animated]);

  const handleTabPress = (key: string) => {
    const item = items.find(item => item.key === key);
    if (item?.disabled) return;

    setCurrentActiveKey(key);
    onChange?.(key);
  };

  const handleTabLayout = (key: string, event: any) => {
    const { x, width } = event.nativeEvent.layout;
    setTabLayouts(prev => ({
      ...prev,
      [key]: { x, width },
    }));
  };

  const getTabBarStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.tabBar,
      ...(variant === 'card' && styles.cardTabBar),
      ...(variant === 'pills' && styles.pillsTabBar),
      ...(centered && !scrollable && styles.centeredTabBar),
    };

    return {
      ...baseStyle,
      ...tabBarStyle,
    };
  };

  const getTabStyle = (item: TabItem, isActive: boolean): ViewStyle => {
    const sizeStyles = {
      small: styles.smallTab,
      medium: styles.mediumTab,
      large: styles.largeTab,
    };

    const variantStyles = {
      default: isActive ? styles.activeDefaultTab : styles.defaultTab,
      pills: isActive ? styles.activePillTab : styles.pillTab,
      underline: isActive ? styles.activeUnderlineTab : styles.underlineTab,
      card: isActive ? styles.activeCardTab : styles.cardTab,
      button: isActive ? styles.activeButtonTab : styles.buttonTab,
    };

    return {
      ...styles.tab,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(item.disabled && styles.disabledTab),
      ...tabStyle,
      ...(isActive && activeTabStyle),
    };
  };

  const getTabTextStyle = (item: TabItem, isActive: boolean): TextStyle => {
    const sizeStyles = {
      small: styles.smallTabText,
      medium: styles.mediumTabText,
      large: styles.largeTabText,
    };

    return {
      ...styles.tabText,
      ...sizeStyles[size],
      ...(isActive && styles.activeTabText),
      ...(item.disabled && styles.disabledTabText),
      ...tabTextStyle,
      ...(isActive && activeTabTextStyle),
    };
  };

  const renderIndicator = () => {
    if (variant !== 'underline' || !animated || !tabLayouts[currentActiveKey]) {
      return null;
    }

    return (
      <Animated.View
        style={{
          ...styles.indicator,
          left: indicatorAnim,
          width: tabLayouts[currentActiveKey]?.width || 0,
          ...indicatorStyle,
        }}
      />
    );
  };

  const renderBadge = (item: TabItem) => {
    if (!item.badge) return null;

    return (
      <View style={{ ...styles.badge, ...badgeStyle }}>
        <Text style={{ ...styles.badgeText, ...badgeTextStyle }}>
          {item.badge}
        </Text>
      </View>
    );
  };

  const renderTab = (item: TabItem) => {
    const isActive = item.key === currentActiveKey;

    return (
      <TouchableOpacity
        key={item.key}
        style={getTabStyle(item, isActive)}
        onPress={() => handleTabPress(item.key)}
        onLayout={(event) => handleTabLayout(item.key, event)}
        disabled={item.disabled}
        activeOpacity={0.7}
      >
        <View style={styles.tabContent}>
          {item.icon && (
            <View style={styles.tabIcon}>
              {item.icon}
            </View>
          )}
          <Text style={getTabTextStyle(item, isActive)}>
            {item.title}
          </Text>
          {renderBadge(item)}
        </View>
      </TouchableOpacity>
    );
  };

  const renderTabBar = () => {
    const TabContainer = scrollable ? ScrollView : View;
    const containerProps = scrollable
      ? {
          ref: scrollViewRef,
          horizontal: true,
          showsHorizontalScrollIndicator: false,
          contentContainerStyle: centered ? styles.centeredScrollContent : undefined,
        }
      : {};

    return (
      <View style={getTabBarStyle()}>
        <TabContainer {...containerProps}>
          <View style={scrollable ? styles.scrollableTabContainer : styles.tabContainer}>
            {items.map(renderTab)}
          </View>
        </TabContainer>
        {renderIndicator()}
      </View>
    );
  };

  const renderContent = () => {
    if (!showContent) return null;

    const activeItem = items.find(item => item.key === currentActiveKey);
    if (!activeItem?.content) return null;

    return (
      <View style={{ ...styles.content, ...contentStyle }}>
        {activeItem.content}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {position === 'top' && renderTabBar()}
      {renderContent()}
      {position === 'bottom' && renderTabBar()}
    </View>
  );
};

// 预设组件
export const SegmentedControl: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="pills" />
);

export const UnderlineTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="underline" />
);

export const CardTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="card" />
);

export const ButtonTabs: React.FC<Omit<TabsProps, 'variant'>> = (props) => (
  <Tabs {...props} variant="button" />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    position: 'relative',
  } as ViewStyle,
  cardTabBar: {
    backgroundColor: colors.gray[50],
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  pillsTabBar: {
    backgroundColor: colors.gray[100],
    borderBottomWidth: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    margin: spacing.md,
  } as ViewStyle,
  centeredTabBar: {
    justifyContent: 'center',
  } as ViewStyle,
  tabContainer: {
    flexDirection: 'row',
  } as ViewStyle,
  scrollableTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  centeredScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  } as ViewStyle,
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  smallTab: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  } as ViewStyle,
  mediumTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  } as ViewStyle,
  largeTab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  } as ViewStyle,
  defaultTab: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeDefaultTab: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  pillTab: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  } as ViewStyle,
  activePillTab: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  underlineTab: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  } as ViewStyle,
  activeUnderlineTab: {
    backgroundColor: 'transparent',
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  } as ViewStyle,
  cardTab: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.gray[200],
  } as ViewStyle,
  activeCardTab: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.primary,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  buttonTab: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  } as ViewStyle,
  activeButtonTab: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    marginHorizontal: spacing.xs,
  } as ViewStyle,
  disabledTab: {
    opacity: 0.5,
  } as ViewStyle,
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  } as ViewStyle,
  tabIcon: {
    marginRight: spacing.xs,
  } as ViewStyle,
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.gray[600],
  } as TextStyle,
  smallTabText: {
    fontSize: 14,
  } as TextStyle,
  mediumTabText: {
    fontSize: 16,
  } as TextStyle,
  largeTabText: {
    fontSize: 18,
  } as TextStyle,
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  } as TextStyle,
  disabledTabText: {
    color: colors.gray[400],
  } as TextStyle,
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    backgroundColor: colors.primary,
  } as ViewStyle,
  badge: {
    position: 'absolute',
    top: -spacing.xs,
    right: -spacing.sm,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  } as ViewStyle,
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  } as TextStyle,
  content: {
    flex: 1,
    padding: spacing.md,
  } as ViewStyle,
});

export default Tabs;
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, spacing } from '../../styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth } = Dimensions.get('window');

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

interface TabItem {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const tabItems: TabItem[] = [
  {
    name: 'index',
    icon: 'home-outline',
    activeIcon: 'home',
    label: '首页',
  },
  {
    name: 'moments',
    icon: 'heart-outline',
    activeIcon: 'heart',
    label: '时光',
  },
  {
    name: 'create',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
    label: '记录',
  },
  {
    name: 'map',
    icon: 'location-outline',
    activeIcon: 'location',
    label: '地图',
  },
  {
    name: 'profile',
    icon: 'person-outline',
    activeIcon: 'person',
    label: '我的',
  },
];

export const TabBar: React.FC<TabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();

  const handleTabPress = (route: any, index: number) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const handleTabLongPress = (route: any) => {
    navigation.emit({
      type: 'tabLongPress',
      target: route.key,
    });
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const tabItem = tabItems.find(item => item.name === route.name);
          if (!tabItem) return null;

          const isCreateTab = route.name === 'create';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={() => handleTabPress(route, index)}
              onLongPress={() => handleTabLongPress(route)}
              style={[
                styles.tabItem,
                isCreateTab && styles.createTabItem,
              ]}
              activeOpacity={0.7}
            >
              {isCreateTab ? (
                <View style={styles.createButton}>
                  <Ionicons
                    name={isFocused ? tabItem.activeIcon : tabItem.icon}
                    size={28}
                    color={colors.white}
                  />
                </View>
              ) : (
                <>
                  <View style={[styles.iconContainer, isFocused && styles.activeIconContainer]}>
                    <Ionicons
                      name={isFocused ? tabItem.activeIcon : tabItem.icon}
                      size={24}
                      color={isFocused ? colors.primary : colors.gray500}
                    />
                  </View>
                  <Text
                    style={[
                      styles.tabLabel,
                      isFocused ? styles.activeTabLabel : styles.inactiveTabLabel,
                    ]}
                  >
                    {tabItem.label}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    paddingHorizontal: spacing.sm,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  createTabItem: {
    marginTop: -20,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 2,
  },
  activeIconContainer: {
    transform: [{ scale: 1.1 }],
  },

  createButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  activeTabLabel: {
    color: colors.primary,
  },
  inactiveTabLabel: {
    color: colors.gray500,
  },
});
import React from 'react';
import { View, Text } from 'react-native';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAppSelector } from '../hooks';
import { LoginScreen } from '../screens/LoginScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AccessibilitySettingsScreen } from '../screens/AccessibilitySettingsScreen';
import LanguageSettingsScreen from '../screens/LanguageSettingsScreen';
import { DeveloperScreen } from '../screens/DeveloperScreen';
import { AchievementScreen } from '../screens/achievement/AchievementScreen';
import StatsScreen from '../screens/StatsScreen';
import { colors } from '../styles';
import { AccessibilityProvider } from '../contexts/AccessibilityContext';
import { I18nProvider } from '../contexts/I18nContext';
import ProfileNavigator from './ProfileNavigator';
import MomentNavigator, { MomentStackParamList } from './MomentNavigator';
import MapScreen from '../../app/(tabs)/map';

// 定义导航参数类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Stats: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Map: undefined;
  Records: NavigatorScreenParams<MomentStackParamList>;
  Achievements: undefined;
  Profile: undefined;
  AccessibilitySettings: undefined;
  LanguageSettings: undefined;
  Developer: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// 认证导航器
const AuthNavigator = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      {/* 其他认证相关屏幕将在后续添加 */}
    </AuthStack.Navigator>
  );
};

// 主导航器（底部标签）
const MainNavigator = () => {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="🏠" color={color} size={size} />
          ),
        }}
      />
      {/* 其他主要屏幕将在后续添加 */}
      <MainTab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: '地图',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="🗺️" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Records"
        component={MomentNavigator}
        options={{
          tabBarLabel: '记录',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="📝" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
        name="Achievements"
        component={AchievementScreen}
        options={{
          tabBarLabel: '成就',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="🏆" color={color} size={size} />
          ),
        }}
      />
      <MainTab.Screen
          name="Profile"
          component={ProfileNavigator}
          options={{
            title: '我的',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="👤" color={color} size={size} />
            ),
          }}
        />
        <MainTab.Screen
          name="AccessibilitySettings"
          component={AccessibilitySettingsScreen}
          options={{
            title: '无障碍',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="♿" color={color} size={size} />
            ),
          }}
        />
        <MainTab.Screen
          name="LanguageSettings"
          component={LanguageSettingsScreen}
          options={{
            title: '语言设置',
            tabBarIcon: ({ color, size }) => (
              <TabIcon name="🌐" color={color} size={size} />
            ),
          }}
        />
        {__DEV__ && (
          <MainTab.Screen
            name="Developer"
            component={DeveloperScreen}
            options={{
              title: '开发者工具',
              tabBarIcon: ({ color, size }) => (
                <TabIcon name="⚙️" color={color} size={size} />
              ),
            }}
          />
        )}
    </MainTab.Navigator>
  );
};

// 临时占位屏幕组件
const PlaceholderScreen = () => {
  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    }}>
      <Text style={{
        fontSize: 18,
        color: colors.textSecondary,
      }}>
        功能开发中...
      </Text>
    </View>
  );
};

// 简单的图标组件
interface TabIconProps {
  name: string;
  color: string;
  size: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, color, size }) => {
  return (
    <Text style={{
      fontSize: size,
      color: color,
    }}>
      {name}
    </Text>
  );
};

// 根导航器
export const AppNavigator = () => {
  const { isAuthenticated } = useAppSelector(state => state.auth);

  return (
    <I18nProvider>
      <AccessibilityProvider>
        <NavigationContainer>
          <RootStack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            {isAuthenticated ? (
              <>
                <RootStack.Screen name="Main" component={MainNavigator} />
                <RootStack.Screen 
                  name="Stats" 
                  component={StatsScreen}
                  options={{
                    headerShown: true,
                    title: '统计分析',
                    animation: 'slide_from_right',
                  }}
                />
              </>
            ) : (
              <RootStack.Screen name="Auth" component={AuthNavigator} />
            )}
          </RootStack.Navigator>
        </NavigationContainer>
      </AccessibilityProvider>
    </I18nProvider>
  );
};
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 主题类型定义
export type ThemeMode = 'light' | 'dark' | 'system';

export interface Theme {
  colors: {
    // 主色调
    primary: string;
    primaryLight: string;
    primaryDark: string;
    
    // 辅助色
    secondary: string;
    secondaryLight: string;
    secondaryDark: string;
    
    // 中性色
    white: string;
    black: string;
    gray50: string;
    gray100: string;
    gray200: string;
    gray300: string;
    gray400: string;
    gray500: string;
    gray600: string;
    gray700: string;
    gray800: string;
    gray900: string;
    
    // 状态色
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // 背景色
    background: string;
    backgroundSecondary: string;
    surface: string;
    
    // 文本色
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    
    // 边框色
    border: string;
    borderLight: string;
    borderDark: string;
    
    // 阴影色
    shadow: string;
    shadowDark: string;
  };
}

// 浅色主题
export const lightTheme: Theme = {
  colors: {
    // 主色调
    primary: '#6366F1',
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    
    // 辅助色
    secondary: '#EC4899',
    secondaryLight: '#F472B6',
    secondaryDark: '#DB2777',
    
    // 中性色
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#F9FAFB',
    gray100: '#F3F4F6',
    gray200: '#E5E7EB',
    gray300: '#D1D5DB',
    gray400: '#9CA3AF',
    gray500: '#6B7280',
    gray600: '#4B5563',
    gray700: '#374151',
    gray800: '#1F2937',
    gray900: '#111827',
    
    // 状态色
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
    
    // 背景色
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    surface: '#FFFFFF',
    
    // 文本色
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    textTertiary: '#9CA3AF',
    textInverse: '#FFFFFF',
    
    // 边框色
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    borderDark: '#D1D5DB',
    
    // 阴影色
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowDark: 'rgba(0, 0, 0, 0.25)',
  },
};

// 深色主题
export const darkTheme: Theme = {
  colors: {
    // 主色调
    primary: '#818CF8',
    primaryLight: '#A5B4FC',
    primaryDark: '#6366F1',
    
    // 辅助色
    secondary: '#F472B6',
    secondaryLight: '#F9A8D4',
    secondaryDark: '#EC4899',
    
    // 中性色
    white: '#FFFFFF',
    black: '#000000',
    gray50: '#1F2937',
    gray100: '#374151',
    gray200: '#4B5563',
    gray300: '#6B7280',
    gray400: '#9CA3AF',
    gray500: '#D1D5DB',
    gray600: '#E5E7EB',
    gray700: '#F3F4F6',
    gray800: '#F9FAFB',
    gray900: '#FFFFFF',
    
    // 状态色
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    info: '#60A5FA',
    
    // 背景色
    background: '#111827',
    backgroundSecondary: '#1F2937',
    surface: '#374151',
    
    // 文本色
    textPrimary: '#F9FAFB',
    textSecondary: '#D1D5DB',
    textTertiary: '#9CA3AF',
    textInverse: '#111827',
    
    // 边框色
    border: '#4B5563',
    borderLight: '#374151',
    borderDark: '#6B7280',
    
    // 阴影色
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowDark: 'rgba(0, 0, 0, 0.5)',
  },
};

// 主题上下文接口
interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // 计算当前是否为深色模式
  const isDark = 
    themeMode === 'dark' || 
    (themeMode === 'system' && systemColorScheme === 'dark');

  // 获取当前主题
  const theme = isDark ? darkTheme : lightTheme;

  // 初始化主题设置
  useEffect(() => {
    const loadThemeMode = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('themeMode');
        if (savedMode && ['light', 'dark', 'system'].includes(savedMode)) {
          setThemeModeState(savedMode as ThemeMode);
        }
      } catch (error) {
        console.warn('Failed to load theme mode:', error);
      }
    };

    loadThemeMode();
  }, []);

  // 监听系统主题变化
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // 设置主题模式
  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.warn('Failed to save theme mode:', error);
    }
  };

  // 切换主题
  const toggleTheme = () => {
    const newMode = isDark ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  const value: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// 使用主题的 Hook
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 导出主题相关的工具函数
export const getThemeColors = (isDark: boolean) => {
  return isDark ? darkTheme.colors : lightTheme.colors;
};

export const createThemedStyles = <T extends Record<string, any>>(
  styleCreator: (theme: Theme) => T
) => {
  return (theme: Theme) => styleCreator(theme);
};
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { AccessibilityState, AccessibilityUtils } from '../utils/accessibility';

// 无障碍上下文类型
interface AccessibilityContextType {
  // 状态
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  reduceTransparencyEnabled: boolean;
  highContrastEnabled: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'extra-large';
  
  // 方法
  announceForAccessibility: (message: string) => void;
  setAccessibilityFocus: (reactTag: number) => void;
  updateFontSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  toggleHighContrast: () => void;
  
  // 辅助方法
  generateAccessibilityLabel: (text: string, role?: string, state?: string) => string;
  generateAccessibilityHint: (action: string, result?: string) => string;
  
  // 主题相关
  getAccessibleColors: () => AccessibleColors;
  getAccessibleFontSizes: () => AccessibleFontSizes;
}

// 可访问的颜色主题
interface AccessibleColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  success: string;
  warning: string;
  focus: string;
}

// 可访问的字体大小
interface AccessibleFontSizes {
  small: number;
  medium: number;
  large: number;
  extraLarge: number;
  title: number;
  subtitle: number;
  caption: number;
}

// 创建上下文
const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

// 无障碍提供者组件
interface AccessibilityProviderProps {
  children: React.ReactNode;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [reduceTransparencyEnabled, setReduceTransparencyEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large' | 'extra-large'>('medium');

  // 初始化无障碍状态
  useEffect(() => {
    const initializeAccessibility = async () => {
      try {
        const screenReader = await AccessibilityUtils.isScreenReaderEnabled();
        const reduceMotion = await AccessibilityUtils.isReduceMotionEnabled();
        const reduceTransparency = await AccessibilityUtils.isReduceTransparencyEnabled();
        
        setScreenReaderEnabled(screenReader);
        setReduceMotionEnabled(reduceMotion);
        setReduceTransparencyEnabled(reduceTransparency);
        
        // 从本地存储加载用户偏好
        // 这里可以添加 AsyncStorage 来持久化用户设置
      } catch (error) {
        console.warn('初始化无障碍设置失败:', error);
      }
    };

    initializeAccessibility();
  }, []);

  // 宣布消息
  const announceForAccessibility = useCallback((message: string) => {
    AccessibilityUtils.announceForAccessibility(message);
  }, []);

  // 设置无障碍焦点
  const setAccessibilityFocus = useCallback((reactTag: number) => {
    AccessibilityUtils.setAccessibilityFocus(reactTag);
  }, []);

  // 更新字体大小
  const updateFontSize = useCallback((size: 'small' | 'medium' | 'large' | 'extra-large') => {
    setFontSize(size);
    announceForAccessibility(`字体大小已更改为${size}`);
    // 这里可以保存到 AsyncStorage
  }, [announceForAccessibility]);

  // 切换高对比度
  const toggleHighContrast = useCallback(() => {
    setHighContrastEnabled(prev => {
      const newValue = !prev;
      announceForAccessibility(`高对比度模式已${newValue ? '开启' : '关闭'}`);
      return newValue;
    });
    // 这里可以保存到 AsyncStorage
  }, [announceForAccessibility]);

  // 生成无障碍标签
  const generateAccessibilityLabel = useCallback((text: string, role?: string, state?: string) => {
    return AccessibilityUtils.generateAccessibilityLabel(text, role, state);
  }, []);

  // 生成无障碍提示
  const generateAccessibilityHint = useCallback((action: string, result?: string) => {
    return AccessibilityUtils.generateAccessibilityHint(action, result);
  }, []);

  // 获取可访问的颜色
  const getAccessibleColors = useCallback((): AccessibleColors => {
    if (highContrastEnabled) {
      return {
        primary: '#000000',
        secondary: '#333333',
        background: '#FFFFFF',
        surface: '#FFFFFF',
        text: '#000000',
        textSecondary: '#333333',
        border: '#000000',
        error: '#CC0000',
        success: '#006600',
        warning: '#CC6600',
        focus: '#0066CC',
      };
    }
    
    return {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#F2F2F7',
      surface: '#FFFFFF',
      text: '#000000',
      textSecondary: '#3C3C43',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      focus: '#007AFF',
    };
  }, [highContrastEnabled]);

  // 获取可访问的字体大小
  const getAccessibleFontSizes = useCallback((): AccessibleFontSizes => {
    const baseMultiplier = {
      'small': 0.875,
      'medium': 1,
      'large': 1.125,
      'extra-large': 1.25,
    }[fontSize];

    return {
      small: 12 * baseMultiplier,
      medium: 14 * baseMultiplier,
      large: 16 * baseMultiplier,
      extraLarge: 18 * baseMultiplier,
      title: 24 * baseMultiplier,
      subtitle: 20 * baseMultiplier,
      caption: 10 * baseMultiplier,
    };
  }, [fontSize]);

  const contextValue: AccessibilityContextType = {
    // 状态
    screenReaderEnabled,
    reduceMotionEnabled,
    reduceTransparencyEnabled,
    highContrastEnabled,
    fontSize,
    
    // 方法
    announceForAccessibility,
    setAccessibilityFocus,
    updateFontSize,
    toggleHighContrast,
    
    // 辅助方法
    generateAccessibilityLabel,
    generateAccessibilityHint,
    
    // 主题相关
    getAccessibleColors,
    getAccessibleFontSizes,
  };

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  );
};

// 使用无障碍上下文的 Hook
export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// 无障碍设置组件
export const AccessibilitySettings: React.FC = () => {
  const {
    fontSize,
    highContrastEnabled,
    updateFontSize,
    toggleHighContrast,
    announceForAccessibility,
  } = useAccessibility();

  return (
    <View style={{ padding: 16 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: '600',
          marginBottom: 16,
          color: '#333',
        }}
        accessible={true}
        accessibilityRole="header"
      >
        无障碍设置
      </Text>
      
      {/* 字体大小设置 */}
      <View style={{ marginBottom: 24 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 8,
            color: '#333',
          }}
        >
          字体大小
        </Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
            <TouchableOpacity
              key={size}
              style={{
                padding: 12,
                marginRight: 8,
                marginBottom: 8,
                backgroundColor: fontSize === size ? '#007AFF' : '#F2F2F7',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: fontSize === size ? '#007AFF' : '#C6C6C8',
              }}
              onPress={() => updateFontSize(size)}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`字体大小 ${size}`}
              accessibilityHint="双击选择此字体大小"
              accessibilityState={{
                selected: fontSize === size,
              }}
            >
              <Text
                style={{
                  color: fontSize === size ? '#FFFFFF' : '#333',
                  fontSize: {
                    'small': 12,
                    'medium': 14,
                    'large': 16,
                    'extra-large': 18,
                  }[size],
                }}
              >
                {{
                  'small': '小',
                  'medium': '中',
                  'large': '大',
                  'extra-large': '特大',
                }[size]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      {/* 高对比度设置 */}
      <View style={{ marginBottom: 24 }}>
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 16,
            backgroundColor: '#F2F2F7',
            borderRadius: 8,
          }}
          onPress={toggleHighContrast}
          accessible={true}
          accessibilityRole="switch"
          accessibilityLabel="高对比度模式"
          accessibilityHint="双击切换高对比度模式"
          accessibilityState={{
            checked: highContrastEnabled,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: '#333',
              flex: 1,
            }}
          >
            高对比度模式
          </Text>
          
          <View
            style={{
              width: 50,
              height: 30,
              borderRadius: 15,
              backgroundColor: highContrastEnabled ? '#007AFF' : '#C6C6C8',
              justifyContent: 'center',
              alignItems: highContrastEnabled ? 'flex-end' : 'flex-start',
              paddingHorizontal: 2,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: '#FFFFFF',
              }}
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// 导入缺失的组件
import { View, Text, TouchableOpacity } from 'react-native';
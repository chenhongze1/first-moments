import { AccessibilityInfo, findNodeHandle } from 'react-native';
import { useEffect, useRef, useCallback } from 'react';

// 无障碍工具类
export class AccessibilityUtils {
  // 检查屏幕阅读器是否启用
  public static async isScreenReaderEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isScreenReaderEnabled();
    } catch (error) {
      console.warn('检查屏幕阅读器状态失败:', error);
      return false;
    }
  }

  // 检查是否启用了减少动画
  public static async isReduceMotionEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceMotionEnabled();
    } catch (error) {
      console.warn('检查减少动画状态失败:', error);
      return false;
    }
  }

  // 检查是否启用了减少透明度
  public static async isReduceTransparencyEnabled(): Promise<boolean> {
    try {
      return await AccessibilityInfo.isReduceTransparencyEnabled();
    } catch (error) {
      console.warn('检查减少透明度状态失败:', error);
      return false;
    }
  }

  // 宣布消息给屏幕阅读器
  public static announceForAccessibility(message: string): void {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch (error) {
      console.warn('无障碍宣布失败:', error);
    }
  }

  // 设置焦点到指定元素
  public static setAccessibilityFocus(reactTag: number): void {
    try {
      AccessibilityInfo.setAccessibilityFocus(reactTag);
    } catch (error) {
      console.warn('设置无障碍焦点失败:', error);
    }
  }

  // 生成无障碍标签
  public static generateAccessibilityLabel(
    text: string,
    role?: string,
    state?: string
  ): string {
    let label = text;
    if (role) {
      label += `, ${role}`;
    }
    if (state) {
      label += `, ${state}`;
    }
    return label;
  }

  // 生成无障碍提示
  public static generateAccessibilityHint(
    action: string,
    result?: string
  ): string {
    let hint = action;
    if (result) {
      hint += `, ${result}`;
    }
    return hint;
  }
}

// 无障碍状态管理
export class AccessibilityState {
  private static screenReaderEnabled: boolean = false;
  private static reduceMotionEnabled: boolean = false;
  private static reduceTransparencyEnabled: boolean = false;
  private static listeners: Set<(state: AccessibilityStateType) => void> = new Set();

  private static screenReaderSubscription: any = null;
  private static reduceMotionSubscription: any = null;
  private static reduceTransparencySubscription: any = null;

  public static async initialize(): Promise<void> {
    try {
      this.screenReaderEnabled = await AccessibilityUtils.isScreenReaderEnabled();
      this.reduceMotionEnabled = await AccessibilityUtils.isReduceMotionEnabled();
      this.reduceTransparencyEnabled = await AccessibilityUtils.isReduceTransparencyEnabled();

      // 监听屏幕阅读器状态变化
      this.screenReaderSubscription = AccessibilityInfo.addEventListener('screenReaderChanged', this.handleScreenReaderChange);
      this.reduceMotionSubscription = AccessibilityInfo.addEventListener('reduceMotionChanged', this.handleReduceMotionChange);
      this.reduceTransparencySubscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', this.handleReduceTransparencyChange);
    } catch (error) {
      console.warn('初始化无障碍状态失败:', error);
    }
  }

  public static destroy(): void {
    if (this.screenReaderSubscription) {
      this.screenReaderSubscription.remove();
      this.screenReaderSubscription = null;
    }
    if (this.reduceMotionSubscription) {
      this.reduceMotionSubscription.remove();
      this.reduceMotionSubscription = null;
    }
    if (this.reduceTransparencySubscription) {
      this.reduceTransparencySubscription.remove();
      this.reduceTransparencySubscription = null;
    }
    this.listeners.clear();
  }

  private static handleScreenReaderChange = (enabled: boolean) => {
    this.screenReaderEnabled = enabled;
    this.notifyListeners();
  };

  private static handleReduceMotionChange = (enabled: boolean) => {
    this.reduceMotionEnabled = enabled;
    this.notifyListeners();
  };

  private static handleReduceTransparencyChange = (enabled: boolean) => {
    this.reduceTransparencyEnabled = enabled;
    this.notifyListeners();
  };

  private static notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  public static getState(): AccessibilityStateType {
    return {
      screenReaderEnabled: this.screenReaderEnabled,
      reduceMotionEnabled: this.reduceMotionEnabled,
      reduceTransparencyEnabled: this.reduceTransparencyEnabled,
    };
  }

  public static addListener(listener: (state: AccessibilityStateType) => void): void {
    this.listeners.add(listener);
  }

  public static removeListener(listener: (state: AccessibilityStateType) => void): void {
    this.listeners.delete(listener);
  }
}

export interface AccessibilityStateType {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  reduceTransparencyEnabled: boolean;
}

// React Hook for accessibility state
export const useAccessibilityState = () => {
  const [state, setState] = useState<AccessibilityStateType>({
    screenReaderEnabled: false,
    reduceMotionEnabled: false,
    reduceTransparencyEnabled: false,
  });

  useEffect(() => {
    // 初始化状态
    const initializeState = async () => {
      await AccessibilityState.initialize();
      setState(AccessibilityState.getState());
    };

    initializeState();

    // 添加监听器
    const handleStateChange = (newState: AccessibilityStateType) => {
      setState(newState);
    };

    AccessibilityState.addListener(handleStateChange);

    return () => {
      AccessibilityState.removeListener(handleStateChange);
    };
  }, []);

  return state;
};

// React Hook for accessibility focus
export const useAccessibilityFocus = () => {
  const ref = useRef<any>(null);

  const setFocus = useCallback(() => {
    if (ref.current) {
      const reactTag = findNodeHandle(ref.current);
      if (reactTag) {
        AccessibilityUtils.setAccessibilityFocus(reactTag);
      }
    }
  }, []);

  return { ref, setFocus };
};

// React Hook for accessibility announcements
export const useAccessibilityAnnouncement = () => {
  const announce = useCallback((message: string) => {
    AccessibilityUtils.announceForAccessibility(message);
  }, []);

  return { announce };
};

// 键盘导航工具
export class KeyboardNavigationUtils {
  private static focusableElements: Set<any> = new Set();
  private static currentFocusIndex: number = -1;

  public static registerFocusableElement(element: any): void {
    this.focusableElements.add(element);
  }

  public static unregisterFocusableElement(element: any): void {
    this.focusableElements.delete(element);
  }

  public static focusNext(): void {
    const elements = Array.from(this.focusableElements);
    if (elements.length === 0) return;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % elements.length;
    const nextElement = elements[this.currentFocusIndex];
    if (nextElement && nextElement.focus) {
      nextElement.focus();
    }
  }

  public static focusPrevious(): void {
    const elements = Array.from(this.focusableElements);
    if (elements.length === 0) return;

    this.currentFocusIndex = this.currentFocusIndex <= 0 
      ? elements.length - 1 
      : this.currentFocusIndex - 1;
    const prevElement = elements[this.currentFocusIndex];
    if (prevElement && prevElement.focus) {
      prevElement.focus();
    }
  }

  public static clearFocus(): void {
    this.currentFocusIndex = -1;
  }
}

// React Hook for keyboard navigation
export const useKeyboardNavigation = () => {
  const elementRef = useRef<any>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (element) {
      KeyboardNavigationUtils.registerFocusableElement(element);
      return () => {
        KeyboardNavigationUtils.unregisterFocusableElement(element);
      };
    }
  }, []);

  const focusNext = useCallback(() => {
    KeyboardNavigationUtils.focusNext();
  }, []);

  const focusPrevious = useCallback(() => {
    KeyboardNavigationUtils.focusPrevious();
  }, []);

  return {
    elementRef,
    focusNext,
    focusPrevious,
  };
};

// 导入缺失的依赖
import { useState } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// 触觉反馈类型
export enum HapticFeedbackType {
  // 轻微反馈
  Light = 'light',
  // 中等反馈
  Medium = 'medium',
  // 重度反馈
  Heavy = 'heavy',
  // 成功反馈
  Success = 'success',
  // 警告反馈
  Warning = 'warning',
  // 错误反馈
  Error = 'error',
  // 选择反馈
  Selection = 'selection',
  // 冲击反馈
  Impact = 'impact',
  // 通知反馈
  Notification = 'notification',
}

// 触觉反馈强度
export enum HapticIntensity {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
}

// 触觉反馈配置
interface HapticConfig {
  enabled: boolean;
  intensity: HapticIntensity;
  duration?: number;
}

// 默认配置
const defaultConfig: HapticConfig = {
  enabled: true,
  intensity: HapticIntensity.Medium,
};

// 触觉反馈管理器
export class HapticManager {
  private static config: HapticConfig = { ...defaultConfig };
  private static isSupported: boolean = Platform.OS === 'ios' || Platform.OS === 'android';

  // 设置配置
  static setConfig(config: Partial<HapticConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // 获取配置
  static getConfig(): HapticConfig {
    return { ...this.config };
  }

  // 启用触觉反馈
  static enable(): void {
    this.config.enabled = true;
  }

  // 禁用触觉反馈
  static disable(): void {
    this.config.enabled = false;
  }

  // 检查是否支持触觉反馈
  static isHapticSupported(): boolean {
    return this.isSupported;
  }

  // 触发触觉反馈
  static async trigger(type: HapticFeedbackType, intensity?: HapticIntensity): Promise<void> {
    if (!this.config.enabled || !this.isSupported) {
      return;
    }

    try {
      const feedbackIntensity = intensity || this.config.intensity;

      switch (type) {
        case HapticFeedbackType.Light:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;

        case HapticFeedbackType.Medium:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;

        case HapticFeedbackType.Heavy:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;

        case HapticFeedbackType.Success:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        case HapticFeedbackType.Warning:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;

        case HapticFeedbackType.Error:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;

        case HapticFeedbackType.Selection:
          await Haptics.selectionAsync();
          break;

        case HapticFeedbackType.Impact:
          const impactStyle = this.getImpactStyle(feedbackIntensity);
          await Haptics.impactAsync(impactStyle);
          break;

        case HapticFeedbackType.Notification:
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;

        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
      }
    } catch (error) {
      console.warn('Haptic feedback failed:', error);
    }
  }

  // 获取冲击样式
  private static getImpactStyle(intensity: HapticIntensity): Haptics.ImpactFeedbackStyle {
    switch (intensity) {
      case HapticIntensity.Light:
        return Haptics.ImpactFeedbackStyle.Light;
      case HapticIntensity.Medium:
        return Haptics.ImpactFeedbackStyle.Medium;
      case HapticIntensity.Heavy:
        return Haptics.ImpactFeedbackStyle.Heavy;
      default:
        return Haptics.ImpactFeedbackStyle.Medium;
    }
  }
}

// 便捷方法
export class HapticFeedback {
  // 轻微冲击
  static light(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 中等冲击
  static medium(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Medium);
  }

  // 重度冲击
  static heavy(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Heavy);
  }

  // 成功反馈
  static success(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Success);
  }

  // 警告反馈
  static warning(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Warning);
  }

  // 错误反馈
  static error(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Error);
  }

  // 选择反馈
  static selection(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Selection);
  }

  // 通知反馈
  static notification(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Notification);
  }

  // 按钮点击反馈
  static buttonPress(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 开关切换反馈
  static switchToggle(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Selection);
  }

  // 滑动反馈
  static swipe(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 长按反馈
  static longPress(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Medium);
  }

  // 拖拽开始反馈
  static dragStart(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Medium);
  }

  // 拖拽结束反馈
  static dragEnd(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 刷新反馈
  static refresh(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 删除反馈
  static delete(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Heavy);
  }

  // 确认反馈
  static confirm(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Success);
  }

  // 取消反馈
  static cancel(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Warning);
  }

  // 输入反馈
  static input(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Selection);
  }

  // 导航反馈
  static navigation(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Light);
  }

  // 加载完成反馈
  static loadComplete(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Success);
  }

  // 网络错误反馈
  static networkError(): Promise<void> {
    return HapticManager.trigger(HapticFeedbackType.Error);
  }
}

// 触觉反馈模式
export class HapticPatterns {
  // 双击模式
  static async doubleTap(): Promise<void> {
    await HapticFeedback.light();
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 100);
  }

  // 三击模式
  static async tripleTap(): Promise<void> {
    await HapticFeedback.light();
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 100);
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 200);
  }

  // 渐强模式
  static async crescendo(): Promise<void> {
    await HapticFeedback.light();
    setTimeout(async () => {
      await HapticFeedback.medium();
    }, 150);
    setTimeout(async () => {
      await HapticFeedback.heavy();
    }, 300);
  }

  // 渐弱模式
  static async diminuendo(): Promise<void> {
    await HapticFeedback.heavy();
    setTimeout(async () => {
      await HapticFeedback.medium();
    }, 150);
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 300);
  }

  // 心跳模式
  static async heartbeat(): Promise<void> {
    await HapticFeedback.medium();
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 100);
    setTimeout(async () => {
      await HapticFeedback.medium();
    }, 600);
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 700);
  }

  // 警报模式
  static async alarm(): Promise<void> {
    for (let i = 0; i < 3; i++) {
      await HapticFeedback.heavy();
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  // 成功庆祝模式
  static async celebration(): Promise<void> {
    await HapticFeedback.success();
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 100);
    setTimeout(async () => {
      await HapticFeedback.light();
    }, 200);
    setTimeout(async () => {
      await HapticFeedback.medium();
    }, 300);
  }
}

// 触觉反馈Hook
export const useHapticFeedback = () => {
  const triggerHaptic = (type: HapticFeedbackType, intensity?: HapticIntensity) => {
    return HapticManager.trigger(type, intensity);
  };

  const isSupported = HapticManager.isHapticSupported();
  const config = HapticManager.getConfig();

  const setConfig = (newConfig: Partial<HapticConfig>) => {
    HapticManager.setConfig(newConfig);
  };

  return {
    triggerHaptic,
    isSupported,
    config,
    setConfig,
    // 便捷方法
    light: HapticFeedback.light,
    medium: HapticFeedback.medium,
    heavy: HapticFeedback.heavy,
    success: HapticFeedback.success,
    warning: HapticFeedback.warning,
    error: HapticFeedback.error,
    selection: HapticFeedback.selection,
    buttonPress: HapticFeedback.buttonPress,
    switchToggle: HapticFeedback.switchToggle,
    longPress: HapticFeedback.longPress,
    confirm: HapticFeedback.confirm,
    cancel: HapticFeedback.cancel,
  };
};

export default {
  HapticManager,
  HapticFeedback,
  HapticPatterns,
  HapticFeedbackType,
  HapticIntensity,
  useHapticFeedback,
};
import React from 'react';
import {
  NotificationData,
  NotificationType,
  NotificationPosition,
  NotificationAnimation,
} from '../components/ui/NotificationEnhanced';

// 通知队列项
interface NotificationQueueItem extends NotificationData {
  position: NotificationPosition;
  animation: NotificationAnimation;
  timestamp: number;
}

// 通知管理器配置
interface NotificationManagerConfig {
  maxNotifications: number;
  defaultDuration: number;
  defaultPosition: NotificationPosition;
  defaultAnimation: NotificationAnimation;
  stackNotifications: boolean;
  autoRemove: boolean;
}

// 默认配置
const defaultConfig: NotificationManagerConfig = {
  maxNotifications: 5,
  defaultDuration: 4000,
  defaultPosition: NotificationPosition.Top,
  defaultAnimation: NotificationAnimation.SlideDown,
  stackNotifications: true,
  autoRemove: true,
};

// 通知管理器类
class NotificationManagerClass {
  private notifications: NotificationQueueItem[] = [];
  private listeners: Array<(notifications: NotificationQueueItem[]) => void> = [];
  private config: NotificationManagerConfig = defaultConfig;
  private idCounter = 0;

  // 配置管理器
  configure(config: Partial<NotificationManagerConfig>) {
    this.config = { ...this.config, ...config };
  }

  // 获取配置
  getConfig(): NotificationManagerConfig {
    return { ...this.config };
  }

  // 添加监听器
  addListener(listener: (notifications: NotificationQueueItem[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 通知监听器
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // 生成唯一ID
  private generateId(): string {
    return `notification_${++this.idCounter}_${Date.now()}`;
  }

  // 显示通知
  show(
    notification: Omit<NotificationData, 'id'> & { id?: string },
    options?: {
      position?: NotificationPosition;
      animation?: NotificationAnimation;
    }
  ): string {
    const id = notification.id || this.generateId();
    const position = options?.position || this.config.defaultPosition;
    const animation = options?.animation || this.config.defaultAnimation;
    const duration = notification.duration || this.config.defaultDuration;

    const notificationItem: NotificationQueueItem = {
      ...notification,
      id,
      duration,
      position,
      animation,
      timestamp: Date.now(),
    };

    // 检查是否超过最大数量
    if (this.notifications.length >= this.config.maxNotifications) {
      if (this.config.autoRemove) {
        // 移除最旧的通知
        this.notifications.shift();
      } else {
        // 不添加新通知
        return id;
      }
    }

    // 添加到队列
    if (this.config.stackNotifications) {
      this.notifications.push(notificationItem);
    } else {
      // 替换现有通知
      this.notifications = [notificationItem];
    }

    this.notifyListeners();

    // 自动移除
    if (!notification.persistent && duration > 0) {
      setTimeout(() => {
        this.hide(id);
      }, duration);
    }

    return id;
  }

  // 隐藏通知
  hide(id: string) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      const notification = this.notifications[index];
      notification.onDismiss?.();
      this.notifications.splice(index, 1);
      this.notifyListeners();
    }
  }

  // 隐藏所有通知
  hideAll() {
    this.notifications.forEach(notification => {
      notification.onDismiss?.();
    });
    this.notifications = [];
    this.notifyListeners();
  }

  // 获取所有通知
  getAll(): NotificationQueueItem[] {
    return [...this.notifications];
  }

  // 获取特定位置的通知
  getByPosition(position: NotificationPosition): NotificationQueueItem[] {
    return this.notifications.filter(n => n.position === position);
  }

  // 更新通知
  update(id: string, updates: Partial<NotificationData>) {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index > -1) {
      this.notifications[index] = {
        ...this.notifications[index],
        ...updates,
      };
      this.notifyListeners();
    }
  }

  // 检查通知是否存在
  exists(id: string): boolean {
    return this.notifications.some(n => n.id === id);
  }

  // 清理过期通知
  cleanup() {
    const now = Date.now();
    const validNotifications = this.notifications.filter(notification => {
      if (notification.persistent) return true;
      if (!notification.duration) return true;
      return (now - notification.timestamp) < notification.duration;
    });

    if (validNotifications.length !== this.notifications.length) {
      this.notifications = validNotifications;
      this.notifyListeners();
    }
  }

  // 便捷方法 - 成功通知
  success(
    title: string,
    message?: string,
    options?: {
      duration?: number;
      position?: NotificationPosition;
      animation?: NotificationAnimation;
      action?: NotificationData['action'];
      onPress?: () => void;
    }
  ): string {
    return this.show({
      type: NotificationType.Success,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
      onPress: options?.onPress,
    }, {
      position: options?.position,
      animation: options?.animation,
    });
  }

  // 便捷方法 - 错误通知
  error(
    title: string,
    message?: string,
    options?: {
      duration?: number;
      position?: NotificationPosition;
      animation?: NotificationAnimation;
      persistent?: boolean;
      action?: NotificationData['action'];
      onPress?: () => void;
    }
  ): string {
    return this.show({
      type: NotificationType.Error,
      title,
      message,
      duration: options?.duration,
      persistent: options?.persistent,
      action: options?.action,
      onPress: options?.onPress,
    }, {
      position: options?.position,
      animation: options?.animation,
    });
  }

  // 便捷方法 - 警告通知
  warning(
    title: string,
    message?: string,
    options?: {
      duration?: number;
      position?: NotificationPosition;
      animation?: NotificationAnimation;
      action?: NotificationData['action'];
      onPress?: () => void;
    }
  ): string {
    return this.show({
      type: NotificationType.Warning,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
      onPress: options?.onPress,
    }, {
      position: options?.position,
      animation: options?.animation,
    });
  }

  // 便捷方法 - 信息通知
  info(
    title: string,
    message?: string,
    options?: {
      duration?: number;
      position?: NotificationPosition;
      animation?: NotificationAnimation;
      action?: NotificationData['action'];
      onPress?: () => void;
    }
  ): string {
    return this.show({
      type: NotificationType.Info,
      title,
      message,
      duration: options?.duration,
      action: options?.action,
      onPress: options?.onPress,
    }, {
      position: options?.position,
      animation: options?.animation,
    });
  }

  // 便捷方法 - 加载通知
  loading(
    title: string,
    message?: string,
    options?: {
      position?: NotificationPosition;
      animation?: NotificationAnimation;
    }
  ): string {
    return this.show({
      type: NotificationType.Info,
      title,
      message,
      persistent: true,
      icon: React.createElement('ActivityIndicator', { size: 'small' }),
    }, {
      position: options?.position,
      animation: options?.animation,
    });
  }

  // 便捷方法 - 进度通知
  progress(
    title: string,
    progress: number,
    options?: {
      message?: string;
      position?: NotificationPosition;
      animation?: NotificationAnimation;
      onComplete?: () => void;
    }
  ): string {
    const message = options?.message || `${Math.round(progress)}% 完成`;
    
    const id = this.show({
      type: NotificationType.Info,
      title,
      message,
      persistent: true,
    }, {
      position: options?.position,
      animation: options?.animation,
    });

    // 进度完成时自动隐藏
    if (progress >= 100) {
      setTimeout(() => {
        this.hide(id);
        options?.onComplete?.();
      }, 1000);
    }

    return id;
  }
}

// 导出单例实例
export const NotificationManager = new NotificationManagerClass();

// 导出类型
export type {
  NotificationQueueItem,
  NotificationManagerConfig,
};

// 导出默认配置
export { defaultConfig };

export default NotificationManager;
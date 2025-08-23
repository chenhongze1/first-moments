import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import NotificationEnhanced, {
  NotificationPosition,
} from './NotificationEnhanced';
import {
  NotificationManager,
  NotificationQueueItem,
} from '../../utils/notificationManager';

// 组件属性
interface NotificationContainerProps {
  // 可选的自定义样式
  style?: any;
  // 是否使用安全区域
  useSafeArea?: boolean;
  // 顶部偏移量
  topOffset?: number;
  // 底部偏移量
  bottomOffset?: number;
}

// 通知容器组件
export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  style,
  useSafeArea = true,
  topOffset = 0,
  bottomOffset = 0,
}) => {
  const [notifications, setNotifications] = useState<NotificationQueueItem[]>([]);

  useEffect(() => {
    // 监听通知变化
    const unsubscribe = NotificationManager.addListener((newNotifications) => {
      setNotifications(newNotifications);
    });

    // 获取初始通知
    setNotifications(NotificationManager.getAll());

    return unsubscribe;
  }, []);

  // 按位置分组通知
  const notificationsByPosition = {
    [NotificationPosition.Top]: notifications.filter(
      n => n.position === NotificationPosition.Top
    ),
    [NotificationPosition.Center]: notifications.filter(
      n => n.position === NotificationPosition.Center
    ),
    [NotificationPosition.Bottom]: notifications.filter(
      n => n.position === NotificationPosition.Bottom
    ),
  };

  // 处理通知隐藏
  const handleNotificationHide = (id: string) => {
    NotificationManager.hide(id);
  };

  // 渲染通知列表
  const renderNotifications = (notifications: NotificationQueueItem[], position: NotificationPosition) => {
    if (notifications.length === 0) return null;

    return (
      <View
        style={[
          styles.notificationGroup,
          position === NotificationPosition.Top && {
            top: useSafeArea ? (StatusBar.currentHeight || 0) + topOffset : topOffset,
          },
          position === NotificationPosition.Bottom && {
            bottom: bottomOffset,
          },
          position === NotificationPosition.Center && styles.centerGroup,
        ]}
      >
        {notifications.map((notification) => (
          <NotificationEnhanced
            key={notification.id}
            notification={notification}
            position={notification.position}
            animation={notification.animation}
            onHide={() => handleNotificationHide(notification.id)}
          />
        ))}
      </View>
    );
  };

  const Container = useSafeArea ? SafeAreaView : View;

  return (
    <Container style={[styles.container, style]} pointerEvents="box-none">
      {/* 顶部通知 */}
      {renderNotifications(
        notificationsByPosition[NotificationPosition.Top],
        NotificationPosition.Top
      )}

      {/* 中心通知 */}
      {renderNotifications(
        notificationsByPosition[NotificationPosition.Center],
        NotificationPosition.Center
      )}

      {/* 底部通知 */}
      {renderNotifications(
        notificationsByPosition[NotificationPosition.Bottom],
        NotificationPosition.Bottom
      )}
    </Container>
  );
};

// 样式
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  notificationGroup: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  centerGroup: {
    top: '50%',
    transform: [{ translateY: -50 }],
  },
});

export default NotificationContainer;
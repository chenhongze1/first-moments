import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Dimensions,
  PanResponder,
} from 'react-native';
import { AnimationUtils, AnimationConfig } from '../../utils/animations';
import { HapticFeedback } from '../../utils/haptics';

const { width: screenWidth } = Dimensions.get('window');

// 通知类型
export enum NotificationType {
  Success = 'success',
  Error = 'error',
  Warning = 'warning',
  Info = 'info',
  Default = 'default',
}

// 通知位置
export enum NotificationPosition {
  Top = 'top',
  Bottom = 'bottom',
  Center = 'center',
}

// 动画类型
export enum NotificationAnimation {
  SlideDown = 'slideDown',
  SlideUp = 'slideUp',
  SlideLeft = 'slideLeft',
  SlideRight = 'slideRight',
  Fade = 'fade',
  Scale = 'scale',
  Bounce = 'bounce',
}

// 通知数据接口
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    text: string;
    onPress: () => void;
  };
  icon?: React.ReactNode;
  onPress?: () => void;
  onDismiss?: () => void;
}

// 组件属性
interface NotificationEnhancedProps {
  notification: NotificationData;
  position?: NotificationPosition;
  animation?: NotificationAnimation;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;
  swipeToClose?: boolean;
  tapToClose?: boolean;
  showProgress?: boolean;
  onShow?: () => void;
  onHide?: () => void;
}

// 增强通知组件
export const NotificationEnhanced: React.FC<NotificationEnhancedProps> = ({
  notification,
  position = NotificationPosition.Top,
  animation = NotificationAnimation.SlideDown,
  style,
  titleStyle,
  messageStyle,
  swipeToClose = true,
  tapToClose = false,
  showProgress = true,
  onShow,
  onHide,
}) => {
  // 动画值
  const translateY = useRef(new Animated.Value(getInitialTranslateY())).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const progressWidth = useRef(new Animated.Value(100)).current;
  
  // 状态
  const [visible, setVisible] = useState(true);
  const [progressTimer, setProgressTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 获取初始位移值
  function getInitialTranslateY() {
    switch (position) {
      case NotificationPosition.Top:
        return -200;
      case NotificationPosition.Bottom:
        return 200;
      case NotificationPosition.Center:
        return 0;
      default:
        return -200;
    }
  }
  
  // 获取通知样式
  const getNotificationStyle = () => {
    const baseStyle = {
      backgroundColor: '#FFFFFF',
      borderLeftWidth: 4,
      borderLeftColor: '#007AFF',
    };
    
    switch (notification.type) {
      case NotificationType.Success:
        return {
          ...baseStyle,
          backgroundColor: '#F0F9FF',
          borderLeftColor: '#10B981',
        };
      case NotificationType.Error:
        return {
          ...baseStyle,
          backgroundColor: '#FEF2F2',
          borderLeftColor: '#EF4444',
        };
      case NotificationType.Warning:
        return {
          ...baseStyle,
          backgroundColor: '#FFFBEB',
          borderLeftColor: '#F59E0B',
        };
      case NotificationType.Info:
        return {
          ...baseStyle,
          backgroundColor: '#EFF6FF',
          borderLeftColor: '#3B82F6',
        };
      default:
        return baseStyle;
    }
  };
  
  // 获取文本颜色
  const getTextColor = () => {
    switch (notification.type) {
      case NotificationType.Success:
        return '#065F46';
      case NotificationType.Error:
        return '#991B1B';
      case NotificationType.Warning:
        return '#92400E';
      case NotificationType.Info:
        return '#1E40AF';
      default:
        return '#1F2937';
    }
  };
  
  // 手势处理
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return swipeToClose && Math.abs(gestureState.dx) > 10;
    },
    onPanResponderMove: (_, gestureState) => {
      if (swipeToClose) {
        translateX.setValue(gestureState.dx);
        const progress = Math.abs(gestureState.dx) / screenWidth;
        opacity.setValue(1 - progress * 0.5);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (swipeToClose) {
        const shouldDismiss = Math.abs(gestureState.dx) > screenWidth * 0.3;
        
        if (shouldDismiss) {
          hideNotification();
          HapticFeedback.success();
        } else {
          // 回弹
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(opacity, {
              toValue: 1,
              useNativeDriver: true,
            }),
          ]).start();
        }
      }
    },
  });
  
  // 显示通知
  const showNotification = () => {
    onShow?.();
    
    let showAnimation: Animated.CompositeAnimation;
    
    switch (animation) {
      case NotificationAnimation.SlideDown:
      case NotificationAnimation.SlideUp:
        showAnimation = Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: AnimationConfig.duration.normal,
            easing: AnimationConfig.easing.easeOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal),
        ]);
        break;
        
      case NotificationAnimation.SlideLeft:
        translateX.setValue(-screenWidth);
        showAnimation = Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: AnimationConfig.duration.normal,
            easing: AnimationConfig.easing.easeOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal),
        ]);
        break;
        
      case NotificationAnimation.SlideRight:
        translateX.setValue(screenWidth);
        showAnimation = Animated.parallel([
          Animated.timing(translateX, {
            toValue: 0,
            duration: AnimationConfig.duration.normal,
            easing: AnimationConfig.easing.easeOut,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal),
        ]);
        break;
        
      case NotificationAnimation.Fade:
        showAnimation = AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal);
        break;
        
      case NotificationAnimation.Scale:
        showAnimation = Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: AnimationConfig.duration.normal,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal),
        ]);
        break;
        
      case NotificationAnimation.Bounce:
        showAnimation = Animated.parallel([
          Animated.spring(translateY, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal),
        ]);
        break;
        
      default:
        showAnimation = AnimationUtils.fadeIn(opacity, AnimationConfig.duration.normal);
        break;
    }
    
    showAnimation.start();
    
    // 自动隐藏
    if (!notification.persistent && notification.duration) {
      // 进度条动画
      if (showProgress) {
        Animated.timing(progressWidth, {
          toValue: 0,
          duration: notification.duration,
          useNativeDriver: false,
        }).start();
      }
      
      const timer = setTimeout(() => {
        hideNotification();
      }, notification.duration);
      
      setProgressTimer(timer);
    }
  };
  
  // 隐藏通知
  const hideNotification = () => {
    if (progressTimer) {
      clearTimeout(progressTimer);
      setProgressTimer(null);
    }
    
    let hideAnimation: Animated.CompositeAnimation;
    
    switch (animation) {
      case NotificationAnimation.SlideDown:
        hideAnimation = Animated.parallel([
          Animated.timing(translateY, {
            toValue: -200,
            duration: AnimationConfig.duration.fast,
            easing: AnimationConfig.easing.easeIn,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      case NotificationAnimation.SlideUp:
        hideAnimation = Animated.parallel([
          Animated.timing(translateY, {
            toValue: 200,
            duration: AnimationConfig.duration.fast,
            easing: AnimationConfig.easing.easeIn,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      case NotificationAnimation.SlideLeft:
        hideAnimation = Animated.parallel([
          Animated.timing(translateX, {
            toValue: -screenWidth,
            duration: AnimationConfig.duration.fast,
            easing: AnimationConfig.easing.easeIn,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      case NotificationAnimation.SlideRight:
        hideAnimation = Animated.parallel([
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: AnimationConfig.duration.fast,
            easing: AnimationConfig.easing.easeIn,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      case NotificationAnimation.Fade:
        hideAnimation = AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast);
        break;
        
      case NotificationAnimation.Scale:
        hideAnimation = Animated.parallel([
          Animated.timing(scale, {
            toValue: 0.8,
            duration: AnimationConfig.duration.fast,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      case NotificationAnimation.Bounce:
        hideAnimation = Animated.parallel([
          Animated.timing(translateY, {
            toValue: getInitialTranslateY(),
            duration: AnimationConfig.duration.fast,
            easing: AnimationConfig.easing.easeIn,
            useNativeDriver: true,
          }),
          AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast),
        ]);
        break;
        
      default:
        hideAnimation = AnimationUtils.fadeOut(opacity, AnimationConfig.duration.fast);
        break;
    }
    
    hideAnimation.start(() => {
      setVisible(false);
      onHide?.();
      notification.onDismiss?.();
    });
  };
  
  // 处理点击
  const handlePress = () => {
    HapticFeedback.light();
    
    if (tapToClose) {
      hideNotification();
    } else {
      notification.onPress?.();
    }
  };
  
  // 处理关闭按钮
  const handleClose = () => {
    HapticFeedback.medium();
    hideNotification();
  };
  
  // 处理动作按钮
  const handleAction = () => {
    HapticFeedback.medium();
    notification.action?.onPress();
    hideNotification();
  };
  
  // 组件挂载时显示
  useEffect(() => {
    showNotification();
    
    return () => {
      if (progressTimer) {
        clearTimeout(progressTimer);
      }
    };
  }, []);
  
  if (!visible) return null;
  
  const notificationStyle = getNotificationStyle();
  const textColor = getTextColor();
  
  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        notificationStyle,
        {
          transform: [
            { translateY },
            { translateX },
            { scale },
          ],
          opacity,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        onPress={handlePress}
        activeOpacity={tapToClose ? 0.7 : 1}
      >
        {notification.icon && (
          <View style={styles.iconContainer}>
            {notification.icon}
          </View>
        )}
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: textColor }, titleStyle]}>
            {notification.title}
          </Text>
          {notification.message && (
            <Text style={[styles.message, { color: textColor }, messageStyle]}>
              {notification.message}
            </Text>
          )}
        </View>
        
        <View style={styles.actionsContainer}>
          {notification.action && (
            <TouchableOpacity
              style={[styles.actionButton, { borderColor: textColor }]}
              onPress={handleAction}
            >
              <Text style={[styles.actionText, { color: textColor }]}>
                {notification.action.text}
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleClose}
          >
            <Text style={[styles.closeText, { color: textColor }]}>×</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      
      {showProgress && !notification.persistent && notification.duration && (
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: textColor,
                width: progressWidth.interpolate({
                  inputRange: [0, 100],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      )}
    </Animated.View>
  );
};

// 样式
const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 6,
    marginRight: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBar: {
    height: '100%',
  },
});

export default NotificationEnhanced;
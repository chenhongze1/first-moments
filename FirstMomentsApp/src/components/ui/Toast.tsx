import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius, fontSize } from '../../styles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'warning' | 'info';
export type ToastPosition = 'top' | 'center' | 'bottom';

interface ToastProps {
  visible: boolean;
  message: string;
  type?: ToastType;
  position?: ToastPosition;
  duration?: number;
  onHide?: () => void;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  textStyle?: TextStyle;
  showCloseButton?: boolean;
  persistent?: boolean;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type = 'info',
  position = 'bottom',
  duration = 3000,
  onHide,
  action,
  style,
  textStyle,
  showCloseButton = false,
  persistent = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(getInitialSlideValue(position))).current;
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function getInitialSlideValue(pos: ToastPosition): number {
    switch (pos) {
      case 'top':
        return -100;
      case 'center':
        return 0;
      case 'bottom':
        return 100;
      default:
        return 100;
    }
  }

  useEffect(() => {
    if (visible) {
      show();
    } else {
      hide();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible]);

  const show = () => {
    setIsVisible(true);
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    if (!persistent && duration > 0) {
      timeoutRef.current = setTimeout(() => {
        hide();
      }, duration);
    }
  };

  const hide = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: getInitialSlideValue(position),
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onHide?.();
    });

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleClose = () => {
    hide();
  };

  const getToastStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.toast];

    switch (type) {
      case 'success':
        baseStyle.push(styles.successToast);
        break;
      case 'error':
        baseStyle.push(styles.errorToast);
        break;
      case 'warning':
        baseStyle.push(styles.warningToast);
        break;
      default:
        baseStyle.push(styles.infoToast);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.message];

    switch (type) {
      case 'success':
        baseStyle.push(styles.successText);
        break;
      case 'error':
        baseStyle.push(styles.errorText);
        break;
      case 'warning':
        baseStyle.push(styles.warningText);
        break;
      default:
        baseStyle.push(styles.infoText);
    }

    return baseStyle;
  };

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.container,
      ...getPositionStyle(),
    };

    return baseStyle;
  };

  const getPositionStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return {
          top: 50,
          justifyContent: 'flex-start',
        };
      case 'center':
        return {
          justifyContent: 'center',
        };
      case 'bottom':
      default:
        return {
          bottom: 50,
          justifyContent: 'flex-end',
        };
    }
  };

  if (!isVisible && !visible) {
    return null;
  }

  return (
    <View style={getContainerStyle()} pointerEvents="box-none">
      <Animated.View
        style={[
          getToastStyle(),
          style,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim,
              },
            ],
          },
        ]}
      >
        <View style={styles.content}>
          <Text style={[getTextStyle(), textStyle]} numberOfLines={3}>
            {message}
          </Text>

          {/* 操作按钮 */}
          {action && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <Text style={styles.actionText}>{action.label}</Text>
            </TouchableOpacity>
          )}

          {/* 关闭按钮 */}
          {showCloseButton && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

// Toast管理器
class ToastManager {
  private static instance: ToastManager;
  private toastRef: React.RefObject<any> | null = null;

  static getInstance(): ToastManager {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  setToastRef(ref: React.RefObject<any>) {
    this.toastRef = ref;
  }

  show(options: Omit<ToastProps, 'visible'>) {
    if (this.toastRef?.current) {
      this.toastRef.current.show(options);
    }
  }

  hide() {
    if (this.toastRef?.current) {
      this.toastRef.current.hide();
    }
  }

  success(message: string, options?: Partial<ToastProps>) {
    this.show({ ...options, message, type: 'success' });
  }

  error(message: string, options?: Partial<ToastProps>) {
    this.show({ ...options, message, type: 'error' });
  }

  warning(message: string, options?: Partial<ToastProps>) {
    this.show({ ...options, message, type: 'warning' });
  }

  info(message: string, options?: Partial<ToastProps>) {
    this.show({ ...options, message, type: 'info' });
  }
}

export const toastManager = ToastManager.getInstance();

// Toast容器组件
interface ToastContainerProps {
  children: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
  const toastRef = useRef<any>(null);

  useEffect(() => {
    toastManager.setToastRef(toastRef);
  }, []);

  const showToast = (options: Omit<ToastProps, 'visible'>) => {
    const id = Date.now().toString();
    const newToast = { ...options, id, visible: true };
    setToasts(prev => [...prev, newToast]);

    // 自动隐藏
    if (!options.persistent && options.duration !== 0) {
      setTimeout(() => {
        hideToast(id);
      }, options.duration || 3000);
    }
  };

  const hideToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const hideAllToasts = () => {
    setToasts([]);
  };

  // 暴露方法给ToastManager
  React.useImperativeHandle(toastRef, () => ({
    show: showToast,
    hide: hideAllToasts,
  }));

  return (
    <>
      {children}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onHide={() => hideToast(toast.id)}
        />
      ))}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  toast: {
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    maxWidth: screenWidth - spacing.md * 2,
    minWidth: 200,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  message: {
    flex: 1,
    fontSize: fontSize.base,
    lineHeight: 20,
  },
  actionButton: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  actionText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  closeButton: {
    marginLeft: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 18,
  },

  // 类型样式
  successToast: {
    backgroundColor: colors.success,
  },
  errorToast: {
    backgroundColor: colors.error,
  },
  warningToast: {
    backgroundColor: colors.warning,
  },
  infoToast: {
    backgroundColor: colors.info,
  },

  // 文本样式
  successText: {
    color: colors.white,
  },
  errorText: {
    color: colors.white,
  },
  warningText: {
    color: colors.white,
  },
  infoText: {
    color: colors.white,
  },
});

export default Toast;
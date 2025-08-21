import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { hideToast } from '../store/slices/uiSlice';
import { colors, fontSize, spacing, borderRadius } from '../styles';

const { width: screenWidth } = Dimensions.get('window');

interface ToastItemProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onHide: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({
  id,
  type,
  message,
  duration = 3000,
  onHide,
}) => {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // 显示动画
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // 自动隐藏
    const timer = setTimeout(() => {
      hideToastWithAnimation();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToastWithAnimation = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide(id);
    });
  };

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return styles.successToast;
      case 'error':
        return styles.errorToast;
      case 'warning':
        return styles.warningToast;
      case 'info':
      default:
        return styles.infoToast;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getToastStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToastWithAnimation}
        activeOpacity={0.9}
      >
        <Text style={styles.toastIcon}>{getIcon()}</Text>
        <Text style={styles.toastMessage} numberOfLines={3}>
          {message}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export const ToastContainer: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toasts } = useAppSelector((state: any) => state.ui);

  const handleHideToast = (id: string) => {
    dispatch(hideToast(id));
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast: any, index: number) => (
        <View
          key={toast.id}
          style={[styles.toastWrapper, { top: 60 + index * 80 }]}
        >
          <ToastItem
            id={toast.id}
            type={toast.type}
            message={toast.message}
            duration={toast.duration}
            onHide={handleHideToast}
          />
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  toastWrapper: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
  },
  toastContainer: {
    borderRadius: borderRadius.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    minHeight: 56,
  },
  toastIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  toastMessage: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.white,
    fontWeight: '500',
    lineHeight: 20,
  },
  
  // Toast类型样式
  successToast: {
    backgroundColor: '#10B981',
  },
  errorToast: {
    backgroundColor: '#EF4444',
  },
  warningToast: {
    backgroundColor: '#F59E0B',
  },
  infoToast: {
    backgroundColor: '#3B82F6',
  },
});

export default ToastContainer;
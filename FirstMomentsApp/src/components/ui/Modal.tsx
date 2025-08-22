import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal as RNModal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 临时样式定义，需要根据实际项目调整
const colors = {
  primary: { main: '#007AFF', light: '#E3F2FD' },
  success: { main: '#34C759' },
  error: { main: '#FF3B30' },
  warning: { main: '#FF9500' },
  text: { primary: '#000', secondary: '#666', disabled: '#999' },
  background: { paper: '#FFF', secondary: '#F5F5F5', overlay: 'rgba(0, 0, 0, 0.5)' },
  border: { main: '#E0E0E0' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const textStyles = { 
  h1: { fontSize: 24, fontWeight: '700' as const },
  h2: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16 }, 
  caption: { fontSize: 12 } 
};
const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16 };

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  position?: 'center' | 'bottom' | 'top';
  animationType?: 'fade' | 'slide' | 'none';
  closeOnBackdrop?: boolean;
  closeOnBackButton?: boolean;
  showCloseButton?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  overlayStyle?: ViewStyle;
  statusBarTranslucent?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  children,
  size = 'medium',
  position = 'center',
  animationType = 'fade',
  closeOnBackdrop = true,
  closeOnBackButton = true,
  showCloseButton = true,
  style,
  contentStyle,
  headerStyle,
  titleStyle,
  overlayStyle,
  statusBarTranslucent = false,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          width: screenWidth * 0.8,
          maxHeight: screenHeight * 0.4,
        };
      case 'large':
        return {
          width: screenWidth * 0.95,
          maxHeight: screenHeight * 0.8,
        };
      case 'fullscreen':
        return {
          width: screenWidth,
          height: screenHeight,
        };
      default:
        return {
          width: screenWidth * 0.9,
          maxHeight: screenHeight * 0.6,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 获取位置样式
  const getPositionStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      width: sizeConfig.width,
    };

    if (size === 'fullscreen') {
      return {
        ...baseStyle,
        height: sizeConfig.height,
        margin: 0,
        borderRadius: 0,
      };
    }

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          maxHeight: sizeConfig.maxHeight,
          marginTop: spacing.xl,
          marginHorizontal: spacing.lg,
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        };
      case 'bottom':
        return {
          ...baseStyle,
          maxHeight: sizeConfig.maxHeight,
          marginBottom: 0,
          marginHorizontal: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        };
      default:
        return {
          ...baseStyle,
          maxHeight: sizeConfig.maxHeight,
          margin: spacing.lg,
        };
    }
  };

  // 获取容器样式
  const getContainerStyle = (): ViewStyle => {
    switch (position) {
      case 'top':
        return {
          justifyContent: 'flex-start',
          alignItems: 'center',
        };
      case 'bottom':
        return {
          justifyContent: 'flex-end',
          alignItems: 'center',
        };
      default:
        return {
          justifyContent: 'center',
          alignItems: 'center',
        };
    }
  };

  // 动画效果
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  // 获取滑动变换
  const getSlideTransform = () => {
    switch (position) {
      case 'top':
        return {
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [-screenHeight, 0],
          }),
        };
      case 'bottom':
        return {
          translateY: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [screenHeight, 0],
          }),
        };
      default:
        return {
          scale: slideAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        };
    }
  };

  // 处理背景点击
  const handleBackdropPress = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeOnBackButton ? onClose : undefined}
      statusBarTranslucent={statusBarTranslucent}
    >
      {statusBarTranslucent && Platform.OS === 'android' && (
        <StatusBar backgroundColor="transparent" translucent />
      )}
      
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <Animated.View
          style={{
            ...styles.overlay,
            ...getContainerStyle(),
            ...overlayStyle,
            opacity: fadeAnim,
          }}
        >
          <TouchableWithoutFeedback>
            <Animated.View
              style={{
                ...styles.modal,
                ...getPositionStyle(),
                ...style,
                transform: animationType === 'slide' ? [getSlideTransform()] : [{ scale: slideAnim }],
              }}
            >
              {(title || showCloseButton) && (
                <View style={{ ...styles.header, ...headerStyle }}>
                  {title && (
                    <Text style={{ ...styles.title, ...titleStyle }}>
                      {title}
                    </Text>
                  )}
                  {showCloseButton && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close"
                        size={24}
                        color={colors.text.secondary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              )}
              
              <View style={{ ...styles.content, ...contentStyle }}>
                {children}
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.background.overlay,
  },
  modal: {
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    elevation: 10,
    boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.25)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    padding: spacing.lg,
  },
});

// 确认对话框
export interface ConfirmDialogProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  confirmButtonStyle?: ViewStyle;
  cancelButtonStyle?: ViewStyle;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  onClose,
  onConfirm,
  title = '确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  type = 'info',
  confirmButtonStyle,
  cancelButtonStyle,
}) => {
  const getTypeColor = () => {
    switch (type) {
      case 'warning':
        return colors.warning.main;
      case 'error':
        return colors.error.main;
      case 'success':
        return colors.success.main;
      default:
        return colors.primary.main;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={title}
      size="small"
      showCloseButton={false}
    >
      <View style={confirmStyles.container}>
        <Text style={confirmStyles.message}>{message}</Text>
        
        <View style={confirmStyles.buttonContainer}>
          <TouchableOpacity
            style={{ ...confirmStyles.button, ...confirmStyles.cancelButton, ...cancelButtonStyle }}
            onPress={onClose}
          >
            <Text style={confirmStyles.cancelButtonText}>{cancelText}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={{
              ...confirmStyles.button,
              ...confirmStyles.confirmButton,
              backgroundColor: getTypeColor(),
              ...confirmButtonStyle,
            }}
            onPress={handleConfirm}
          >
            <Text style={confirmStyles.confirmButtonText}>{confirmText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const confirmStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  message: {
    ...textStyles.body,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background.secondary,
    marginRight: spacing.sm,
  },
  confirmButton: {
    backgroundColor: colors.primary.main,
    marginLeft: spacing.sm,
  },
  cancelButtonText: {
    ...textStyles.body,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  confirmButtonText: {
    ...textStyles.body,
    color: colors.background.paper,
    fontWeight: '600',
  },
});

// 底部弹出框
export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number;
  showHandle?: boolean;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  height,
  showHandle = true,
  style,
  contentStyle,
}) => {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      position="bottom"
      animationType="slide"
      showCloseButton={false}
      style={{
        height: height || screenHeight * 0.5,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        ...style,
      }}
    >
      <View style={bottomSheetStyles.container}>
        {showHandle && (
          <View style={bottomSheetStyles.handle} />
        )}
        
        {title && (
          <View style={bottomSheetStyles.header}>
            <Text style={bottomSheetStyles.title}>{title}</Text>
          </View>
        )}
        
        <View style={{ ...bottomSheetStyles.content, ...contentStyle }}>
          {children}
        </View>
      </View>
    </Modal>
  );
};

const bottomSheetStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border.main,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
  },
  title: {
    ...textStyles.h2,
    color: colors.text.primary,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
});

export default Modal;
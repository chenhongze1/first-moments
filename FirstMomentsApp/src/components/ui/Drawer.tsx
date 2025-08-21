import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface DrawerProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  placement?: 'left' | 'right' | 'top' | 'bottom';
  width?: number | string;
  height?: number | string;
  maskClosable?: boolean;
  mask?: boolean;
  closable?: boolean;
  closeIcon?: React.ReactNode;
  headerStyle?: ViewStyle;
  bodyStyle?: ViewStyle;
  maskStyle?: ViewStyle;
  style?: ViewStyle;
  titleStyle?: TextStyle;
  footer?: React.ReactNode;
  footerStyle?: ViewStyle;
  destroyOnClose?: boolean;
  forceRender?: boolean;
  getContainer?: () => React.ReactNode;
  keyboard?: boolean;
  push?: boolean;
  size?: 'default' | 'large';
  extra?: React.ReactNode;
  onAfterVisibleChange?: (visible: boolean) => void;
}

const Drawer: React.FC<DrawerProps> = ({
  visible,
  onClose,
  children,
  title,
  placement = 'right',
  width,
  height,
  maskClosable = true,
  mask = true,
  closable = true,
  closeIcon,
  headerStyle,
  bodyStyle,
  maskStyle,
  style,
  titleStyle,
  footer,
  footerStyle,
  destroyOnClose = false,
  forceRender = false,
  keyboard = true,
  size = 'default',
  extra,
  onAfterVisibleChange,
}) => {
  const translateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const isHorizontal = placement === 'left' || placement === 'right';
  const isVertical = placement === 'top' || placement === 'bottom';

  const getDrawerSize = () => {
    if (isHorizontal) {
      if (width) {
        return typeof width === 'string' ? screenWidth * (parseInt(width) / 100) : width;
      }
      return size === 'large' ? screenWidth * 0.75 : screenWidth * 0.6;
    } else {
      if (height) {
        return typeof height === 'string' ? screenHeight * (parseInt(height) / 100) : height;
      }
      return size === 'large' ? screenHeight * 0.75 : screenHeight * 0.6;
    }
  };

  const drawerSize = getDrawerSize();

  const getInitialTranslate = () => {
    switch (placement) {
      case 'left':
        return -drawerSize;
      case 'right':
        return drawerSize;
      case 'top':
        return -drawerSize;
      case 'bottom':
        return drawerSize;
      default:
        return drawerSize;
    }
  };

  const getTranslateStyle = () => {
    if (isHorizontal) {
      return { transform: [{ translateX: translateAnim }] };
    } else {
      return { transform: [{ translateY: translateAnim }] };
    }
  };

  const getDrawerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      backgroundColor: '#ffffff',
      ...getTranslateStyle(),
    };

    switch (placement) {
      case 'left':
        return {
          ...baseStyle,
          left: 0,
          top: 0,
          bottom: 0,
          width: drawerSize,
        };
      case 'right':
        return {
          ...baseStyle,
          right: 0,
          top: 0,
          bottom: 0,
          width: drawerSize,
        };
      case 'top':
        return {
          ...baseStyle,
          top: 0,
          left: 0,
          right: 0,
          height: drawerSize,
        };
      case 'bottom':
        return {
          ...baseStyle,
          bottom: 0,
          left: 0,
          right: 0,
          height: drawerSize,
        };
      default:
        return baseStyle;
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAfterVisibleChange) {
          onAfterVisibleChange(true);
        }
      });
    } else {
      Animated.parallel([
        Animated.timing(translateAnim, {
          toValue: getInitialTranslate(),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onAfterVisibleChange) {
          onAfterVisibleChange(false);
        }
      });
    }
  }, [visible]);

  useEffect(() => {
    translateAnim.setValue(getInitialTranslate());
  }, [placement]);

  const handleMaskPress = () => {
    if (maskClosable) {
      onClose();
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!visible && !forceRender) {
    return null;
  }

  if (destroyOnClose && !visible) {
    return null;
  }

  return (
    <Modal
      visible={visible || forceRender}
      transparent
      animationType="none"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.container}>
        {mask && (
          <TouchableWithoutFeedback onPress={handleMaskPress}>
            <Animated.View
              style={[
                styles.mask,
                { opacity: opacityAnim },
                maskStyle,
              ]}
            />
          </TouchableWithoutFeedback>
        )}
        
        <Animated.View style={[getDrawerStyle(), style]}>
          {(title || closable || extra) && (
            <View style={[styles.header, headerStyle]}>
              <View style={styles.headerLeft}>
                {title && (
                  <Text style={[styles.title, titleStyle]}>
                    {title}
                  </Text>
                )}
              </View>
              
              <View style={styles.headerRight}>
                {extra}
                
                {closable && (
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={handleClose}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {closeIcon || <Text style={styles.closeIcon}>×</Text>}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          
          <View style={[styles.body, bodyStyle]}>
            {children}
          </View>
          
          {footer && (
            <View style={[styles.footer, footerStyle]}>
              {footer}
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mask: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#262626',
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#999999',
  },
  body: {
    flex: 1,
    padding: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});

// Preset components
export const LeftDrawer: React.FC<Omit<DrawerProps, 'placement'>> = (props) => (
  <Drawer {...props} placement="left" />
);

export const RightDrawer: React.FC<Omit<DrawerProps, 'placement'>> = (props) => (
  <Drawer {...props} placement="right" />
);

export const TopDrawer: React.FC<Omit<DrawerProps, 'placement'>> = (props) => (
  <Drawer {...props} placement="top" />
);

export const BottomDrawer: React.FC<Omit<DrawerProps, 'placement'>> = (props) => (
  <Drawer {...props} placement="bottom" />
);

export default Drawer;
import React, { useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ViewStyle,
  Dimensions,
  ScrollView,
} from 'react-native';

// 临时样式变量
const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16 };

export interface PopoverProps {
  content?: React.ReactNode;
  title?: React.ReactNode;
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu';
  placement?: 'top' | 'left' | 'right' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom';
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  overlayClassName?: string;
  overlayStyle?: ViewStyle;
  overlayInnerStyle?: ViewStyle;
  getPopupContainer?: () => HTMLElement;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  destroyTooltipOnHide?: boolean;
  arrow?: boolean;
  arrowPointAtCenter?: boolean;
  autoAdjustOverflow?: boolean;
  color?: string;
  children: React.ReactElement;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  width?: number;
  height?: number;
  offset?: [number, number];
}

export const Popover: React.FC<PopoverProps> = ({
  content,
  title,
  trigger = 'click',
  placement = 'bottom',
  visible,
  defaultVisible = false,
  onVisibleChange,
  overlayStyle,
  overlayInnerStyle,
  mouseEnterDelay = 100,
  mouseLeaveDelay = 100,
  arrow = true,
  color = colors.white,
  children,
  style,
  contentStyle,
  width = 200,
  height,
  offset = [0, 8],
}) => {
  const [internalVisible, setInternalVisible] = useState(defaultVisible);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVisible = visible !== undefined ? visible : internalVisible;

  const handleVisibilityChange = (newVisible: boolean) => {
    if (visible === undefined) {
      setInternalVisible(newVisible);
    }
    onVisibleChange?.(newVisible);
  };

  const showPopover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      measureTrigger();
      handleVisibilityChange(true);
    }, mouseEnterDelay);
  };

  const hidePopover = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleVisibilityChange(false);
    }, mouseLeaveDelay);
  };

  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((x, y, triggerWidth, triggerHeight, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        
        let popoverX = pageX;
        let popoverY = pageY;
        const popoverWidth = width;
        const popoverHeight = height || 150;

        // 根据placement计算位置
        switch (placement) {
          case 'top':
            popoverX = pageX + triggerWidth / 2 - popoverWidth / 2;
            popoverY = pageY - popoverHeight - offset[1];
            break;
          case 'bottom':
            popoverX = pageX + triggerWidth / 2 - popoverWidth / 2;
            popoverY = pageY + triggerHeight + offset[1];
            break;
          case 'left':
            popoverX = pageX - popoverWidth - offset[1];
            popoverY = pageY + triggerHeight / 2 - popoverHeight / 2;
            break;
          case 'right':
            popoverX = pageX + triggerWidth + offset[1];
            popoverY = pageY + triggerHeight / 2 - popoverHeight / 2;
            break;
          case 'topLeft':
            popoverX = pageX;
            popoverY = pageY - popoverHeight - offset[1];
            break;
          case 'topRight':
            popoverX = pageX + triggerWidth - popoverWidth;
            popoverY = pageY - popoverHeight - offset[1];
            break;
          case 'bottomLeft':
            popoverX = pageX;
            popoverY = pageY + triggerHeight + offset[1];
            break;
          case 'bottomRight':
            popoverX = pageX + triggerWidth - popoverWidth;
            popoverY = pageY + triggerHeight + offset[1];
            break;
          case 'leftTop':
            popoverX = pageX - popoverWidth - offset[1];
            popoverY = pageY;
            break;
          case 'leftBottom':
            popoverX = pageX - popoverWidth - offset[1];
            popoverY = pageY + triggerHeight - popoverHeight;
            break;
          case 'rightTop':
            popoverX = pageX + triggerWidth + offset[1];
            popoverY = pageY;
            break;
          case 'rightBottom':
            popoverX = pageX + triggerWidth + offset[1];
            popoverY = pageY + triggerHeight - popoverHeight;
            break;
        }

        // 应用偏移
        popoverX += offset[0];

        // 边界检查
        popoverX = Math.max(10, Math.min(popoverX, screenWidth - popoverWidth - 10));
        popoverY = Math.max(10, Math.min(popoverY, screenHeight - popoverHeight - 10));

        setPopoverPosition({ x: popoverX, y: popoverY });
      });
    }
  };

  const handleTriggerPress = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hidePopover();
      } else {
        showPopover();
      }
    }
  };

  const getPopoverStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      left: popoverPosition.x,
      top: popoverPosition.y,
      width: width,
      height: height,
      backgroundColor: color,
      borderRadius: borderRadius.lg,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 1000,
      borderWidth: 1,
      borderColor: colors.gray[200],
    };

    return {
      ...baseStyle,
      ...overlayStyle,
    };
  };

  const getArrowStyle = (): ViewStyle => {
    const arrowSize = 8;
    const baseStyle: ViewStyle = {
      position: 'absolute',
      width: 0,
      height: 0,
      borderStyle: 'solid',
    };

    switch (placement) {
      case 'top':
      case 'topLeft':
      case 'topRight':
        return {
          ...baseStyle,
          top: '100%',
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderTopColor: color,
        };
      case 'bottom':
      case 'bottomLeft':
      case 'bottomRight':
        return {
          ...baseStyle,
          bottom: '100%',
          left: '50%',
          marginLeft: -arrowSize,
          borderLeftWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftColor: 'transparent',
          borderRightColor: 'transparent',
          borderBottomColor: color,
        };
      case 'left':
      case 'leftTop':
      case 'leftBottom':
        return {
          ...baseStyle,
          left: '100%',
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderLeftWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderLeftColor: color,
        };
      case 'right':
      case 'rightTop':
      case 'rightBottom':
        return {
          ...baseStyle,
          right: '100%',
          top: '50%',
          marginTop: -arrowSize,
          borderTopWidth: arrowSize,
          borderBottomWidth: arrowSize,
          borderRightWidth: arrowSize,
          borderTopColor: 'transparent',
          borderBottomColor: 'transparent',
          borderRightColor: color,
        };
      default:
        return baseStyle;
    }
  };

  const renderPopoverContent = () => {
    return (
      <View style={[styles.popoverContent, contentStyle]}>
        {title && (
          <View style={styles.titleContainer}>
            {title}
          </View>
        )}
        {content && (
          <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        )}
      </View>
    );
  };

  const WrappedChild = () => (
    <TouchableOpacity
      ref={triggerRef}
      onPress={handleTriggerPress}
      onPressIn={trigger === 'hover' ? showPopover : undefined}
      onPressOut={trigger === 'hover' ? hidePopover : undefined}
      activeOpacity={0.7}
    >
      {children}
    </TouchableOpacity>
  );

  return (
    <>
      <WrappedChild />
      <Modal
        visible={isVisible}
        transparent
        animationType="fade"
        onRequestClose={() => handleVisibilityChange(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => handleVisibilityChange(false)}
        >
          <TouchableOpacity
            style={[getPopoverStyle(), overlayInnerStyle]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            {renderPopoverContent()}
            {arrow && <View style={getArrowStyle()} />}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// 预设组件
export const InfoPopover: React.FC<Omit<PopoverProps, 'color'>> = (props) => (
  <Popover {...props} color={colors.primary} />
);

export const WarningPopover: React.FC<Omit<PopoverProps, 'color'>> = (props) => (
  <Popover {...props} color={colors.warning} />
);

export const ErrorPopover: React.FC<Omit<PopoverProps, 'color'>> = (props) => (
  <Popover {...props} color={colors.error} />
);

export const SuccessPopover: React.FC<Omit<PopoverProps, 'color'>> = (props) => (
  <Popover {...props} color={colors.success} />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
  popoverContent: {
    flex: 1,
    padding: spacing.md,
  } as ViewStyle,
  titleContainer: {
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: spacing.sm,
  } as ViewStyle,
  contentContainer: {
    flex: 1,
  } as ViewStyle,
});

export default Popover;
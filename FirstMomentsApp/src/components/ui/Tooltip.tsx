import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Dimensions,
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

export interface TooltipProps {
  title?: string;
  content?: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  trigger?: 'hover' | 'focus' | 'click' | 'contextMenu';
  visible?: boolean;
  defaultVisible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  color?: string;
  overlayClassName?: string;
  overlayStyle?: ViewStyle;
  overlayInnerStyle?: ViewStyle;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
  destroyTooltipOnHide?: boolean;
  align?: object;
  arrowPointAtCenter?: boolean;
  autoAdjustOverflow?: boolean;
  getPopupContainer?: () => HTMLElement;
  children: React.ReactElement;
  style?: ViewStyle;
  textStyle?: TextStyle;
  arrow?: boolean;
  offset?: [number, number];
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  content,
  placement = 'top',
  trigger = 'click',
  visible,
  defaultVisible = false,
  onVisibleChange,
  color,
  overlayStyle,
  overlayInnerStyle,
  mouseEnterDelay = 100,
  mouseLeaveDelay = 100,
  children,
  style,
  textStyle,
  arrow = true,
  offset = [0, 0],
}) => {
  const [internalVisible, setInternalVisible] = useState(defaultVisible);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<View>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isVisible = visible !== undefined ? visible : internalVisible;

  const handleVisibilityChange = (newVisible: boolean) => {
    if (visible === undefined) {
      setInternalVisible(newVisible);
    }
    onVisibleChange?.(newVisible);
  };

  const showTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      measureTrigger();
      handleVisibilityChange(true);
    }, mouseEnterDelay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      handleVisibilityChange(false);
    }, mouseLeaveDelay);
  };

  const measureTrigger = () => {
    if (triggerRef.current) {
      triggerRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenWidth = Dimensions.get('window').width;
        const screenHeight = Dimensions.get('window').height;
        
        let tooltipX = pageX;
        let tooltipY = pageY;

        // 根据placement计算位置
        switch (placement) {
          case 'top':
            tooltipX = pageX + width / 2;
            tooltipY = pageY - 10;
            break;
          case 'bottom':
            tooltipX = pageX + width / 2;
            tooltipY = pageY + height + 10;
            break;
          case 'left':
            tooltipX = pageX - 10;
            tooltipY = pageY + height / 2;
            break;
          case 'right':
            tooltipX = pageX + width + 10;
            tooltipY = pageY + height / 2;
            break;
          case 'topLeft':
            tooltipX = pageX;
            tooltipY = pageY - 10;
            break;
          case 'topRight':
            tooltipX = pageX + width;
            tooltipY = pageY - 10;
            break;
          case 'bottomLeft':
            tooltipX = pageX;
            tooltipY = pageY + height + 10;
            break;
          case 'bottomRight':
            tooltipX = pageX + width;
            tooltipY = pageY + height + 10;
            break;
        }

        // 应用偏移
        tooltipX += offset[0];
        tooltipY += offset[1];

        // 边界检查
        tooltipX = Math.max(10, Math.min(tooltipX, screenWidth - 200));
        tooltipY = Math.max(10, Math.min(tooltipY, screenHeight - 100));

        setTooltipPosition({ x: tooltipX, y: tooltipY });
      });
    }
  };

  const handleTriggerPress = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  const getTooltipStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      position: 'absolute',
      left: tooltipPosition.x,
      top: tooltipPosition.y,
      backgroundColor: color || colors.gray[800],
      borderRadius: borderRadius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxWidth: 200,
      shadowColor: colors.black,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      zIndex: 1000,
    };

    return {
      ...baseStyle,
      ...overlayStyle,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      color: colors.white,
      fontSize: 14,
      lineHeight: 20,
    };

    return {
      ...baseStyle,
      ...textStyle,
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
          borderTopColor: color || colors.gray[800],
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
          borderBottomColor: color || colors.gray[800],
        };
      case 'left':
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
          borderLeftColor: color || colors.gray[800],
        };
      case 'right':
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
          borderRightColor: color || colors.gray[800],
        };
      default:
        return baseStyle;
    }
  };

  const renderTooltipContent = () => {
    if (content) {
      return content;
    }
    if (title) {
      return (
        <Text style={getTextStyle()}>
          {title}
        </Text>
      );
    }
    return null;
  };

  const WrappedChild = () => (
    <TouchableOpacity
      ref={triggerRef}
      onPress={handleTriggerPress}
      onPressIn={trigger === 'hover' ? showTooltip : undefined}
      onPressOut={trigger === 'hover' ? hideTooltip : undefined}
      activeOpacity={0.7}
      style={{ alignSelf: 'flex-start' }}
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
          <View style={[getTooltipStyle(), overlayInnerStyle]}>
            {renderTooltipContent()}
            {arrow && <View style={getArrowStyle()} />}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// 预设组件
export const InfoTooltip: React.FC<Omit<TooltipProps, 'color'>> = (props) => (
  <Tooltip {...props} color={colors.primary} />
);

export const WarningTooltip: React.FC<Omit<TooltipProps, 'color'>> = (props) => (
  <Tooltip {...props} color={colors.warning} />
);

export const ErrorTooltip: React.FC<Omit<TooltipProps, 'color'>> = (props) => (
  <Tooltip {...props} color={colors.error} />
);

export const SuccessTooltip: React.FC<Omit<TooltipProps, 'color'>> = (props) => (
  <Tooltip {...props} color={colors.success} />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  } as ViewStyle,
});

export default Tooltip;
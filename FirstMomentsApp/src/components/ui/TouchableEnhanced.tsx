import React, { useRef, useCallback, ReactNode } from 'react';
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
  Pressable,
  Animated,
  ViewStyle,
  GestureResponderEvent,
  PressableStateCallbackType,
} from 'react-native';
import { AnimationUtils, GestureAnimations, AnimatedValueUtils } from '../../utils/animations';
import { HapticFeedback, HapticFeedbackType } from '../../utils/haptics';

// 触摸反馈类型
export enum TouchFeedbackType {
  None = 'none',
  Scale = 'scale',
  Opacity = 'opacity',
  ScaleOpacity = 'scale-opacity',
  Bounce = 'bounce',
  Ripple = 'ripple',
}

// 触觉反馈类型
export enum TouchHapticType {
  None = 'none',
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Selection = 'selection',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
}

// 组件属性
interface TouchableEnhancedProps {
  children: ReactNode;
  onPress?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  style?: ViewStyle;
  activeStyle?: ViewStyle;
  disabledStyle?: ViewStyle;
  
  // 动画配置
  feedbackType?: TouchFeedbackType;
  scaleValue?: number;
  opacityValue?: number;
  animationDuration?: number;
  
  // 触觉反馈配置
  hapticType?: TouchHapticType;
  hapticOnPress?: boolean;
  hapticOnLongPress?: boolean;
  
  // 其他配置
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;
  hitSlop?: { top?: number; bottom?: number; left?: number; right?: number };
  pressRetentionOffset?: { top?: number; bottom?: number; left?: number; right?: number };
  
  // 高级配置
  rippleColor?: string;
  rippleRadius?: number;
  borderless?: boolean;
  background?: any;
  
  // 可访问性
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityRole?: 'none' | 'button' | 'link' | 'search' | 'image' | 'keyboardkey' | 'text' | 'adjustable' | 'imagebutton' | 'header' | 'summary' | 'alert' | 'checkbox' | 'combobox' | 'menu' | 'menubar' | 'menuitem' | 'progressbar' | 'radio' | 'radiogroup' | 'scrollbar' | 'spinbutton' | 'switch' | 'tab' | 'tablist' | 'timer' | 'toolbar';
  
  // 测试
  testID?: string;
}

// 增强触摸组件
export const TouchableEnhanced: React.FC<TouchableEnhancedProps> = ({
  children,
  onPress,
  onLongPress,
  onPressIn,
  onPressOut,
  disabled = false,
  style,
  activeStyle,
  disabledStyle,
  
  // 动画配置
  feedbackType = TouchFeedbackType.Scale,
  scaleValue = 0.95,
  opacityValue = 0.8,
  animationDuration = 150,
  
  // 触觉反馈配置
  hapticType = TouchHapticType.Light,
  hapticOnPress = true,
  hapticOnLongPress = true,
  
  // 其他配置
  delayPressIn = 0,
  delayPressOut = 100,
  delayLongPress = 500,
  hitSlop,
  pressRetentionOffset,
  
  // 高级配置
  rippleColor,
  rippleRadius,
  borderless = false,
  background,
  
  // 可访问性
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole = 'button' as const,
  
  // 测试
  testID,
}) => {
  // 动画值
  const scaleAnim = useRef(AnimatedValueUtils.createValue(1)).current;
  const opacityAnim = useRef(AnimatedValueUtils.createValue(1)).current;
  
  // 触觉反馈映射
  const getHapticFeedbackType = useCallback((type: TouchHapticType): HapticFeedbackType => {
    switch (type) {
      case TouchHapticType.Light:
        return HapticFeedbackType.Light;
      case TouchHapticType.Medium:
        return HapticFeedbackType.Medium;
      case TouchHapticType.Heavy:
        return HapticFeedbackType.Heavy;
      case TouchHapticType.Selection:
        return HapticFeedbackType.Selection;
      case TouchHapticType.Success:
        return HapticFeedbackType.Success;
      case TouchHapticType.Warning:
        return HapticFeedbackType.Warning;
      case TouchHapticType.Error:
        return HapticFeedbackType.Error;
      default:
        return HapticFeedbackType.Light;
    }
  }, []);
  
  // 按下处理
  const handlePressIn = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;
    
    // 执行动画
    if (feedbackType !== TouchFeedbackType.None) {
      const animations: Animated.CompositeAnimation[] = [];
      
      if (feedbackType === TouchFeedbackType.Scale || feedbackType === TouchFeedbackType.ScaleOpacity) {
        animations.push(
          AnimationUtils.scale(scaleAnim, scaleValue, animationDuration)
        );
      }
      
      if (feedbackType === TouchFeedbackType.Opacity || feedbackType === TouchFeedbackType.ScaleOpacity) {
        animations.push(
          AnimationUtils.fadeIn(opacityAnim, animationDuration)
        );
        opacityAnim.setValue(opacityValue);
      }
      
      if (feedbackType === TouchFeedbackType.Bounce) {
        animations.push(
          AnimationUtils.bounceScale(scaleAnim, scaleValue)
        );
      }
      
      if (animations.length > 0) {
        Animated.parallel(animations).start();
      }
    }
    
    onPressIn?.(event);
  }, [disabled, feedbackType, scaleAnim, opacityAnim, scaleValue, opacityValue, animationDuration, onPressIn]);
  
  // 释放处理
  const handlePressOut = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;
    
    // 恢复动画
    if (feedbackType !== TouchFeedbackType.None) {
      const animations: Animated.CompositeAnimation[] = [];
      
      if (feedbackType === TouchFeedbackType.Scale || feedbackType === TouchFeedbackType.ScaleOpacity) {
        animations.push(
          AnimationUtils.bounceScale(scaleAnim, 1)
        );
      }
      
      if (feedbackType === TouchFeedbackType.Opacity || feedbackType === TouchFeedbackType.ScaleOpacity) {
        animations.push(
          AnimationUtils.fadeIn(opacityAnim, animationDuration)
        );
        opacityAnim.setValue(1);
      }
      
      if (feedbackType === TouchFeedbackType.Bounce) {
        animations.push(
          AnimationUtils.bounceScale(scaleAnim, 1)
        );
      }
      
      if (animations.length > 0) {
        Animated.parallel(animations).start();
      }
    }
    
    onPressOut?.(event);
  }, [disabled, feedbackType, scaleAnim, opacityAnim, animationDuration, onPressOut]);
  
  // 点击处理
  const handlePress = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;
    
    // 触觉反馈
    if (hapticOnPress && hapticType !== TouchHapticType.None) {
      const feedbackType = getHapticFeedbackType(hapticType);
      HapticFeedback.buttonPress();
    }
    
    onPress?.(event);
  }, [disabled, hapticOnPress, hapticType, getHapticFeedbackType, onPress]);
  
  // 长按处理
  const handleLongPress = useCallback((event: GestureResponderEvent) => {
    if (disabled) return;
    
    // 触觉反馈
    if (hapticOnLongPress && hapticType !== TouchHapticType.None) {
      HapticFeedback.longPress();
    }
    
    onLongPress?.(event);
  }, [disabled, hapticOnLongPress, hapticType, onLongPress]);
  
  // 获取动画样式
  const getAnimatedStyle = useCallback((): ViewStyle => {
    const animatedStyle: ViewStyle = {};
    
    if (feedbackType === TouchFeedbackType.Scale || feedbackType === TouchFeedbackType.ScaleOpacity || feedbackType === TouchFeedbackType.Bounce) {
      animatedStyle.transform = [{ scale: scaleAnim }];
    }
    
    if (feedbackType === TouchFeedbackType.Opacity || feedbackType === TouchFeedbackType.ScaleOpacity) {
      animatedStyle.opacity = opacityAnim;
    }
    
    return animatedStyle;
  }, [feedbackType, scaleAnim, opacityAnim]);
  
  // 获取最终样式
  const getFinalStyle = useCallback((): ViewStyle => {
    let finalStyle = style || {};
    
    if (disabled && disabledStyle) {
      finalStyle = { ...finalStyle, ...disabledStyle };
    }
    
    return { ...finalStyle, ...getAnimatedStyle() };
  }, [style, disabled, disabledStyle, getAnimatedStyle]);
  
  // 渲染内容
  const renderContent = () => (
    <Animated.View style={getFinalStyle()}>
      {children}
    </Animated.View>
  );
  
  // 根据平台和配置选择合适的组件
  if (feedbackType === TouchFeedbackType.Ripple) {
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        pressRetentionOffset={pressRetentionOffset}
        android_ripple={{
          color: rippleColor || 'rgba(0, 0, 0, 0.1)',
          radius: rippleRadius,
          borderless,
        }}
        style={({ pressed }: PressableStateCallbackType) => [
          getFinalStyle(),
          pressed && activeStyle,
        ]}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {children}
      </Pressable>
    );
  }
  
  if (feedbackType === TouchFeedbackType.None) {
    return (
      <TouchableWithoutFeedback
        onPress={handlePress}
        onLongPress={onLongPress ? handleLongPress : undefined}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        delayPressIn={delayPressIn}
        delayPressOut={delayPressOut}
        delayLongPress={delayLongPress}
        hitSlop={hitSlop}
        pressRetentionOffset={pressRetentionOffset}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole={accessibilityRole}
        testID={testID}
      >
        {renderContent()}
      </TouchableWithoutFeedback>
    );
  }
  
  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1} // 我们使用自定义动画
      delayPressIn={delayPressIn}
      delayPressOut={delayPressOut}
      delayLongPress={delayLongPress}
      hitSlop={hitSlop}
      pressRetentionOffset={pressRetentionOffset}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}
      testID={testID}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

// 预设组件
export const TouchableButton: React.FC<TouchableEnhancedProps> = (props) => (
  <TouchableEnhanced
    {...props}
    feedbackType={TouchFeedbackType.Scale}
    hapticType={TouchHapticType.Light}
    accessibilityRole="button"
  />
);

export const TouchableCard: React.FC<TouchableEnhancedProps> = (props) => (
  <TouchableEnhanced
    {...props}
    feedbackType={TouchFeedbackType.ScaleOpacity}
    scaleValue={0.98}
    opacityValue={0.9}
    hapticType={TouchHapticType.Selection}
    accessibilityRole="button"
  />
);

export const TouchableIcon: React.FC<TouchableEnhancedProps> = (props) => (
  <TouchableEnhanced
    {...props}
    feedbackType={TouchFeedbackType.Bounce}
    scaleValue={0.9}
    hapticType={TouchHapticType.Light}
    accessibilityRole="button"
  />
);

export const TouchableListItem: React.FC<TouchableEnhancedProps> = (props) => (
  <TouchableEnhanced
    {...props}
    feedbackType={TouchFeedbackType.Opacity}
    opacityValue={0.7}
    hapticType={TouchHapticType.Selection}
    accessibilityRole="button"
  />
);

export const TouchableRipple: React.FC<TouchableEnhancedProps> = (props) => (
  <TouchableEnhanced
    {...props}
    feedbackType={TouchFeedbackType.Ripple}
    hapticType={TouchHapticType.Light}
    accessibilityRole="button"
  />
);

export default TouchableEnhanced;
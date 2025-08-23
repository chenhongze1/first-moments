import React, { useRef, useEffect, ReactNode } from 'react';
import {
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { PageTransitions, AnimationConfig, AnimatedValueUtils } from '../../utils/animations';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 转场动画类型
export enum TransitionType {
  SlideLeft = 'slide-left',
  SlideRight = 'slide-right',
  SlideUp = 'slide-up',
  SlideDown = 'slide-down',
  FadeIn = 'fade-in',
  ScaleIn = 'scale-in',
  FlipHorizontal = 'flip-horizontal',
  FlipVertical = 'flip-vertical',
  Push = 'push',
  Modal = 'modal',
  Custom = 'custom',
}

// 转场方向
export enum TransitionDirection {
  Enter = 'enter',
  Exit = 'exit',
}

// 转场配置
interface TransitionConfig {
  type: TransitionType;
  duration: number;
  delay: number;
  easing: any;
  gestureEnabled: boolean;
  gestureThreshold: number;
}

// 组件属性
interface PageTransitionProps {
  children: ReactNode;
  visible: boolean;
  type?: TransitionType;
  direction?: TransitionDirection;
  duration?: number;
  delay?: number;
  easing?: any;
  gestureEnabled?: boolean;
  gestureThreshold?: number;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  style?: ViewStyle;
  customTransition?: {
    enter: ViewStyle;
    exit: ViewStyle;
  };
}

// 页面转场组件
export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  visible,
  type = TransitionType.SlideRight,
  direction = TransitionDirection.Enter,
  duration = AnimationConfig.duration.normal,
  delay = 0,
  easing = AnimationConfig.easing.easeOut,
  gestureEnabled = false,
  gestureThreshold = 0.3,
  onTransitionStart,
  onTransitionEnd,
  onGestureStart,
  onGestureEnd,
  style,
  customTransition,
}) => {
  // 动画值
  const translateX = useRef(AnimatedValueUtils.createValue(0)).current;
  const translateY = useRef(AnimatedValueUtils.createValue(0)).current;
  const opacity = useRef(AnimatedValueUtils.createValue(0)).current;
  const scale = useRef(AnimatedValueUtils.createValue(1)).current;
  const rotateY = useRef(AnimatedValueUtils.createValue(0)).current;
  const rotateX = useRef(AnimatedValueUtils.createValue(0)).current;
  
  // 手势状态
  const gestureState = useRef({ isActive: false, startValue: 0 });
  
  // 获取初始变换值
  const getInitialTransform = (): { [key: string]: number } => {
    switch (type) {
      case TransitionType.SlideLeft:
        return { translateX: direction === TransitionDirection.Enter ? screenWidth : -screenWidth };
      case TransitionType.SlideRight:
        return { translateX: direction === TransitionDirection.Enter ? -screenWidth : screenWidth };
      case TransitionType.SlideUp:
        return { translateY: direction === TransitionDirection.Enter ? screenHeight : -screenHeight };
      case TransitionType.SlideDown:
        return { translateY: direction === TransitionDirection.Enter ? -screenHeight : screenHeight };
      case TransitionType.FadeIn:
        return { opacity: direction === TransitionDirection.Enter ? 0 : 1 };
      case TransitionType.ScaleIn:
        return { 
          scale: direction === TransitionDirection.Enter ? 0.8 : 1.2,
          opacity: direction === TransitionDirection.Enter ? 0 : 1,
        };
      case TransitionType.FlipHorizontal:
        return { rotateY: direction === TransitionDirection.Enter ? 90 : -90 };
      case TransitionType.FlipVertical:
        return { rotateX: direction === TransitionDirection.Enter ? 90 : -90 };
      case TransitionType.Push:
        return { translateX: direction === TransitionDirection.Enter ? screenWidth : 0 };
      case TransitionType.Modal:
        return { 
          translateY: direction === TransitionDirection.Enter ? screenHeight : 0,
          scale: direction === TransitionDirection.Enter ? 0.9 : 1,
        };
      default:
        return {};
    }
  };
  
  // 获取目标变换值
  const getTargetTransform = (): { [key: string]: number } => {
    switch (type) {
      case TransitionType.SlideLeft:
      case TransitionType.SlideRight:
      case TransitionType.Push:
        return { translateX: 0 };
      case TransitionType.SlideUp:
      case TransitionType.SlideDown:
      case TransitionType.Modal:
        return { translateY: 0 };
      case TransitionType.FadeIn:
      case TransitionType.ScaleIn:
        return { opacity: 1 };
      case TransitionType.FlipHorizontal:
        return { rotateY: 0 };
      case TransitionType.FlipVertical:
        return { rotateX: 0 };
      default:
        return {};
    }
  };
  
  // 设置初始值
  useEffect(() => {
    const initialTransform = getInitialTransform();
    
    if (initialTransform.translateX !== undefined) {
      translateX.setValue(initialTransform.translateX);
    }
    if (initialTransform.translateY !== undefined) {
      translateY.setValue(initialTransform.translateY);
    }
    if (initialTransform.opacity !== undefined) {
      opacity.setValue(initialTransform.opacity);
    }
    if (initialTransform.scale !== undefined) {
      scale.setValue(initialTransform.scale);
    }
    if (initialTransform.rotateY !== undefined) {
      rotateY.setValue(initialTransform.rotateY);
    }
    if (initialTransform.rotateX !== undefined) {
      rotateX.setValue(initialTransform.rotateX);
    }
  }, [type, direction]);
  
  // 执行转场动画
  useEffect(() => {
    if (visible) {
      onTransitionStart?.();
      
      const targetTransform = getTargetTransform();
      const animations: Animated.CompositeAnimation[] = [];
      
      if (targetTransform.translateX !== undefined) {
        animations.push(
          Animated.timing(translateX, {
            toValue: targetTransform.translateX,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (targetTransform.translateY !== undefined) {
        animations.push(
          Animated.timing(translateY, {
            toValue: targetTransform.translateY,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (targetTransform.opacity !== undefined) {
        animations.push(
          Animated.timing(opacity, {
            toValue: targetTransform.opacity,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (targetTransform.scale !== undefined) {
        animations.push(
          Animated.timing(scale, {
            toValue: targetTransform.scale || 1,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (targetTransform.rotateY !== undefined) {
        animations.push(
          Animated.timing(rotateY, {
            toValue: targetTransform.rotateY,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (targetTransform.rotateX !== undefined) {
        animations.push(
          Animated.timing(rotateX, {
            toValue: targetTransform.rotateX,
            duration,
            delay,
            easing,
            useNativeDriver: true,
          })
        );
      }
      
      if (animations.length > 0) {
        Animated.parallel(animations).start(() => {
          onTransitionEnd?.();
        });
      }
    } else {
      // 退出动画
      const initialTransform = getInitialTransform();
      const animations: Animated.CompositeAnimation[] = [];
      
      Object.entries(initialTransform).forEach(([key, value]) => {
        switch (key) {
          case 'translateX':
            animations.push(
              Animated.timing(translateX, {
                toValue: value,
                duration: duration * 0.8,
                easing: AnimationConfig.easing.easeIn,
                useNativeDriver: true,
              })
            );
            break;
          case 'translateY':
            animations.push(
              Animated.timing(translateY, {
                toValue: value,
                duration: duration * 0.8,
                easing: AnimationConfig.easing.easeIn,
                useNativeDriver: true,
              })
            );
            break;
          case 'opacity':
            animations.push(
              Animated.timing(opacity, {
                toValue: value,
                duration: duration * 0.8,
                easing: AnimationConfig.easing.easeIn,
                useNativeDriver: true,
              })
            );
            break;
          case 'scale':
            animations.push(
              Animated.timing(scale, {
                toValue: value,
                duration: duration * 0.8,
                easing: AnimationConfig.easing.easeIn,
                useNativeDriver: true,
              })
            );
            break;
        }
      });
      
      if (animations.length > 0) {
        Animated.parallel(animations).start();
      }
    }
  }, [visible]);
  
  // 手势处理
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );
  
  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    const { state, translationX: gestureX, translationY: gestureY } = event.nativeEvent;
    
    switch (state) {
      case State.BEGAN:
        gestureState.current.isActive = true;
        onGestureStart?.();
        break;
        
      case State.END:
      case State.CANCELLED:
        gestureState.current.isActive = false;
        
        // 判断是否达到阈值
        const threshold = gestureThreshold * screenWidth;
        const shouldDismiss = Math.abs(gestureX) > threshold || Math.abs(gestureY) > threshold;
        
        if (shouldDismiss) {
          // 完成手势，触发退出
          onGestureEnd?.();
        } else {
          // 回弹到原位
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
            }),
          ]).start();
        }
        break;
    }
  };
  
  // 获取动画样式
  const getAnimatedStyle = (): ViewStyle => {
    const transform: any[] = [];
    
    // 添加变换
    transform.push({ translateX });
    transform.push({ translateY });
    transform.push({ scale });
    
    // 添加旋转
    transform.push({
      rotateY: rotateY.interpolate({
        inputRange: [-180, 0, 180],
        outputRange: ['-180deg', '0deg', '180deg'],
      }),
    });
    
    transform.push({
      rotateX: rotateX.interpolate({
        inputRange: [-180, 0, 180],
        outputRange: ['-180deg', '0deg', '180deg'],
      }),
    });
    
    return {
      transform,
      opacity,
    };
  };
  
  // 渲染内容
  const renderContent = () => (
    <Animated.View style={[style, getAnimatedStyle()]}>
      {children}
    </Animated.View>
  );
  
  // 如果启用手势，包装手势处理器
  if (gestureEnabled) {
    return (
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={gestureEnabled}
      >
        {renderContent()}
      </PanGestureHandler>
    );
  }
  
  return renderContent();
};

// 预设转场组件
export const SlideTransition: React.FC<Omit<PageTransitionProps, 'type'>> = (props) => (
  <PageTransition {...props} type={TransitionType.SlideRight} />
);

export const FadeTransition: React.FC<Omit<PageTransitionProps, 'type'>> = (props) => (
  <PageTransition {...props} type={TransitionType.FadeIn} />
);

export const ScaleTransition: React.FC<Omit<PageTransitionProps, 'type'>> = (props) => (
  <PageTransition {...props} type={TransitionType.ScaleIn} />
);

export const ModalTransition: React.FC<Omit<PageTransitionProps, 'type'>> = (props) => (
  <PageTransition {...props} type={TransitionType.Modal} />
);

export const FlipTransition: React.FC<Omit<PageTransitionProps, 'type'>> = (props) => (
  <PageTransition {...props} type={TransitionType.FlipHorizontal} />
);

// 转场管理器
export class TransitionManager {
  private static activeTransitions: Map<string, Animated.CompositeAnimation> = new Map();
  
  // 注册转场动画
  static register(id: string, animation: Animated.CompositeAnimation): void {
    this.activeTransitions.set(id, animation);
  }
  
  // 停止转场动画
  static stop(id: string): void {
    const animation = this.activeTransitions.get(id);
    if (animation) {
      animation.stop();
      this.activeTransitions.delete(id);
    }
  }
  
  // 停止所有转场动画
  static stopAll(): void {
    this.activeTransitions.forEach((animation) => {
      animation.stop();
    });
    this.activeTransitions.clear();
  }
  
  // 获取活跃转场数量
  static getActiveCount(): number {
    return this.activeTransitions.size;
  }
}

export default PageTransition;
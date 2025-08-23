import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Animated,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import { AnimationUtils, AnimationConfig, AnimatedValueUtils } from '../../utils/animations';

// 加载动画类型
export enum LoadingType {
  Spinner = 'spinner',
  Dots = 'dots',
  Pulse = 'pulse',
  Wave = 'wave',
  Bounce = 'bounce',
  Fade = 'fade',
  Scale = 'scale',
  Skeleton = 'skeleton',
  Progress = 'progress',
  Custom = 'custom',
}

// 加载尺寸
export enum LoadingSize {
  Small = 'small',
  Medium = 'medium',
  Large = 'large',
}

// 组件属性
interface LoadingEnhancedProps {
  visible?: boolean;
  type?: LoadingType;
  size?: LoadingSize;
  color?: string;
  backgroundColor?: string;
  text?: string;
  textStyle?: TextStyle;
  style?: ViewStyle;
  overlay?: boolean;
  overlayColor?: string;
  duration?: number;
  intensity?: number;
  dotCount?: number;
  waveCount?: number;
  progress?: number;
  customAnimation?: Animated.CompositeAnimation;
  onAnimationStart?: () => void;
  onAnimationEnd?: () => void;
}

// 增强加载组件
export const LoadingEnhanced: React.FC<LoadingEnhancedProps> = ({
  visible = true,
  type = LoadingType.Spinner,
  size = LoadingSize.Medium,
  color = '#007AFF',
  backgroundColor = 'transparent',
  text,
  textStyle,
  style,
  overlay = false,
  overlayColor = 'rgba(0, 0, 0, 0.5)',
  duration = AnimationConfig.duration.normal,
  intensity = 1,
  dotCount = 3,
  waveCount = 4,
  progress = 0,
  customAnimation,
  onAnimationStart,
  onAnimationEnd,
}) => {
  // 动画值
  const spinValue = useRef(AnimatedValueUtils.createValue(0)).current;
  const scaleValue = useRef(AnimatedValueUtils.createValue(1)).current;
  const opacityValue = useRef(AnimatedValueUtils.createValue(1)).current;
  const translateY = useRef(AnimatedValueUtils.createValue(0)).current;
  const progressValue = useRef(AnimatedValueUtils.createValue(0)).current;
  
  // 多个动画值用于复杂动画
  const dotAnimations = useRef(
    Array.from({ length: dotCount }, () => AnimatedValueUtils.createValue(0))
  ).current;
  
  const waveAnimations = useRef(
    Array.from({ length: waveCount }, () => AnimatedValueUtils.createValue(0))
  ).current;
  
  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case LoadingSize.Small:
        return { width: 20, height: 20, fontSize: 12 };
      case LoadingSize.Medium:
        return { width: 40, height: 40, fontSize: 14 };
      case LoadingSize.Large:
        return { width: 60, height: 60, fontSize: 16 };
      default:
        return { width: 40, height: 40, fontSize: 14 };
    }
  };
  
  const sizeConfig = getSizeConfig();
  
  // 启动动画
  useEffect(() => {
    if (!visible) return;
    
    onAnimationStart?.();
    
    let animation: Animated.CompositeAnimation;
    
    switch (type) {
      case LoadingType.Spinner:
        animation = Animated.loop(
          AnimationUtils.rotate(spinValue, 1, duration)
        );
        break;
        
      case LoadingType.Dots:
        const dotAnimationSequence = dotAnimations.map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(anim, {
              toValue: 1,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: duration / 2,
              useNativeDriver: true,
            }),
          ])
        );
        animation = Animated.loop(
          Animated.parallel(dotAnimationSequence)
        );
        break;
        
      case LoadingType.Pulse:
        animation = AnimationUtils.pulse(scaleValue, 0.8, 1.2, duration);
        break;
        
      case LoadingType.Wave:
        const waveAnimationSequence = waveAnimations.map((anim, index) =>
          Animated.sequence([
            Animated.delay(index * 100),
            Animated.timing(anim, {
              toValue: -10 * intensity,
              duration: duration / 4,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: duration / 4,
              useNativeDriver: true,
            }),
          ])
        );
        animation = Animated.loop(
          Animated.parallel(waveAnimationSequence)
        );
        break;
        
      case LoadingType.Bounce:
        animation = Animated.loop(
          Animated.sequence([
            Animated.timing(translateY, {
              toValue: -20 * intensity,
              duration: duration / 2,
              easing: AnimationConfig.easing.easeOut,
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: 0,
              duration: duration / 2,
              easing: AnimationConfig.easing.bounce,
              useNativeDriver: true,
            }),
          ])
        );
        break;
        
      case LoadingType.Fade:
        animation = AnimationUtils.breathe(opacityValue, 0.3, 1, duration);
        break;
        
      case LoadingType.Scale:
        animation = AnimationUtils.pulse(scaleValue, 0.5, 1.5, duration);
        break;
        
      case LoadingType.Progress:
        animation = Animated.timing(progressValue, {
          toValue: progress,
          duration,
          useNativeDriver: false,
        });
        break;
        
      case LoadingType.Custom:
        animation = customAnimation || Animated.timing(opacityValue, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        });
        break;
        
      default:
        animation = AnimationUtils.pulse(scaleValue, 0.8, 1.2, duration);
        break;
    }
    
    animation.start(() => {
      onAnimationEnd?.();
    });
    
    return () => {
      animation.stop();
    };
  }, [visible, type, duration, intensity, progress]);
  
  // 渲染旋转器
  const renderSpinner = () => {
    const spin = spinValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
    
    return (
      <Animated.View
        style={[
          styles.spinner,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            borderColor: color,
            transform: [{ rotate: spin }],
          },
        ]}
      />
    );
  };
  
  // 渲染点动画
  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {dotAnimations.map((anim, index) => {
          const scale = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.5, 1.5],
          });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: color,
                  width: sizeConfig.width / 4,
                  height: sizeConfig.width / 4,
                  transform: [{ scale }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  // 渲染脉冲
  const renderPulse = () => {
    return (
      <Animated.View
        style={[
          styles.pulse,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            backgroundColor: color,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />
    );
  };
  
  // 渲染波浪
  const renderWave = () => {
    return (
      <View style={styles.waveContainer}>
        {waveAnimations.map((anim, index) => {
          return (
            <Animated.View
              key={index}
              style={[
                styles.waveBar,
                {
                  backgroundColor: color,
                  width: sizeConfig.width / waveCount,
                  height: sizeConfig.height,
                  transform: [{ translateY: anim }],
                },
              ]}
            />
          );
        })}
      </View>
    );
  };
  
  // 渲染弹跳
  const renderBounce = () => {
    return (
      <Animated.View
        style={[
          styles.bounce,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            backgroundColor: color,
            transform: [{ translateY }],
          },
        ]}
      />
    );
  };
  
  // 渲染淡入淡出
  const renderFade = () => {
    return (
      <Animated.View
        style={[
          styles.fade,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            backgroundColor: color,
            opacity: opacityValue,
          },
        ]}
      />
    );
  };
  
  // 渲染缩放
  const renderScale = () => {
    return (
      <Animated.View
        style={[
          styles.scale,
          {
            width: sizeConfig.width,
            height: sizeConfig.height,
            backgroundColor: color,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />
    );
  };
  
  // 渲染骨架屏
  const renderSkeleton = () => {
    return (
      <View style={styles.skeletonContainer}>
        <Animated.View
          style={[
            styles.skeletonLine,
            { opacity: opacityValue, backgroundColor: color },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            styles.skeletonLineShort,
            { opacity: opacityValue, backgroundColor: color },
          ]}
        />
        <Animated.View
          style={[
            styles.skeletonLine,
            { opacity: opacityValue, backgroundColor: color },
          ]}
        />
      </View>
    );
  };
  
  // 渲染进度条
  const renderProgress = () => {
    const progressWidth = progressValue.interpolate({
      inputRange: [0, 100],
      outputRange: ['0%', '100%'],
      extrapolate: 'clamp',
    });
    
    return (
      <View style={[styles.progressContainer, { width: sizeConfig.width * 3 }]}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: color,
              width: progressWidth,
            },
          ]}
        />
      </View>
    );
  };
  
  // 获取加载内容
  const getLoadingContent = () => {
    switch (type) {
      case LoadingType.Spinner:
        return renderSpinner();
      case LoadingType.Dots:
        return renderDots();
      case LoadingType.Pulse:
        return renderPulse();
      case LoadingType.Wave:
        return renderWave();
      case LoadingType.Bounce:
        return renderBounce();
      case LoadingType.Fade:
        return renderFade();
      case LoadingType.Scale:
        return renderScale();
      case LoadingType.Skeleton:
        return renderSkeleton();
      case LoadingType.Progress:
        return renderProgress();
      default:
        return renderSpinner();
    }
  };
  
  if (!visible) return null;
  
  const content = (
    <View style={[styles.container, { backgroundColor }, style]}>
      {getLoadingContent()}
      {text && (
        <Text style={[styles.text, { fontSize: sizeConfig.fontSize, color }, textStyle]}>
          {text}
        </Text>
      )}
    </View>
  );
  
  if (overlay) {
    return (
      <View style={[styles.overlay, { backgroundColor: overlayColor }]}>
        {content}
      </View>
    );
  }
  
  return content;
};

// 样式
const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  text: {
    marginTop: 10,
    textAlign: 'center',
  },
  spinner: {
    borderWidth: 2,
    borderRadius: 50,
    borderTopColor: 'transparent',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    borderRadius: 50,
    marginHorizontal: 2,
  },
  pulse: {
    borderRadius: 50,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  waveBar: {
    marginHorizontal: 1,
    borderRadius: 2,
  },
  bounce: {
    borderRadius: 50,
  },
  fade: {
    borderRadius: 50,
  },
  scale: {
    borderRadius: 50,
  },
  skeletonContainer: {
    width: 200,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
    marginVertical: 4,
  },
  skeletonLineShort: {
    width: '60%',
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
});

// 预设组件
export const SpinnerLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Spinner} />
);

export const DotsLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Dots} />
);

export const PulseLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Pulse} />
);

export const WaveLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Wave} />
);

export const SkeletonLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Skeleton} />
);

export const ProgressLoading: React.FC<Omit<LoadingEnhancedProps, 'type'>> = (props) => (
  <LoadingEnhanced {...props} type={LoadingType.Progress} />
);

export default LoadingEnhanced;
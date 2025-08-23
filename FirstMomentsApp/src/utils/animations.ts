import { Animated, Easing, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 动画配置
export const AnimationConfig = {
  // 持续时间
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },
  // 缓动函数
  easing: {
    easeInOut: Easing.inOut(Easing.ease),
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    linear: Easing.linear,
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),
    back: Easing.back(1.5),
    bezier: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  },
};

// 基础动画函数
export class AnimationUtils {
  // 淡入动画
  static fadeIn(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal,
    easing: any = AnimationConfig.easing.easeOut
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 1,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  // 淡出动画
  static fadeOut(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal,
    easing: any = AnimationConfig.easing.easeIn
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  // 缩放动画
  static scale(
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationConfig.duration.normal,
    easing: any = AnimationConfig.easing.easeOut
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  // 弹性缩放动画
  static bounceScale(
    animatedValue: Animated.Value,
    toValue: number = 1,
    duration: number = AnimationConfig.duration.slow
  ): Animated.CompositeAnimation {
    return Animated.spring(animatedValue, {
      toValue,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  }

  // 滑动动画
  static slide(
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationConfig.duration.normal,
    easing: any = AnimationConfig.easing.easeOut
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  // 旋转动画
  static rotate(
    animatedValue: Animated.Value,
    toValue: number,
    duration: number = AnimationConfig.duration.normal,
    easing: any = AnimationConfig.easing.linear
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  }

  // 摇摆动画
  static shake(
    animatedValue: Animated.Value,
    intensity: number = 10,
    duration: number = AnimationConfig.duration.fast
  ): Animated.CompositeAnimation {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: intensity,
        duration: duration / 4,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -intensity,
        duration: duration / 2,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: intensity / 2,
        duration: duration / 4,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: duration / 4,
        useNativeDriver: true,
      }),
    ]);
  }

  // 脉冲动画
  static pulse(
    animatedValue: Animated.Value,
    minScale: number = 0.95,
    maxScale: number = 1.05,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: maxScale,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: minScale,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeInOut,
          useNativeDriver: true,
        }),
      ])
    );
  }

  // 呼吸动画
  static breathe(
    animatedValue: Animated.Value,
    minOpacity: number = 0.3,
    maxOpacity: number = 1,
    duration: number = AnimationConfig.duration.verySlow
  ): Animated.CompositeAnimation {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: maxOpacity,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeInOut,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: minOpacity,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeInOut,
          useNativeDriver: true,
        }),
      ])
    );
  }
}

// 页面转场动画
export class PageTransitions {
  // 从右侧滑入
  static slideInRight(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: AnimationConfig.easing.easeOut,
      useNativeDriver: true,
    });
  }

  // 向左侧滑出
  static slideOutLeft(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: -screenWidth,
      duration,
      easing: AnimationConfig.easing.easeIn,
      useNativeDriver: true,
    });
  }

  // 从下方滑入
  static slideInUp(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: 0,
      duration,
      easing: AnimationConfig.easing.easeOut,
      useNativeDriver: true,
    });
  }

  // 向下方滑出
  static slideOutDown(
    animatedValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.timing(animatedValue, {
      toValue: screenHeight,
      duration,
      easing: AnimationConfig.easing.easeIn,
      useNativeDriver: true,
    });
  }

  // 缩放淡入
  static scaleIn(
    scaleValue: Animated.Value,
    opacityValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 1,
        duration,
        easing: AnimationConfig.easing.easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 1,
        duration,
        easing: AnimationConfig.easing.easeOut,
        useNativeDriver: true,
      }),
    ]);
  }

  // 缩放淡出
  static scaleOut(
    scaleValue: Animated.Value,
    opacityValue: Animated.Value,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    return Animated.parallel([
      Animated.timing(scaleValue, {
        toValue: 0.8,
        duration,
        easing: AnimationConfig.easing.easeIn,
        useNativeDriver: true,
      }),
      Animated.timing(opacityValue, {
        toValue: 0,
        duration,
        easing: AnimationConfig.easing.easeIn,
        useNativeDriver: true,
      }),
    ]);
  }
}

// 手势动画
export class GestureAnimations {
  // 按下效果
  static pressIn(
    scaleValue: Animated.Value,
    opacityValue?: Animated.Value,
    scale: number = 0.95,
    opacity: number = 0.8
  ): Animated.CompositeAnimation {
    const animations = [
      Animated.timing(scaleValue, {
        toValue: scale,
        duration: AnimationConfig.duration.fast,
        easing: AnimationConfig.easing.easeOut,
        useNativeDriver: true,
      }),
    ];

    if (opacityValue) {
      animations.push(
        Animated.timing(opacityValue, {
          toValue: opacity,
          duration: AnimationConfig.duration.fast,
          easing: AnimationConfig.easing.easeOut,
          useNativeDriver: true,
        })
      );
    }

    return Animated.parallel(animations);
  }

  // 释放效果
  static pressOut(
    scaleValue: Animated.Value,
    opacityValue?: Animated.Value
  ): Animated.CompositeAnimation {
    const animations = [
      Animated.spring(scaleValue, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ];

    if (opacityValue) {
      animations.push(
        Animated.timing(opacityValue, {
          toValue: 1,
          duration: AnimationConfig.duration.fast,
          easing: AnimationConfig.easing.easeOut,
          useNativeDriver: true,
        })
      );
    }

    return Animated.parallel(animations);
  }

  // 长按效果
  static longPress(
    scaleValue: Animated.Value,
    scale: number = 1.05
  ): Animated.CompositeAnimation {
    return Animated.spring(scaleValue, {
      toValue: scale,
      tension: 100,
      friction: 8,
      useNativeDriver: true,
    });
  }
}

// 列表动画
export class ListAnimations {
  // 交错动画
  static staggered(
    animatedValues: Animated.Value[],
    delay: number = 100,
    duration: number = AnimationConfig.duration.normal
  ): Animated.CompositeAnimation {
    const animations = animatedValues.map((value, index) =>
      Animated.timing(value, {
        toValue: 1,
        duration,
        delay: index * delay,
        easing: AnimationConfig.easing.easeOut,
        useNativeDriver: true,
      })
    );

    return Animated.parallel(animations);
  }

  // 波浪效果
  static wave(
    animatedValues: Animated.Value[],
    delay: number = 50,
    duration: number = AnimationConfig.duration.fast
  ): Animated.CompositeAnimation {
    const animations = animatedValues.map((value, index) =>
      Animated.sequence([
        Animated.delay(index * delay),
        Animated.timing(value, {
          toValue: 1.2,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(value, {
          toValue: 1,
          duration: duration / 2,
          easing: AnimationConfig.easing.easeIn,
          useNativeDriver: true,
        }),
      ])
    );

    return Animated.parallel(animations);
  }
}

// 动画组合工具
export class AnimationComposer {
  // 创建序列动画
  static sequence(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
    return Animated.sequence(animations);
  }

  // 创建并行动画
  static parallel(animations: Animated.CompositeAnimation[]): Animated.CompositeAnimation {
    return Animated.parallel(animations);
  }

  // 创建循环动画
  static loop(
    animation: Animated.CompositeAnimation,
    iterations?: number
  ): Animated.CompositeAnimation {
    return Animated.loop(animation, { iterations });
  }

  // 创建延迟动画
  static delay(duration: number): Animated.CompositeAnimation {
    return Animated.delay(duration);
  }
}

// 动画值工具
export class AnimatedValueUtils {
  // 创建动画值
  static createValue(initialValue: number = 0): Animated.Value {
    return new Animated.Value(initialValue);
  }

  // 创建XY动画值
  static createValueXY(initialValue: { x: number; y: number } = { x: 0, y: 0 }): Animated.ValueXY {
    return new Animated.ValueXY(initialValue);
  }

  // 重置动画值
  static resetValue(animatedValue: Animated.Value, value: number = 0): void {
    animatedValue.setValue(value);
  }

  // 获取动画值
  static getValue(animatedValue: Animated.Value): Promise<number> {
    return new Promise((resolve) => {
      animatedValue.addListener(({ value }) => {
        resolve(value);
      });
    });
  }
}

export default {
  AnimationConfig,
  AnimationUtils,
  PageTransitions,
  GestureAnimations,
  ListAnimations,
  AnimationComposer,
  AnimatedValueUtils,
};
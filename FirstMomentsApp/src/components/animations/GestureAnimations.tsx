import React from 'react';
import { ViewStyle, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 可拖拽组件
interface DraggableProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onDragEnd?: (x: number, y: number) => void;
  bounds?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };
  snapToEdges?: boolean;
  disabled?: boolean;
}

export const Draggable: React.FC<DraggableProps> = ({
  children,
  style,
  onDragEnd,
  bounds,
  snapToEdges = false,
  disabled = false,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      scale.value = withSpring(1.05);
    },
    onActive: (event) => {
      let newX = event.translationX;
      let newY = event.translationY;

      // 应用边界限制
      if (bounds) {
        if (bounds.left !== undefined && newX < bounds.left) {
          newX = bounds.left;
        }
        if (bounds.right !== undefined && newX > bounds.right) {
          newX = bounds.right;
        }
        if (bounds.top !== undefined && newY < bounds.top) {
          newY = bounds.top;
        }
        if (bounds.bottom !== undefined && newY > bounds.bottom) {
          newY = bounds.bottom;
        }
      }

      translateX.value = newX;
      translateY.value = newY;
    },
    onEnd: () => {
      scale.value = withSpring(1);

      if (snapToEdges) {
        // 吸附到最近的边缘
        const centerX = translateX.value + (style?.width as number || 50) / 2;
        const snapToLeft = centerX < screenWidth / 2;
        translateX.value = withSpring(snapToLeft ? 0 : screenWidth - (style?.width as number || 50));
      }

      if (onDragEnd) {
        runOnJS(onDragEnd)(translateX.value, translateY.value);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  if (disabled) {
    return (
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    );
  }

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

// 滑动删除组件
interface SwipeToDeleteProps {
  children: React.ReactNode;
  onDelete: () => void;
  deleteThreshold?: number;
  style?: ViewStyle;
  deleteColor?: string;
  deleteText?: string;
}

export const SwipeToDelete: React.FC<SwipeToDeleteProps> = ({
  children,
  onDelete,
  deleteThreshold = 100,
  style,
  deleteColor = '#ff4444',
  deleteText = '删除',
}) => {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      translateX.value = Math.min(0, event.translationX);
    },
    onEnd: (event) => {
      const shouldDelete = Math.abs(translateX.value) > deleteThreshold;
      
      if (shouldDelete) {
        translateX.value = withTiming(-screenWidth, { duration: 300 });
        opacity.value = withTiming(0, { duration: 300 }, () => {
          runOnJS(onDelete)();
        });
      } else {
        translateX.value = withSpring(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const deleteBackgroundStyle = useAnimatedStyle(() => {
    const deleteOpacity = interpolate(
      Math.abs(translateX.value),
      [0, deleteThreshold],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      opacity: deleteOpacity,
    };
  });

  return (
    <Animated.View style={[{ position: 'relative' }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: deleteThreshold,
            backgroundColor: deleteColor,
            justifyContent: 'center',
            alignItems: 'center',
          },
          deleteBackgroundStyle,
        ]}
      >
        <Animated.Text style={{ color: 'white', fontWeight: 'bold' }}>
          {deleteText}
        </Animated.Text>
      </Animated.View>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

// 下拉刷新组件
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  style?: ViewStyle;
  refreshColor?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  refreshThreshold = 80,
  style,
  refreshColor = '#007AFF',
}) => {
  const translateY = useSharedValue(0);
  const isRefreshing = useSharedValue(false);
  const refreshProgress = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onActive: (event) => {
      if (event.translationY > 0 && !isRefreshing.value) {
        translateY.value = event.translationY * 0.5; // 添加阻尼效果
        refreshProgress.value = Math.min(1, translateY.value / refreshThreshold);
      }
    },
    onEnd: () => {
      if (translateY.value >= refreshThreshold && !isRefreshing.value) {
        isRefreshing.value = true;
        translateY.value = withSpring(refreshThreshold);
        
        runOnJS(async () => {
          await onRefresh();
          isRefreshing.value = false;
          translateY.value = withSpring(0);
          refreshProgress.value = withTiming(0);
        })();
      } else {
        translateY.value = withSpring(0);
        refreshProgress.value = withTiming(0);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  const refreshIndicatorStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      refreshProgress.value,
      [0, 1],
      [0, 360]
    );
    
    const opacity = interpolate(
      translateY.value,
      [0, refreshThreshold / 2],
      [0, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotation}deg` }],
      opacity,
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: -refreshThreshold,
            left: 0,
            right: 0,
            height: refreshThreshold,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1,
          },
        ]}
      >
        <Animated.View
          style={[
            {
              width: 30,
              height: 30,
              borderRadius: 15,
              borderWidth: 3,
              borderColor: refreshColor,
              borderTopColor: 'transparent',
            },
            refreshIndicatorStyle,
          ]}
        />
      </Animated.View>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[{ flex: 1 }, animatedStyle]}>
          {children}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

// 滑动选择器组件
interface SwipePickerProps {
  items: string[];
  selectedIndex: number;
  onSelectionChange: (index: number) => void;
  itemHeight?: number;
  visibleItems?: number;
  style?: ViewStyle;
}

export const SwipePicker: React.FC<SwipePickerProps> = ({
  items,
  selectedIndex,
  onSelectionChange,
  itemHeight = 50,
  visibleItems = 3,
  style,
}) => {
  const translateY = useSharedValue(-selectedIndex * itemHeight);
  const containerHeight = visibleItems * itemHeight;

  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // 记录开始位置
    },
    onActive: (event) => {
      const newY = -selectedIndex * itemHeight + event.translationY;
      const maxY = 0;
      const minY = -(items.length - 1) * itemHeight;
      
      translateY.value = Math.max(minY, Math.min(maxY, newY));
    },
    onEnd: (event) => {
      const velocity = event.velocityY;
      const currentY = translateY.value;
      
      // 计算最近的索引
      let targetIndex = Math.round(-currentY / itemHeight);
      targetIndex = Math.max(0, Math.min(items.length - 1, targetIndex));
      
      // 考虑速度影响
      if (Math.abs(velocity) > 500) {
        if (velocity > 0 && targetIndex > 0) {
          targetIndex -= 1;
        } else if (velocity < 0 && targetIndex < items.length - 1) {
          targetIndex += 1;
        }
      }
      
      translateY.value = withSpring(-targetIndex * itemHeight, {
        damping: 15,
        stiffness: 150,
      });
      
      if (targetIndex !== selectedIndex) {
        runOnJS(onSelectionChange)(targetIndex);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <Animated.View
      style={[
        {
          height: containerHeight,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={animatedStyle}>
          {items.map((item, index) => {
            const itemStyle = useAnimatedStyle(() => {
              const distance = Math.abs(translateY.value + index * itemHeight);
              const opacity = interpolate(
                distance,
                [0, itemHeight],
                [1, 0.3],
                Extrapolate.CLAMP
              );
              const scale = interpolate(
                distance,
                [0, itemHeight],
                [1, 0.8],
                Extrapolate.CLAMP
              );
              
              return {
                opacity,
                transform: [{ scale }],
              };
            });

            return (
              <Animated.View
                key={index}
                style={[
                  {
                    height: itemHeight,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  itemStyle,
                ]}
              >
                <Animated.Text style={{ fontSize: 18, fontWeight: '500' }}>
                  {item}
                </Animated.Text>
              </Animated.View>
            );
          })}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};
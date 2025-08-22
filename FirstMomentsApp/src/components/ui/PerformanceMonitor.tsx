import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  AppState,
  AppStateStatus,
} from 'react-native';
import { memoryManager, MemoryOptimizer } from '../../utils/memoryManager';

// 性能指标接口
interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  jsHeapSize?: number;
  totalJSHeapSize?: number;
  cacheHitRate: number;
  componentCount: number;
}

// 性能监控Hook
export const usePerformanceMonitor = (enabled: boolean = __DEV__) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    cacheHitRate: 0,
    componentCount: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(Date.now());
  const renderStartTime = useRef(0);
  const animationFrame = useRef<number | null>(null);

  // FPS计算
  const calculateFPS = () => {
    const now = Date.now();
    frameCount.current++;
    
    if (now - lastTime.current >= 1000) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastTime.current));
      setMetrics(prev => ({ ...prev, fps }));
      
      frameCount.current = 0;
      lastTime.current = now;
    }
    
    if (enabled) {
      animationFrame.current = requestAnimationFrame(calculateFPS);
    }
  };

  // 内存使用监控
  const monitorMemory = () => {
    const memoryInfo = MemoryOptimizer.monitorMemoryUsage();
    const cacheStats = memoryManager.getCacheStats();
    
    setMetrics(prev => ({
      ...prev,
      memoryUsage: cacheStats.size,
      jsHeapSize: memoryInfo.usedJSHeapSize,
      totalJSHeapSize: memoryInfo.totalJSHeapSize,
      cacheHitRate: cacheStats.hitRate,
    }));
  };

  // 渲染时间监控
  const startRenderTimer = () => {
    renderStartTime.current = performance.now();
  };

  const endRenderTimer = () => {
    const renderTime = performance.now() - renderStartTime.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  };

  useEffect(() => {
    if (!enabled) return;

    // 启动FPS监控
    animationFrame.current = requestAnimationFrame(calculateFPS);
    
    // 启动内存监控
    const memoryInterval = setInterval(monitorMemory, 2000);
    
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      clearInterval(memoryInterval);
    };
  }, [enabled]);

  return {
    metrics,
    startRenderTimer,
    endRenderTimer,
  };
};

// 性能监控组件
interface PerformanceMonitorProps {
  visible?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  style?: any;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  visible = __DEV__,
  position = 'top-right',
  style,
}) => {
  const { metrics } = usePerformanceMonitor(visible);
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);

  if (!visible || appState !== 'active') {
    return null;
  }

  const getPositionStyle = () => {
    const baseStyle = {
      position: 'absolute' as const,
      zIndex: 9999,
      padding: 8,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      borderRadius: 4,
      minWidth: 120,
    };

    switch (position) {
      case 'top-left':
        return { ...baseStyle, top: 50, left: 10 };
      case 'top-right':
        return { ...baseStyle, top: 50, right: 10 };
      case 'bottom-left':
        return { ...baseStyle, bottom: 50, left: 10 };
      case 'bottom-right':
        return { ...baseStyle, bottom: 50, right: 10 };
      default:
        return { ...baseStyle, top: 50, right: 10 };
    }
  };

  const getFPSColor = (fps: number) => {
    if (fps >= 55) return '#4CAF50'; // 绿色
    if (fps >= 30) return '#FF9800'; // 橙色
    return '#F44336'; // 红色
  };

  const getMemoryColor = (usage: number) => {
    if (usage < 30) return '#4CAF50';
    if (usage < 70) return '#FF9800';
    return '#F44336';
  };

  return (
    <View style={[getPositionStyle(), style]}>
      <Text style={[styles.metricText, { color: getFPSColor(metrics.fps) }]}>
        FPS: {metrics.fps}
      </Text>
      <Text style={[styles.metricText, { color: getMemoryColor(metrics.memoryUsage) }]}>
        Cache: {metrics.memoryUsage}
      </Text>
      <Text style={styles.metricText}>
        Render: {metrics.renderTime.toFixed(1)}ms
      </Text>
      {metrics.jsHeapSize && (
        <Text style={styles.metricText}>
          Heap: {(metrics.jsHeapSize / 1024 / 1024).toFixed(1)}MB
        </Text>
      )}
    </View>
  );
};

// 性能分析器组件
interface PerformanceProfilerProps {
  name: string;
  children: React.ReactNode;
  onProfileComplete?: (duration: number) => void;
}

export const PerformanceProfiler: React.FC<PerformanceProfilerProps> = ({
  name,
  children,
  onProfileComplete,
}) => {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const duration = performance.now() - startTime.current;
      
      if (__DEV__) {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      if (onProfileComplete) {
        onProfileComplete(duration);
      }
    };
  }, [name, onProfileComplete]);

  return <>{children}</>;
};

// 渲染性能监控Hook
export const useRenderPerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const totalRenderTime = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      renderCount.current++;
      totalRenderTime.current += renderTime;
      lastRenderTime.current = renderTime;
      
      if (__DEV__ && renderTime > 16) { // 超过16ms警告
        console.warn(
          `[Slow Render] ${componentName}: ${renderTime.toFixed(2)}ms (renders: ${renderCount.current})`
        );
      }
    };
  });

  const getStats = () => ({
    renderCount: renderCount.current,
    averageRenderTime: renderCount.current > 0 ? totalRenderTime.current / renderCount.current : 0,
    lastRenderTime: lastRenderTime.current,
    totalRenderTime: totalRenderTime.current,
  });

  return { getStats };
};

// 内存泄漏检测Hook
export const useMemoryLeakDetection = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const timers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervals = useRef<Set<ReturnType<typeof setInterval>>>(new Set());
  const listeners = useRef<Set<() => void>>(new Set());

  // 包装setTimeout
  const safeSetTimeout = (callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      callback();
    }, delay);
    timers.current.add(timer);
    return timer;
  };

  // 包装setInterval
  const safeSetInterval = (callback: () => void, delay: number) => {
    const interval = setInterval(callback, delay);
    intervals.current.add(interval);
    return interval;
  };

  // 添加事件监听器
  const addListener = (cleanup: () => void) => {
    listeners.current.add(cleanup);
  };

  useEffect(() => {
    return () => {
      // 清理所有定时器
      timers.current.forEach(timer => clearTimeout(timer));
      intervals.current.forEach(interval => clearInterval(interval));
      
      // 清理所有监听器
      listeners.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn(`[Memory Leak] Failed to cleanup listener in ${componentName}:`, error);
        }
      });
      
      // 检查组件生命周期
      const lifeTime = Date.now() - mountTime.current;
      if (__DEV__ && lifeTime < 1000 && (timers.current.size > 0 || intervals.current.size > 0)) {
        console.warn(
          `[Memory Leak] ${componentName} unmounted quickly but has ${timers.current.size} timers and ${intervals.current.size} intervals`
        );
      }
      
      // 清理引用
      timers.current.clear();
      intervals.current.clear();
      listeners.current.clear();
    };
  }, [componentName]);

  return {
    safeSetTimeout,
    safeSetInterval,
    addListener,
  };
};

const styles = StyleSheet.create({
  metricText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
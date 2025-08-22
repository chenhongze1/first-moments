import { AppState, AppStateStatus } from 'react-native';
import { memoryManager } from './memoryManager';

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  apiResponseTime: number;
  imageLoadTime: number;
  listScrollPerformance: number;
}

interface PerformanceEvent {
  type: 'render' | 'api' | 'image' | 'scroll' | 'memory';
  duration: number;
  timestamp: number;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    memoryUsage: 0,
    apiResponseTime: 0,
    imageLoadTime: 0,
    listScrollPerformance: 0,
  };

  private events: PerformanceEvent[] = [];
  private maxEvents = 100;
  private timers = new Map<string, number>();
  private isMonitoring = __DEV__; // 只在开发环境启用

  constructor() {
    if (this.isMonitoring) {
      this.setupAppStateListener();
      this.startMemoryMonitoring();
    }
  }

  // 开始计时
  startTimer(key: string): void {
    if (!this.isMonitoring) return;
    this.timers.set(key, Date.now());
  }

  // 结束计时并记录事件
  endTimer(key: string, type: PerformanceEvent['type'], metadata?: any): number {
    if (!this.isMonitoring) return 0;
    
    const startTime = this.timers.get(key);
    if (!startTime) {
      console.warn(`Performance timer '${key}' not found`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.timers.delete(key);

    this.recordEvent({
      type,
      duration,
      timestamp: Date.now(),
      metadata,
    });

    return duration;
  }

  // 记录性能事件
  recordEvent(event: PerformanceEvent): void {
    if (!this.isMonitoring) return;

    this.events.push(event);
    
    // 限制事件数量
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // 更新指标
    this.updateMetrics(event);

    // 在开发环境输出性能警告
    if (__DEV__) {
      this.checkPerformanceThresholds(event);
    }
  }

  // 更新性能指标
  private updateMetrics(event: PerformanceEvent): void {
    switch (event.type) {
      case 'render':
        this.metrics.renderTime = this.calculateAverage('render');
        break;
      case 'api':
        this.metrics.apiResponseTime = this.calculateAverage('api');
        break;
      case 'image':
        this.metrics.imageLoadTime = this.calculateAverage('image');
        break;
      case 'scroll':
        this.metrics.listScrollPerformance = this.calculateAverage('scroll');
        break;
    }
  }

  // 计算平均值
  private calculateAverage(type: PerformanceEvent['type']): number {
    const typeEvents = this.events.filter(e => e.type === type);
    if (typeEvents.length === 0) return 0;
    
    const sum = typeEvents.reduce((acc, event) => acc + event.duration, 0);
    return sum / typeEvents.length;
  }

  // 检查性能阈值
  private checkPerformanceThresholds(event: PerformanceEvent): void {
    const thresholds: Record<PerformanceEvent['type'], number> = {
      render: 16, // 60fps = 16ms per frame
      api: 3000, // 3秒
      image: 2000, // 2秒
      scroll: 16, // 60fps
      memory: 100, // 100MB
    };

    const threshold = thresholds[event.type];
    if (threshold && event.duration > threshold) {
      console.warn(
        `[Performance] Slow ${event.type}: ${event.duration}ms (threshold: ${threshold}ms)`,
        event.metadata
      );
    }
  }

  // 获取性能报告
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    recentEvents: PerformanceEvent[];
    summary: string;
  } {
    const recentEvents = this.events.slice(-20); // 最近20个事件
    
    const summary = `
性能报告:
- 平均渲染时间: ${this.metrics.renderTime.toFixed(2)}ms
- 平均API响应时间: ${this.metrics.apiResponseTime.toFixed(2)}ms
- 平均图片加载时间: ${this.metrics.imageLoadTime.toFixed(2)}ms
- 内存使用: ${this.metrics.memoryUsage.toFixed(2)}MB
- 滚动性能: ${this.metrics.listScrollPerformance.toFixed(2)}ms
    `;

    return {
      metrics: { ...this.metrics },
      recentEvents,
      summary,
    };
  }

  // 清除性能数据
  clearData(): void {
    this.events = [];
    this.timers.clear();
    this.metrics = {
      renderTime: 0,
      memoryUsage: 0,
      apiResponseTime: 0,
      imageLoadTime: 0,
      listScrollPerformance: 0,
    };
  }

  // 监听应用状态变化
  private setupAppStateListener(): void {
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background') {
        // 应用进入后台时记录性能报告
        if (__DEV__) {
          console.log(this.getPerformanceReport().summary);
        }
      }
    });
  }

  // 开始内存监控
  private startMemoryMonitoring(): void {
    setInterval(() => {
      try {
        // 简化内存监控，使用缓存大小作为内存使用指标
        const cacheSize = memoryManager.getCacheStats().size;
        this.metrics.memoryUsage = cacheSize;
        
        // 记录内存事件
        this.recordEvent({
          type: 'memory',
          duration: cacheSize,
          timestamp: Date.now(),
          metadata: { cacheSize },
        });
      } catch (error) {
        console.warn('Memory monitoring error:', error);
      }
    }, 5000); // 每5秒检查一次内存
  }

  // API请求性能监控装饰器
  monitorApiCall<T>(apiCall: () => Promise<T>, endpoint: string): Promise<T> {
    const timerId = `api_${endpoint}_${Date.now()}`;
    this.startTimer(timerId);
    
    return apiCall()
      .then(result => {
        this.endTimer(timerId, 'api', { endpoint, success: true });
        return result;
      })
      .catch(error => {
        this.endTimer(timerId, 'api', { endpoint, success: false, error: error.message });
        throw error;
      });
  }

  // 图片加载性能监控
  monitorImageLoad(imageUrl: string): {
    onLoadStart: () => void;
    onLoadEnd: () => void;
    onError: () => void;
  } {
    const timerId = `image_${imageUrl}_${Date.now()}`;
    
    return {
      onLoadStart: () => this.startTimer(timerId),
      onLoadEnd: () => this.endTimer(timerId, 'image', { imageUrl, success: true }),
      onError: () => this.endTimer(timerId, 'image', { imageUrl, success: false }),
    };
  }

  // 渲染性能监控
  monitorRender(componentName: string): {
    onRenderStart: () => void;
    onRenderEnd: () => void;
  } {
    const timerId = `render_${componentName}_${Date.now()}`;
    
    return {
      onRenderStart: () => this.startTimer(timerId),
      onRenderEnd: () => this.endTimer(timerId, 'render', { componentName }),
    };
  }
}

// 单例实例
export const performanceMonitor = new PerformanceMonitor();

// React Hook for performance monitoring
export const usePerformanceMonitor = (componentName: string) => {
  const monitor = performanceMonitor.monitorRender(componentName);
  
  return {
    startRender: monitor.onRenderStart,
    endRender: monitor.onRenderEnd,
    monitorApiCall: performanceMonitor.monitorApiCall.bind(performanceMonitor),
    monitorImageLoad: performanceMonitor.monitorImageLoad.bind(performanceMonitor),
    getReport: performanceMonitor.getPerformanceReport.bind(performanceMonitor),
  };
};

export default performanceMonitor;
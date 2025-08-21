import { InteractionManager, AppState, AppStateStatus } from 'react-native';

// 内存管理器类
class MemoryManager {
  private static instance: MemoryManager;
  private caches: Map<string, any> = new Map();
  private cacheTimestamps: Map<string, number> = new Map();
  private maxCacheSize: number = 50; // 最大缓存项数
  private maxCacheAge: number = 5 * 60 * 1000; // 5分钟缓存过期时间
  private cleanupInterval: NodeJS.Timeout | null = null;
  private memoryWarningListeners: Set<() => void> = new Set();

  private constructor() {
    this.startCleanupTimer();
    this.setupAppStateListener();
  }

  public static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  // 设置缓存
  public setCache(key: string, value: any, ttl?: number): void {
    // 检查缓存大小限制
    if (this.caches.size >= this.maxCacheSize) {
      this.evictOldestCache();
    }

    this.caches.set(key, value);
    this.cacheTimestamps.set(key, Date.now() + (ttl || this.maxCacheAge));
  }

  // 获取缓存
  public getCache(key: string): any {
    const value = this.caches.get(key);
    const timestamp = this.cacheTimestamps.get(key);

    if (!value || !timestamp) {
      return null;
    }

    // 检查是否过期
    if (Date.now() > timestamp) {
      this.removeCache(key);
      return null;
    }

    return value;
  }

  // 移除缓存
  public removeCache(key: string): void {
    this.caches.delete(key);
    this.cacheTimestamps.delete(key);
  }

  // 清除所有缓存
  public clearAllCache(): void {
    this.caches.clear();
    this.cacheTimestamps.clear();
  }

  // 清除过期缓存
  public clearExpiredCache(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (now > timestamp) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.removeCache(key));
  }

  // 驱逐最旧的缓存
  private evictOldestCache(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cacheTimestamps.forEach((timestamp, key) => {
      if (timestamp < oldestTime) {
        oldestTime = timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey) {
      this.removeCache(oldestKey);
    }
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.clearExpiredCache();
    }, 60000); // 每分钟清理一次
  }

  // 停止清理定时器
  private stopCleanupTimer(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // 设置应用状态监听
  private setupAppStateListener(): void {
    AppState.addEventListener('change', this.handleAppStateChange.bind(this));
  }

  // 处理应用状态变化
  private handleAppStateChange(nextAppState: AppStateStatus): void {
    if (nextAppState === 'background') {
      // 应用进入后台时清理缓存
      this.clearExpiredCache();
    } else if (nextAppState === 'active') {
      // 应用激活时重启清理定时器
      if (!this.cleanupInterval) {
        this.startCleanupTimer();
      }
    }
  }

  // 添加内存警告监听器
  public addMemoryWarningListener(listener: () => void): void {
    this.memoryWarningListeners.add(listener);
  }

  // 移除内存警告监听器
  public removeMemoryWarningListener(listener: () => void): void {
    this.memoryWarningListeners.delete(listener);
  }

  // 触发内存警告
  public triggerMemoryWarning(): void {
    // 清除所有缓存
    this.clearAllCache();
    
    // 通知所有监听器
    this.memoryWarningListeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.warn('Memory warning listener error:', error);
      }
    });
  }

  // 获取缓存统计信息
  public getCacheStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    memoryUsage: string;
  } {
    return {
      size: this.caches.size,
      maxSize: this.maxCacheSize,
      hitRate: 0, // 简化实现，实际应用中可以跟踪命中率
      memoryUsage: `${this.caches.size}/${this.maxCacheSize}`,
    };
  }

  // 销毁管理器
  public destroy(): void {
    this.stopCleanupTimer();
    this.clearAllCache();
    this.memoryWarningListeners.clear();
  }
}

// 导出单例实例
export const memoryManager = MemoryManager.getInstance();

// 内存优化工具函数
export class MemoryOptimizer {
  // 延迟执行函数，避免阻塞主线程
  public static runAfterInteractions<T>(fn: () => T): Promise<T> {
    return new Promise((resolve) => {
      InteractionManager.runAfterInteractions(() => {
        resolve(fn());
      });
    });
  }

  // 分批处理大量数据
  public static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    batchSize: number = 10,
    delay: number = 0
  ): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      // 处理当前批次
      const batchResults = await Promise.all(
        batch.map(item => processor(item))
      );
      
      results.push(...batchResults);
      
      // 如果不是最后一批，添加延迟
      if (i + batchSize < items.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return results;
  }

  // 防抖函数
  public static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = setTimeout(() => {
        func(...args);
      }, wait);
    };
  }

  // 节流函数
  public static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  // 内存使用监控
  public static monitorMemoryUsage(): {
    jsHeapSizeLimit?: number;
    totalJSHeapSize?: number;
    usedJSHeapSize?: number;
  } {
    // 在Web环境中可以使用performance.memory
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in (window as any).performance) {
      const memory = (window as any).performance.memory;
      return {
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
      };
    }
    
    return {};
  }

  // 清理未使用的对象引用
  public static cleanupReferences(obj: any): void {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        if (obj[key] && typeof obj[key] === 'object') {
          obj[key] = null;
        }
      });
    }
  }
}

// React Hook for memory management
import { useEffect, useRef, useCallback } from 'react';

export const useMemoryOptimization = () => {
  const cleanupFunctions = useRef<(() => void)[]>([]);

  // 添加清理函数
  const addCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.push(cleanup);
  }, []);

  // 组件卸载时执行清理
  useEffect(() => {
    return () => {
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.warn('Cleanup function error:', error);
        }
      });
      cleanupFunctions.current = [];
    };
  }, []);

  // 缓存管理
  const setCache = useCallback((key: string, value: any, ttl?: number) => {
    memoryManager.setCache(key, value, ttl);
  }, []);

  const getCache = useCallback((key: string) => {
    return memoryManager.getCache(key);
  }, []);

  const removeCache = useCallback((key: string) => {
    memoryManager.removeCache(key);
    
    // 添加到清理函数中
    addCleanup(() => memoryManager.removeCache(key));
  }, [addCleanup]);

  return {
    addCleanup,
    setCache,
    getCache,
    removeCache,
    memoryStats: memoryManager.getCacheStats(),
  };
};

// 图片缓存管理
export class ImageCacheManager {
  private static cache: Map<string, string> = new Map();
  private static maxSize: number = 100;

  public static setImage(uri: string, base64: string): void {
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的图片
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(uri, base64);
  }

  public static getImage(uri: string): string | null {
    return this.cache.get(uri) || null;
  }

  public static removeImage(uri: string): void {
    this.cache.delete(uri);
  }

  public static clearAll(): void {
    this.cache.clear();
  }

  public static getSize(): number {
    return this.cache.size;
  }
}
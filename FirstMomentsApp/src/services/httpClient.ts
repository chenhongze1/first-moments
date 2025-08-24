import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { memoryManager } from '../utils/memoryManager';
import { performanceMonitor } from '../utils/performanceMonitor';

// 缓存配置接口
interface CacheConfig {
  ttl?: number; // 缓存时间（毫秒）
  key?: string; // 自定义缓存键
  enabled?: boolean; // 是否启用缓存
}

// 扩展AxiosRequestConfig以支持缓存
interface CachedAxiosRequestConfig extends AxiosRequestConfig {
  cache?: CacheConfig;
}

class HttpClient {
  private instance: AxiosInstance;
  private onUnauthorized?: () => void;
  private defaultCacheTTL: number = 5 * 60 * 1000; // 默认5分钟缓存

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.setupCacheInterceptors();
  }

  public setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  // 生成缓存键
  private generateCacheKey(url: string, method: string, params?: any, data?: any): string {
    const baseKey = `api_cache_${method}_${url}`;
    if (params || data) {
      const hash = JSON.stringify({ params, data });
      return `${baseKey}_${btoa(hash).slice(0, 10)}`;
    }
    return baseKey;
  }

  // 设置缓存拦截器
  private setupCacheInterceptors() {
    // 请求拦截器 - 检查缓存
    this.instance.interceptors.request.use(
      async (config: any) => {
        // 只对GET请求启用缓存
        if (config.method?.toLowerCase() === 'get' && config.cache?.enabled !== false) {
          const cacheKey = config.cache?.key || this.generateCacheKey(
            config.url || '',
            config.method,
            config.params,
            config.data
          );
          
          const cachedResponse = memoryManager.getCache(cacheKey);
          if (cachedResponse) {
            // 返回缓存的响应，但需要包装成Promise
            (config as any).adapter = () => Promise.resolve({
              data: cachedResponse,
              status: 200,
              statusText: 'OK',
              headers: {},
              config,
            });
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器 - 缓存响应
    this.instance.interceptors.response.use(
      (response) => {
        const config = response.config as CachedAxiosRequestConfig;
        
        // 只对GET请求且成功的响应进行缓存
        if (config.method?.toLowerCase() === 'get' && 
            response.status === 200 && 
            config.cache?.enabled !== false) {
          
          const cacheKey = config.cache?.key || this.generateCacheKey(
            config.url || '',
            config.method,
            config.params,
            config.data
          );
          
          const ttl = config.cache?.ttl || this.defaultCacheTTL;
          memoryManager.setCache(cacheKey, response.data, ttl);
        }
        
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          await AsyncStorage.removeItem('auth_token');
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private setupInterceptors() {
    // 请求拦截器 - 添加认证token
    this.instance.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 处理认证错误
    this.instance.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        if (error.response?.status === 401) {
          // 清除过期的token
          await AsyncStorage.removeItem('auth_token');
          // 调用未授权处理器
          if (this.onUnauthorized) {
            this.onUnauthorized();
          }
        }
        return Promise.reject(error);
      }
    );
  }

  public get<T = any>(url: string, config?: CachedAxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.monitorApiCall(
      () => this.instance.get<T>(url, config),
      `GET ${url}`
    );
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.monitorApiCall(
      () => this.instance.post<T>(url, data, config),
      `POST ${url}`
    );
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.monitorApiCall(
      () => this.instance.put<T>(url, data, config),
      `PUT ${url}`
    );
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.monitorApiCall(
      () => this.instance.delete<T>(url, config),
      `DELETE ${url}`
    );
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return performanceMonitor.monitorApiCall(
      () => this.instance.patch<T>(url, data, config),
      `PATCH ${url}`
    );
  }

  // 清除特定缓存
  public clearCache(key?: string): void {
    if (key) {
      memoryManager.removeCache(key);
    } else {
      memoryManager.clearAllCache();
    }
  }

  // 预加载数据到缓存
  public async preloadCache(url: string, config?: CachedAxiosRequestConfig): Promise<void> {
    try {
      await this.get(url, { ...config, cache: { enabled: true, ...config?.cache } });
    } catch (error) {
      console.warn('预加载缓存失败:', error);
    }
  }
}

export const httpClient = new HttpClient();
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

class HttpClient {
  private instance: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor() {
    this.instance = axios.create({
      baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
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
          // Token过期或无效，清除本地存储
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

  public get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.get<T>(url, config);
  }

  public post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.post<T>(url, data, config);
  }

  public put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.put<T>(url, data, config);
  }

  public delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.delete<T>(url, config);
  }

  public patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.instance.patch<T>(url, data, config);
  }
}

export const httpClient = new HttpClient();
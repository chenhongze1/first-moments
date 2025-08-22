import { Alert } from 'react-native';
import { store } from '../store';
import { showToast } from '../store/slices/uiSlice';
import { t } from '../i18n';

// 错误类型枚举
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTH = 'AUTH',
  PERMISSION = 'PERMISSION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  FILE_UPLOAD = 'FILE_UPLOAD',
  UNKNOWN = 'UNKNOWN'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  code?: string | number;
  details?: any;
  timestamp: number;
  userId?: string;
  context?: string;
}

// 错误处理配置
interface ErrorHandlerConfig {
  showToast: boolean;
  showAlert: boolean;
  logError: boolean;
  reportError: boolean;
  autoRetry: boolean;
  maxRetries: number;
}

// 默认错误处理配置
const defaultConfig: ErrorHandlerConfig = {
  showToast: true,
  showAlert: false,
  logError: true,
  reportError: false,
  autoRetry: false,
  maxRetries: 3
};

// 错误映射表
const errorTypeMap: Record<number | string, ErrorType> = {
  400: ErrorType.VALIDATION,
  401: ErrorType.AUTH,
  403: ErrorType.PERMISSION,
  404: ErrorType.NOT_FOUND,
  408: ErrorType.TIMEOUT,
  413: ErrorType.FILE_UPLOAD,
  422: ErrorType.VALIDATION,
  429: ErrorType.SERVER,
  500: ErrorType.SERVER,
  502: ErrorType.SERVER,
  503: ErrorType.SERVER,
  504: ErrorType.TIMEOUT,
  'NETWORK_ERROR': ErrorType.NETWORK,
  'TIMEOUT_ERROR': ErrorType.TIMEOUT,
  'ECONNABORTED': ErrorType.TIMEOUT,
  'ENOTFOUND': ErrorType.NETWORK,
  'ECONNREFUSED': ErrorType.NETWORK
};

// 错误消息映射
const getErrorMessage = (type: ErrorType, code?: string | number): string => {
  const errorKey = `errors.${type.toLowerCase()}Error`;
  const defaultMessage = t(errorKey);
  
  // 特殊错误码的自定义消息
  const customMessages: Record<string, string> = {
    '401': t('errors.authError'),
    '403': t('errors.permissionError'),
    '404': t('errors.notFoundError'),
    '408': t('errors.timeoutError'),
    '413': t('errors.fileSizeError'),
    '422': t('errors.validationError'),
    '429': t('errors.serverError'),
    '500': t('errors.serverError'),
    '502': t('errors.serverError'),
    '503': t('errors.serverError'),
    '504': t('errors.timeoutError')
  };
  
  return code ? customMessages[code.toString()] || defaultMessage : defaultMessage;
};

// 错误严重程度映射
const getSeverity = (type: ErrorType): ErrorSeverity => {
  switch (type) {
    case ErrorType.AUTH:
    case ErrorType.PERMISSION:
      return ErrorSeverity.HIGH;
    case ErrorType.SERVER:
      return ErrorSeverity.CRITICAL;
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
      return ErrorSeverity.MEDIUM;
    case ErrorType.VALIDATION:
    case ErrorType.NOT_FOUND:
    case ErrorType.FILE_UPLOAD:
      return ErrorSeverity.LOW;
    default:
      return ErrorSeverity.MEDIUM;
  }
};

// 全局错误处理器类
class GlobalErrorHandler {
  private errorLog: ErrorInfo[] = [];
  private maxLogSize = 100;
  private retryAttempts = new Map<string, number>();
  
  // 处理错误的主要方法
  public handleError(
    error: any,
    context?: string,
    config: Partial<ErrorHandlerConfig> = {}
  ): ErrorInfo {
    const finalConfig = { ...defaultConfig, ...config };
    const errorInfo = this.parseError(error, context);
    
    // 记录错误
    if (finalConfig.logError) {
      this.logError(errorInfo);
    }
    
    // 显示用户反馈
    this.showUserFeedback(errorInfo, finalConfig);
    
    // 错误上报
    if (finalConfig.reportError) {
      this.reportError(errorInfo);
    }
    
    return errorInfo;
  }
  
  // 解析错误信息
  private parseError(error: any, context?: string): ErrorInfo {
    let type = ErrorType.UNKNOWN;
    let code: string | number | undefined;
    let message = t('errors.unknownError');
    
    if (error?.response) {
      // HTTP 错误
      code = error.response.status;
      type = (code !== undefined ? errorTypeMap[code] : undefined) || ErrorType.SERVER;
      message = error.response.data?.message || (code ? getErrorMessage(type, code) : getErrorMessage(type));
    } else if (error?.code) {
      // 网络错误
      code = error.code;
      type = (code !== undefined ? errorTypeMap[code] : undefined) || ErrorType.NETWORK;
      message = code ? getErrorMessage(type, code) : getErrorMessage(type);
    } else if (error?.message) {
      // 一般错误
      message = error.message;
      // 尝试从消息中推断错误类型
      if (message.toLowerCase().includes('network')) {
        type = ErrorType.NETWORK;
      } else if (message.toLowerCase().includes('timeout')) {
        type = ErrorType.TIMEOUT;
      } else if (message.toLowerCase().includes('validation')) {
        type = ErrorType.VALIDATION;
      }
    }
    
    return {
      type,
      severity: getSeverity(type),
      message,
      code,
      details: error,
      timestamp: Date.now(),
      context
    };
  }
  
  // 显示用户反馈
  private showUserFeedback(errorInfo: ErrorInfo, config: ErrorHandlerConfig) {
    const { message, severity, type } = errorInfo;
    
    if (config.showToast) {
      const toastType = this.getToastType(severity);
      store.dispatch(showToast({
        type: toastType,
        message,
        duration: this.getToastDuration(severity)
      }));
    }
    
    if (config.showAlert && severity === ErrorSeverity.CRITICAL) {
      Alert.alert(
        t('common.error'),
        message,
        [
          {
            text: t('common.ok'),
            style: 'default'
          }
        ]
      );
    }
  }
  
  // 获取Toast类型
  private getToastType(severity: ErrorSeverity): 'error' | 'warning' | 'info' {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warning';
      default:
        return 'info';
    }
  }
  
  // 获取Toast持续时间
  private getToastDuration(severity: ErrorSeverity): number {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        return 8000;
      case ErrorSeverity.HIGH:
        return 6000;
      case ErrorSeverity.MEDIUM:
        return 4000;
      default:
        return 3000;
    }
  }
  
  // 记录错误
  private logError(errorInfo: ErrorInfo) {
    console.error('GlobalErrorHandler:', errorInfo);
    
    // 添加到错误日志
    this.errorLog.unshift(errorInfo);
    
    // 保持日志大小限制
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }
  
  // 错误上报（可集成第三方服务）
  private reportError(errorInfo: ErrorInfo) {
    // 这里可以集成 Crashlytics、Sentry 等错误上报服务
    // crashlytics().recordError(new Error(errorInfo.message));
    console.log('Error reported:', errorInfo);
  }
  
  // 获取错误日志
  public getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }
  
  // 清除错误日志
  public clearErrorLog() {
    this.errorLog = [];
  }
  
  // 处理网络错误的重试逻辑
  public async handleWithRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries = 3
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        // 成功后清除重试计数
        this.retryAttempts.delete(context);
        return result;
      } catch (error) {
        lastError = error;
        
        // 记录重试次数
        this.retryAttempts.set(context, attempt);
        
        // 如果是最后一次尝试或不应该重试的错误类型
        if (attempt === maxRetries || !this.shouldRetry(error)) {
          break;
        }
        
        // 等待一段时间后重试（指数退避）
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
    
    // 所有重试都失败，处理错误
    throw lastError;
  }
  
  // 判断是否应该重试
  private shouldRetry(error: any): boolean {
    if (error?.response) {
      const status = error.response.status;
      // 5xx 服务器错误和 408 超时可以重试
      return status >= 500 || status === 408;
    }
    
    if (error?.code) {
      // 网络错误可以重试
      return ['ECONNABORTED', 'ENOTFOUND', 'ECONNREFUSED', 'NETWORK_ERROR'].includes(error.code);
    }
    
    return false;
  }
  
  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new GlobalErrorHandler();

// 便捷的错误处理函数
export const handleError = (
  error: any,
  context?: string,
  config?: Partial<ErrorHandlerConfig>
): ErrorInfo => {
  return globalErrorHandler.handleError(error, context, config);
};

// 带重试的异步操作
export const withRetry = <T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries = 3
): Promise<T> => {
  return globalErrorHandler.handleWithRetry(operation, context, maxRetries);
};

// 网络错误处理
export const handleNetworkError = (error: any, context?: string): ErrorInfo => {
  return handleError(error, context, {
    showToast: true,
    showAlert: false,
    logError: true,
    reportError: true
  });
};

// 验证错误处理
export const handleValidationError = (error: any, context?: string): ErrorInfo => {
  return handleError(error, context, {
    showToast: true,
    showAlert: false,
    logError: false,
    reportError: false
  });
};

// 认证错误处理
export const handleAuthError = (error: any, context?: string): ErrorInfo => {
  return handleError(error, context, {
    showToast: true,
    showAlert: true,
    logError: true,
    reportError: true
  });
};

export default globalErrorHandler;
import { useCallback } from 'react';
import { globalErrorHandler } from '../utils/errorHandler';

// 错误处理选项接口
interface ErrorHandlerOptions {
  showToast?: boolean;
  showAlert?: boolean;
  logError?: boolean;
  reportError?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
}

/**
 * 全局错误处理Hook
 * 提供统一的错误处理接口
 */
export const useErrorHandler = () => {
  const errorHandler = globalErrorHandler;

  /**
   * 处理错误
   * @param error 错误对象
   * @param options 处理选项
   */
  const handleError = useCallback((error: any, options?: Partial<ErrorHandlerOptions>) => {
    errorHandler.handleError(error, undefined, options);
  }, [errorHandler]);

  /**
   * 处理带重试的异步操作
   * @param operation 异步操作函数
   * @param context 操作上下文
   * @param maxRetries 最大重试次数
   * @returns Promise结果
   */
  const handleWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries = 3
  ): Promise<T> => {
    return errorHandler.handleWithRetry(operation, context, maxRetries);
  }, [errorHandler]);

  /**
   * 显示成功Toast
   * @param message 成功消息
   */
  const showSuccess = useCallback((message: string) => {
    import('../store').then(({ store }) => {
      import('../store/slices/uiSlice').then(({ showToast }) => {
        store.dispatch(showToast({
          type: 'success',
          message,
          duration: 3000
        }));
      });
    });
  }, []);

  /**
   * 显示警告Toast
   * @param message 警告消息
   */
  const showWarning = useCallback((message: string) => {
    import('../store').then(({ store }) => {
      import('../store/slices/uiSlice').then(({ showToast }) => {
        store.dispatch(showToast({
          type: 'warning',
          message,
          duration: 4000
        }));
      });
    });
  }, []);

  /**
   * 显示信息Toast
   * @param message 信息消息
   */
  const showInfo = useCallback((message: string) => {
    import('../store').then(({ store }) => {
      import('../store/slices/uiSlice').then(({ showToast }) => {
        store.dispatch(showToast({
          type: 'info',
          message,
          duration: 3000
        }));
      });
    });
  }, []);

  return {
    handleError,
    handleWithRetry,
    showSuccess,
    showWarning,
    showInfo,
  };
};

export default useErrorHandler;
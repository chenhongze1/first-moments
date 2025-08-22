import { useState, useCallback } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { t } from '../i18n';

/**
 * 异步操作状态
 */
interface AsyncOperationState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

/**
 * 异步操作选项
 */
interface AsyncOperationOptions {
  showSuccessToast?: boolean;
  successMessage?: string;
  showErrorToast?: boolean;
  showErrorAlert?: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * 带错误处理的异步操作Hook
 * 集成了加载状态、错误处理和用户反馈
 */
export const useAsyncOperationWithErrorHandling = <T = any>(
  initialData: T | null = null
) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
  });

  const { handleError, handleWithRetry, showSuccess } = useErrorHandler();

  /**
   * 执行异步操作
   * @param operation 异步操作函数
   * @param options 操作选项
   */
  const execute = useCallback(async (
    operation: () => Promise<T>,
    options: AsyncOperationOptions = {}
  ) => {
    const {
      showSuccessToast = false,
      successMessage,
      showErrorToast = true,
      showErrorAlert = false,
      autoRetry = false,
      maxRetries = 3,
      onSuccess,
      onError,
    } = options;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
      success: false,
    }));

    try {
      let result: T;
      
      if (autoRetry) {
        // 使用重试机制
        result = await handleWithRetry(
          operation,
          'async-operation',
          maxRetries
        );
      } else {
        // 直接执行
        result = await operation();
      }

      setState({
        data: result,
        loading: false,
        error: null,
        success: true,
      });

      // 显示成功消息
      if (showSuccessToast) {
        const message = successMessage || t('common.operationSuccess');
        showSuccess(message);
      }

      // 成功回调
      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || t('errors.unknownError');
      
      setState({
        data: null,
        loading: false,
        error: errorMessage,
        success: false,
      });

      // 错误处理
      handleError(error, {
        showToast: showErrorToast,
        showAlert: showErrorAlert,
        logError: true,
        reportError: false,
        autoRetry: false,
        maxRetries: 3,
      });

      // 错误回调
      if (onError) {
        onError(error);
      }

      throw error;
    }
  }, [handleError, handleWithRetry, showSuccess]);

  /**
   * 重置状态
   */
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
    });
  }, [initialData]);

  /**
   * 设置数据
   * @param data 新数据
   */
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      error: null,
      success: true,
    }));
  }, []);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    clearError,
  };
};

export default useAsyncOperationWithErrorHandling;
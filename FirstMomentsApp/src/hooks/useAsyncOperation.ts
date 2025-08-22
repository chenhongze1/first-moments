import { useState, useCallback, useRef, useEffect } from 'react';

// 异步操作状态
export interface AsyncOperationState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
  success: boolean;
}

// 异步操作选项
export interface AsyncOperationOptions {
  showSuccessMessage?: boolean;
  successMessage?: string;
  showErrorMessage?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retryCount?: number;
  retryDelay?: number;
}

// 异步操作Hook
export const useAsyncOperation = <T = any>(
  initialData: T | null = null,
  options: AsyncOperationOptions = {}
) => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    data: initialData,
    loading: false,
    error: null,
    success: false,
  });

  const retryCountRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 执行异步操作
  const execute = useCallback(
    async (asyncFunction: () => Promise<T>, operationOptions?: AsyncOperationOptions) => {
      const mergedOptions = { ...options, ...operationOptions };
      
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
        success: false,
      }));

      try {
        const result = await asyncFunction();
        
        setState({
          data: result,
          loading: false,
          error: null,
          success: true,
        });

        // 成功回调
        if (mergedOptions.onSuccess) {
          mergedOptions.onSuccess(result);
        }

        // 重置重试计数
        retryCountRef.current = 0;

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || '操作失败';
        
        // 检查是否需要重试
        const maxRetries = mergedOptions.retryCount || 0;
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current += 1;
          const delay = mergedOptions.retryDelay || 1000;
          
          timeoutRef.current = setTimeout(() => {
            execute(asyncFunction, operationOptions);
          }, delay);
          
          return;
        }

        setState({
          data: null,
          loading: false,
          error: errorMessage,
          success: false,
        });

        // 错误回调
        if (mergedOptions.onError) {
          mergedOptions.onError(errorMessage);
        }

        // 重置重试计数
        retryCountRef.current = 0;

        throw error;
      }
    },
    [options]
  );

  // 重置状态
  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
      success: false,
    });
    retryCountRef.current = 0;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [initialData]);

  // 设置数据
  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
      success: data !== null,
    }));
  }, []);

  // 设置错误
  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
      success: false,
    }));
  }, []);

  // 手动重试
  const retry = useCallback(
    (asyncFunction: () => Promise<T>, operationOptions?: AsyncOperationOptions) => {
      retryCountRef.current = 0;
      return execute(asyncFunction, operationOptions);
    },
    [execute]
  );

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    retry,
    isRetrying: retryCountRef.current > 0,
  };
};

// 批量异步操作Hook
export const useBatchAsyncOperation = <T = any>() => {
  const [operations, setOperations] = useState<Record<string, AsyncOperationState<T>>>({});

  // 执行单个操作
  const executeOperation = useCallback(
    async (
      key: string,
      asyncFunction: () => Promise<T>,
      options: AsyncOperationOptions = {}
    ) => {
      // 设置加载状态
      setOperations(prev => ({
        ...prev,
        [key]: {
          data: null,
          loading: true,
          error: null,
          success: false,
        },
      }));

      try {
        const result = await asyncFunction();
        
        setOperations(prev => ({
          ...prev,
          [key]: {
            data: result,
            loading: false,
            error: null,
            success: true,
          },
        }));

        if (options.onSuccess) {
          options.onSuccess(result);
        }

        return result;
      } catch (error: any) {
        const errorMessage = error?.message || '操作失败';
        
        setOperations(prev => ({
          ...prev,
          [key]: {
            data: null,
            loading: false,
            error: errorMessage,
            success: false,
          },
        }));

        if (options.onError) {
          options.onError(errorMessage);
        }

        throw error;
      }
    },
    []
  );

  // 获取操作状态
  const getOperationState = useCallback(
    (key: string): AsyncOperationState<T> => {
      return operations[key] || {
        data: null,
        loading: false,
        error: null,
        success: false,
      };
    },
    [operations]
  );

  // 重置操作
  const resetOperation = useCallback((key: string) => {
    setOperations(prev => {
      const newOperations = { ...prev };
      delete newOperations[key];
      return newOperations;
    });
  }, []);

  // 重置所有操作
  const resetAllOperations = useCallback(() => {
    setOperations({});
  }, []);

  // 检查是否有任何操作在加载中
  const isAnyLoading = Object.values(operations).some(op => op.loading);

  // 检查是否有任何操作出错
  const hasAnyError = Object.values(operations).some(op => op.error);

  return {
    operations,
    executeOperation,
    getOperationState,
    resetOperation,
    resetAllOperations,
    isAnyLoading,
    hasAnyError,
  };
};

// 分页加载Hook
export interface PaginationState<T> {
  data: T[];
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  page: number;
}

export const usePaginatedAsyncOperation = <T = any>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize: number = 20
) => {
  const [state, setState] = useState<PaginationState<T>>({
    data: [],
    loading: false,
    refreshing: false,
    loadingMore: false,
    error: null,
    hasMore: true,
    page: 1,
  });

  // 初始加载
  const load = useCallback(async () => {
    if (state.loading || state.refreshing) return;

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }));

    try {
      const result = await fetchFunction(1, pageSize);
      setState({
        data: result.data,
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
        hasMore: result.hasMore,
        page: 1,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error?.message || '加载失败',
      }));
    }
  }, [fetchFunction, pageSize, state.loading, state.refreshing]);

  // 刷新
  const refresh = useCallback(async () => {
    if (state.loading || state.refreshing) return;

    setState(prev => ({
      ...prev,
      refreshing: true,
      error: null,
    }));

    try {
      const result = await fetchFunction(1, pageSize);
      setState({
        data: result.data,
        loading: false,
        refreshing: false,
        loadingMore: false,
        error: null,
        hasMore: result.hasMore,
        page: 1,
      });
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        refreshing: false,
        error: error?.message || '刷新失败',
      }));
    }
  }, [fetchFunction, pageSize, state.loading, state.refreshing]);

  // 加载更多
  const loadMore = useCallback(async () => {
    if (state.loadingMore || !state.hasMore || state.loading || state.refreshing) return;

    setState(prev => ({
      ...prev,
      loadingMore: true,
      error: null,
    }));

    try {
      const nextPage = state.page + 1;
      const result = await fetchFunction(nextPage, pageSize);
      setState(prev => ({
        ...prev,
        data: [...prev.data, ...result.data],
        loadingMore: false,
        hasMore: result.hasMore,
        page: nextPage,
      }));
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loadingMore: false,
        error: error?.message || '加载更多失败',
      }));
    }
  }, [fetchFunction, pageSize, state.page, state.hasMore, state.loadingMore, state.loading, state.refreshing]);

  // 重置
  const reset = useCallback(() => {
    setState({
      data: [],
      loading: false,
      refreshing: false,
      loadingMore: false,
      error: null,
      hasMore: true,
      page: 1,
    });
  }, []);

  return {
    ...state,
    load,
    refresh,
    loadMore,
    reset,
  };
};
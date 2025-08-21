import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { LoadingOverlay } from '../components/ui/LoadingStates';

// 加载状态接口
interface LoadingState {
  id: string;
  message?: string;
  progress?: number;
  cancellable?: boolean;
}

// 加载上下文接口
interface LoadingContextType {
  // 显示全局加载
  showLoading: (id: string, message?: string, options?: LoadingOptions) => void;
  // 隐藏全局加载
  hideLoading: (id: string) => void;
  // 更新加载进度
  updateProgress: (id: string, progress: number) => void;
  // 更新加载消息
  updateMessage: (id: string, message: string) => void;
  // 检查是否正在加载
  isLoading: (id?: string) => boolean;
  // 获取当前加载状态
  getLoadingState: (id: string) => LoadingState | undefined;
  // 清除所有加载状态
  clearAll: () => void;
}

// 加载选项
interface LoadingOptions {
  progress?: number;
  cancellable?: boolean;
  onCancel?: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// 加载状态提供者
interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<Map<string, LoadingState>>(new Map());
  const [cancelHandlers, setCancelHandlers] = useState<Map<string, () => void>>(new Map());

  // 显示加载
  const showLoading = useCallback(
    (id: string, message?: string, options?: LoadingOptions) => {
      setLoadingStates(prev => {
        const newStates = new Map(prev);
        newStates.set(id, {
          id,
          message,
          progress: options?.progress,
          cancellable: options?.cancellable,
        });
        return newStates;
      });

      // 设置取消处理器
      if (options?.onCancel) {
        setCancelHandlers(prev => {
          const newHandlers = new Map(prev);
          newHandlers.set(id, options.onCancel!);
          return newHandlers;
        });
      }
    },
    []
  );

  // 隐藏加载
  const hideLoading = useCallback((id: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      newStates.delete(id);
      return newStates;
    });

    setCancelHandlers(prev => {
      const newHandlers = new Map(prev);
      newHandlers.delete(id);
      return newHandlers;
    });
  }, []);

  // 更新进度
  const updateProgress = useCallback((id: string, progress: number) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(id);
      if (currentState) {
        newStates.set(id, {
          ...currentState,
          progress,
        });
      }
      return newStates;
    });
  }, []);

  // 更新消息
  const updateMessage = useCallback((id: string, message: string) => {
    setLoadingStates(prev => {
      const newStates = new Map(prev);
      const currentState = newStates.get(id);
      if (currentState) {
        newStates.set(id, {
          ...currentState,
          message,
        });
      }
      return newStates;
    });
  }, []);

  // 检查是否正在加载
  const isLoading = useCallback(
    (id?: string) => {
      if (id) {
        return loadingStates.has(id);
      }
      return loadingStates.size > 0;
    },
    [loadingStates]
  );

  // 获取加载状态
  const getLoadingState = useCallback(
    (id: string) => {
      return loadingStates.get(id);
    },
    [loadingStates]
  );

  // 清除所有加载状态
  const clearAll = useCallback(() => {
    setLoadingStates(new Map());
    setCancelHandlers(new Map());
  }, []);

  // 获取主要加载状态（用于显示）
  const primaryLoadingState = Array.from(loadingStates.values())[0];

  const contextValue: LoadingContextType = {
    showLoading,
    hideLoading,
    updateProgress,
    updateMessage,
    isLoading,
    getLoadingState,
    clearAll,
  };

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}
      <LoadingOverlay
        visible={loadingStates.size > 0}
        text={primaryLoadingState?.message || '加载中...'}
      />
    </LoadingContext.Provider>
  );
};

// 使用加载上下文的Hook
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// 自动管理加载状态的Hook
export const useAutoLoading = (id: string) => {
  const { showLoading, hideLoading, updateProgress, updateMessage, isLoading, getLoadingState } = useLoading();

  const startLoading = useCallback(
    (message?: string, options?: LoadingOptions) => {
      showLoading(id, message, options);
    },
    [id, showLoading]
  );

  const stopLoading = useCallback(() => {
    hideLoading(id);
  }, [id, hideLoading]);

  const setProgress = useCallback(
    (progress: number) => {
      updateProgress(id, progress);
    },
    [id, updateProgress]
  );

  const setMessage = useCallback(
    (message: string) => {
      updateMessage(id, message);
    },
    [id, updateMessage]
  );

  const loading = isLoading(id);
  const state = getLoadingState(id);

  return {
    loading,
    state,
    startLoading,
    stopLoading,
    setProgress,
    setMessage,
  };
};

// 异步操作加载装饰器Hook
export const useAsyncWithLoading = <T extends any[], R>(
  asyncFunction: (...args: T) => Promise<R>,
  loadingId: string,
  loadingMessage?: string
) => {
  const { startLoading, stopLoading } = useAutoLoading(loadingId);

  const wrappedFunction = useCallback(
    async (...args: T): Promise<R> => {
      try {
        startLoading(loadingMessage);
        const result = await asyncFunction(...args);
        return result;
      } finally {
        stopLoading();
      }
    },
    [asyncFunction, startLoading, stopLoading, loadingMessage]
  );

  return wrappedFunction;
};

// 批量操作加载Hook
export const useBatchLoading = () => {
  const { showLoading, hideLoading, updateProgress } = useLoading();

  const executeBatch = useCallback(
    async (
      operations: Array<{
        id: string;
        operation: () => Promise<any>;
        message?: string;
      }>,
      onProgress?: (completed: number, total: number) => void
    ) => {
      const results: any[] = [];
      const total = operations.length;

      for (let i = 0; i < operations.length; i++) {
        const { id, operation, message } = operations[i];
        
        try {
          showLoading(id, message || `执行操作 ${i + 1}/${total}`);
          const result = await operation();
          results.push(result);
          
          // 更新进度
          const progress = ((i + 1) / total) * 100;
          updateProgress(id, progress);
          
          if (onProgress) {
            onProgress(i + 1, total);
          }
        } finally {
          hideLoading(id);
        }
      }

      return results;
    },
    [showLoading, hideLoading, updateProgress]
  );

  return { executeBatch };
};
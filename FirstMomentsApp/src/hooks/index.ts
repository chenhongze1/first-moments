import { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store/index';
import { debounce } from '../utils/index';

// 类型化的Redux hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = <T>(selector: (state: RootState) => T) => useSelector(selector);

// 防抖hook
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 防抖回调hook
export const useDebouncedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback(
    debounce((...args: Parameters<T>) => callbackRef.current(...args), delay),
    [delay]
  );
};

// 本地存储hook
export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
};

// 异步状态hook
export const useAsyncState = <T, E = Error>() => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async (asyncFunction: () => Promise<T>) => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFunction();
      setData(result);
      return result;
    } catch (err) {
      setError(err as E);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
};

// 组件挂载状态hook
export const useIsMounted = () => {
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  return isMountedRef;
};

// 前一个值hook
export const usePrevious = <T>(value: T): T | undefined => {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  });
  
  return ref.current;
};

// 切换状态hook
export const useToggle = (initialValue: boolean = false): [boolean, () => void] => {
  const [value, setValue] = useState(initialValue);
  
  const toggle = useCallback(() => {
    setValue(v => !v);
  }, []);
  
  return [value, toggle];
};

// 计数器hook
export const useCounter = (initialValue: number = 0) => {
  const [count, setCount] = useState(initialValue);
  
  const increment = useCallback(() => setCount(x => x + 1), []);
  const decrement = useCallback(() => setCount(x => x - 1), []);
  const reset = useCallback(() => setCount(initialValue), [initialValue]);
  
  return { count, increment, decrement, reset, setCount };
};

// 网络状态hook（React Native环境下需要额外配置）
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);
  
  // 在React Native中，需要使用@react-native-community/netinfo
  // 这里提供基础结构
  
  return { isOnline };
};

// 键盘状态hook（React Native）
export const useKeyboard = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  
  // 在React Native中需要监听键盘事件
  // 这里提供基础结构
  
  return { keyboardHeight, isKeyboardVisible };
};
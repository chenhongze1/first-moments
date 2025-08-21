import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import { Platform } from 'react-native';

import authSlice from './slices/authSlice';
import profileSlice from './slices/profileSlice';
import achievementSlice from './slices/achievementSlice';
import mapSlice from './slices/mapSlice';
import uiSlice from './slices/uiSlice';
import momentSlice from './slices/momentSlice';

// 为 Web 环境创建 localStorage 适配器
const createWebStorage = () => {
  return {
    getItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.getItem(key));
      }
      return Promise.resolve(null);
    },
    setItem: (key: string, value: string) => {
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.setItem(key, value));
      }
      return Promise.resolve();
    },
    removeItem: (key: string) => {
      if (typeof window !== 'undefined') {
        return Promise.resolve(window.localStorage.removeItem(key));
      }
      return Promise.resolve();
    }
  };
};

// 根据平台选择存储引擎
const storage = Platform.OS === 'web' ? createWebStorage() : AsyncStorage;

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth', 'profile'] // 只持久化认证和档案数据
};

const rootReducer = combineReducers({
  auth: authSlice,
  profile: profileSlice,
  achievement: achievementSlice,
  map: mapSlice,
  ui: uiSlice,
  moment: momentSlice
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
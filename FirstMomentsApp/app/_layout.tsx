import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
// Web平台滚动修复
import '../src/styles/global.web';

import { store } from '../src/store';
import { useAppDispatch, useAppSelector } from '../src/hooks/redux';
import { autoLoginAsync, logout } from '../src/store/slices/authSlice';
import { fetchProfilesAsync } from '../src/store/slices/profileSlice';
import { httpClient } from '../src/services/httpClient';
import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { LoadingProvider } from '../src/contexts/LoadingContext';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ToastContainer } from '../src/components/Toast';
import { ModalContainer } from '../src/components/Modal';
// import { LoadingDebug } from '../src/components/debug/LoadingDebug';
// import { InteractionTest } from '../src/components/debug/InteractionTest';

// 状态栏组件
function ThemedStatusBar() {
  const { isDark, theme } = useTheme();
  
  return (
    <StatusBar 
      style={isDark ? "light" : "dark"} 
      backgroundColor={theme.colors.background} 
    />
  );
}

// 应用内容组件
function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, isLoading } = useAppSelector(state => state.auth);

  useEffect(() => {
    // 设置HTTP客户端的未授权处理器
    httpClient.setUnauthorizedHandler(() => {
      dispatch(logout());
    });
    
    // 应用启动时尝试自动登录
    dispatch(autoLoginAsync());
  }, [dispatch]);

  // 用户认证成功后获取档案列表
  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(fetchProfilesAsync());
    }
  }, [isAuthenticated, user, dispatch]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemedStatusBar />
        {/* 如果正在加载，显示加载状态 */}
        {isLoading ? (
          <Stack>
            <Stack.Screen name="loading" options={{ headerShown: false }} />
          </Stack>
        ) : !isAuthenticated ? (
          /* 根据认证状态显示不同的页面 */
          <Stack>
            <Stack.Screen name="login" options={{ headerShown: false }} />
          </Stack>
        ) : (
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        )}
        {/* 全局UI组件 */}
        <ToastContainer />
        <ModalContainer />
        {/* 调试组件已移除 */}
        {/* <LoadingDebug /> */}
        {/* <InteractionTest /> */}
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <Provider store={store}>
      <ThemeProvider>
        <LoadingProvider>
          <AppContent />
        </LoadingProvider>
      </ThemeProvider>
    </Provider>
  );
}

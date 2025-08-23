import React, { useEffect } from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import { colors } from '../styles';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scrollable?: boolean;
  safeArea?: boolean;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  statusBarBackgroundColor?: string;
  backgroundColor?: string;
  padding?: boolean;
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  scrollable = false,
  safeArea = true,
  statusBarStyle = 'dark-content',
  statusBarBackgroundColor = colors.white,
  backgroundColor = colors.background,
  padding = true,
}) => {
  // Web平台滚动修复
  useEffect(() => {
    if (Platform.OS === 'web' && scrollable) {
      // 移除可能阻止滚动的样式
      const style = document.createElement('style');
      style.textContent = `
        html, body {
          height: auto;
          min-height: 100vh;
          overflow: auto;
        }
        #root {
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }
        .css-view-1dbjc4n {
          overflow: visible !important;
          -webkit-overflow-scrolling: touch;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [scrollable]);

  const containerStyle = [
    styles.container,
    { backgroundColor },
    padding && styles.padding,
    style,
  ];

  const webScrollViewStyle = Platform.OS === 'web' ? {
    flex: 1,
  } : {};

  const content = scrollable ? (
    <ScrollView
      style={[containerStyle, { flex: 1 }, webScrollViewStyle]}
      contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
      showsVerticalScrollIndicator={true}
      keyboardShouldPersistTaps="handled"
      bounces={Platform.OS !== 'web'}
      scrollEnabled={true}
      alwaysBounceVertical={Platform.OS !== 'web'}
      overScrollMode={Platform.OS === 'android' ? 'always' : 'auto'}
      nestedScrollEnabled={true}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={containerStyle}>
      {children}
    </View>
  );

  const ScreenComponent = safeArea ? SafeAreaView : View;

  return (
    <ScreenComponent style={styles.wrapper}>
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBackgroundColor}
        translucent={false}
      />
      {content}
    </ScreenComponent>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  padding: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  scrollContent: {
    paddingBottom: 100, // 确保底部有足够空间
  },
});
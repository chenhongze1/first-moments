import React from 'react';
import {
  View,
  ScrollView,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  ViewStyle,
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
  const containerStyle = [
    styles.container,
    { backgroundColor },
    padding && styles.padding,
    style,
  ];

  const content = scrollable ? (
    <ScrollView
      style={containerStyle}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
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
    flexGrow: 1,
  },
});
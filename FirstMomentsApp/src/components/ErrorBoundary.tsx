import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../styles';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 这里可以添加错误上报逻辑
    // crashlytics().recordError(error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 默认错误UI
      return (
        <View style={styles.container}>
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>出现了一些问题</Text>
            <Text style={styles.errorMessage}>
              应用遇到了意外错误，我们已经记录了这个问题。
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugInfo}>
                <Text style={styles.debugTitle}>调试信息:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.message}
                </Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>重试</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  errorCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 320,
    width: '100%',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  debugInfo: {
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
    width: '100%',
  },
  debugTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  debugText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minWidth: 120,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: fontSize.base,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ErrorBoundary;
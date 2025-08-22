import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../hooks';
import { loginAsync } from '../store/slices/authSlice';
import { Screen } from '../components/Screen';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { colors, fontSize, fontWeight, spacing, textStyles } from '../styles';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector(state => state.auth);
  const { handleError, showSuccess, showInfo } = useErrorHandler();

  const validateForm = () => {
    let isValid = true;
    
    // 重置错误
    setEmailError('');
    setPasswordError('');

    // 验证邮箱
    if (!email.trim()) {
      setEmailError('请输入邮箱');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('请输入有效的邮箱地址');
      isValid = false;
    }

    // 验证密码
    if (!password.trim()) {
      setPasswordError('请输入密码');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('密码长度至少6位');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(loginAsync({ email, password })).unwrap();
      showSuccess('登录成功，欢迎回来！');
      // 登录成功，导航将由Redux状态变化自动处理
    } catch (err: any) {
      handleError(err, {
        showAlert: true,
        showToast: false
      });
    }
  };

  const handleRegister = () => {
    // 导航到注册页面
    // navigation.navigate('Register');
    showInfo('注册功能即将开放');
  };

  const handleForgotPassword = () => {
    // 导航到忘记密码页面
    showInfo('忘记密码功能即将开放');
  };

  return (
    <Screen safeArea={true} backgroundColor={colors.background}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.title}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录您的账户继续记录美好时光</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="邮箱"
            value={email}
            onChangeText={setEmail}
            placeholder="请输入您的邮箱"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            error={emailError}
          />

          <Input
            label="密码"
            value={password}
            onChangeText={setPassword}
            placeholder="请输入您的密码"
            secureTextEntry={true}
            showPasswordToggle={true}
            error={passwordError}
          />

          <Button
            title="登录"
            onPress={handleLogin}
            loading={isLoading}
            fullWidth={true}
            style={styles.loginButton}
          />

          <Button
            title="忘记密码？"
            onPress={handleForgotPassword}
            variant="ghost"
            size="small"
            style={styles.forgotButton}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>还没有账户？</Text>
          <Button
            title="立即注册"
            onPress={handleRegister}
            variant="ghost"
            size="small"
          />
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  
  title: {
    ...textStyles.h2,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  
  subtitle: {
    ...textStyles.bodySecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  form: {
    marginBottom: spacing.xl,
  },
  
  loginButton: {
    marginTop: spacing.md,
  },
  
  forgotButton: {
    marginTop: spacing.sm,
    alignSelf: 'center',
  },
  
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  
  footerText: {
    ...textStyles.body,
    marginRight: spacing.xs,
  },
  
  errorContainer: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.error + '10',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  
  errorText: {
    color: colors.error,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
});
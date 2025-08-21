import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { forgotPasswordAsync, clearError } from '../../store/slices/authSlice';
import { colors, spacing } from '../../styles';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('错误', '请输入邮箱地址');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('错误', '请输入有效的邮箱地址');
      return;
    }

    try {
      await dispatch(forgotPasswordAsync(email)).unwrap();
      setEmailSent(true);
      Alert.alert(
        '重置邮件已发送',
        '请检查您的邮箱，按照邮件中的说明重置密码。',
        [
          { text: '确定', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error: any) {
      Alert.alert('发送失败', error || '请稍后重试');
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const navigateToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>重置密码</Text>
              <View style={styles.placeholder} />
            </View>

            {/* Icon 区域 */}
            <View style={styles.iconContainer}>
              <View style={styles.iconCircle}>
                <Ionicons name="key-outline" size={40} color={colors.white} />
              </View>
              <Text style={styles.titleText}>忘记密码？</Text>
              <Text style={styles.subtitleText}>
                {emailSent 
                  ? '重置邮件已发送到您的邮箱' 
                  : '请输入您的邮箱地址，我们将发送重置密码的链接给您'
                }
              </Text>
            </View>

            {/* 表单 */}
            {!emailSent && (
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="邮箱地址"
                    placeholderTextColor={colors.gray500}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!isLoading}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
                  onPress={handleResetPassword}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.resetButtonText}>发送重置邮件</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* 成功状态 */}
            {emailSent && (
              <View style={styles.successContainer}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                </View>
                <Text style={styles.successTitle}>邮件已发送</Text>
                <Text style={styles.successText}>
                  我们已向 {email} 发送了重置密码的邮件。\n请检查您的邮箱（包括垃圾邮件文件夹）。
                </Text>
                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setEmailSent(false)}
                >
                  <Text style={styles.resendButtonText}>重新发送</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* 返回登录 */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>记起密码了？</Text>
              <TouchableOpacity onPress={navigateToLogin}>
                <Text style={styles.loginLink}>返回登录</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl * 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  titleText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.md,
  },
  subtitleText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  formContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 50,
  },
  inputIcon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.gray900,
  },
  resetButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.gray900,
    marginBottom: spacing.md,
  },
  successText: {
    fontSize: 16,
    color: colors.gray600,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  resendButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  resendButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginLink: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
});
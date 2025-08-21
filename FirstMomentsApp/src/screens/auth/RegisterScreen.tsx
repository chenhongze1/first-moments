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
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../hooks';
import { registerAsync } from '../../store/slices/authSlice';
import { colors, spacing } from '../../styles';

interface RegisterScreenProps {
  navigation: any;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const dispatch = useAppDispatch();

  const handleRegister = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      Alert.alert('错误', '请填写所有字段');
      return;
    }

    if (!isValidEmail(formData.email)) {
      Alert.alert('错误', '请输入有效的邮箱地址');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('错误', '密码长度至少为6位');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('错误', '两次输入的密码不一致');
      return;
    }

    if (!agreedToTerms) {
      Alert.alert('错误', '请同意用户协议和隐私政策');
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(registerAsync({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      })).unwrap();
      Alert.alert('注册成功', '欢迎加入初见！', [
        { text: '确定', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (error: any) {
      Alert.alert('注册失败', error.message || '请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
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
                <Text style={styles.headerTitle}>创建账户</Text>
                <View style={styles.placeholder} />
              </View>

              {/* Logo 区域 */}
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Ionicons name="heart" size={32} color={colors.white} />
                </View>
                <Text style={styles.logoText}>加入初见</Text>
                <Text style={styles.taglineText}>开始记录你的美好时光</Text>
              </View>

              {/* 注册表单 */}
              <View style={styles.formContainer}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="用户名"
                    placeholderTextColor={colors.gray500}
                    value={formData.username}
                    onChangeText={(value) => updateFormData('username', value)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="邮箱地址"
                    placeholderTextColor={colors.gray500}
                    value={formData.email}
                    onChangeText={(value) => updateFormData('email', value)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="密码（至少6位）"
                    placeholderTextColor={colors.gray500}
                    value={formData.password}
                    onChangeText={(value) => updateFormData('password', value)}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.gray500}
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color={colors.gray500} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="确认密码"
                    placeholderTextColor={colors.gray500}
                    value={formData.confirmPassword}
                    onChangeText={(value) => updateFormData('confirmPassword', value)}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color={colors.gray500}
                    />
                  </TouchableOpacity>
                </View>

                {/* 用户协议 */}
                <TouchableOpacity
                  style={styles.termsContainer}
                  onPress={() => setAgreedToTerms(!agreedToTerms)}
                >
                  <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                    {agreedToTerms && (
                      <Ionicons name="checkmark" size={16} color={colors.white} />
                    )}
                  </View>
                  <Text style={styles.termsText}>
                    我已阅读并同意
                    <Text style={styles.termsLink}>《用户协议》</Text>
                    和
                    <Text style={styles.termsLink}>《隐私政策》</Text>
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
                  onPress={handleRegister}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.registerButtonText}>创建账户</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* 登录链接 */}
              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>已有账户？</Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.loginLink}>立即登录</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  taglineText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
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
    marginBottom: spacing.lg,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 12,
    marginBottom: spacing.md,
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
  passwordInput: {
    paddingRight: spacing.md,
  },
  eyeIcon: {
    padding: spacing.xs,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: colors.gray300,
    borderRadius: 4,
    marginRight: spacing.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray600,
    lineHeight: 20,
  },
  termsLink: {
    color: colors.primary,
    fontWeight: '500',
  },
  registerButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: spacing.lg,
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
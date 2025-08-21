import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../styles';
import { validateField, ValidationRule, FieldValidationResult } from '../utils/validation';

interface ValidatedInputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  validationRules?: ValidationRule;
  onValidationChange?: (result: FieldValidationResult) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'url';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  editable?: boolean;
  maxLength?: number;
  style?: any;
  inputStyle?: any;
  errorStyle?: any;
  showValidationIcon?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onFocus?: () => void;
  onBlur?: () => void;
}

export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  validationRules,
  onValidationChange,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength,
  style,
  inputStyle,
  errorStyle,
  showValidationIcon = true,
  validateOnBlur = true,
  validateOnChange = false,
  leftIcon,
  rightIcon,
  onFocus,
  onBlur,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [validationResult, setValidationResult] = useState<FieldValidationResult>({
    isValid: true,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [hasBeenBlurred, setHasBeenBlurred] = useState(false);
  
  const labelAnimation = new Animated.Value(value ? 1 : 0);
  const borderAnimation = new Animated.Value(0);

  // 执行验证
  const performValidation = (textValue: string) => {
    if (!validationRules) return;
    
    const result = validateField(textValue, validationRules);
    setValidationResult(result);
    onValidationChange?.(result);
  };

  // 处理文本变化
  const handleChangeText = (text: string) => {
    onChangeText(text);
    
    if (validateOnChange) {
      performValidation(text);
    } else if (hasBeenBlurred && !validationResult.isValid) {
      // 如果之前有错误，实时验证以便及时清除错误状态
      performValidation(text);
    }
  };

  // 处理焦点
  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    
    // 动画效果
    Animated.parallel([
      Animated.timing(labelAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 处理失焦
  const handleBlur = () => {
    setIsFocused(false);
    setHasBeenBlurred(true);
    onBlur?.();
    
    if (validateOnBlur) {
      performValidation(value);
    }
    
    // 动画效果
    Animated.parallel([
      Animated.timing(labelAnimation, {
        toValue: value ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(borderAnimation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // 切换密码显示
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // 获取边框颜色
  const getBorderColor = () => {
    if (!validationResult.isValid && hasBeenBlurred) {
      return colors.error;
    }
    if (isFocused) {
      return colors.primary;
    }
    return colors.gray300;
  };

  // 获取验证图标
  const getValidationIcon = () => {
    if (!showValidationIcon || !hasBeenBlurred || !validationRules) {
      return null;
    }
    
    if (validationResult.isValid && value) {
      return (
        <View style={styles.validationIcon}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
      );
    }
    
    if (!validationResult.isValid) {
      return (
        <View style={styles.validationIcon}>
          <Text style={styles.errorIcon}>✕</Text>
        </View>
      );
    }
    
    return null;
  };

  // 获取右侧图标
  const getRightIcon = () => {
    if (secureTextEntry) {
      return (
        <TouchableOpacity onPress={togglePasswordVisibility} style={styles.iconButton}>
          <Text style={styles.passwordIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
        </TouchableOpacity>
      );
    }
    
    return rightIcon || getValidationIcon();
  };

  const animatedBorderColor = borderAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [getBorderColor(), colors.primary],
  });

  const animatedLabelStyle = {
    top: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [multiline ? 16 : 12, -8],
    }),
    fontSize: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [fontSize.base, fontSize.sm],
    }),
    color: labelAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, isFocused ? colors.primary : colors.textSecondary],
    }),
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.inputContainer,
          multiline && styles.multilineContainer,
          { borderColor: animatedBorderColor },
          !editable && styles.disabledContainer,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <View style={styles.inputWrapper}>
          {label && (
            <Animated.Text style={[styles.label, animatedLabelStyle]}>
              {label}
            </Animated.Text>
          )}
          
          <TextInput
            style={[
              styles.input,
              multiline && styles.multilineInput,
              leftIcon && styles.inputWithLeftIcon,
              (rightIcon || secureTextEntry || showValidationIcon) && styles.inputWithRightIcon,
              inputStyle,
            ]}
            value={value}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={isFocused || value ? '' : placeholder}
            placeholderTextColor={colors.textSecondary}
            secureTextEntry={secureTextEntry && !showPassword}
            keyboardType={keyboardType}
            autoCapitalize={autoCapitalize}
            multiline={multiline}
            numberOfLines={numberOfLines}
            editable={editable}
            maxLength={maxLength}
          />
        </View>
        
        {getRightIcon() && (
          <View style={styles.rightIcon}>{getRightIcon()}</View>
        )}
      </Animated.View>
      
      {/* 错误信息 */}
      {!validationResult.isValid && hasBeenBlurred && validationResult.error && (
        <Text style={[styles.errorText, errorStyle]}>
          {validationResult.error}
        </Text>
      )}
      
      {/* 字符计数 */}
      {maxLength && (
        <Text style={styles.characterCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.md,
  },
  multilineContainer: {
    minHeight: 80,
    alignItems: 'flex-start',
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  disabledContainer: {
    backgroundColor: colors.gray50,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  label: {
    position: 'absolute',
    left: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    zIndex: 1,
  },
  input: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    paddingVertical: 0,
    minHeight: 20,
  },
  multilineInput: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    marginLeft: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  passwordIcon: {
    fontSize: 18,
  },
  validationIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successIcon: {
    color: colors.success,
    fontSize: 14,
    fontWeight: 'bold',
  },
  errorIcon: {
    color: colors.error,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  characterCount: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});

export default ValidatedInput;
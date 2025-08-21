import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  Animated,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius, fontSize } from '../../styles';

interface InputFieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'outlined' | 'filled' | 'standard';
  size?: 'small' | 'medium' | 'large';
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  showCharacterCount?: boolean;
  maxLength?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
  helperStyle?: TextStyle;
  onFocus?: () => void;
  onBlur?: () => void;
  onChangeText?: (text: string) => void;
}

export interface InputFieldRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
  setValue: (value: string) => void;
}

export const InputField = forwardRef<InputFieldRef, InputFieldProps>((
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    variant = 'outlined',
    size = 'medium',
    required = false,
    disabled = false,
    loading = false,
    showCharacterCount = false,
    maxLength,
    containerStyle,
    inputStyle,
    labelStyle,
    errorStyle,
    helperStyle,
    onFocus,
    onBlur,
    onChangeText,
    value,
    ...props
  },
  ref
) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value || '');
  const inputRef = useRef<TextInput>(null);
  const labelAnimation = useRef(new Animated.Value(value ? 1 : 0)).current;

  const currentValue = value !== undefined ? value : internalValue;

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
    blur: () => inputRef.current?.blur(),
    clear: () => {
      const newValue = '';
      setInternalValue(newValue);
      onChangeText?.(newValue);
    },
    getValue: () => currentValue,
    setValue: (newValue: string) => {
      setInternalValue(newValue);
      onChangeText?.(newValue);
    },
  }));

  // 处理焦点变化
  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!currentValue) {
      animateLabel(false);
    }
    onBlur?.();
  };

  // 处理文本变化
  const handleChangeText = (text: string) => {
    if (value === undefined) {
      setInternalValue(text);
    }
    onChangeText?.(text);

    // 动画处理
    if (text && !isFocused) {
      animateLabel(true);
    } else if (!text && !isFocused) {
      animateLabel(false);
    }
  };

  // 标签动画
  const animateLabel = (focused: boolean) => {
    Animated.timing(labelAnimation, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  // 获取容器样式
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.container];

    switch (size) {
      case 'small':
        baseStyle.push(styles.smallContainer);
        break;
      case 'large':
        baseStyle.push(styles.largeContainer);
        break;
      default:
        baseStyle.push(styles.mediumContainer);
    }

    if (disabled) {
      baseStyle.push(styles.disabledContainer);
    }

    return baseStyle;
  };

  // 获取输入框样式
  const getInputContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.inputContainer];

    switch (variant) {
      case 'filled':
        baseStyle.push(styles.filledInput);
        break;
      case 'standard':
        baseStyle.push(styles.standardInput);
        break;
      default:
        baseStyle.push(styles.outlinedInput);
    }

    if (isFocused) {
      baseStyle.push(styles.focusedInput);
    }

    if (error) {
      baseStyle.push(styles.errorInput);
    }

    if (disabled) {
      baseStyle.push(styles.disabledInput);
    }

    return baseStyle;
  };

  // 获取输入框文本样式
  const getInputTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.input];

    switch (size) {
      case 'small':
        baseStyle.push(styles.smallInput);
        break;
      case 'large':
        baseStyle.push(styles.largeInput);
        break;
      default:
        baseStyle.push(styles.mediumInput);
    }

    if (disabled) {
      baseStyle.push(styles.disabledInputText);
    }

    return baseStyle;
  };

  // 获取标签样式
  const getLabelStyle = () => {
    const animatedStyle = {
      transform: [
        {
          translateY: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [0, -24],
          }),
        },
        {
          scale: labelAnimation.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 0.85],
          }),
        },
      ],
      color: labelAnimation.interpolate({
        inputRange: [0, 1],
        outputRange: [colors.textSecondary, isFocused ? colors.primary : colors.textSecondary],
      }),
    };

    return [styles.label, animatedStyle, labelStyle];
  };

  return (
    <View style={[getContainerStyle(), containerStyle]}>
      {/* 标签 */}
      {label && variant !== 'standard' && (
        <Animated.Text style={getLabelStyle()}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Animated.Text>
      )}

      {/* 输入框容器 */}
      <View style={getInputContainerStyle()}>
        {/* 左侧图标 */}
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}

        {/* 输入框 */}
        <TextInput
          ref={inputRef}
          style={[getInputTextStyle(), inputStyle]}
          value={currentValue}
          onChangeText={handleChangeText}
          onFocus={handleFocus}
          onBlur={handleBlur}
          editable={!disabled && !loading}
          maxLength={maxLength}
          placeholderTextColor={colors.textTertiary}
          {...props}
        />

        {/* 右侧图标 */}
        {rightIcon && (
          <View style={styles.rightIconContainer}>
            {rightIcon}
          </View>
        )}

        {/* 加载指示器 */}
        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>...</Text>
          </View>
        )}
      </View>

      {/* 底部信息区域 */}
      <View style={styles.bottomContainer}>
        {/* 错误信息或帮助文本 */}
        <View style={styles.messageContainer}>
          {error ? (
            <Text style={[styles.errorText, errorStyle]}>
              {error}
            </Text>
          ) : helperText ? (
            <Text style={[styles.helperText, helperStyle]}>
              {helperText}
            </Text>
          ) : null}
        </View>

        {/* 字符计数 */}
        {showCharacterCount && maxLength && (
          <Text style={styles.characterCount}>
            {currentValue.length}/{maxLength}
          </Text>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  smallContainer: {
    marginBottom: spacing.sm,
  },
  mediumContainer: {
    marginBottom: spacing.md,
  },
  largeContainer: {
    marginBottom: spacing.lg,
  },
  disabledContainer: {
    opacity: 0.6,
  },

  // 输入框容器样式
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
  },
  outlinedInput: {
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  filledInput: {
    backgroundColor: colors.gray50,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  standardInput: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
    borderRadius: 0,
  },
  focusedInput: {
    borderColor: colors.primary,
  },
  errorInput: {
    borderColor: colors.error,
  },
  disabledInput: {
    backgroundColor: colors.gray100,
  },

  // 输入框文本样式
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontFamily: 'System',
  },
  smallInput: {
    fontSize: fontSize.sm,
    minHeight: 32,
  },
  mediumInput: {
    fontSize: fontSize.base,
    minHeight: 44,
  },
  largeInput: {
    fontSize: fontSize.lg,
    minHeight: 52,
  },
  disabledInputText: {
    color: colors.textTertiary,
  },

  // 标签样式
  label: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.xs,
    zIndex: 1,
  },
  required: {
    color: colors.error,
  },

  // 图标容器样式
  leftIconContainer: {
    marginRight: spacing.sm,
  },
  rightIconContainer: {
    marginLeft: spacing.sm,
  },
  loadingContainer: {
    marginLeft: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
  },

  // 底部信息样式
  bottomContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: spacing.xs,
  },
  messageContainer: {
    flex: 1,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error,
  },
  helperText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  characterCount: {
    ...textStyles.caption,
    color: colors.textTertiary,
    marginLeft: spacing.sm,
  },
});

export default InputField;
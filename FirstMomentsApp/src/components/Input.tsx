import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  TextInputProps,
} from 'react-native';
import { colors, fontSize, fontWeight, borderRadius, spacing } from '../styles';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  labelStyle?: TextStyle;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  inputStyle,
  labelStyle,
  secureTextEntry,
  showPasswordToggle = false,
  ...textInputProps
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  const inputContainerStyle = [
    styles.inputContainer,
    isFocused && styles.inputContainerFocused,
    error && styles.inputContainerError,
  ];

  const textInputStyle = [
    styles.input,
    leftIcon && styles.inputWithLeftIcon,
    (rightIcon || showPasswordToggle) && styles.inputWithRightIcon,
    inputStyle,
  ] as any;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={inputContainerStyle}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={textInputStyle}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholderTextColor={colors.textTertiary}
          {...textInputProps}
        />
        
        {(rightIcon || showPasswordToggle) && (
          <TouchableOpacity
            style={styles.rightIconContainer}
            onPress={showPasswordToggle ? togglePasswordVisibility : undefined}
            disabled={!showPasswordToggle}
          >
            {showPasswordToggle ? (
              <Text style={styles.passwordToggle}>
                {isPasswordVisible ? '🙈' : '👁️'}
              </Text>
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>
      
      {(error || helperText) && (
        <Text style={[styles.helperText, error && styles.errorText]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  
  label: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    backgroundColor: colors.white,
    minHeight: 44,
  },
  
  inputContainerFocused: {
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  
  inputContainerError: {
    borderColor: colors.error,
  },
  
  input: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  
  inputWithRightIcon: {
    paddingRight: 0,
  },
  
  leftIconContainer: {
    paddingLeft: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  rightIconContainer: {
    paddingRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  passwordToggle: {
    fontSize: fontSize.lg,
  },
  
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  
  errorText: {
    color: colors.error,
  },
});
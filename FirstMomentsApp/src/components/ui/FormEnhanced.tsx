import React, { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
  StyleSheet,
  Animated,
} from 'react-native';
import { AnimationUtils, AnimationConfig } from '../../utils/animations';
import { HapticFeedback } from '../../utils/haptics';
import { TouchableEnhanced } from './TouchableEnhanced';
import { LoadingEnhanced, LoadingType } from './LoadingEnhanced';

// 表单字段类型
export enum FormFieldType {
  Text = 'text',
  Email = 'email',
  Password = 'password',
  Number = 'number',
  Phone = 'phone',
  TextArea = 'textarea',
  Select = 'select',
  Checkbox = 'checkbox',
  Radio = 'radio',
  Date = 'date',
  Time = 'time',
  File = 'file',
  Custom = 'custom',
}

// 验证规则
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  email?: boolean;
  phone?: boolean;
  custom?: (value: any) => string | null;
  message?: string;
}

// 表单字段配置
export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: any;
  validation?: ValidationRule;
  options?: Array<{ label: string; value: any }>;
  disabled?: boolean;
  hidden?: boolean;
  component?: React.ComponentType<any>;
  props?: any;
  dependencies?: string[];
  conditional?: (values: any) => boolean;
}

// 表单错误
export interface FormError {
  field: string;
  message: string;
}

// 表单状态
export interface FormState {
  values: Record<string, any>;
  errors: FormError[];
  touched: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

// 表单配置
export interface FormConfig {
  fields: FormField[];
  initialValues?: Record<string, any>;
  validationMode?: 'onChange' | 'onBlur' | 'onSubmit';
  submitOnEnter?: boolean;
  resetOnSubmit?: boolean;
  showProgress?: boolean;
  animateErrors?: boolean;
  hapticFeedback?: boolean;
}

// 表单方法
export interface FormMethods {
  submit: () => Promise<void>;
  reset: () => void;
  validate: () => boolean;
  setFieldValue: (name: string, value: any) => void;
  setFieldError: (name: string, error: string) => void;
  clearErrors: () => void;
  getValues: () => Record<string, any>;
  getErrors: () => FormError[];
  isFieldValid: (name: string) => boolean;
  focusField: (name: string) => void;
}

// 组件属性
interface FormEnhancedProps {
  config: FormConfig;
  onSubmit: (values: Record<string, any>) => Promise<void> | void;
  onChange?: (values: Record<string, any>, state: FormState) => void;
  onValidationChange?: (isValid: boolean, errors: FormError[]) => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  headerStyle?: ViewStyle;
  footerStyle?: ViewStyle;
  fieldStyle?: ViewStyle;
  errorStyle?: TextStyle;
  loadingComponent?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  submitButton?: React.ReactNode;
  resetButton?: React.ReactNode;
}

// 增强表单组件
export const FormEnhanced = forwardRef<FormMethods, FormEnhancedProps>((
  {
    config,
    onSubmit,
    onChange,
    onValidationChange,
    style,
    contentStyle,
    headerStyle,
    footerStyle,
    fieldStyle,
    errorStyle,
    loadingComponent,
    header,
    footer,
    submitButton,
    resetButton,
  },
  ref
) => {
  // 状态
  const [formState, setFormState] = useState<FormState>({
    values: config.initialValues || {},
    errors: [],
    touched: {},
    isValid: false,
    isSubmitting: false,
    isDirty: false,
  });

  // 动画值
  const errorAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const submitAnimation = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  // 字段引用
  const fieldRefs = useRef<Record<string, any>>({}).current;

  // 验证单个字段
  const validateField = (field: FormField, value: any): string | null => {
    const { validation } = field;
    if (!validation) return null;

    // 必填验证
    if (validation.required && (!value || value.toString().trim() === '')) {
      return validation.message || `${field.label}是必填项`;
    }

    // 如果值为空且不是必填，跳过其他验证
    if (!value || value.toString().trim() === '') {
      return null;
    }

    // 长度验证
    if (validation.minLength && value.toString().length < validation.minLength) {
      return validation.message || `${field.label}至少需要${validation.minLength}个字符`;
    }

    if (validation.maxLength && value.toString().length > validation.maxLength) {
      return validation.message || `${field.label}不能超过${validation.maxLength}个字符`;
    }

    // 数值验证
    if (validation.min !== undefined && Number(value) < validation.min) {
      return validation.message || `${field.label}不能小于${validation.min}`;
    }

    if (validation.max !== undefined && Number(value) > validation.max) {
      return validation.message || `${field.label}不能大于${validation.max}`;
    }

    // 正则验证
    if (validation.pattern && !validation.pattern.test(value.toString())) {
      return validation.message || `${field.label}格式不正确`;
    }

    // 邮箱验证
    if (validation.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value.toString())) {
        return validation.message || '请输入有效的邮箱地址';
      }
    }

    // 手机号验证
    if (validation.phone) {
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(value.toString())) {
        return validation.message || '请输入有效的手机号码';
      }
    }

    // 自定义验证
    if (validation.custom) {
      return validation.custom(value);
    }

    return null;
  };

  // 验证所有字段
  const validateForm = (): FormError[] => {
    const errors: FormError[] = [];
    const visibleFields = getVisibleFields();

    visibleFields.forEach(field => {
      const value = formState.values[field.name];
      const error = validateField(field, value);
      if (error) {
        errors.push({ field: field.name, message: error });
      }
    });

    return errors;
  };

  // 获取可见字段
  const getVisibleFields = (): FormField[] => {
    return config.fields.filter(field => {
      if (field.hidden) return false;
      if (field.conditional) {
        return field.conditional(formState.values);
      }
      return true;
    });
  };

  // 更新字段值
  const updateFieldValue = (name: string, value: any) => {
    const newValues = { ...formState.values, [name]: value };
    const newTouched = { ...formState.touched, [name]: true };
    
    let newErrors = [...formState.errors];
    
    // 实时验证
    if (config.validationMode === 'onChange' || formState.touched[name]) {
      const field = config.fields.find(f => f.name === name);
      if (field) {
        const error = validateField(field, value);
        
        // 移除旧错误
        newErrors = newErrors.filter(e => e.field !== name);
        
        // 添加新错误
        if (error) {
          newErrors.push({ field: name, message: error });
          
          // 错误动画
          if (config.animateErrors && errorAnimations[name]) {
            AnimationUtils.shake(errorAnimations[name], 10, 300).start();
          }
          
          // 触觉反馈
          if (config.hapticFeedback) {
            HapticFeedback.error();
          }
        }
      }
    }
    
    const newState: FormState = {
      values: newValues,
      errors: newErrors,
      touched: newTouched,
      isValid: newErrors.length === 0,
      isSubmitting: formState.isSubmitting,
      isDirty: true,
    };
    
    setFormState(newState);
    onChange?.(newValues, newState);
    onValidationChange?.(newState.isValid, newErrors);
  };

  // 处理字段失焦
  const handleFieldBlur = (name: string) => {
    if (config.validationMode === 'onBlur') {
      const field = config.fields.find(f => f.name === name);
      if (field) {
        const value = formState.values[name];
        const error = validateField(field, value);
        
        let newErrors = formState.errors.filter(e => e.field !== name);
        if (error) {
          newErrors.push({ field: name, message: error });
        }
        
        const newState = {
          ...formState,
          errors: newErrors,
          isValid: newErrors.length === 0,
          touched: { ...formState.touched, [name]: true },
        };
        
        setFormState(newState);
        onValidationChange?.(newState.isValid, newErrors);
      }
    }
  };

  // 提交表单
  const handleSubmit = async () => {
    if (formState.isSubmitting) return;

    // 验证表单
    const errors = validateForm();
    
    if (errors.length > 0) {
      setFormState(prev => ({
        ...prev,
        errors,
        isValid: false,
      }));
      
      // 触觉反馈
      if (config.hapticFeedback) {
        HapticFeedback.error();
      }
      
      // 聚焦到第一个错误字段
      const firstErrorField = errors[0].field;
      focusField(firstErrorField);
      
      return;
    }

    // 开始提交
    setFormState(prev => ({ ...prev, isSubmitting: true }));
    
    // 提交动画
    Animated.sequence([
      Animated.timing(submitAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(submitAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // 进度动画
    if (config.showProgress) {
      Animated.timing(progressAnimation, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
      }).start();
    }
    
    try {
      await onSubmit(formState.values);
      
      // 成功触觉反馈
      if (config.hapticFeedback) {
        HapticFeedback.success();
      }
      
      // 重置表单
      if (config.resetOnSubmit) {
        reset();
      }
    } catch (error) {
      // 错误触觉反馈
      if (config.hapticFeedback) {
        HapticFeedback.error();
      }
      
      console.error('Form submission error:', error);
    } finally {
      setFormState(prev => ({ ...prev, isSubmitting: false }));
      progressAnimation.setValue(0);
    }
  };

  // 重置表单
  const reset = () => {
    setFormState({
      values: config.initialValues || {},
      errors: [],
      touched: {},
      isValid: false,
      isSubmitting: false,
      isDirty: false,
    });
    
    progressAnimation.setValue(0);
  };

  // 聚焦字段
  const focusField = (name: string) => {
    const fieldRef = fieldRefs[name];
    if (fieldRef && fieldRef.focus) {
      fieldRef.focus();
    }
  };

  // 暴露方法
  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    reset,
    validate: () => {
      const errors = validateForm();
      setFormState(prev => ({
        ...prev,
        errors,
        isValid: errors.length === 0,
      }));
      return errors.length === 0;
    },
    setFieldValue: (name: string, value: any) => {
      updateFieldValue(name, value);
    },
    setFieldError: (name: string, error: string) => {
      const newErrors = formState.errors.filter(e => e.field !== name);
      newErrors.push({ field: name, message: error });
      setFormState(prev => ({
        ...prev,
        errors: newErrors,
        isValid: false,
      }));
    },
    clearErrors: () => {
      setFormState(prev => ({
        ...prev,
        errors: [],
        isValid: true,
      }));
    },
    getValues: () => formState.values,
    getErrors: () => formState.errors,
    isFieldValid: (name: string) => {
      return !formState.errors.some(e => e.field === name);
    },
    focusField,
  }));

  // 初始化错误动画
  useEffect(() => {
    config.fields.forEach(field => {
      if (!errorAnimations[field.name]) {
        errorAnimations[field.name] = new Animated.Value(0);
      }
    });
  }, [config.fields]);

  // 渲染字段错误
  const renderFieldError = (fieldName: string) => {
    const error = formState.errors.find(e => e.field === fieldName);
    if (!error) return null;

    const animatedStyle = config.animateErrors ? {
      transform: [{
        translateX: errorAnimations[fieldName] || new Animated.Value(0),
      }],
    } : {};

    return (
      <Animated.View style={[styles.errorContainer, animatedStyle]}>
        <Text style={[styles.errorText, errorStyle]}>
          {error.message}
        </Text>
      </Animated.View>
    );
  };

  // 渲染字段
  const renderField = (field: FormField) => {
    if (field.hidden) return null;
    if (field.conditional && !field.conditional(formState.values)) return null;

    const value = formState.values[field.name];
    const hasError = formState.errors.some(e => e.field === field.name);

    return (
      <View key={field.name} style={[styles.fieldContainer, fieldStyle]}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        
        {field.component ? (
          <field.component
            ref={(ref: any) => { fieldRefs[field.name] = ref; }}
            value={value}
            onChangeText={(text: string) => updateFieldValue(field.name, text)}
            onBlur={() => handleFieldBlur(field.name)}
            placeholder={field.placeholder}
            editable={!field.disabled}
            error={hasError}
            {...field.props}
          />
        ) : (
          <Text style={styles.fieldPlaceholder}>
            {field.type} field component not implemented
          </Text>
        )}
        
        {renderFieldError(field.name)}
      </View>
    );
  };

  const visibleFields = getVisibleFields();

  return (
    <KeyboardAvoidingView
      style={[styles.container, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {header && (
          <View style={[styles.header, headerStyle]}>
            {header}
          </View>
        )}
        
        <View style={styles.fieldsContainer}>
          {visibleFields.map(renderField)}
        </View>
        
        {config.showProgress && formState.isSubmitting && (
          <View style={styles.progressContainer}>
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
        )}
        
        {footer && (
          <View style={[styles.footer, footerStyle]}>
            {footer}
          </View>
        )}
        
        <View style={styles.buttonsContainer}>
          {resetButton && (
            <TouchableEnhanced onPress={reset}>
              {resetButton}
            </TouchableEnhanced>
          )}
          
          {submitButton ? (
            <Animated.View style={{ transform: [{ scale: submitAnimation }] }}>
              <TouchableEnhanced onPress={handleSubmit} disabled={formState.isSubmitting}>
                {submitButton}
              </TouchableEnhanced>
            </Animated.View>
          ) : (
            <TouchableEnhanced
              style={StyleSheet.flatten([
                styles.defaultSubmitButton,
                formState.isSubmitting && styles.disabledButton,
              ])}
              onPress={handleSubmit}
              disabled={formState.isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {formState.isSubmitting ? '提交中...' : '提交'}
              </Text>
            </TouchableEnhanced>
          )}
        </View>
      </ScrollView>
      
      {formState.isSubmitting && loadingComponent && (
        <View style={styles.loadingOverlay}>
          {loadingComponent}
        </View>
      )}
      
      {formState.isSubmitting && !loadingComponent && (
        <LoadingEnhanced
          visible={true}
          type={LoadingType.Spinner}
          overlay={true}
          text="提交中..."
        />
      )}
    </KeyboardAvoidingView>
  );
});

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  footer: {
    marginTop: 24,
  },
  fieldsContainer: {
    gap: 16,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#1F2937',
  },
  fieldPlaceholder: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  errorContainer: {
    marginTop: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginVertical: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  defaultSubmitButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FormEnhanced;
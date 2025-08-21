// 表单验证工具类

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  email?: boolean;
  phone?: boolean;
  url?: boolean;
  custom?: (value: any) => boolean | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
}

// 预定义的正则表达式
const PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^1[3-9]\d{9}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  chinese: /^[\u4e00-\u9fa5]+$/,
  idCard: /^[1-9]\d{5}(18|19|([23]\d))\d{2}((0[1-9])|(10|11|12))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/,
};

// 错误消息模板
const ERROR_MESSAGES = {
  required: '此字段为必填项',
  minLength: (min: number) => `最少需要${min}个字符`,
  maxLength: (max: number) => `最多允许${max}个字符`,
  min: (min: number) => `最小值为${min}`,
  max: (max: number) => `最大值为${max}`,
  email: '请输入有效的邮箱地址',
  phone: '请输入有效的手机号码',
  url: '请输入有效的网址',
  pattern: '格式不正确',
};

/**
 * 验证单个字段
 */
export const validateField = (
  value: any,
  rules: ValidationRule
): FieldValidationResult => {
  const errors: string[] = [];

  // 必填验证
  if (rules.required && (value === undefined || value === null || value === '')) {
    return {
      isValid: false,
      error: ERROR_MESSAGES.required,
    };
  }

  // 如果值为空且不是必填，则跳过其他验证
  if (value === undefined || value === null || value === '') {
    return { isValid: true };
  }

  const stringValue = String(value);

  // 最小长度验证
  if (rules.minLength && stringValue.length < rules.minLength) {
    errors.push(ERROR_MESSAGES.minLength(rules.minLength));
  }

  // 最大长度验证
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    errors.push(ERROR_MESSAGES.maxLength(rules.maxLength));
  }

  // 数值范围验证
  if (typeof value === 'number') {
    if (rules.min !== undefined && value < rules.min) {
      errors.push(ERROR_MESSAGES.min(rules.min));
    }
    if (rules.max !== undefined && value > rules.max) {
      errors.push(ERROR_MESSAGES.max(rules.max));
    }
  }

  // 邮箱验证
  if (rules.email && !PATTERNS.email.test(stringValue)) {
    errors.push(ERROR_MESSAGES.email);
  }

  // 手机号验证
  if (rules.phone && !PATTERNS.phone.test(stringValue)) {
    errors.push(ERROR_MESSAGES.phone);
  }

  // URL验证
  if (rules.url && !PATTERNS.url.test(stringValue)) {
    errors.push(ERROR_MESSAGES.url);
  }

  // 正则表达式验证
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    errors.push(ERROR_MESSAGES.pattern);
  }

  // 自定义验证
  if (rules.custom) {
    const customResult = rules.custom(value);
    if (typeof customResult === 'string') {
      errors.push(customResult);
    } else if (!customResult) {
      errors.push('验证失败');
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors[0], // 只返回第一个错误
  };
};

/**
 * 验证表单对象
 */
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): ValidationResult => {
  const errors: string[] = [];
  const fieldErrors: Record<string, string> = {};

  Object.keys(rules).forEach(field => {
    const fieldResult = validateField(data[field], rules[field]);
    if (!fieldResult.isValid && fieldResult.error) {
      errors.push(`${field}: ${fieldResult.error}`);
      fieldErrors[field] = fieldResult.error;
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * 常用验证规则预设
 */
export const VALIDATION_RULES = {
  // 用户名
  username: {
    required: true,
    minLength: 3,
    maxLength: 20,
    pattern: PATTERNS.username,
  },
  
  // 邮箱
  email: {
    required: true,
    email: true,
  },
  
  // 手机号
  phone: {
    required: true,
    phone: true,
  },
  
  // 密码
  password: {
    required: true,
    minLength: 8,
    pattern: PATTERNS.password,
  },
  
  // 确认密码
  confirmPassword: (password: string) => ({
    required: true,
    custom: (value: string) => {
      if (value !== password) {
        return '两次输入的密码不一致';
      }
      return true;
    },
  }),
  
  // 昵称
  nickname: {
    required: true,
    minLength: 2,
    maxLength: 20,
  },
  
  // 年龄
  age: {
    required: true,
    min: 1,
    max: 150,
  },
  
  // 身份证号
  idCard: {
    pattern: PATTERNS.idCard,
  },
  
  // URL
  url: {
    url: true,
  },
  
  // 非空文本
  requiredText: {
    required: true,
    minLength: 1,
  },
};

/**
 * 实时验证Hook辅助函数
 */
export const createValidator = (rules: Record<string, ValidationRule>) => {
  return {
    validateField: (field: string, value: any) => {
      if (!rules[field]) return { isValid: true };
      return validateField(value, rules[field]);
    },
    validateForm: (data: Record<string, any>) => {
      return validateForm(data, rules);
    },
  };
};

/**
 * 格式化验证错误消息
 */
export const formatValidationErrors = (errors: string[]): string => {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return errors.map((error, index) => `${index + 1}. ${error}`).join('\n');
};

/**
 * 检查字符串是否为空或只包含空白字符
 */
export const isEmpty = (value: any): boolean => {
  return value === undefined || value === null || String(value).trim() === '';
};

/**
 * 检查是否为有效的数字
 */
export const isValidNumber = (value: any): boolean => {
  return !isNaN(Number(value)) && isFinite(Number(value));
};

/**
 * 检查是否为有效的整数
 */
export const isValidInteger = (value: any): boolean => {
  return Number.isInteger(Number(value));
};

/**
 * 检查数组是否为空
 */
export const isEmptyArray = (value: any): boolean => {
  return !Array.isArray(value) || value.length === 0;
};

/**
 * 检查对象是否为空
 */
export const isEmptyObject = (value: any): boolean => {
  return !value || typeof value !== 'object' || Object.keys(value).length === 0;
};

export default {
  validateField,
  validateForm,
  createValidator,
  formatValidationErrors,
  isEmpty,
  isValidNumber,
  isValidInteger,
  isEmptyArray,
  isEmptyObject,
  VALIDATION_RULES,
  PATTERNS,
};
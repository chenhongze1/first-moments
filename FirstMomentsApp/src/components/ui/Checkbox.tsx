import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 临时样式定义，需要根据实际项目调整
const colors = {
  primary: { main: '#007AFF', light: '#E3F2FD' },
  success: { main: '#34C759' },
  error: { main: '#FF3B30' },
  warning: { main: '#FF9500' },
  text: { primary: '#000', secondary: '#666', disabled: '#999' },
  background: { paper: '#FFF', secondary: '#F5F5F5', disabled: '#F0F0F0' },
  border: { main: '#E0E0E0', disabled: '#E0E0E0' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16 };
const textStyles = { body: { fontSize: 16 }, caption: { fontSize: 12 } };
const borderRadius = { sm: 4, md: 8 };

export interface CheckboxProps {
  checked: boolean;
  onPress: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  indeterminate?: boolean;
  labelPosition?: 'left' | 'right';
  style?: ViewStyle;
  labelStyle?: TextStyle;
  checkboxStyle?: ViewStyle;
  error?: string;
  required?: boolean;
  icon?: {
    checked?: string;
    unchecked?: string;
    indeterminate?: string;
  };
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onPress,
  label,
  description,
  disabled = false,
  size = 'medium',
  color = colors.primary.main,
  indeterminate = false,
  labelPosition = 'right',
  style,
  labelStyle,
  checkboxStyle,
  error,
  required = false,
  icon,
}) => {
  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          checkboxSize: 16,
          iconSize: 12,
          fontSize: 14,
        };
      case 'large':
        return {
          checkboxSize: 24,
          iconSize: 18,
          fontSize: 18,
        };
      default:
        return {
          checkboxSize: 20,
          iconSize: 14,
          fontSize: 16,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 处理点击
  const handlePress = () => {
    if (disabled) return;
    onPress(!checked);
  };

  // 获取复选框样式
  const getCheckboxStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      {
        width: sizeConfig.checkboxSize,
        height: sizeConfig.checkboxSize,
        borderRadius: borderRadius.sm,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
      } as ViewStyle,
    ];

    // 状态样式
    if (disabled) {
      baseStyle.push({
        borderColor: colors.border.disabled,
        backgroundColor: colors.background.disabled,
      } as ViewStyle);
    } else if (checked || indeterminate) {
      baseStyle.push({
        borderColor: color,
        backgroundColor: color,
      } as ViewStyle);
    } else if (error) {
      baseStyle.push({
        borderColor: colors.error.main,
        backgroundColor: colors.background.paper,
      } as ViewStyle);
    } else {
      baseStyle.push({
        borderColor: colors.border.main,
        backgroundColor: colors.background.paper,
      } as ViewStyle);
    }

    return baseStyle;
  };

  // 获取图标名称
  const getIconName = () => {
    if (indeterminate) {
      return icon?.indeterminate || 'remove';
    }
    if (checked) {
      return icon?.checked || 'checkmark';
    }
    return icon?.unchecked || null;
  };

  // 获取图标颜色
  const getIconColor = () => {
    if (disabled) {
      return colors.text.disabled;
    }
    if (checked || indeterminate) {
      return colors.background.paper;
    }
    return 'transparent';
  };

  // 获取标签样式
  const getLabelStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [
      {
        fontSize: sizeConfig.fontSize,
        color: colors.text.primary,
      } as TextStyle,
    ];

    if (disabled) {
      baseStyle.push({
        color: colors.text.disabled,
      } as TextStyle);
    }

    if (error) {
      baseStyle.push({
        color: colors.error.main,
      } as TextStyle);
    }

    return baseStyle;
  };

  // 渲染复选框
  const renderCheckbox = () => (
    <View style={[getCheckboxStyle(), checkboxStyle]}>
      {(checked || indeterminate) && (
        <Ionicons
          name={getIconName() as any}
          size={sizeConfig.iconSize}
          color={getIconColor()}
        />
      )}
    </View>
  );

  // 渲染标签
  const renderLabel = () => {
    if (!label && !description) return null;

    return (
      <View style={styles.labelContainer}>
        {label && (
          <Text style={[getLabelStyle(), labelStyle]}>
            {label}
            {required && <Text style={styles.required}> *</Text>}
          </Text>
        )}
        {description && (
          <Text
            style={[
              styles.description,
              {
                fontSize: sizeConfig.fontSize - 2,
                color: disabled ? colors.text.disabled : colors.text.secondary,
              },
            ]}
          >
            {description}
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity
        style={[
          styles.touchable,
          labelPosition === 'left' && styles.touchableReverse,
        ]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        {labelPosition === 'left' && renderLabel()}
        {renderCheckbox()}
        {labelPosition === 'right' && renderLabel()}
      </TouchableOpacity>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  touchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  touchableReverse: {
    flexDirection: 'row-reverse',
  },
  labelContainer: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  description: {
    marginTop: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
    marginLeft: spacing.lg,
  },
});

// 预设组件
export const CheckboxGroup: React.FC<{
  options: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
}> = ({
  options,
  value,
  onChange,
  disabled = false,
  size = 'medium',
  color,
  style,
}) => {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

  return (
    <View style={style}>
      {options.map((option, index) => (
        <Checkbox
          key={option.value}
          checked={value.includes(option.value)}
          onPress={(checked) => handleChange(option.value, checked)}
          label={option.label}
          disabled={disabled || option.disabled}
          size={size}
          color={color}
          style={index < options.length - 1 ? { marginBottom: spacing.sm } : undefined}
        />
      ))}
    </View>
  );
};

export default Checkbox;
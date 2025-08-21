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

export interface RadioButtonProps {
  selected: boolean;
  onPress: () => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  labelPosition?: 'left' | 'right';
  style?: ViewStyle;
  labelStyle?: TextStyle;
  radioStyle?: ViewStyle;
  error?: string;
  required?: boolean;
  value?: string | number;
}

export const RadioButton: React.FC<RadioButtonProps> = ({
  selected,
  onPress,
  label,
  description,
  disabled = false,
  size = 'medium',
  color = colors.primary.main,
  labelPosition = 'right',
  style,
  labelStyle,
  radioStyle,
  error,
  required = false,
  value,
}) => {
  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          radioSize: 16,
          innerSize: 8,
          fontSize: 14,
        };
      case 'large':
        return {
          radioSize: 24,
          innerSize: 12,
          fontSize: 18,
        };
      default:
        return {
          radioSize: 20,
          innerSize: 10,
          fontSize: 16,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 处理点击
  const handlePress = () => {
    if (disabled) return;
    onPress();
  };

  // 获取单选按钮样式
  const getRadioStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      {
        width: sizeConfig.radioSize,
        height: sizeConfig.radioSize,
        borderRadius: sizeConfig.radioSize / 2,
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
    } else if (selected) {
      baseStyle.push({
        borderColor: color,
        backgroundColor: colors.background.paper,
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

  // 获取内圆样式
  const getInnerCircleStyle = (): ViewStyle => {
    return {
      width: sizeConfig.innerSize,
      height: sizeConfig.innerSize,
      borderRadius: sizeConfig.innerSize / 2,
      backgroundColor: disabled ? colors.text.disabled : color,
    };
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

  // 渲染单选按钮
  const renderRadio = () => (
    <View style={[getRadioStyle(), radioStyle]}>
      {selected && (
        <View style={getInnerCircleStyle()} />
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
        {renderRadio()}
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
  groupContainer: {
    marginVertical: spacing.sm,
  },
  groupLabel: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  optionsContainer: {
    // 默认垂直布局
  },
  horizontalContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  groupErrorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing.sm,
  },
});

// 单选按钮组
export interface RadioGroupOption {
  label: string;
  value: string | number;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  options: RadioGroupOption[];
  value?: string | number;
  onChange: (value: string | number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  color?: string;
  style?: ViewStyle;
  direction?: 'vertical' | 'horizontal';
  error?: string;
  required?: boolean;
  label?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  value,
  onChange,
  disabled = false,
  size = 'medium',
  color,
  style,
  direction = 'vertical',
  error,
  required = false,
  label,
}) => {
  const handleChange = (optionValue: string | number) => {
    if (disabled) return;
    onChange(optionValue);
  };

  return (
    <View style={[styles.groupContainer, style]}>
      {label && (
        <Text style={[styles.groupLabel, disabled && styles.disabledLabel]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View
        style={[
          styles.optionsContainer,
          direction === 'horizontal' && styles.horizontalContainer,
        ]}
      >
        {options.map((option, index) => (
          <RadioButton
            key={option.value.toString()}
            selected={value === option.value}
            onPress={() => handleChange(option.value)}
            label={option.label}
            description={option.description}
            disabled={disabled || option.disabled}
            size={size}
            color={color}
            error={error && index === 0 ? error : undefined}
            style={{
              ...(direction === 'vertical' && index < options.length - 1
                ? { marginBottom: spacing.sm }
                : {}),
              ...(direction === 'horizontal' && index < options.length - 1
                ? { marginRight: spacing.lg }
                : {}),
            }}
          />
        ))}
      </View>
      
      {error && (
        <Text style={styles.groupErrorText}>{error}</Text>
      )}
    </View>
  );
};



export default RadioButton;
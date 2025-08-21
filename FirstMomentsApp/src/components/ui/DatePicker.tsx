import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
// 注意：需要安装 @react-native-community/datetimepicker 依赖
// npm install @react-native-community/datetimepicker
import { Ionicons } from '@expo/vector-icons';

// 临时样式定义，需要根据实际项目调整
const colors = {
  primary: { main: '#007AFF', light: '#E3F2FD' },
  success: { main: '#34C759' },
  error: { main: '#FF3B30' },
  warning: { main: '#FF9500' },
  text: { primary: '#000', secondary: '#666', disabled: '#999', placeholder: '#999' },
  background: { paper: '#FFF', secondary: '#F5F5F5', disabled: '#F0F0F0' },
  border: { main: '#E0E0E0', focus: '#007AFF', error: '#FF3B30', disabled: '#E0E0E0' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20 };
const textStyles = { body: { fontSize: 16 }, caption: { fontSize: 12 } };
const borderRadius = { sm: 4, md: 8, lg: 12 };

export interface DatePickerProps {
  value?: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time' | 'datetime';
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  format?: string;
  style?: ViewStyle;
  inputStyle?: ViewStyle;
  labelStyle?: TextStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
  icon?: string;
  clearable?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder,
  label,
  error,
  disabled = false,
  required = false,
  format,
  style,
  inputStyle,
  labelStyle,
  size = 'medium',
  variant = 'outlined',
  icon = 'calendar-outline',
  clearable = false,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(value || new Date());

  // 获取尺寸配置
  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          height: 36,
          fontSize: 14,
          paddingHorizontal: spacing.sm,
          iconSize: 16,
        };
      case 'large':
        return {
          height: 56,
          fontSize: 18,
          paddingHorizontal: spacing.lg,
          iconSize: 24,
        };
      default:
        return {
          height: 44,
          fontSize: 16,
          paddingHorizontal: spacing.md,
          iconSize: 20,
        };
    }
  };

  const sizeConfig = getSizeConfig();

  // 格式化日期
  const formatDate = (date: Date): string => {
    if (format) {
      // 简单的格式化实现，实际项目中可能需要使用 date-fns 或 moment.js
      return format
        .replace('YYYY', date.getFullYear().toString())
        .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
        .replace('DD', date.getDate().toString().padStart(2, '0'))
        .replace('HH', date.getHours().toString().padStart(2, '0'))
        .replace('mm', date.getMinutes().toString().padStart(2, '0'));
    }

    switch (mode) {
      case 'time':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      case 'datetime':
        return date.toLocaleString();
      default:
        return date.toLocaleDateString();
    }
  };

  // 获取容器样式
  const getContainerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      {
        height: sizeConfig.height,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizeConfig.paddingHorizontal,
        borderRadius: borderRadius.md,
      } as ViewStyle,
    ];

    // 变体样式
    switch (variant) {
      case 'filled':
        baseStyle.push({
          backgroundColor: colors.background.secondary,
          borderWidth: 0,
        } as ViewStyle);
        break;
      case 'standard':
        baseStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 0,
          borderBottomWidth: 1,
          borderRadius: 0,
          paddingHorizontal: 0,
        } as ViewStyle);
        break;
      default:
        baseStyle.push({
          backgroundColor: colors.background.paper,
          borderWidth: 1,
        } as ViewStyle);
    }

    // 状态样式
    if (disabled) {
      baseStyle.push({
        backgroundColor: colors.background.disabled,
        borderColor: colors.border.disabled,
      } as ViewStyle);
    } else if (error) {
      baseStyle.push({
        borderColor: colors.border.error,
      } as ViewStyle);
    } else {
      baseStyle.push({
        borderColor: colors.border.main,
      } as ViewStyle);
    }

    return baseStyle;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle => {
    return {
      flex: 1,
      fontSize: sizeConfig.fontSize,
      color: disabled
        ? colors.text.disabled
        : value
        ? colors.text.primary
        : colors.text.placeholder,
    };
  };

  // 处理日期变化
  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }

    if (selectedDate) {
      setTempDate(selectedDate);
      if (Platform.OS === 'android') {
        onChange(selectedDate);
      }
    }
  };

  // 确认选择（iOS）
  const handleConfirm = () => {
    onChange(tempDate);
    setShowPicker(false);
  };

  // 取消选择（iOS）
  const handleCancel = () => {
    setTempDate(value || new Date());
    setShowPicker(false);
  };

  // 清除值
  const handleClear = () => {
    if (disabled) return;
    // 这里可能需要根据实际需求调整，比如传递 null 或 undefined
    onChange(new Date());
  };

  // 打开选择器
  const handlePress = () => {
    if (disabled) return;
    setShowPicker(true);
  };

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, labelStyle, disabled && styles.disabledLabel]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <TouchableOpacity
        style={[getContainerStyle(), inputStyle]}
        onPress={handlePress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon as any}
          size={sizeConfig.iconSize}
          color={disabled ? colors.text.disabled : colors.text.secondary}
          style={styles.icon}
        />

        <Text style={getTextStyle()}>
          {value ? formatDate(value) : placeholder || '请选择日期'}
        </Text>

        {clearable && value && !disabled && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons
              name="close-circle"
              size={sizeConfig.iconSize}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {showPicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showPicker}
              transparent
              animationType="slide"
              onRequestClose={handleCancel}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={handleCancel}>
                      <Text style={styles.modalButton}>取消</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>选择{mode === 'date' ? '日期' : mode === 'time' ? '时间' : '日期时间'}</Text>
                    <TouchableOpacity onPress={handleConfirm}>
                      <Text style={[styles.modalButton, styles.confirmButton]}>确定</Text>
                    </TouchableOpacity>
                  </View>
                  {/* <DateTimePicker
                    value={tempDate}
                    mode={mode}
                    display="spinner"
                    onChange={handleDateChange}
                    minimumDate={minimumDate}
                    maximumDate={maximumDate}
                    style={styles.picker}
                  /> */}
                  <Text style={styles.placeholderText}>DateTimePicker 组件需要安装依赖</Text>
                </View>
              </View>
            </Modal>
          ) : (
            {/* <DateTimePicker
              value={tempDate}
              mode={mode}
              display="default"
              onChange={handleDateChange}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
            /> */}
            <Text>DateTimePicker 组件需要安装依赖</Text>
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: spacing.xs,
  },
  label: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  disabledLabel: {
    color: colors.text.disabled,
  },
  required: {
    color: colors.error.main,
  },
  icon: {
    marginRight: spacing.sm,
  },
  clearButton: {
    marginLeft: spacing.sm,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.paper,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    paddingBottom: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.main,
  },
  modalTitle: {
    ...textStyles.body,
    fontWeight: '600',
    color: colors.text.primary,
  },
  modalButton: {
    ...textStyles.body,
    color: colors.primary.main,
  },
  confirmButton: {
    fontWeight: '600',
  },
  picker: {
    backgroundColor: colors.background.paper,
  },
  placeholderText: {
    ...textStyles.body,
    color: colors.text.secondary,
    textAlign: 'center',
    padding: spacing.lg,
  },
  rangeWrapper: {
    marginVertical: spacing.xs,
  },
  rangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rangePicker: {
    flex: 1,
    marginVertical: 0,
  },
  rangeSeparator: {
    ...textStyles.body,
    color: colors.text.secondary,
    marginHorizontal: spacing.sm,
  },
});

// 日期范围选择器
export interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date) => void;
  onEndDateChange: (date: Date) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  placeholder?: { start: string; end: string };
  label?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  variant?: 'outlined' | 'filled' | 'standard';
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minimumDate,
  maximumDate,
  placeholder = { start: '开始日期', end: '结束日期' },
  label,
  error,
  disabled = false,
  required = false,
  style,
  size = 'medium',
  variant = 'outlined',
}) => {
  return (
    <View style={[styles.rangeWrapper, style]}>
      {label && (
        <Text style={[styles.label, disabled && styles.disabledLabel]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.rangeContainer}>
        <DatePicker
          value={startDate}
          onChange={onStartDateChange}
          placeholder={placeholder.start}
          disabled={disabled}
          size={size}
          variant={variant}
          maximumDate={endDate || maximumDate}
          minimumDate={minimumDate}
          style={styles.rangePicker}
        />
        
        <Text style={styles.rangeSeparator}>至</Text>
        
        <DatePicker
          value={endDate}
          onChange={onEndDateChange}
          placeholder={placeholder.end}
          disabled={disabled}
          size={size}
          variant={variant}
          minimumDate={startDate || minimumDate}
          maximumDate={maximumDate}
          style={styles.rangePicker}
        />
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};



export default DatePicker;
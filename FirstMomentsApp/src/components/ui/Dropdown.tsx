import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// 临时样式定义，需要根据实际项目调整
const colors = {
  primary: { main: '#007AFF', light: '#E3F2FD' },
  error: { main: '#FF3B30' },
  text: { primary: '#000', secondary: '#666', disabled: '#999', placeholder: '#999' },
  background: { paper: '#FFF', secondary: '#F5F5F5', disabled: '#F0F0F0' },
  border: { main: '#E0E0E0', light: '#F0F0F0', disabled: '#E0E0E0' },
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16 };
const textStyles = { body: { fontSize: 16 }, caption: { fontSize: 12 } };
const borderRadius = { md: 8 };

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export interface DropdownOption {
  label: string;
  value: string | number;
  disabled?: boolean;
  icon?: string;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string | number;
  placeholder?: string;
  onSelect: (option: DropdownOption) => void;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  maxHeight?: number;
  variant?: 'default' | 'outline' | 'filled';
  size?: 'small' | 'medium' | 'large';
  error?: string;
  label?: string;
  required?: boolean;
  clearable?: boolean;
  loading?: boolean;
  renderOption?: (option: DropdownOption, isSelected: boolean) => React.ReactNode;
  style?: ViewStyle;
  dropdownStyle?: ViewStyle;
}

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  placeholder = '请选择...',
  onSelect,
  disabled = false,
  searchable = false,
  multiple = false,
  maxHeight = 200,
  variant = 'default',
  size = 'medium',
  error,
  label,
  required = false,
  clearable = false,
  loading = false,
  renderOption,
  style,
  dropdownStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedValues, setSelectedValues] = useState<(string | number)[]>(
    multiple ? (Array.isArray(value) ? value : value ? [value] : []) : []
  );
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<View>(null);

  // 过滤选项
  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchText.toLowerCase())
  );

  // 获取选中的选项
  const getSelectedOption = () => {
    if (multiple) {
      return options.filter(option => selectedValues.includes(option.value));
    }
    return options.find(option => option.value === value);
  };

  // 获取显示文本
  const getDisplayText = () => {
    const selected = getSelectedOption();
    if (multiple && Array.isArray(selected)) {
      if (selected.length === 0) return placeholder;
      if (selected.length === 1) return selected[0].label;
      return `已选择 ${selected.length} 项`;
    }
    return selected ? (selected as DropdownOption).label : placeholder;
  };

  // 处理选项选择
  const handleSelect = (option: DropdownOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newSelectedValues = selectedValues.includes(option.value)
        ? selectedValues.filter(v => v !== option.value)
        : [...selectedValues, option.value];
      setSelectedValues(newSelectedValues);
      onSelect(option);
    } else {
      onSelect(option);
      setIsOpen(false);
    }
  };

  // 清除选择
  const handleClear = () => {
    if (multiple) {
      setSelectedValues([]);
    }
    onSelect({ label: '', value: '' });
  };

  // 打开下拉框
  const openDropdown = () => {
    if (disabled) return;
    
    triggerRef.current?.measure((x: number, y: number, width: number, height: number, pageX: number, pageY: number) => {
      setDropdownPosition({
        top: pageY + height,
        left: pageX,
        width: width,
      });
    });
    
    setIsOpen(true);
    setSearchText('');
  };

  // 关闭下拉框
  const closeDropdown = () => {
    setIsOpen(false);
    setSearchText('');
  };

  // 获取触发器样式
  const getTriggerStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [styles.trigger as ViewStyle];

    // 变体样式
    switch (variant) {
      case 'outline':
        baseStyle.push(styles.outlineTrigger as ViewStyle);
        break;
      case 'filled':
        baseStyle.push(styles.filledTrigger as ViewStyle);
        break;
      default:
        baseStyle.push(styles.defaultTrigger as ViewStyle);
    }

    // 尺寸样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallTrigger as ViewStyle);
        break;
      case 'large':
        baseStyle.push(styles.largeTrigger as ViewStyle);
        break;
      default:
        baseStyle.push(styles.mediumTrigger as ViewStyle);
    }

    // 状态样式
    if (disabled) {
      baseStyle.push(styles.disabledTrigger as ViewStyle);
    }
    if (error) {
      baseStyle.push(styles.errorTrigger as ViewStyle);
    }
    if (isOpen) {
      baseStyle.push(styles.openTrigger as ViewStyle);
    }

    return baseStyle;
  };

  // 获取文本样式
  const getTextStyle = (): TextStyle[] => {
    const baseStyle: TextStyle[] = [styles.triggerText as TextStyle];

    // 尺寸文本样式
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText as TextStyle);
        break;
      case 'large':
        baseStyle.push(styles.largeText as TextStyle);
        break;
      default:
        baseStyle.push(styles.mediumText as TextStyle);
    }

    // 状态文本样式
    if (disabled) {
      baseStyle.push(styles.disabledText as TextStyle);
    }
    if (!getSelectedOption() || (multiple && selectedValues.length === 0)) {
      baseStyle.push(styles.placeholderText as TextStyle);
    }

    return baseStyle;
  };

  // 渲染选项
  const renderOptionItem = ({ item }: { item: DropdownOption }) => {
    const isSelected = multiple 
      ? selectedValues.includes(item.value)
      : value === item.value;

    if (renderOption) {
      return (
        <TouchableOpacity
          style={[styles.optionItem, item.disabled && styles.disabledOption]}
          onPress={() => handleSelect(item)}
          disabled={item.disabled}
        >
          {renderOption(item, isSelected)}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.optionItem,
          isSelected && styles.selectedOption,
          item.disabled && styles.disabledOption,
        ]}
        onPress={() => handleSelect(item)}
        disabled={item.disabled}
      >
        <View style={styles.optionContent}>
          {item.icon && (
            <Ionicons
              name={item.icon as any}
              size={16}
              color={item.disabled ? colors.text.disabled : colors.text.primary}
              style={styles.optionIcon}
            />
          )}
          <Text
            style={[
              styles.optionText,
              isSelected && styles.selectedOptionText,
              item.disabled && styles.disabledOptionText,
            ]}
          >
            {item.label}
          </Text>
        </View>
        {multiple && isSelected && (
          <Ionicons
            name="checkmark"
            size={16}
            color={colors.primary.main}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <TouchableOpacity
        ref={triggerRef}
        style={getTriggerStyle()}
        onPress={openDropdown}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle()}>
          {getDisplayText()}
        </Text>
        
        <View style={styles.triggerActions}>
          {clearable && (getSelectedOption() || (multiple && selectedValues.length > 0)) && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClear}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name="close"
                size={16}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          )}
          
          {loading ? (
            <Ionicons
              name="refresh"
              size={16}
              color={colors.text.secondary}
            />
          ) : (
            <Ionicons
              name={isOpen ? "chevron-up" : "chevron-down"}
              size={16}
              color={disabled ? colors.text.disabled : colors.text.secondary}
            />
          )}
        </View>
      </TouchableOpacity>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={closeDropdown}
        >
          <View
            style={[
              styles.dropdown,
              {
                top: dropdownPosition.top,
                left: dropdownPosition.left,
                width: dropdownPosition.width,
                maxHeight: maxHeight,
              },
              dropdownStyle,
            ]}
          >
            {searchable && (
              <View style={styles.searchContainer}>
                <Ionicons
                  name="search"
                  size={16}
                  color={colors.text.secondary}
                  style={styles.searchIcon}
                />
                <TextInput
                  style={styles.searchInput}
                  placeholder="搜索选项..."
                  value={searchText}
                  onChangeText={setSearchText}
                  autoFocus
                />
              </View>
            )}
            
            <FlatList
              data={filteredOptions}
              keyExtractor={(item) => item.value.toString()}
              renderItem={renderOptionItem}
              style={styles.optionsList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
            
            {filteredOptions.length === 0 && (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText ? '未找到匹配选项' : '暂无选项'}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    ...textStyles.body,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error.main,
  },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.paper,
  },
  defaultTrigger: {
    borderColor: colors.border.main,
  },
  outlineTrigger: {
    borderColor: colors.primary.main,
    backgroundColor: 'transparent',
  },
  filledTrigger: {
    borderColor: 'transparent',
    backgroundColor: colors.background.secondary,
  },
  smallTrigger: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 32,
  },
  mediumTrigger: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 40,
  },
  largeTrigger: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 48,
  },
  disabledTrigger: {
    backgroundColor: colors.background.disabled,
    borderColor: colors.border.disabled,
  },
  errorTrigger: {
    borderColor: colors.error.main,
  },
  openTrigger: {
    borderColor: colors.primary.main,
  },
  triggerText: {
    flex: 1,
    color: colors.text.primary,
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
  disabledText: {
    color: colors.text.disabled,
  },
  placeholderText: {
    color: colors.text.placeholder,
  },
  triggerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  clearButton: {
    marginRight: spacing.xs,
  },
  errorText: {
    ...textStyles.caption,
    color: colors.error.main,
    marginTop: spacing.xs,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: colors.background.paper,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.main,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
  },
  optionsList: {
    maxHeight: 200,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  selectedOption: {
    backgroundColor: colors.primary.light,
  },
  disabledOption: {
    opacity: 0.5,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    marginRight: spacing.sm,
  },
  optionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  selectedOptionText: {
    color: colors.primary.main,
    fontWeight: '600',
  },
  disabledOptionText: {
    color: colors.text.disabled,
  },
  emptyContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    ...textStyles.body,
    color: colors.text.secondary,
  },
});

export default Dropdown;
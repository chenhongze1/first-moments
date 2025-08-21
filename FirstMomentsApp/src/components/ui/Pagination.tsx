import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';

// 临时样式变量
const colors = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  white: '#FFFFFF',
  black: '#000000',
};

const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24 };
const borderRadius = { sm: 4, md: 8, lg: 12, xl: 16 };

export interface PaginationProps {
  current: number;
  total: number;
  pageSize?: number;
  onChange?: (page: number) => void;
  showSizeChanger?: boolean;
  pageSizeOptions?: number[];
  onShowSizeChange?: (current: number, size: number) => void;
  showQuickJumper?: boolean;
  showTotal?: boolean | ((total: number, range: [number, number]) => React.ReactNode);
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined' | 'filled';
  simple?: boolean;
  disabled?: boolean;
  hideOnSinglePage?: boolean;
  showLessItems?: boolean;
  style?: ViewStyle;
  itemStyle?: ViewStyle;
  activeItemStyle?: ViewStyle;
  disabledItemStyle?: ViewStyle;
  textStyle?: TextStyle;
  activeTextStyle?: TextStyle;
  disabledTextStyle?: TextStyle;
  prevIcon?: React.ReactNode;
  nextIcon?: React.ReactNode;
  jumpPrevIcon?: React.ReactNode;
  jumpNextIcon?: React.ReactNode;
}

export const Pagination: React.FC<PaginationProps> = ({
  current,
  total,
  pageSize = 10,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = [10, 20, 50, 100],
  onShowSizeChange,
  showQuickJumper = false,
  showTotal = false,
  size = 'medium',
  variant = 'default',
  simple = false,
  disabled = false,
  hideOnSinglePage = false,
  showLessItems = false,
  style,
  itemStyle,
  activeItemStyle,
  disabledItemStyle,
  textStyle,
  activeTextStyle,
  disabledTextStyle,
  prevIcon,
  nextIcon,
  jumpPrevIcon,
  jumpNextIcon,
}) => {
  const totalPages = Math.ceil(total / pageSize);
  const startItem = (current - 1) * pageSize + 1;
  const endItem = Math.min(current * pageSize, total);

  if (hideOnSinglePage && totalPages <= 1) {
    return null;
  }

  const handlePageChange = (page: number) => {
    if (disabled || page === current || page < 1 || page > totalPages) {
      return;
    }
    onChange?.(page);
  };

  const getItemStyle = (isActive: boolean, isDisabled: boolean): ViewStyle => {
    const sizeStyles = {
      small: styles.smallItem,
      medium: styles.mediumItem,
      large: styles.largeItem,
    };

    const variantStyles = {
      default: isActive ? styles.activeDefaultItem : styles.defaultItem,
      outlined: isActive ? styles.activeOutlinedItem : styles.outlinedItem,
      filled: isActive ? styles.activeFilledItem : styles.filledItem,
    };

    return {
      ...styles.item,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(isDisabled && { ...styles.disabledItem, ...disabledItemStyle }),
      ...itemStyle,
      ...(isActive && activeItemStyle),
    };
  };

  const getTextStyle = (isActive: boolean, isDisabled: boolean): TextStyle => {
    const sizeStyles = {
      small: styles.smallText,
      medium: styles.mediumText,
      large: styles.largeText,
    };

    return {
      ...styles.text,
      ...sizeStyles[size],
      ...(isActive && { ...styles.activeText, ...activeTextStyle }),
      ...(isDisabled && { ...styles.disabledText, ...disabledTextStyle }),
      ...textStyle,
    };
  };

  const renderPageItem = (page: number, isActive: boolean = false) => {
    const isDisabled = disabled;
    
    return (
      <TouchableOpacity
        key={page}
        style={getItemStyle(isActive, isDisabled)}
        onPress={() => handlePageChange(page)}
        disabled={isDisabled || isActive}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle(isActive, isDisabled)}>
          {page}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderJumpPrev = () => {
    if (jumpPrevIcon) {
      return (
        <TouchableOpacity
          style={getItemStyle(false, disabled)}
          onPress={() => handlePageChange(Math.max(1, current - 5))}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {jumpPrevIcon}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={getItemStyle(false, disabled)}
        onPress={() => handlePageChange(Math.max(1, current - 5))}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle(false, disabled)}>•••</Text>
      </TouchableOpacity>
    );
  };

  const renderJumpNext = () => {
    if (jumpNextIcon) {
      return (
        <TouchableOpacity
          style={getItemStyle(false, disabled)}
          onPress={() => handlePageChange(Math.min(totalPages, current + 5))}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {jumpNextIcon}
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={getItemStyle(false, disabled)}
        onPress={() => handlePageChange(Math.min(totalPages, current + 5))}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={getTextStyle(false, disabled)}>•••</Text>
      </TouchableOpacity>
    );
  };

  const renderPrevButton = () => {
    const isDisabled = disabled || current <= 1;
    
    return (
      <TouchableOpacity
        style={getItemStyle(false, isDisabled)}
        onPress={() => handlePageChange(current - 1)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {prevIcon || (
          <Text style={getTextStyle(false, isDisabled)}>‹</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderNextButton = () => {
    const isDisabled = disabled || current >= totalPages;
    
    return (
      <TouchableOpacity
        style={getItemStyle(false, isDisabled)}
        onPress={() => handlePageChange(current + 1)}
        disabled={isDisabled}
        activeOpacity={0.7}
      >
        {nextIcon || (
          <Text style={getTextStyle(false, isDisabled)}>›</Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderPageNumbers = () => {
    const pages: React.ReactNode[] = [];
    const maxVisible = showLessItems ? 5 : 7;
    
    if (simple) {
      return [
        renderPrevButton(),
        <View key="simple" style={styles.simpleInfo}>
          <Text style={getTextStyle(false, false)}>
            {current} / {totalPages}
          </Text>
        </View>,
        renderNextButton(),
      ];
    }

    // 总是显示第一页
    pages.push(renderPageItem(1, current === 1));

    if (totalPages <= maxVisible) {
      // 如果总页数较少，显示所有页面
      for (let i = 2; i <= totalPages; i++) {
        pages.push(renderPageItem(i, current === i));
      }
    } else {
      // 复杂分页逻辑
      const startPage = Math.max(2, current - Math.floor(maxVisible / 2));
      const endPage = Math.min(totalPages - 1, startPage + maxVisible - 3);

      // 显示跳转到前面的省略号
      if (startPage > 2) {
        pages.push(renderJumpPrev());
      }

      // 显示中间页面
      for (let i = startPage; i <= endPage; i++) {
        pages.push(renderPageItem(i, current === i));
      }

      // 显示跳转到后面的省略号
      if (endPage < totalPages - 1) {
        pages.push(renderJumpNext());
      }

      // 总是显示最后一页
      if (totalPages > 1) {
        pages.push(renderPageItem(totalPages, current === totalPages));
      }
    }

    return [renderPrevButton(), ...pages, renderNextButton()];
  };

  const renderTotal = () => {
    if (!showTotal) return null;

    if (typeof showTotal === 'function') {
      return (
        <View style={styles.totalContainer}>
          {showTotal(total, [startItem, endItem])}
        </View>
      );
    }

    return (
      <View style={styles.totalContainer}>
        <Text style={getTextStyle(false, false)}>
          共 {total} 条，第 {startItem}-{endItem} 条
        </Text>
      </View>
    );
  };

  const renderSizeChanger = () => {
    if (!showSizeChanger) return null;

    return (
      <View style={styles.sizeChangerContainer}>
        <Text style={getTextStyle(false, false)}>每页 </Text>
        {pageSizeOptions.map(size => (
          <TouchableOpacity
            key={size}
            style={{
              ...styles.sizeOption,
              ...(size === pageSize && styles.activeSizeOption),
            }}
            onPress={() => onShowSizeChange?.(1, size)}
            disabled={disabled}
          >
            <Text
              style={{
                ...getTextStyle(size === pageSize, disabled),
                ...(size === pageSize && styles.activeSizeText),
              }}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={getTextStyle(false, false)}> 条</Text>
      </View>
    );
  };

  return (
    <View style={{ ...styles.container, ...style }}>
      {renderTotal()}
      <View style={styles.paginationContainer}>
        {renderPageNumbers()}
      </View>
      {renderSizeChanger()}
    </View>
  );
};

// 预设组件
export const SimplePagination: React.FC<Omit<PaginationProps, 'simple'>> = (props) => (
  <Pagination {...props} simple />
);

export const OutlinedPagination: React.FC<Omit<PaginationProps, 'variant'>> = (props) => (
  <Pagination {...props} variant="outlined" />
);

export const FilledPagination: React.FC<Omit<PaginationProps, 'variant'>> = (props) => (
  <Pagination {...props} variant="filled" />
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  } as ViewStyle,
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  item: {
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  } as ViewStyle,
  smallItem: {
    width: 28,
    height: 28,
  } as ViewStyle,
  mediumItem: {
    width: 32,
    height: 32,
  } as ViewStyle,
  largeItem: {
    width: 36,
    height: 36,
  } as ViewStyle,
  defaultItem: {
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeDefaultItem: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  outlinedItem: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.gray[300],
  } as ViewStyle,
  activeOutlinedItem: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  } as ViewStyle,
  filledItem: {
    backgroundColor: colors.gray[100],
  } as ViewStyle,
  activeFilledItem: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  disabledItem: {
    opacity: 0.5,
  } as ViewStyle,
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.gray[700],
  } as TextStyle,
  smallText: {
    fontSize: 12,
  } as TextStyle,
  mediumText: {
    fontSize: 14,
  } as TextStyle,
  largeText: {
    fontSize: 16,
  } as TextStyle,
  activeText: {
    color: colors.white,
    fontWeight: '600',
  } as TextStyle,
  disabledText: {
    color: colors.gray[400],
  } as TextStyle,
  simpleInfo: {
    paddingHorizontal: spacing.md,
  } as ViewStyle,
  totalContainer: {
    marginRight: spacing.md,
  } as ViewStyle,
  sizeChangerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.md,
  } as ViewStyle,
  sizeOption: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    marginHorizontal: spacing.xs / 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'transparent',
  } as ViewStyle,
  activeSizeOption: {
    backgroundColor: colors.primary,
  } as ViewStyle,
  activeSizeText: {
    color: colors.white,
  } as TextStyle,
});

export default Pagination;
import React from 'react';
import {
  View,
  Text,
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

export interface DividerProps {
  children?: React.ReactNode;
  className?: string;
  dashed?: boolean;
  orientation?: 'left' | 'right' | 'center';
  orientationMargin?: string | number;
  plain?: boolean;
  style?: ViewStyle;
  type?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  thickness?: number;
  color?: string;
  margin?: number;
  textStyle?: TextStyle;
}

export const Divider: React.FC<DividerProps> = ({
  children,
  dashed = false,
  orientation = 'center',
  orientationMargin,
  plain = false,
  style,
  type = 'horizontal',
  variant = 'solid',
  thickness = 1,
  color = colors.gray[200],
  margin = spacing.md,
  textStyle,
}) => {
  const isHorizontal = type === 'horizontal';
  const hasText = !!children;
  const actualVariant = dashed ? 'dashed' : variant;

  const getDividerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: actualVariant === 'solid' ? color : 'transparent',
      borderColor: color,
    };

    if (isHorizontal) {
      baseStyle.height = thickness;
      baseStyle.marginVertical = margin;
      if (actualVariant === 'dashed') {
        baseStyle.borderTopWidth = thickness;
        baseStyle.borderStyle = 'dashed';
      } else if (actualVariant === 'dotted') {
        baseStyle.borderTopWidth = thickness;
        baseStyle.borderStyle = 'dotted';
      }
    } else {
      baseStyle.width = thickness;
      baseStyle.marginHorizontal = margin;
      if (actualVariant === 'dashed') {
        baseStyle.borderLeftWidth = thickness;
        baseStyle.borderStyle = 'dashed';
      } else if (actualVariant === 'dotted') {
        baseStyle.borderLeftWidth = thickness;
        baseStyle.borderStyle = 'dotted';
      }
    }

    return baseStyle;
  };

  const getTextContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.white,
      paddingHorizontal: spacing.md,
    };

    if (orientation === 'left') {
      baseStyle.alignSelf = 'flex-start';
      if (orientationMargin) {
        baseStyle.marginLeft = typeof orientationMargin === 'string' 
          ? parseInt(orientationMargin) 
          : orientationMargin;
      }
    } else if (orientation === 'right') {
      baseStyle.alignSelf = 'flex-end';
      if (orientationMargin) {
        baseStyle.marginRight = typeof orientationMargin === 'string' 
          ? parseInt(orientationMargin) 
          : orientationMargin;
      }
    } else {
      baseStyle.alignSelf = 'center';
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontSize: 14,
      color: plain ? colors.gray[400] : colors.gray[600],
      fontWeight: plain ? 'normal' : '500',
    };

    return {
      ...baseStyle,
      ...textStyle,
    };
  };

  if (!hasText) {
    return (
      <View style={[getDividerStyle(), style]} />
    );
  }

  if (isHorizontal) {
    return (
      <View style={[styles.horizontalContainer, { marginVertical: margin }, style]}>
        <View style={[getDividerStyle(), styles.horizontalLine]} />
        <View style={getTextContainerStyle()}>
          {typeof children === 'string' ? (
            <Text style={getTextStyle()}>{children}</Text>
          ) : (
            children
          )}
        </View>
        <View style={[getDividerStyle(), styles.horizontalLine]} />
      </View>
    );
  } else {
    return (
      <View style={[styles.verticalContainer, { marginHorizontal: margin }, style]}>
        <View style={[getDividerStyle(), styles.verticalLine]} />
        <View style={getTextContainerStyle()}>
          {typeof children === 'string' ? (
            <Text style={getTextStyle()}>{children}</Text>
          ) : (
            children
          )}
        </View>
        <View style={[getDividerStyle(), styles.verticalLine]} />
      </View>
    );
  }
};

// 预设组件
export const HorizontalDivider: React.FC<Omit<DividerProps, 'type'>> = (props) => (
  <Divider {...props} type="horizontal" />
);

export const VerticalDivider: React.FC<Omit<DividerProps, 'type'>> = (props) => (
  <Divider {...props} type="vertical" />
);

export const DashedDivider: React.FC<Omit<DividerProps, 'variant'>> = (props) => (
  <Divider {...props} variant="dashed" />
);

export const DottedDivider: React.FC<Omit<DividerProps, 'variant'>> = (props) => (
  <Divider {...props} variant="dotted" />
);

export const TextDivider: React.FC<DividerProps & { text: string }> = ({ text, ...props }) => (
  <Divider {...props}>{text}</Divider>
);

const styles = StyleSheet.create({
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  } as ViewStyle,
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    height: '100%',
  } as ViewStyle,
  horizontalLine: {
    flex: 1,
    marginVertical: 0,
  } as ViewStyle,
  verticalLine: {
    flex: 1,
    marginHorizontal: 0,
  } as ViewStyle,
});

export default Divider;
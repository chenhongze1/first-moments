import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  TextInputProps,
  ScrollViewProps,
  AccessibilityState,
} from 'react-native';
import type { AccessibilityRole } from 'react-native';
import { useAccessibilityState, useAccessibilityFocus, AccessibilityUtils } from '../../utils/accessibility';

// 可访问的按钮组件
interface AccessibleButtonProps extends Omit<TouchableOpacityProps, 'accessibilityRole' | 'role'> {
  title: string;
  onPress: () => void;
  accessibilityRole?: 'button' | 'link' | 'text';
  hint?: string;
  state?: AccessibilityState;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const AccessibleButton = forwardRef<any, AccessibleButtonProps>((
  {
    title,
    onPress,
    accessibilityRole = 'button',
    hint,
    state,
    style,
    textStyle,
    disabled = false,
    ...props
  },
  ref
) => {
  const { ref: focusRef, setFocus } = useAccessibilityFocus();
  const accessibilityState = useAccessibilityState();

  useImperativeHandle(ref, () => focusRef.current);

  const accessibilityLabel = AccessibilityUtils.generateAccessibilityLabel(
    title,
    accessibilityRole,
    disabled ? '已禁用' : ''
  );

  const accessibilityHint = hint || AccessibilityUtils.generateAccessibilityHint(
    '双击激活',
    '执行操作'
  );

  return (
    <TouchableOpacity
      ref={focusRef}
      style={[
        {
          padding: 12,
          backgroundColor: disabled ? '#ccc' : '#007AFF',
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      accessible={true}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        disabled,
        ...state,
      }}
      disabled={disabled}
      {...props}
    >
      <Text
        style={[
          {
            color: disabled ? '#666' : '#fff',
            fontSize: 16,
            fontWeight: '600',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
});

// 可访问的文本输入组件
interface AccessibleTextInputProps extends TextInputProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  errorStyle?: TextStyle;
}

export const AccessibleTextInput = forwardRef<TextInput, AccessibleTextInputProps>((
  {
    label,
    error,
    hint,
    required = false,
    containerStyle,
    labelStyle,
    errorStyle,
    ...props
  },
  ref
) => {
  const { ref: focusRef, setFocus } = useAccessibilityFocus();
  const [isFocused, setIsFocused] = useState(false);

  useImperativeHandle(ref, () => focusRef.current);

  const accessibilityLabel = AccessibilityUtils.generateAccessibilityLabel(
    label,
    '文本输入框',
    required ? '必填' : '选填'
  );

  const accessibilityHint = hint || AccessibilityUtils.generateAccessibilityHint(
    '双击编辑',
    '输入文本内容'
  );

  return (
    <View style={[{ marginVertical: 8 }, containerStyle]}>
      <Text
        style={[
          {
            fontSize: 16,
            fontWeight: '600',
            marginBottom: 4,
            color: '#333',
          },
          labelStyle,
        ]}
      >
        {label}
        {required && (
          <Text style={{ color: '#FF3B30' }} accessibilityLabel="必填">
            {' *'}
          </Text>
        )}
      </Text>
      
      <TextInput
        ref={focusRef}
        style={[
          {
            borderWidth: 1,
            borderColor: error ? '#FF3B30' : isFocused ? '#007AFF' : '#ccc',
            borderRadius: 8,
            padding: 12,
            fontSize: 16,
            backgroundColor: '#fff',
          },
          props.style,
        ]}
        accessible={true}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="text"
        onFocus={(e) => {
          setIsFocused(true);
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          props.onBlur?.(e);
        }}
        {...props}
      />
      
      {error && (
        <Text
          style={[
            {
              color: '#FF3B30',
              fontSize: 14,
              marginTop: 4,
            },
            errorStyle,
          ]}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel={`错误: ${error}`}
        >
          {error}
        </Text>
      )}
    </View>
  );
});

// 可访问的列表项组件
interface AccessibleListItemProps extends TouchableOpacityProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  selected?: boolean;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  subtitleStyle?: TextStyle;
}

export const AccessibleListItem = forwardRef<any, AccessibleListItemProps>((
  {
    title,
    subtitle,
    onPress,
    leftIcon,
    rightIcon,
    selected = false,
    containerStyle,
    titleStyle,
    subtitleStyle,
    ...props
  },
  ref
) => {
  const { ref: focusRef, setFocus } = useAccessibilityFocus();

  useImperativeHandle(ref, () => focusRef.current);

  const accessibilityLabel = AccessibilityUtils.generateAccessibilityLabel(
    `${title}${subtitle ? `, ${subtitle}` : ''}`,
    '列表项',
    selected ? '已选中' : ''
  );

  const accessibilityHint = AccessibilityUtils.generateAccessibilityHint(
    '双击选择',
    '打开详情'
  );

  return (
    <TouchableOpacity
      ref={focusRef}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          backgroundColor: selected ? '#E3F2FD' : '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        },
        containerStyle,
      ]}
      onPress={onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{
        selected,
      }}
      {...props}
    >
      {leftIcon && (
        <View style={{ marginRight: 12 }}>
          {leftIcon}
        </View>
      )}
      
      <View style={{ flex: 1 }}>
        <Text
          style={[
            {
              fontSize: 16,
              fontWeight: '600',
              color: '#333',
            },
            titleStyle,
          ]}
        >
          {title}
        </Text>
        
        {subtitle && (
          <Text
            style={[
              {
                fontSize: 14,
                color: '#666',
                marginTop: 2,
              },
              subtitleStyle,
            ]}
          >
            {subtitle}
          </Text>
        )}
      </View>
      
      {rightIcon && (
        <View style={{ marginLeft: 12 }}>
          {rightIcon}
        </View>
      )}
    </TouchableOpacity>
  );
});

// 可访问的标签页组件
interface AccessibleTabProps {
  tabs: Array<{
    key: string;
    title: string;
    content: React.ReactNode;
  }>;
  activeTab: string;
  onTabChange: (key: string) => void;
  containerStyle?: ViewStyle;
  tabStyle?: ViewStyle;
  activeTabStyle?: ViewStyle;
  tabTextStyle?: TextStyle;
  activeTabTextStyle?: TextStyle;
}

export const AccessibleTabs: React.FC<AccessibleTabProps> = ({
  tabs,
  activeTab,
  onTabChange,
  containerStyle,
  tabStyle,
  activeTabStyle,
  tabTextStyle,
  activeTabTextStyle,
}) => {
  const accessibilityState = useAccessibilityState();

  return (
    <View style={[{ flex: 1 }, containerStyle]}>
      {/* 标签页头部 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          flexGrow: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#eee',
        }}
        accessible={true}
        accessibilityLabel="标签页列表"
      >
        <View style={{ flexDirection: 'row' }}>
          {tabs.map((tab, index) => {
            const isActive = tab.key === activeTab;
            
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  {
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 2,
                    borderBottomColor: isActive ? '#007AFF' : 'transparent',
                  },
                  tabStyle,
                  isActive && activeTabStyle,
                ]}
                onPress={() => onTabChange(tab.key)}
                accessible={true}
                accessibilityLabel={AccessibilityUtils.generateAccessibilityLabel(
                  tab.title,
                  '标签页',
                  isActive ? '已选中' : ''
                )}
                accessibilityHint={AccessibilityUtils.generateAccessibilityHint(
                  '双击切换',
                  '显示对应内容'
                )}
                accessibilityState={{
                  selected: isActive,
                }}
              >
                <Text
                  style={[
                    {
                      fontSize: 16,
                      fontWeight: isActive ? '600' : '400',
                      color: isActive ? '#007AFF' : '#666',
                    },
                    tabTextStyle,
                    isActive && activeTabTextStyle,
                  ]}
                >
                  {tab.title}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
      
      {/* 标签页内容 */}
      <View
        style={{ flex: 1 }}
        accessible={true}
        accessibilityLabel={`${tabs.find(tab => tab.key === activeTab)?.title || ''} 内容`}
      >
        {tabs.find(tab => tab.key === activeTab)?.content}
      </View>
    </View>
  );
};

// 可访问的模态框组件
interface AccessibleModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  contentStyle?: ViewStyle;
  titleStyle?: TextStyle;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  visible,
  onClose,
  title,
  children,
  containerStyle,
  contentStyle,
  titleStyle,
}) => {
  const { ref: modalRef, setFocus } = useAccessibilityFocus();

  useEffect(() => {
    if (visible) {
      // 模态框打开时设置焦点
      setTimeout(() => {
        setFocus();
      }, 100);
      
      // 宣布模态框打开
      AccessibilityUtils.announceForAccessibility(`${title} 对话框已打开`);
    }
  }, [visible, title, setFocus]);

  if (!visible) return null;

  return (
    <View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        },
        containerStyle,
      ]}
      accessible={true}
      accessibilityLabel={title}
      accessibilityViewIsModal={true}
    >
      <View
        ref={modalRef}
        style={[
          {
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 20,
            margin: 20,
            maxWidth: '90%',
            maxHeight: '80%',
          },
          contentStyle,
        ]}
        accessible={true}
      >
        {/* 标题 */}
        <Text
          style={[
            {
              fontSize: 18,
              fontWeight: '600',
              marginBottom: 16,
              color: '#333',
            },
            titleStyle,
          ]}
          accessible={true}
          accessibilityRole="header"
        >
          {title}
        </Text>
        
        {/* 内容 */}
        {children}
        
        {/* 关闭按钮 */}
        <AccessibleButton
          title="关闭"
          onPress={onClose}
          style={{
            marginTop: 16,
            backgroundColor: '#666',
          }}
          hint="关闭对话框"
        />
      </View>
    </View>
  );
};
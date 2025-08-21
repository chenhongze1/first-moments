import React, { useEffect, useRef, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
  TextStyle,
  Keyboard,
  Platform,
} from 'react-native';
import { useKeyboardNavigation, AccessibilityUtils } from '../../utils/accessibility';

// 键盘导航容器
interface KeyboardNavigationContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onFocusChange?: (focusedIndex: number) => void;
}

export const KeyboardNavigationContainer: React.FC<KeyboardNavigationContainerProps> = ({
  children,
  style,
  onFocusChange,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const containerRef = useRef<View>(null);
  const focusableElements = useRef<any[]>([]);

  // 监听键盘显示/隐藏
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 注册可聚焦元素
  const registerFocusableElement = useCallback((element: any, index: number) => {
    focusableElements.current[index] = element;
  }, []);

  // 设置焦点
  const setFocus = useCallback((index: number) => {
    if (index >= 0 && index < focusableElements.current.length) {
      const element = focusableElements.current[index];
      if (element && element.focus) {
        element.focus();
        setFocusedIndex(index);
        onFocusChange?.(index);
        
        // 宣布焦点变化
        AccessibilityUtils.announceForAccessibility(`焦点移动到第 ${index + 1} 个元素`);
      }
    }
  }, [onFocusChange]);

  // 下一个焦点
  const focusNext = useCallback(() => {
    const nextIndex = (focusedIndex + 1) % focusableElements.current.length;
    setFocus(nextIndex);
  }, [focusedIndex, setFocus]);

  // 上一个焦点
  const focusPrevious = useCallback(() => {
    const prevIndex = focusedIndex <= 0 
      ? focusableElements.current.length - 1 
      : focusedIndex - 1;
    setFocus(prevIndex);
  }, [focusedIndex, setFocus]);

  // 第一个焦点
  const focusFirst = useCallback(() => {
    setFocus(0);
  }, [setFocus]);

  // 最后一个焦点
  const focusLast = useCallback(() => {
    setFocus(focusableElements.current.length - 1);
  }, [setFocus]);

  return (
    <View
      ref={containerRef}
      style={style}
      accessible={true}
      accessibilityLabel="键盘导航容器"
    >
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            onFocus: () => {
              setFocusedIndex(index);
              onFocusChange?.(index);
            },
            ref: (element: any) => {
              registerFocusableElement(element, index);
            },
            tabIndex: index,
            focused: focusedIndex === index,
          });
        }
        return child;
      })}
      
      {/* 键盘导航提示 */}
      {keyboardVisible && (
        <View
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 8,
            borderRadius: 4,
          }}
          accessible={true}
          accessibilityLabel="键盘导航提示"
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 12,
            }}
          >
            Tab: 下一个 | Shift+Tab: 上一个
          </Text>
        </View>
      )}
    </View>
  );
};

// 可聚焦的按钮组件
interface FocusableButtonProps {
  title: string;
  onPress: () => void;
  focused?: boolean;
  tabIndex?: number;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export const FocusableButton = React.forwardRef<any, FocusableButtonProps>((
  {
    title,
    onPress,
    focused = false,
    tabIndex = 0,
    style,
    textStyle,
    disabled = false,
  },
  ref
) => {
  const buttonRef = useRef<any>(null);
  const { elementRef, focusNext, focusPrevious } = useKeyboardNavigation();

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      if (buttonRef.current) {
        // 模拟焦点效果
        AccessibilityUtils.announceForAccessibility(`按钮 ${title} 获得焦点`);
      }
    },
  }));

  return (
    <TouchableOpacity
      ref={buttonRef}
      style={[
        {
          padding: 12,
          backgroundColor: disabled ? '#ccc' : focused ? '#0056b3' : '#007AFF',
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: focused ? 2 : 0,
          borderColor: '#fff',
        },
        style,
      ]}
      onPress={disabled ? undefined : onPress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint="双击激活"
      accessibilityState={{
        disabled,
        selected: focused,
      }}
      disabled={disabled}
    >
      <Text
        style={[
          {
            color: disabled ? '#666' : '#fff',
            fontSize: 16,
            fontWeight: focused ? '700' : '600',
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
});

// 快捷键处理器
interface ShortcutKey {
  key: string;
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[];
  action: () => void;
  description: string;
}

interface KeyboardShortcutsProps {
  shortcuts: ShortcutKey[];
  children: React.ReactNode;
  showHelp?: boolean;
}

export const KeyboardShortcuts: React.FC<KeyboardShortcutsProps> = ({
  shortcuts,
  children,
  showHelp = false,
}) => {
  const [helpVisible, setHelpVisible] = useState(showHelp);
  const containerRef = useRef<View>(null);

  // 处理键盘事件（在Web环境下）
  useEffect(() => {
    if (Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent) => {
        for (const shortcut of shortcuts) {
          const modifiersMatch = shortcut.modifiers?.every(modifier => {
            switch (modifier) {
              case 'ctrl':
                return event.ctrlKey;
              case 'shift':
                return event.shiftKey;
              case 'alt':
                return event.altKey;
              case 'meta':
                return event.metaKey;
              default:
                return false;
            }
          }) ?? true;

          if (event.key.toLowerCase() === shortcut.key.toLowerCase() && modifiersMatch) {
            event.preventDefault();
            shortcut.action();
            
            // 宣布快捷键执行
            AccessibilityUtils.announceForAccessibility(`执行快捷键: ${shortcut.description}`);
            break;
          }
        }

        // 显示/隐藏帮助
        if (event.key === '?' && event.shiftKey) {
          event.preventDefault();
          setHelpVisible(!helpVisible);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [shortcuts, helpVisible]);

  return (
    <View ref={containerRef} style={{ flex: 1 }}>
      {children}
      
      {/* 快捷键帮助 */}
      {helpVisible && (
        <View
          style={{
            position: 'absolute',
            top: 50,
            right: 20,
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            padding: 16,
            borderRadius: 8,
            maxWidth: 300,
            zIndex: 1000,
          }}
          accessible={true}
          accessibilityLabel="快捷键帮助"
        >
          <Text
            style={{
              color: '#fff',
              fontSize: 16,
              fontWeight: '600',
              marginBottom: 12,
            }}
          >
            快捷键帮助
          </Text>
          
          {shortcuts.map((shortcut, index) => {
            const keyText = [
              ...(shortcut.modifiers || []),
              shortcut.key.toUpperCase(),
            ].join(' + ');
            
            return (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    flex: 1,
                  }}
                >
                  {shortcut.description}
                </Text>
                <Text
                  style={{
                    color: '#ccc',
                    fontSize: 14,
                    fontFamily: 'monospace',
                  }}
                >
                  {keyText}
                </Text>
              </View>
            );
          })}
          
          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: '#666',
              marginTop: 8,
              paddingTop: 8,
            }}
          >
            <Text
              style={{
                color: '#ccc',
                fontSize: 12,
                textAlign: 'center',
              }}
            >
              按 Shift + ? 关闭帮助
            </Text>
          </View>
          
          <TouchableOpacity
            style={{
              marginTop: 12,
              padding: 8,
              backgroundColor: '#333',
              borderRadius: 4,
              alignItems: 'center',
            }}
            onPress={() => setHelpVisible(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="关闭帮助"
          >
            <Text style={{ color: '#fff', fontSize: 14 }}>关闭</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// 焦点陷阱组件（用于模态框等）
interface FocusTrapProps {
  children: React.ReactNode;
  active: boolean;
  onEscape?: () => void;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  onEscape,
}) => {
  const containerRef = useRef<View>(null);
  const firstFocusableRef = useRef<any>(null);
  const lastFocusableRef = useRef<any>(null);

  useEffect(() => {
    if (active && Platform.OS === 'web') {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === 'Escape' && onEscape) {
          event.preventDefault();
          onEscape();
          return;
        }

        if (event.key === 'Tab') {
          // 在React Native Web环境下处理焦点陷阱
          if (Platform.OS === 'web' && (containerRef.current as any)?.querySelectorAll) {
            const focusableElements = (containerRef.current as any).querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements && focusableElements.length > 0) {
              const firstElement = focusableElements[0] as HTMLElement;
              const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
              
              if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                  event.preventDefault();
                  lastElement.focus();
                }
              } else {
                // Tab
                if (document.activeElement === lastElement) {
                  event.preventDefault();
                  firstElement.focus();
                }
              }
            }
          }
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      
      // 设置初始焦点
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [active, onEscape]);

  return (
    <View
      ref={containerRef}
      style={{ flex: 1 }}
      accessible={true}
      accessibilityLabel="焦点陷阱容器"
    >
      {children}
    </View>
  );
};
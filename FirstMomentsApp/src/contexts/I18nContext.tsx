import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Alert } from 'react-native';
import {
  initializeLanguage,
  changeLanguage as changeAppLanguage,
  getCurrentLanguage,
  getCurrentLanguageInfo,
  SUPPORTED_LANGUAGES,
  t,
  formatDate,
  formatNumber,
  formatRelativeTime,
  formatCurrency,
  isRTL,
  getTextDirection,
} from '../i18n';

// 国际化上下文类型
interface I18nContextType {
  // 当前语言信息
  currentLanguage: string;
  currentLanguageInfo: {
    code: string;
    name: string;
    nativeName: string;
  };
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
  isRTL: boolean;
  textDirection: 'ltr' | 'rtl';
  
  // 语言切换
  changeLanguage: (languageCode: string) => Promise<void>;
  
  // 翻译函数
  t: (key: string, options?: any) => string;
  
  // 格式化函数
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (number: number, options?: Intl.NumberFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  
  // 状态
  isLoading: boolean;
  error: string | null;
}

// 创建上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 国际化提供者组件
interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('zh');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化语言设置
  useEffect(() => {
    const initLanguage = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const language = await initializeLanguage();
        setCurrentLanguage(language);
      } catch (err) {
        console.error('初始化语言设置失败:', err);
        setError('初始化语言设置失败');
        // 使用默认语言
        setCurrentLanguage('zh');
      } finally {
        setIsLoading(false);
      }
    };

    initLanguage();
  }, []);

  // 切换语言
  const changeLanguage = useCallback(async (languageCode: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 检查语言是否支持
      const isSupported = SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
      if (!isSupported) {
        throw new Error(`不支持的语言: ${languageCode}`);
      }
      
      await changeAppLanguage(languageCode);
      setCurrentLanguage(languageCode);
      
      // 显示切换成功提示
      const languageInfo = SUPPORTED_LANGUAGES.find(lang => lang.code === languageCode);
      Alert.alert(
        t('settings.languageChanged'),
        t('settings.languageChangedTo', { language: languageInfo?.nativeName || languageCode }),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } catch (err) {
      console.error('切换语言失败:', err);
      setError(err instanceof Error ? err.message : '切换语言失败');
      
      Alert.alert(
        t('common.error'),
        t('settings.languageChangeError'),
        [{ text: t('common.ok'), style: 'default' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 获取当前语言信息
  const currentLanguageInfo = getCurrentLanguageInfo();
  
  // 获取文本方向
  const textDirection = getTextDirection();
  const isRightToLeft = isRTL();

  const contextValue: I18nContextType = {
    // 当前语言信息
    currentLanguage,
    currentLanguageInfo,
    supportedLanguages: SUPPORTED_LANGUAGES,
    isRTL: isRightToLeft,
    textDirection,
    
    // 语言切换
    changeLanguage,
    
    // 翻译函数
    t,
    
    // 格式化函数
    formatDate,
    formatNumber,
    formatRelativeTime,
    formatCurrency,
    
    // 状态
    isLoading,
    error,
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// 使用国际化上下文的 Hook
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// 简化的翻译 Hook
export const useTranslation = () => {
  const { t, currentLanguage } = useI18n();
  
  return {
    t,
    i18n: {
      language: currentLanguage,
      changeLanguage: useI18n().changeLanguage,
    },
  };
};

// 格式化 Hook
export const useFormatting = () => {
  const {
    formatDate,
    formatNumber,
    formatRelativeTime,
    formatCurrency,
    currentLanguage,
  } = useI18n();
  
  return {
    formatDate,
    formatNumber,
    formatRelativeTime,
    formatCurrency,
    locale: currentLanguage,
  };
};

// 语言选择器组件
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface LanguageSelectorProps {
  onLanguageSelect?: (languageCode: string) => void;
  style?: any;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  onLanguageSelect,
  style,
}) => {
  const {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isLoading,
    t,
  } = useI18n();

  const handleLanguageSelect = async (languageCode: string) => {
    if (languageCode === currentLanguage) return;
    
    try {
      await changeLanguage(languageCode);
      onLanguageSelect?.(languageCode);
    } catch (error) {
      // 错误已在 changeLanguage 中处理
    }
  };

  const styles = StyleSheet.create({
    container: {
      padding: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 16,
      color: '#333',
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      marginBottom: 8,
      backgroundColor: '#F8F9FA',
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#E9ECEF',
    },
    selectedLanguageItem: {
      backgroundColor: '#007AFF',
      borderColor: '#007AFF',
    },
    languageFlag: {
      fontSize: 24,
      marginRight: 12,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: 16,
      fontWeight: '500',
      color: '#333',
      marginBottom: 2,
    },
    selectedLanguageName: {
      color: '#FFFFFF',
    },
    languageNativeName: {
      fontSize: 14,
      color: '#666',
    },
    selectedLanguageNativeName: {
      color: '#E3F2FD',
    },
    checkmark: {
      fontSize: 20,
      color: '#FFFFFF',
    },
    loadingText: {
      textAlign: 'center',
      color: '#666',
      fontStyle: 'italic',
    },
  });

  if (isLoading) {
    return (
      <View style={[styles.container, style]}>
        <Text style={styles.loadingText}>{t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{t('settings.selectLanguage')}</Text>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {supportedLanguages.map((language) => {
          const isSelected = language.code === currentLanguage;
          
          return (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageItem,
                isSelected && styles.selectedLanguageItem,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
              disabled={isLoading}
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={`${t('settings.selectLanguage')} ${language.nativeName}`}
              accessibilityState={{
                selected: isSelected,
                disabled: isLoading,
              }}
            >
              <Text style={styles.languageFlag}>🌐</Text>
              
              <View style={styles.languageInfo}>
                <Text
                  style={[
                    styles.languageName,
                    isSelected && styles.selectedLanguageName,
                  ]}
                >
                  {language.name}
                </Text>
                <Text
                  style={[
                    styles.languageNativeName,
                    isSelected && styles.selectedLanguageNativeName,
                  ]}
                >
                  {language.nativeName}
                </Text>
              </View>
              
              {isSelected && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default I18nProvider;
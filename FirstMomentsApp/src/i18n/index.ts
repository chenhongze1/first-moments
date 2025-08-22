import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, NativeModules } from 'react-native';

// 导入语言包
import en from './locales/en.json';
import zh from './locales/zh.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

// 简化的i18n实现
class SimpleI18n {
  private translations: { [key: string]: any } = { en, zh, ja, ko };
  private currentLocale: string = 'zh';
  private fallbackLocale: string = 'zh';

  constructor() {
    // 获取系统语言
    try {
      const systemLocale = this.detectSystemLanguage();
      this.setLocale(systemLocale);
    } catch (error) {
      console.warn('Failed to get system locale, using default zh');
    }
  }

  private detectSystemLanguage(): string {
    // 简单的语言检测逻辑
    if (typeof navigator !== 'undefined' && navigator.language) {
      const lang = navigator.language.split('-')[0];
      return this.translations[lang] ? lang : 'zh';
    }
    return 'zh';
  }

  setLocale(locale: string) {
    if (this.translations[locale]) {
      this.currentLocale = locale;
    }
  }

  getLocale(): string {
    return this.currentLocale;
  }

  t(key: string, options: any = {}): string {
    const keys = key.split('.');
    let value = this.translations[this.currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // 回退到默认语言
        value = this.translations[this.fallbackLocale];
        for (const fallbackKey of keys) {
          if (value && typeof value === 'object' && fallbackKey in value) {
            value = value[fallbackKey];
          } else {
            return key; // 如果都找不到，返回key本身
          }
        }
        break;
      }
    }
    
    if (typeof value === 'string') {
      // 简单的模板替换
      return value.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        const optionValue = options[key];
        return optionValue !== undefined ? optionValue.toString() : match;
      });
    }
    
    return key;
  }
}

const i18n = new SimpleI18n();

// 存储键
const LANGUAGE_STORAGE_KEY = '@app_language';

// 支持的语言列表
export const SUPPORTED_LANGUAGES = [
  { code: 'zh', name: '中文', nativeName: '中文' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
];

// 获取设备语言
const getDeviceLanguage = (): string => {
  try {
    // 使用简单的语言检测
    if (typeof navigator !== 'undefined' && navigator.language) {
      const deviceLanguage = navigator.language.split('-')[0];
      // 检查是否支持该语言
      const supportedLanguage = SUPPORTED_LANGUAGES.find(
        lang => lang.code === deviceLanguage
      );
      return supportedLanguage ? deviceLanguage : 'zh';
    }
  } catch (error) {
    console.warn('Failed to detect device language:', error);
  }
  return 'zh';
};

// 初始化语言设置
export const initializeLanguage = async (): Promise<string> => {
  try {
    // 尝试从存储中获取用户设置的语言
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    
    if (savedLanguage && SUPPORTED_LANGUAGES.some(lang => lang.code === savedLanguage)) {
      i18n.setLocale(savedLanguage);
      return savedLanguage;
    }
    
    // 如果没有保存的语言，使用设备语言
    const deviceLanguage = getDeviceLanguage();
    i18n.setLocale(deviceLanguage);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, deviceLanguage);
    return deviceLanguage;
  } catch (error) {
    console.warn('初始化语言设置失败:', error);
    i18n.setLocale('zh');
    return 'zh';
  }
};

// 切换语言
export const changeLanguage = async (languageCode: string): Promise<void> => {
  try {
    if (SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode)) {
      i18n.setLocale(languageCode);
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    } else {
      throw new Error(`不支持的语言代码: ${languageCode}`);
    }
  } catch (error) {
    console.error('切换语言失败:', error);
    throw error;
  }
};

// 获取当前语言
export const getCurrentLanguage = (): string => {
  return i18n.getLocale();
};

// 获取当前语言信息
export const getCurrentLanguageInfo = () => {
  const currentLang = getCurrentLanguage();
  return SUPPORTED_LANGUAGES.find(lang => lang.code === currentLang) || SUPPORTED_LANGUAGES[0];
};

// 翻译函数
export const t = (key: string, options?: any): string => {
  return i18n.t(key, options);
};

// 格式化数字
export const formatNumber = (number: number, options?: Intl.NumberFormatOptions): string => {
  const locale = getCurrentLanguage();
  const localeMap: { [key: string]: string } = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };
  
  return new Intl.NumberFormat(localeMap[locale] || 'zh-CN', options).format(number);
};

// 格式化日期
export const formatDate = (date: Date, options?: Intl.DateTimeFormatOptions): string => {
  const locale = getCurrentLanguage();
  const localeMap: { [key: string]: string } = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };
  
  return new Intl.DateTimeFormat(localeMap[locale] || 'zh-CN', defaultOptions).format(date);
};

// 格式化相对时间
export const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) {
    return t('time.yearsAgo', { count: years });
  } else if (months > 0) {
    return t('time.monthsAgo', { count: months });
  } else if (weeks > 0) {
    return t('time.weeksAgo', { count: weeks });
  } else if (days > 0) {
    return t('time.daysAgo', { count: days });
  } else if (hours > 0) {
    return t('time.hoursAgo', { count: hours });
  } else if (minutes > 0) {
    return t('time.minutesAgo', { count: minutes });
  } else {
    return t('time.justNow');
  }
};

// 复数处理
export const pluralize = (count: number, key: string): string => {
  const locale = getCurrentLanguage();
  
  // 中文、日文、韩文没有复数形式
  if (['zh', 'ja', 'ko'].includes(locale)) {
    return t(key, { count });
  }
  
  // 英文复数处理
  if (locale === 'en') {
    const pluralKey = count === 1 ? `${key}.one` : `${key}.other`;
    return t(pluralKey, { count });
  }
  
  return t(key, { count });
};

// 货币格式化
export const formatCurrency = (amount: number, currency: string = 'CNY'): string => {
  const locale = getCurrentLanguage();
  const localeMap: { [key: string]: string } = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
  };
  
  return new Intl.NumberFormat(localeMap[locale] || 'zh-CN', {
    style: 'currency',
    currency,
  }).format(amount);
};

// 检查是否为RTL语言
export const isRTL = (): boolean => {
  const locale = getCurrentLanguage();
  const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
  return rtlLanguages.includes(locale);
};

// 获取文本方向
export const getTextDirection = (): 'ltr' | 'rtl' => {
  return isRTL() ? 'rtl' : 'ltr';
};

export default i18n;
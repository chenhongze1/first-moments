import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useI18n, useTranslation, useFormatting } from '../../contexts/I18nContext';
import { colors, fontSize, fontWeight, spacing } from '../../styles';

// 国际化功能演示组件
const I18nDemo: React.FC = () => {
  const {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isRTL,
    textDirection,
    isLoading,
  } = useI18n();
  const { t } = useTranslation();
  const { formatDate, formatNumber, formatRelativeTime, formatCurrency } = useFormatting();
  
  const [demoDate] = useState(new Date());
  const [demoNumber] = useState(12345.67);
  const [demoCurrency] = useState(99.99);
  const [pastDate] = useState(new Date(Date.now() - 2 * 60 * 60 * 1000)); // 2小时前

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await changeLanguage(languageCode);
    } catch (error) {
      Alert.alert(
        t('common.error'),
        t('settings.languageChangeError')
      );
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: fontSize['2xl'],
      fontWeight: fontWeight.bold,
      color: colors.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xl,
    },
    section: {
      marginBottom: spacing.xl,
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
      marginBottom: spacing.md,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    infoLabel: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: fontSize.base,
      color: colors.textPrimary,
      fontWeight: fontWeight.medium,
    },
    languageGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    languageButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      minWidth: 80,
      alignItems: 'center',
    },
    selectedLanguageButton: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    languageButtonText: {
      fontSize: fontSize.sm,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
    },
    selectedLanguageButtonText: {
      color: colors.white,
    },
    formatExample: {
      backgroundColor: colors.backgroundSecondary,
      padding: spacing.md,
      borderRadius: 8,
      marginTop: spacing.sm,
    },
    formatLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    formatValue: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
      fontFamily: 'monospace',
    },
    rtlIndicator: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'center',
      padding: spacing.md,
      backgroundColor: isRTL ? colors.warning : colors.success,
      borderRadius: 8,
      marginTop: spacing.sm,
    },
    rtlText: {
      fontSize: fontSize.base,
      color: colors.white,
      fontWeight: fontWeight.medium,
      marginLeft: isRTL ? 0 : spacing.sm,
      marginRight: isRTL ? spacing.sm : 0,
    },
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: 12,
    },
    loadingText: {
      fontSize: fontSize.base,
      color: colors.white,
      fontWeight: fontWeight.medium,
    },
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>{t('demo.i18nTitle')}</Text>

      {/* 当前语言信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('demo.currentLanguageInfo')}</Text>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('settings.language')}:</Text>
          <Text style={styles.infoValue}>{currentLanguage}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('demo.textDirection')}:</Text>
          <Text style={styles.infoValue}>{textDirection.toUpperCase()}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>{t('demo.isRTL')}:</Text>
          <Text style={styles.infoValue}>{isRTL ? t('common.yes') : t('common.no')}</Text>
        </View>

        {/* RTL 演示 */}
        <View style={styles.rtlIndicator}>
          <Text style={styles.rtlText}>→</Text>
          <Text style={styles.rtlText}>{t('demo.rtlDemo')}</Text>
          <Text style={styles.rtlText}>←</Text>
        </View>
      </View>

      {/* 语言切换 */}
      <View style={styles.section}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        )}
        
        <Text style={styles.sectionTitle}>{t('demo.languageSwitcher')}</Text>
        
        <View style={styles.languageGrid}>
          {supportedLanguages.map((language) => {
            const isSelected = language.code === currentLanguage;
            
            return (
              <TouchableOpacity
                key={language.code}
                style={[
                  styles.languageButton,
                  isSelected && styles.selectedLanguageButton,
                ]}
                onPress={() => handleLanguageChange(language.code)}
                disabled={isLoading}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={`${t('settings.selectLanguage')} ${language.nativeName}`}
                accessibilityState={{
                  selected: isSelected,
                  disabled: isLoading,
                }}
              >
                <Text
                  style={[
                    styles.languageButtonText,
                    isSelected && styles.selectedLanguageButtonText,
                  ]}
                >
                  {language.code.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 格式化演示 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('demo.formattingExamples')}</Text>
        
        {/* 日期格式化 */}
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.dateFormatting')}:</Text>
          <Text style={styles.formatValue}>{formatDate(demoDate)}</Text>
        </View>
        
        {/* 数字格式化 */}
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.numberFormatting')}:</Text>
          <Text style={styles.formatValue}>{formatNumber(demoNumber)}</Text>
        </View>
        
        {/* 货币格式化 */}
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.currencyFormatting')}:</Text>
          <Text style={styles.formatValue}>{formatCurrency(demoCurrency)}</Text>
        </View>
        
        {/* 相对时间格式化 */}
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.relativeTimeFormatting')}:</Text>
          <Text style={styles.formatValue}>{formatRelativeTime(pastDate)}</Text>
        </View>
      </View>

      {/* 翻译示例 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{t('demo.translationExamples')}</Text>
        
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.basicTranslation')}:</Text>
          <Text style={styles.formatValue}>{t('common.welcome')}</Text>
        </View>
        
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.pluralization')}:</Text>
          <Text style={styles.formatValue}>
            {t('demo.itemCount', { count: 1 })} / {t('demo.itemCount', { count: 5 })}
          </Text>
        </View>
        
        <View style={styles.formatExample}>
          <Text style={styles.formatLabel}>{t('demo.interpolation')}:</Text>
          <Text style={styles.formatValue}>
            {t('demo.greeting', { name: 'React Native' })}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

export default I18nDemo;
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useI18n, useTranslation } from '../contexts/I18nContext';
import { colors, fontSize, fontWeight, spacing } from '../styles';

interface LanguageSettingsScreenProps {
  navigation: any;
}

const LanguageSettingsScreen: React.FC<LanguageSettingsScreenProps> = ({ navigation }) => {
  const {
    currentLanguage,
    supportedLanguages,
    changeLanguage,
    isLoading,
    error,
    currentLanguageInfo,
  } = useI18n();
  const { t } = useTranslation();
  const [changingLanguage, setChangingLanguage] = useState<string | null>(null);

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isLoading) return;

    try {
      setChangingLanguage(languageCode);
      await changeLanguage(languageCode);
    } catch (err) {
      console.error('语言切换失败:', err);
    } finally {
      setChangingLanguage(null);
    }
  };

  const showLanguageInfo = () => {
    Alert.alert(
      t('settings.languageInfo'),
      t('settings.languageInfoDescription'),
      [
        {
          text: t('settings.deviceLanguage'),
          onPress: () => {
            Alert.alert(
              t('settings.deviceLanguage'),
              t('settings.deviceLanguageDescription')
            );
          },
        },
        { text: t('common.ok'), style: 'default' },
      ]
    );
  };

  const resetToDeviceLanguage = async () => {
    Alert.alert(
      t('settings.resetLanguage'),
      t('settings.resetLanguageConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.confirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              // 这里可以实现重置到设备语言的逻辑
              // 暂时重置到中文
              await changeLanguage('zh');
            } catch (err) {
              console.error('重置语言失败:', err);
            }
          },
        },
      ]
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.semibold,
      color: colors.textPrimary,
    },
    backButton: {
      padding: spacing.sm,
    },
    backButtonText: {
      fontSize: fontSize.lg,
      color: colors.primary,
    },
    infoButton: {
      padding: spacing.sm,
    },
    infoButtonText: {
      fontSize: fontSize.lg,
      color: colors.primary,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.textPrimary,
      marginBottom: spacing.md,
    },
    currentLanguageCard: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: spacing.lg,
    },
    currentLanguageLabel: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    currentLanguageName: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    currentLanguageNative: {
      fontSize: fontSize.base,
      color: colors.textPrimary,
    },
    languageList: {
      gap: spacing.sm,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    selectedLanguageItem: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    changingLanguageItem: {
      opacity: 0.6,
    },
    languageFlag: {
      fontSize: 24,
      marginRight: spacing.md,
    },
    languageInfo: {
      flex: 1,
    },
    languageName: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    selectedLanguageName: {
      color: colors.primary,
    },
    languageNativeName: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
    },
    selectedLanguageNativeName: {
      color: colors.primary,
    },
    checkmark: {
      fontSize: 20,
      color: colors.primary,
    },
    loadingText: {
      fontSize: fontSize.sm,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    actionButtons: {
      marginTop: spacing.xl,
      gap: spacing.md,
    },
    resetButton: {
      backgroundColor: colors.surface,
      padding: spacing.lg,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.error,
      alignItems: 'center',
    },
    resetButtonText: {
      fontSize: fontSize.base,
      fontWeight: fontWeight.medium,
      color: colors.error,
    },
    errorText: {
      fontSize: fontSize.sm,
      color: colors.error,
      textAlign: 'center',
      marginTop: spacing.md,
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{t('settings.language')}</Text>
        
        <TouchableOpacity
          style={styles.infoButton}
          onPress={showLanguageInfo}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={t('settings.languageInfo')}
        >
          <Text style={styles.infoButtonText}>ℹ</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 当前语言 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.currentLanguage')}</Text>
          <View style={styles.currentLanguageCard}>
            <Text style={styles.currentLanguageLabel}>
              {t('settings.selectedLanguage')}
            </Text>
            <Text style={styles.currentLanguageName}>
              {currentLanguageInfo.name}
            </Text>
            <Text style={styles.currentLanguageNative}>
              {currentLanguageInfo.nativeName}
            </Text>
          </View>
        </View>

        {/* 可用语言列表 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('settings.availableLanguages')}</Text>
          
          {error && (
            <Text style={styles.errorText}>
              {t('settings.languageError')}: {error}
            </Text>
          )}
          
          <View style={styles.languageList}>
            {supportedLanguages.map((language) => {
              const isSelected = language.code === currentLanguage;
              const isChanging = changingLanguage === language.code;
              
              return (
                <TouchableOpacity
                  key={language.code}
                  style={[
                    styles.languageItem,
                    isSelected && styles.selectedLanguageItem,
                    isChanging && styles.changingLanguageItem,
                  ]}
                  onPress={() => handleLanguageChange(language.code)}
                  disabled={isLoading || isChanging}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel={`${t('settings.selectLanguage')} ${language.nativeName}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isLoading || isChanging,
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
                  
                  {isChanging && (
                    <Text style={styles.loadingText}>{t('common.loading')}</Text>
                  )}
                  
                  {isSelected && !isChanging && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 操作按钮 */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.resetButton}
            onPress={resetToDeviceLanguage}
            disabled={isLoading}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={t('settings.resetLanguage')}
          >
            <Text style={styles.resetButtonText}>
              {t('settings.resetToDeviceLanguage')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default LanguageSettingsScreen;
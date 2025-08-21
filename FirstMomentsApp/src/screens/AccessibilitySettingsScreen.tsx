import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useAccessibility } from '../contexts/AccessibilityContext';
import { Screen } from '../components/Screen';
import { colors, fontSize, fontWeight, spacing } from '../styles';

interface AccessibilitySettingsScreenProps {
  navigation: any;
}

export const AccessibilitySettingsScreen: React.FC<AccessibilitySettingsScreenProps> = ({
  navigation,
}) => {
  const {
    screenReaderEnabled,
    reduceMotionEnabled,
    reduceTransparencyEnabled,
    highContrastEnabled,
    fontSize: currentFontSize,
    updateFontSize,
    toggleHighContrast,
    announceForAccessibility,
    getAccessibleColors,
    getAccessibleFontSizes,
  } = useAccessibility();

  const colors = getAccessibleColors();
  const fontSizes = getAccessibleFontSizes();

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large' | 'extra-large') => {
    updateFontSize(size);
    announceForAccessibility(`字体大小已更改为${{
      'small': '小',
      'medium': '中',
      'large': '大',
      'extra-large': '特大',
    }[size]}`);
  };

  const handleHighContrastToggle = () => {
    toggleHighContrast();
  };

  const showAccessibilityInfo = () => {
    Alert.alert(
      '无障碍功能说明',
      '这些设置可以帮助您更好地使用应用：\n\n' +
      '• 字体大小：调整应用中文字的大小\n' +
      '• 高对比度：增强文字和背景的对比度\n' +
      '• 屏幕阅读器：系统级别的语音朗读功能\n' +
      '• 减少动画：降低界面动画效果',
      [{ text: '了解', style: 'default' }],
      {
        cancelable: true,
      }
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xl,
    },
    title: {
      fontSize: fontSizes.title,
      fontWeight: fontWeight.bold,
      color: colors.text,
    },
    infoButton: {
      padding: spacing.sm,
      borderRadius: 20,
      backgroundColor: colors.primary,
    },
    infoButtonText: {
      color: '#FFFFFF',
      fontSize: fontSizes.small,
      fontWeight: fontWeight.medium,
    },
    section: {
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSizes.large,
      fontWeight: fontWeight.semibold,
      color: colors.text,
      marginBottom: spacing.md,
    },
    settingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    settingItemFocused: {
      borderColor: colors.focus,
      borderWidth: 2,
    },
    settingContent: {
      flex: 1,
      marginRight: spacing.md,
    },
    settingLabel: {
      fontSize: fontSizes.medium,
      fontWeight: fontWeight.medium,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    settingDescription: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      lineHeight: fontSizes.small * 1.4,
    },
    statusBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
      backgroundColor: colors.primary,
    },
    statusText: {
      fontSize: fontSizes.small,
      color: '#FFFFFF',
      fontWeight: fontWeight.medium,
    },
    fontSizeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: spacing.sm,
    },
    fontSizeButton: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    fontSizeButtonSelected: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    fontSizeButtonText: {
      fontSize: fontSizes.medium,
      color: colors.text,
      fontWeight: fontWeight.medium,
    },
    fontSizeButtonTextSelected: {
      color: '#FFFFFF',
    },
    systemSettingsNote: {
      padding: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderLeftWidth: 4,
      borderLeftColor: colors.warning,
      marginTop: spacing.md,
    },
    systemSettingsText: {
      fontSize: fontSizes.small,
      color: colors.textSecondary,
      lineHeight: fontSizes.small * 1.4,
    },
  });

  return (
    <Screen style={styles.container}>
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        accessible={true}
        accessibilityLabel="无障碍设置页面"
      >
        {/* 页面标题 */}
        <View style={styles.header}>
          <Text
            style={styles.title}
            accessible={true}
            accessibilityRole="header"
          >
            无障碍设置
          </Text>
          
          <TouchableOpacity
            style={styles.infoButton}
            onPress={showAccessibilityInfo}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="查看无障碍功能说明"
            accessibilityHint="双击查看详细说明"
          >
            <Text style={styles.infoButtonText}>说明</Text>
          </TouchableOpacity>
        </View>

        {/* 字体大小设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>显示设置</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>字体大小</Text>
              <Text style={styles.settingDescription}>
                调整应用中文字的显示大小
              </Text>
              
              <View style={styles.fontSizeOptions}>
                {(['small', 'medium', 'large', 'extra-large'] as const).map((size) => (
                  <TouchableOpacity
                    key={size}
                    style={[
                      styles.fontSizeButton,
                      currentFontSize === size && styles.fontSizeButtonSelected,
                    ]}
                    onPress={() => handleFontSizeChange(size)}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel={`字体大小 ${{
                      'small': '小',
                      'medium': '中',
                      'large': '大',
                      'extra-large': '特大',
                    }[size]}`}
                    accessibilityHint="双击选择此字体大小"
                    accessibilityState={{
                      selected: currentFontSize === size,
                    }}
                  >
                    <Text
                      style={[
                        styles.fontSizeButtonText,
                        currentFontSize === size && styles.fontSizeButtonTextSelected,
                        {
                          fontSize: {
                            'small': fontSizes.small,
                            'medium': fontSizes.medium,
                            'large': fontSizes.large,
                            'extra-large': fontSizes.extraLarge,
                          }[size],
                        },
                      ]}
                    >
                      {{
                        'small': '小',
                        'medium': '中',
                        'large': '大',
                        'extra-large': '特大',
                      }[size]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleHighContrastToggle}
            accessible={true}
            accessibilityRole="switch"
            accessibilityLabel="高对比度模式"
            accessibilityHint="双击切换高对比度模式"
            accessibilityState={{
              checked: highContrastEnabled,
            }}
          >
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>高对比度模式</Text>
              <Text style={styles.settingDescription}>
                增强文字和背景的对比度，提高可读性
              </Text>
            </View>
            
            <Switch
              value={highContrastEnabled}
              onValueChange={handleHighContrastToggle}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={highContrastEnabled ? '#FFFFFF' : colors.textSecondary}
              accessible={false} // 父容器已处理无障碍
            />
          </TouchableOpacity>
        </View>

        {/* 系统级设置状态 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>系统设置状态</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>屏幕阅读器</Text>
              <Text style={styles.settingDescription}>
                系统级别的语音朗读功能
              </Text>
            </View>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {screenReaderEnabled ? '已启用' : '未启用'}
              </Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>减少动画</Text>
              <Text style={styles.settingDescription}>
                降低界面动画和过渡效果
              </Text>
            </View>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {reduceMotionEnabled ? '已启用' : '未启用'}
              </Text>
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <Text style={styles.settingLabel}>减少透明度</Text>
              <Text style={styles.settingDescription}>
                降低界面透明度效果
              </Text>
            </View>
            
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>
                {reduceTransparencyEnabled ? '已启用' : '未启用'}
              </Text>
            </View>
          </View>

          <View style={styles.systemSettingsNote}>
            <Text style={styles.systemSettingsText}>
              💡 系统级设置需要在设备的「设置 {'>'} 辅助功能」中进行调整。这些状态会自动同步到应用中。
            </Text>
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
};

export default AccessibilitySettingsScreen;
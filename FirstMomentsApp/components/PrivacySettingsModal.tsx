import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useResponsive } from '../src/utils/responsive';

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowFriendRequests: boolean;
  showLocation: boolean;
  dataCollection: boolean;
  personalizedAds: boolean;
  shareAnalytics: boolean;
}

interface PrivacySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: PrivacySettings) => void;
  initialSettings: PrivacySettings;
}

const PrivacySettingsModal: React.FC<PrivacySettingsModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const colors = theme.colors;
  
  const [settings, setSettings] = useState<PrivacySettings>(initialSettings);

  const handleSave = () => {
    onSave(settings);
    Alert.alert('保存成功', '隐私设置已更新');
  };

  const updateSetting = <K extends keyof PrivacySettings>(
    key: K,
    value: PrivacySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderVisibilityOption = (value: 'public' | 'friends' | 'private', label: string) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        {
          backgroundColor: settings.profileVisibility === value ? colors.primary : colors.surface,
          borderColor: settings.profileVisibility === value ? colors.primary : colors.border,
        },
      ]}
      onPress={() => updateSetting('profileVisibility', value)}
    >
      <Text
        style={[
          styles.optionText,
          {
            color: settings.profileVisibility === value ? colors.white : colors.textPrimary,
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderSwitchItem = (
    key: keyof PrivacySettings,
    title: string,
    subtitle: string,
    value: boolean
  ) => (
    <View style={[styles.switchItem, { borderBottomColor: colors.border }]}>
      <View style={styles.switchContent}>
        <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.switchSubtitle, { color: colors.textSecondary }]}>
          {subtitle}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={(newValue) => updateSetting(key, newValue)}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={value ? colors.white : colors.textSecondary}
      />
    </View>
  );

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    container: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: responsiveUtils.wp(90),
      maxHeight: responsiveUtils.hp(80),
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.textPrimary,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 16,
    },
    optionsContainer: {
      flexDirection: 'row',
      gap: 8,
    },
    optionButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      borderWidth: 1,
      alignItems: 'center',
    },
    optionText: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
    switchItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 16,
      borderBottomWidth: 1,
    },
    switchContent: {
      flex: 1,
      marginRight: 16,
    },
    switchTitle: {
      fontSize: 16,
      fontWeight: '500' as const,
      marginBottom: 4,
    },
    switchSubtitle: {
      fontSize: 14,
    },
    footer: {
      flexDirection: 'row',
      padding: 20,
      gap: 12,
    },
    button: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 8,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      backgroundColor: colors.primary,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600' as const,
    },
    cancelButtonText: {
      color: colors.textPrimary,
    },
    saveButtonText: {
      color: colors.white,
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 头部 */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>隐私设置</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* 内容 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 个人资料可见性 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>个人资料可见性</Text>
              <Text style={styles.sectionSubtitle}>
                选择谁可以查看您的个人资料信息
              </Text>
              <View style={styles.optionsContainer}>
                {renderVisibilityOption('public', '公开')}
                {renderVisibilityOption('friends', '好友')}
                {renderVisibilityOption('private', '私密')}
              </View>
            </View>

            {/* 活动状态 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>活动状态</Text>
              {renderSwitchItem(
                'showOnlineStatus',
                '显示在线状态',
                '让好友知道您是否在线',
                settings.showOnlineStatus
              )}
              {renderSwitchItem(
                'allowFriendRequests',
                '允许好友请求',
                '其他用户可以向您发送好友请求',
                settings.allowFriendRequests
              )}
              {renderSwitchItem(
                'showLocation',
                '显示位置信息',
                '在时光记录中显示位置信息',
                settings.showLocation
              )}
            </View>

            {/* 数据与隐私 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>数据与隐私</Text>
              {renderSwitchItem(
                'dataCollection',
                '数据收集',
                '允许收集使用数据以改善服务',
                settings.dataCollection
              )}
              {renderSwitchItem(
                'personalizedAds',
                '个性化广告',
                '基于您的兴趣显示相关广告',
                settings.personalizedAds
              )}
              {renderSwitchItem(
                'shareAnalytics',
                '分享分析数据',
                '匿名分享使用统计以帮助改进应用',
                settings.shareAnalytics
              )}
            </View>
          </ScrollView>

          {/* 底部按钮 */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                取消
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={[styles.buttonText, styles.saveButtonText]}>
                保存
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PrivacySettingsModal;
export type { PrivacySettings };
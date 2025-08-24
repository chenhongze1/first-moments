import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useResponsive } from '../src/utils/responsive';

interface BackupSettings {
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  includePhotos: boolean;
  includeVideos: boolean;
  includeMessages: boolean;
  includeSettings: boolean;
  cloudProvider: 'icloud' | 'google' | 'local';
}

interface DataBackupModalProps {
  visible: boolean;
  initialSettings: BackupSettings;
  onClose: () => void;
  onSave: (settings: BackupSettings) => void;
}

const DataBackupModal: React.FC<DataBackupModalProps> = ({
  visible,
  initialSettings,
  onClose,
  onSave,
}) => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const [settings, setSettings] = useState<BackupSettings>(initialSettings);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string>('从未备份');

  const handleSave = () => {
    onSave(settings);
  };

  const handleManualBackup = async () => {
    setIsBackingUp(true);
    try {
      // 模拟备份过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      const now = new Date().toLocaleString('zh-CN');
      setLastBackupTime(now);
      Alert.alert('备份成功', '数据已成功备份到云端');
    } catch (error) {
      Alert.alert('备份失败', '备份过程中出现错误，请稍后重试');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreBackup = () => {
    Alert.alert(
      '恢复备份',
      '确定要从云端恢复数据吗？这将覆盖当前的本地数据。',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: () => {
            Alert.alert('恢复成功', '数据已从云端恢复');
          },
        },
      ]
    );
  };

  const frequencyOptions = [
    { value: 'daily', label: '每日' },
    { value: 'weekly', label: '每周' },
    { value: 'monthly', label: '每月' },
  ];

  const cloudProviders = [
    { value: 'icloud', label: 'iCloud', icon: 'cloud-outline' },
    { value: 'google', label: 'Google Drive', icon: 'logo-google' },
    { value: 'local', label: '本地存储', icon: 'phone-portrait-outline' },
  ];

  const styles = createStyles(theme, responsiveUtils);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>数据备份</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>保存</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 备份状态 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备份状态</Text>
            <View style={styles.statusCard}>
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>上次备份时间</Text>
                <Text style={styles.statusValue}>{lastBackupTime}</Text>
              </View>
              <TouchableOpacity
                style={[styles.backupButton, isBackingUp && styles.backupButtonDisabled]}
                onPress={handleManualBackup}
                disabled={isBackingUp}
              >
                {isBackingUp ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
                    <Text style={styles.backupButtonText}>立即备份</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.restoreButton} onPress={handleRestoreBackup}>
              <Ionicons name="cloud-download-outline" size={16} color={theme.colors.primary} />
              <Text style={styles.restoreButtonText}>恢复备份</Text>
            </TouchableOpacity>
          </View>

          {/* 自动备份设置 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自动备份</Text>
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>启用自动备份</Text>
              <Switch
                value={settings.autoBackup}
                onValueChange={(value) => setSettings({ ...settings, autoBackup: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.autoBackup ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            {settings.autoBackup && (
              <View style={styles.frequencyContainer}>
                <Text style={styles.settingLabel}>备份频率</Text>
                <View style={styles.frequencyOptions}>
                  {frequencyOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.frequencyOption,
                        settings.backupFrequency === option.value && styles.frequencyOptionSelected,
                      ]}
                      onPress={() => setSettings({ ...settings, backupFrequency: option.value as any })}
                      >
                        <Text
                          style={[
                            styles.frequencyOptionText,
                            settings.backupFrequency === option.value && styles.frequencyOptionTextSelected,
                          ]}
                        >
                          {option.label}
                        </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 备份内容 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>备份内容</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>照片</Text>
              <Switch
                value={settings.includePhotos}
                onValueChange={(value) => setSettings({ ...settings, includePhotos: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.includePhotos ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>视频</Text>
              <Switch
                value={settings.includeVideos}
                onValueChange={(value) => setSettings({ ...settings, includeVideos: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.includeVideos ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>消息记录</Text>
              <Switch
                value={settings.includeMessages}
                onValueChange={(value) => setSettings({ ...settings, includeMessages: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.includeMessages ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>

            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>应用设置</Text>
              <Switch
                value={settings.includeSettings}
                onValueChange={(value) => setSettings({ ...settings, includeSettings: value })}
                trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
                thumbColor={settings.includeSettings ? theme.colors.primary : theme.colors.textSecondary}
              />
            </View>
          </View>

          {/* 云端存储 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>存储位置</Text>
            {cloudProviders.map((provider) => (
              <TouchableOpacity
                key={provider.value}
                style={[
                  styles.providerOption,
                  settings.cloudProvider === provider.value && styles.providerOptionSelected,
                ]}
                onPress={() => setSettings({ ...settings, cloudProvider: provider.value as any })}
              >
                <View style={styles.providerInfo}>
                  <Ionicons
                    name={provider.icon as any}
                    size={20}
                    color={settings.cloudProvider === provider.value ? theme.colors.primary : theme.colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.providerLabel,
                      settings.cloudProvider === provider.value && styles.providerLabelSelected,
                    ]}
                  >
                    {provider.label}
                  </Text>
                </View>
                {settings.cloudProvider === provider.value && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const createStyles = (theme: any, responsiveUtils: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    closeButton: {
      padding: 4,
    },
    title: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
    },
    saveButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
    },
    saveButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    section: {
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: theme.colors.textPrimary,
      marginBottom: 12,
    },
    statusCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    statusInfo: {
      marginBottom: 16,
    },
    statusLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    statusValue: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: theme.colors.textPrimary,
    },
    backupButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.primary,
      borderRadius: 8,
      paddingVertical: 12,
      gap: 8,
    },
    backupButtonDisabled: {
      opacity: 0.6,
    },
    backupButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600' as const,
    },
    restoreButton: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.primary,
      gap: 8,
    },
    restoreButtonText: {
      color: theme.colors.primary,
      fontSize: 16,
      fontWeight: '600' as const,
    },
    settingItem: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    settingLabel: {
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    frequencyContainer: {
      marginTop: 16,
    },
    frequencyOptions: {
      flexDirection: 'row' as const,
      gap: 8,
      marginTop: 8,
    },
    frequencyOption: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
      alignItems: 'center' as const,
    },
    frequencyOptionSelected: {
      backgroundColor: theme.colors.primary + '20',
      borderColor: theme.colors.primary,
    },
    frequencyOptionText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
    },
    frequencyOptionTextSelected: {
      color: theme.colors.primary,
      fontWeight: '600' as const,
    },
    providerOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    providerOptionSelected: {
      borderColor: theme.colors.primary,
      backgroundColor: theme.colors.primary + '10',
    },
    providerInfo: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
    },
    providerLabel: {
      fontSize: 16,
      color: theme.colors.textPrimary,
    },
    providerLabelSelected: {
      color: theme.colors.primary,
      fontWeight: '600' as const,
    },
  });

export default DataBackupModal;
export type { BackupSettings };
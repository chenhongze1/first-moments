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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Dimensions } from 'react-native';

export interface ShareSettings {
  allowPublicSharing: boolean;
  allowFriendSharing: boolean;
  allowLocationSharing: boolean;
  autoShareToSocial: boolean;
  shareWithMetadata: boolean;
  watermarkEnabled: boolean;
  defaultSharePlatform: 'none' | 'wechat' | 'weibo' | 'qq' | 'instagram';
  shareQuality: 'original' | 'high' | 'medium' | 'low';
}

interface ShareSettingsModalProps {
  visible: boolean;
  initialSettings: ShareSettings;
  onClose: () => void;
  onSave: (settings: ShareSettings) => void;
}

const ShareSettingsModal: React.FC<ShareSettingsModalProps> = ({
  visible,
  initialSettings,
  onClose,
  onSave,
}) => {
  const colorScheme = useColorScheme();
  const theme = {
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#888888' : '#666666',
    border: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
    primary: '#007AFF',
  };
  const { width } = Dimensions.get('window');
  
  const [settings, setSettings] = useState<ShareSettings>(initialSettings);

  const handleSettingChange = (key: keyof ShareSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  const handleReset = () => {
    Alert.alert(
      '重置设置',
      '确定要重置所有分享设置为默认值吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '重置',
          style: 'destructive',
          onPress: () => {
            const defaultSettings: ShareSettings = {
              allowPublicSharing: false,
              allowFriendSharing: true,
              allowLocationSharing: false,
              autoShareToSocial: false,
              shareWithMetadata: true,
              watermarkEnabled: false,
              defaultSharePlatform: 'none',
              shareQuality: 'high',
            };
            setSettings(defaultSettings);
          },
        },
      ]
    );
  };

  const platformOptions = [
    { value: 'none', label: '无默认平台', icon: 'ban-outline' },
    { value: 'wechat', label: '微信', icon: 'chatbubble-outline' },
    { value: 'weibo', label: '微博', icon: 'logo-twitter' },
    { value: 'qq', label: 'QQ', icon: 'chatbubbles-outline' },
    { value: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  ];

  const qualityOptions = [
    { value: 'original', label: '原始质量', description: '保持原始分辨率，文件较大' },
    { value: 'high', label: '高质量', description: '适合大多数分享场景' },
    { value: 'medium', label: '中等质量', description: '平衡质量与文件大小' },
    { value: 'low', label: '低质量', description: '快速分享，文件较小' },
  ];

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modal: {
      backgroundColor: theme.background,
      borderRadius: 20,
      padding: 20,
      width: width * 0.9,
      maxHeight: '85%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 20,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.text,
    },
    closeButton: {
      padding: 5,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 10,
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    settingLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    settingDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    optionButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      marginBottom: 8,
    },
    selectedOption: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}10`,
    },
    optionContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    optionIcon: {
      marginRight: 10,
    },
    optionText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    optionDescription: {
      fontSize: 12,
      color: theme.textSecondary,
      marginTop: 2,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 20,
    },
    button: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
      marginHorizontal: 5,
    },
    saveButton: {
      backgroundColor: theme.primary,
    },
    resetButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    },
    buttonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    saveButtonText: {
      color: '#fff',
    },
    resetButtonText: {
      color: theme.text,
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
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>分享设置</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 基础分享设置 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>基础设置</Text>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>允许公开分享</Text>
                  <Text style={styles.settingDescription}>允许将内容分享到公开平台</Text>
                </View>
                <Switch
                  value={settings.allowPublicSharing}
                  onValueChange={(value) => handleSettingChange('allowPublicSharing', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>允许好友分享</Text>
                  <Text style={styles.settingDescription}>允许好友转发您的内容</Text>
                </View>
                <Switch
                  value={settings.allowFriendSharing}
                  onValueChange={(value) => handleSettingChange('allowFriendSharing', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>位置信息分享</Text>
                  <Text style={styles.settingDescription}>分享时包含位置信息</Text>
                </View>
                <Switch
                  value={settings.allowLocationSharing}
                  onValueChange={(value) => handleSettingChange('allowLocationSharing', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>自动分享到社交媒体</Text>
                  <Text style={styles.settingDescription}>发布内容时自动分享到默认平台</Text>
                </View>
                <Switch
                  value={settings.autoShareToSocial}
                  onValueChange={(value) => handleSettingChange('autoShareToSocial', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
            </View>

            {/* 高级设置 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>高级设置</Text>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>包含元数据</Text>
                  <Text style={styles.settingDescription}>分享时包含拍摄时间、设备等信息</Text>
                </View>
                <Switch
                  value={settings.shareWithMetadata}
                  onValueChange={(value) => handleSettingChange('shareWithMetadata', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.settingLabel}>添加水印</Text>
                  <Text style={styles.settingDescription}>在分享的图片上添加应用水印</Text>
                </View>
                <Switch
                  value={settings.watermarkEnabled}
                  onValueChange={(value) => handleSettingChange('watermarkEnabled', value)}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
            </View>

            {/* 默认分享平台 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>默认分享平台</Text>
              {platformOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.defaultSharePlatform === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSettingChange('defaultSharePlatform', option.value)}
                >
                  <View style={styles.optionContent}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={theme.text} 
                      style={styles.optionIcon}
                    />
                    <Text style={styles.optionText}>{option.label}</Text>
                  </View>
                  {settings.defaultSharePlatform === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 分享质量 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>分享质量</Text>
              {qualityOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.shareQuality === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSettingChange('shareQuality', option.value)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {settings.shareQuality === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 按钮 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.resetButton]}
                onPress={handleReset}
              >
                <Text style={[styles.buttonText, styles.resetButtonText]}>重置</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
              >
                <Text style={[styles.buttonText, styles.saveButtonText]}>保存</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default ShareSettingsModal;
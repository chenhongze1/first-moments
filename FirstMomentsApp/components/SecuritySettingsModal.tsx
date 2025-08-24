import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/contexts/ThemeContext';
import { useResponsive } from '../src/utils/responsive';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  biometricEnabled: boolean;
  autoLockEnabled: boolean;
  autoLockTime: number; // 分钟
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
}

interface SecuritySettingsModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (settings: SecuritySettings) => void;
  initialSettings: SecuritySettings;
}

const SecuritySettingsModal: React.FC<SecuritySettingsModalProps> = ({
  visible,
  onClose,
  onSave,
  initialSettings,
}) => {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const colors = theme.colors;
  
  const [settings, setSettings] = useState<SecuritySettings>(initialSettings);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSave = () => {
    onSave(settings);
    Alert.alert('保存成功', '安全设置已更新');
  };

  const updateSetting = <K extends keyof SecuritySettings>(
    key: K,
    value: SecuritySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert('错误', '请填写所有密码字段');
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('错误', '新密码和确认密码不匹配');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      Alert.alert('错误', '新密码长度至少为6位');
      return;
    }
    
    // 这里应该调用API来修改密码
    Alert.alert('成功', '密码修改成功', [
      {
        text: '确定',
        onPress: () => {
          setShowChangePassword(false);
          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        },
      },
    ]);
  };

  const renderSwitchItem = (
    key: keyof SecuritySettings,
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

  const renderAutoLockTimeSelector = () => {
    const timeOptions = [
      { label: '1分钟', value: 1 },
      { label: '5分钟', value: 5 },
      { label: '15分钟', value: 15 },
      { label: '30分钟', value: 30 },
      { label: '1小时', value: 60 },
    ];

    return (
      <View style={styles.timeSelector}>
        <Text style={[styles.timeSelectorTitle, { color: colors.textPrimary }]}>自动锁定时间</Text>
        <View style={styles.timeOptions}>
          {timeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeOption,
                {
                  backgroundColor: settings.autoLockTime === option.value ? colors.primary : colors.surface,
                  borderColor: settings.autoLockTime === option.value ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateSetting('autoLockTime', option.value)}
            >
              <Text
                style={[
                  styles.timeOptionText,
                  {
                    color: settings.autoLockTime === option.value ? colors.white : colors.textPrimary,
                  },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

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
      maxHeight: responsiveUtils.hp(85),
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
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 16,
      paddingHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: colors.textPrimary,
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
    timeSelector: {
      marginTop: 16,
    },
    timeSelectorTitle: {
      fontSize: 14,
      fontWeight: '500' as const,
      marginBottom: 12,
    },
    timeOptions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeOption: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 6,
      borderWidth: 1,
    },
    timeOptionText: {
      fontSize: 14,
      fontWeight: '500' as const,
    },
    passwordSection: {
      padding: 20,
    },
    inputContainer: {
      marginBottom: 16,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.textPrimary,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 12,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.surface,
    },
    passwordButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 16,
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
            <Text style={styles.headerTitle}>账户安全</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* 内容 */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {!showChangePassword ? (
              <>
                {/* 密码管理 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>密码管理</Text>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setShowChangePassword(true)}
                  >
                    <Text style={styles.actionButtonText}>修改密码</Text>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* 双重验证 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>双重验证</Text>
                  {renderSwitchItem(
                    'twoFactorEnabled',
                    '启用双重验证',
                    '登录时需要额外的验证步骤',
                    settings.twoFactorEnabled
                  )}
                  {renderSwitchItem(
                    'biometricEnabled',
                    '生物识别登录',
                    '使用指纹或面部识别快速登录',
                    settings.biometricEnabled
                  )}
                </View>

                {/* 自动锁定 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>自动锁定</Text>
                  {renderSwitchItem(
                    'autoLockEnabled',
                    '启用自动锁定',
                    '在指定时间后自动锁定应用',
                    settings.autoLockEnabled
                  )}
                  {settings.autoLockEnabled && renderAutoLockTimeSelector()}
                </View>

                {/* 安全通知 */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>安全通知</Text>
                  {renderSwitchItem(
                    'loginNotifications',
                    '登录通知',
                    '新设备登录时发送通知',
                    settings.loginNotifications
                  )}
                  {renderSwitchItem(
                    'suspiciousActivityAlerts',
                    '可疑活动警报',
                    '检测到异常活动时发送警报',
                    settings.suspiciousActivityAlerts
                  )}
                </View>
              </>
            ) : (
              /* 修改密码界面 */
              <View style={styles.passwordSection}>
                <TouchableOpacity
                  style={[styles.actionButton, { marginBottom: 20 }]}
                  onPress={() => setShowChangePassword(false)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                    <Text style={[styles.actionButtonText, { marginLeft: 8 }]}>返回</Text>
                  </View>
                </TouchableOpacity>

                <Text style={styles.sectionTitle}>修改密码</Text>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>当前密码</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, currentPassword: text }))}
                    secureTextEntry
                    placeholder="请输入当前密码"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>新密码</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, newPassword: text }))}
                    secureTextEntry
                    placeholder="请输入新密码（至少6位）"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>确认新密码</Text>
                  <TextInput
                    style={styles.input}
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData(prev => ({ ...prev, confirmPassword: text }))}
                    secureTextEntry
                    placeholder="请再次输入新密码"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={styles.passwordButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.cancelButton]}
                    onPress={() => {
                      setShowChangePassword(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                  >
                    <Text style={[styles.buttonText, styles.cancelButtonText]}>取消</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleChangePassword}
                  >
                    <Text style={[styles.buttonText, styles.saveButtonText]}>确认修改</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>

          {/* 底部按钮 - 只在非修改密码界面显示 */}
          {!showChangePassword && (
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
          )}
        </View>
      </View>
    </Modal>
  );
};

export default SecuritySettingsModal;
export type { SecuritySettings };
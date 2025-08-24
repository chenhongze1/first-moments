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
import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { Dimensions } from 'react-native';

export interface ExportSettings {
  includePhotos: boolean;
  includeVideos: boolean;
  includeMessages: boolean;
  includeSettings: boolean;
  includeContacts: boolean;
  exportFormat: 'json' | 'csv' | 'pdf';
  dateRange: 'all' | 'last_month' | 'last_year';
}

interface DataExportModalProps {
  visible: boolean;
  initialSettings: ExportSettings;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
}

const DataExportModal: React.FC<DataExportModalProps> = ({
  visible,
  initialSettings,
  onClose,
  onExport,
}) => {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];
  const { width } = Dimensions.get('window');
  const [settings, setSettings] = useState<ExportSettings>(initialSettings);
  const [isExporting, setIsExporting] = useState(false);

  const handleSettingChange = (key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    // 模拟导出过程
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        '导出成功',
        '数据已成功导出到您的设备。',
        [{ text: '确定', onPress: () => onExport(settings) }]
      );
    }, 3000);
  };

  const formatOptions = [
    { value: 'json', label: 'JSON格式', description: '适合开发者使用' },
    { value: 'csv', label: 'CSV格式', description: '适合Excel等表格软件' },
    { value: 'pdf', label: 'PDF格式', description: '适合打印和分享' },
  ];

  const dateRangeOptions = [
    { value: 'all', label: '全部数据' },
    { value: 'last_month', label: '最近一个月' },
    { value: 'last_year', label: '最近一年' },
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
      maxHeight: '80%',
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
      borderBottomColor: theme.icon,
    },
    settingLabel: {
      fontSize: 14,
      color: theme.text,
      flex: 1,
    },
    optionButton: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 15,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.icon,
      marginBottom: 8,
    },
    selectedOption: {
      borderColor: theme.tint,
      backgroundColor: `${theme.tint}10`,
    },
    optionText: {
      fontSize: 14,
      color: theme.text,
      fontWeight: '500',
    },
    optionDescription: {
      fontSize: 12,
      color: theme.icon,
      marginTop: 2,
    },
    exportButton: {
      backgroundColor: theme.tint,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    exportButtonDisabled: {
      backgroundColor: theme.icon,
    },
    exportButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    loadingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
      marginLeft: 10,
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
            <Text style={styles.title}>数据导出</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 导出内容选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>选择导出内容</Text>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>照片</Text>
                <Switch
                  value={settings.includePhotos}
                  onValueChange={(value) => handleSettingChange('includePhotos', value)}
                  trackColor={{ false: theme.icon, true: theme.tint }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>视频</Text>
                <Switch
                  value={settings.includeVideos}
                  onValueChange={(value) => handleSettingChange('includeVideos', value)}
                  trackColor={{ false: theme.icon, true: theme.tint }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>消息记录</Text>
                <Switch
                  value={settings.includeMessages}
                  onValueChange={(value) => handleSettingChange('includeMessages', value)}
                  trackColor={{ false: theme.icon, true: theme.tint }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>应用设置</Text>
                <Switch
                  value={settings.includeSettings}
                  onValueChange={(value) => handleSettingChange('includeSettings', value)}
                  trackColor={{ false: theme.icon, true: theme.tint }}
                />
              </View>
              
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>联系人</Text>
                <Switch
                  value={settings.includeContacts}
                  onValueChange={(value) => handleSettingChange('includeContacts', value)}
                  trackColor={{ false: theme.icon, true: theme.tint }}
                />
              </View>
            </View>

            {/* 导出格式选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>导出格式</Text>
              {formatOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.exportFormat === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSettingChange('exportFormat', option.value)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionText}>{option.label}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  {settings.exportFormat === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 时间范围选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>时间范围</Text>
              {dateRangeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    settings.dateRange === option.value && styles.selectedOption,
                  ]}
                  onPress={() => handleSettingChange('dateRange', option.value)}
                >
                  <Text style={styles.optionText}>{option.label}</Text>
                  {settings.dateRange === option.value && (
                    <Ionicons name="checkmark" size={20} color={theme.tint} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* 导出按钮 */}
            <TouchableOpacity
              style={[
                styles.exportButton,
                isExporting && styles.exportButtonDisabled,
              ]}
              onPress={handleExport}
              disabled={isExporting}
            >
              {isExporting ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.loadingText}>正在导出...</Text>
                </View>
              ) : (
                <Text style={styles.exportButtonText}>开始导出</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DataExportModal;
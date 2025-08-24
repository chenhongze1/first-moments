import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Dimensions } from 'react-native';

interface HelpFeedbackModalProps {
  visible: boolean;
  onClose: () => void;
}

const HelpFeedbackModal: React.FC<HelpFeedbackModalProps> = ({
  visible,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const theme = {
    background: colorScheme === 'dark' ? '#1a1a1a' : '#ffffff',
    text: colorScheme === 'dark' ? '#ffffff' : '#000000',
    textSecondary: colorScheme === 'dark' ? '#888888' : '#666666',
    border: colorScheme === 'dark' ? '#333333' : '#e0e0e0',
    primary: '#007AFF',
    cardBackground: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
  };
  const { width } = Dimensions.get('window');
  
  const [activeTab, setActiveTab] = useState<'help' | 'feedback'>('help');
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'general'>('general');
  const [feedbackText, setFeedbackText] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) {
      Alert.alert('提示', '请输入反馈内容');
      return;
    }

    // 模拟提交反馈
    Alert.alert(
      '提交成功',
      '感谢您的反馈！我们会认真处理您的建议。',
      [
        {
          text: '确定',
          onPress: () => {
            setFeedbackText('');
            setContactEmail('');
            onClose();
          },
        },
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert('错误', '无法打开链接');
    });
  };

  const helpItems = [
    {
      title: '如何创建美好时刻？',
      content: '点击首页的"+"按钮，选择照片或视频，添加描述和标签，即可创建您的美好时刻。',
      icon: 'add-circle-outline',
    },
    {
      title: '如何管理隐私设置？',
      content: '在个人资料页面点击"隐私设置"，您可以控制谁能看到您的内容、评论权限等。',
      icon: 'shield-outline',
    },
    {
      title: '如何备份我的数据？',
      content: '在设置中选择"数据备份"，可以将您的照片、视频和数据备份到云端。',
      icon: 'cloud-upload-outline',
    },
    {
      title: '如何添加好友？',
      content: '通过搜索用户名、扫描二维码或导入通讯录来添加好友。',
      icon: 'people-outline',
    },
    {
      title: '如何分享内容？',
      content: '点击内容右下角的分享按钮，可以分享到其他社交平台或发送给好友。',
      icon: 'share-outline',
    },
  ];

  const contactOptions = [
    {
      title: '官方网站',
      description: '访问我们的官方网站了解更多信息',
      icon: 'globe-outline',
      action: () => handleOpenLink('https://firstmoments.com'),
    },
    {
      title: '用户手册',
      description: '查看详细的使用说明和教程',
      icon: 'book-outline',
      action: () => handleOpenLink('https://firstmoments.com/help'),
    },
    {
      title: '在线客服',
      description: '与我们的客服团队实时沟通',
      icon: 'chatbubble-outline',
      action: () => Alert.alert('客服', '客服功能即将上线，敬请期待！'),
    },
    {
      title: '邮件联系',
      description: 'support@firstmoments.com',
      icon: 'mail-outline',
      action: () => handleOpenLink('mailto:support@firstmoments.com'),
    },
  ];

  const feedbackTypes = [
    { value: 'bug', label: '问题反馈', icon: 'bug-outline', color: '#FF3B30' },
    { value: 'feature', label: '功能建议', icon: 'bulb-outline', color: '#FF9500' },
    { value: 'general', label: '一般反馈', icon: 'chatbubble-outline', color: '#007AFF' },
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: theme.cardBackground,
      borderRadius: 10,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
    },
    activeTab: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.textSecondary,
    },
    activeTabText: {
      color: '#fff',
    },
    helpItem: {
      flexDirection: 'row',
      padding: 15,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 10,
    },
    helpIcon: {
      marginRight: 15,
      marginTop: 2,
    },
    helpContent: {
      flex: 1,
    },
    helpTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 5,
    },
    helpDescription: {
      fontSize: 14,
      color: theme.textSecondary,
      lineHeight: 20,
    },
    contactOption: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      backgroundColor: theme.cardBackground,
      borderRadius: 12,
      marginBottom: 10,
    },
    contactIcon: {
      marginRight: 15,
    },
    contactContent: {
      flex: 1,
    },
    contactTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 2,
    },
    contactDescription: {
      fontSize: 14,
      color: theme.textSecondary,
    },
    feedbackTypeContainer: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    feedbackTypeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      marginHorizontal: 3,
    },
    selectedFeedbackType: {
      borderColor: theme.primary,
      backgroundColor: `${theme.primary}10`,
    },
    feedbackTypeIcon: {
      marginRight: 5,
    },
    feedbackTypeText: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.text,
    },
    inputContainer: {
      marginBottom: 15,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: theme.text,
      backgroundColor: theme.cardBackground,
      textAlignVertical: 'top',
    },
    submitButton: {
      backgroundColor: theme.primary,
      paddingVertical: 15,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 10,
    },
    submitButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.text,
      marginBottom: 15,
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
            <Text style={styles.title}>帮助与反馈</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 标签页切换 */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'help' && styles.activeTab]}
              onPress={() => setActiveTab('help')}
            >
              <Text style={[styles.tabText, activeTab === 'help' && styles.activeTabText]}>
                帮助中心
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'feedback' && styles.activeTab]}
              onPress={() => setActiveTab('feedback')}
            >
              <Text style={[styles.tabText, activeTab === 'feedback' && styles.activeTabText]}>
                意见反馈
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {activeTab === 'help' ? (
              <>
                {/* 常见问题 */}
                <Text style={styles.sectionTitle}>常见问题</Text>
                {helpItems.map((item, index) => (
                  <View key={index} style={styles.helpItem}>
                    <Ionicons 
                      name={item.icon as any} 
                      size={24} 
                      color={theme.primary} 
                      style={styles.helpIcon}
                    />
                    <View style={styles.helpContent}>
                      <Text style={styles.helpTitle}>{item.title}</Text>
                      <Text style={styles.helpDescription}>{item.content}</Text>
                    </View>
                  </View>
                ))}

                {/* 联系我们 */}
                <Text style={[styles.sectionTitle, { marginTop: 20 }]}>联系我们</Text>
                {contactOptions.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.contactOption}
                    onPress={option.action}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={theme.primary} 
                      style={styles.contactIcon}
                    />
                    <View style={styles.contactContent}>
                      <Text style={styles.contactTitle}>{option.title}</Text>
                      <Text style={styles.contactDescription}>{option.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <>
                {/* 反馈类型选择 */}
                <Text style={styles.sectionTitle}>反馈类型</Text>
                <View style={styles.feedbackTypeContainer}>
                  {feedbackTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.feedbackTypeButton,
                        feedbackType === type.value && styles.selectedFeedbackType,
                      ]}
                      onPress={() => setFeedbackType(type.value as any)}
                    >
                      <Ionicons 
                        name={type.icon as any} 
                        size={16} 
                        color={feedbackType === type.value ? theme.primary : theme.textSecondary}
                        style={styles.feedbackTypeIcon}
                      />
                      <Text style={styles.feedbackTypeText}>{type.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* 反馈内容 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>反馈内容 *</Text>
                  <TextInput
                    style={[styles.textInput, { height: 120 }]}
                    placeholder="请详细描述您遇到的问题或建议..."
                    placeholderTextColor={theme.textSecondary}
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                    multiline
                    maxLength={500}
                  />
                </View>

                {/* 联系邮箱 */}
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>联系邮箱（可选）</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="您的邮箱地址，方便我们回复"
                    placeholderTextColor={theme.textSecondary}
                    value={contactEmail}
                    onChangeText={setContactEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {/* 提交按钮 */}
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleSubmitFeedback}
                >
                  <Text style={styles.submitButtonText}>提交反馈</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default HelpFeedbackModal;
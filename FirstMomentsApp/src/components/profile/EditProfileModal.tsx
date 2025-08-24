import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { responsive } from '../../utils/responsive';
import { spacing } from '../../styles';
import * as ImagePicker from 'expo-image-picker';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  joinDate: Date;
  stats: {
    moments: number;
    locations: number;
    achievements: number;
    followers: number;
  };
}

interface EditProfileModalProps {
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (updatedUser: Partial<UserProfile>) => void;
}

export default function EditProfileModal({ visible, user, onClose, onSave }: EditProfileModalProps) {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!formData.username.trim()) {
      Alert.alert('错误', '用户名不能为空');
      return;
    }

    if (!formData.email.trim()) {
      Alert.alert('错误', '邮箱不能为空');
      return;
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('错误', '请输入有效的邮箱地址');
      return;
    }

    setIsLoading(true);
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSave(formData);
      Alert.alert('成功', '个人资料已更新');
      onClose();
    } catch (error) {
      Alert.alert('错误', '更新失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相册权限来选择头像');
        return;
      }

      // 选择图片
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('错误', '选择图片失败');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // 请求权限
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('权限不足', '需要访问相机权限来拍摄头像');
        return;
      }

      // 拍摄照片
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setFormData(prev => ({
          ...prev,
          avatar: result.assets[0].uri,
        }));
      }
    } catch (error) {
      Alert.alert('错误', '拍摄照片失败');
    }
  };

  const showImagePicker = () => {
    Alert.alert(
      '选择头像',
      '请选择获取头像的方式',
      [
        { text: '从相册选择', onPress: handlePickImage },
        { text: '拍摄照片', onPress: handleTakePhoto },
        { text: '取消', style: 'cancel' },
      ]
    );
  };

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
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
          <Text style={styles.title}>编辑个人资料</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={isLoading}
          >
            <Text style={[styles.saveText, isLoading && styles.disabledText]}>
              {isLoading ? '保存中...' : '保存'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 头像编辑 */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={showImagePicker} style={styles.avatarContainer}>
              <Image source={{ uri: formData.avatar }} style={styles.avatar} />
              <View style={styles.avatarOverlay}>
                <Ionicons name="camera" size={24} color={colors.white} />
                <Text style={styles.avatarOverlayText}>更换头像</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* 表单字段 */}
          <View style={styles.formSection}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>用户名</Text>
              <TextInput
                style={styles.textInput}
                value={formData.username}
                onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
                placeholder="请输入用户名"
                placeholderTextColor={colors.textSecondary}
                maxLength={20}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>邮箱</Text>
              <TextInput
                style={styles.textInput}
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                placeholder="请输入邮箱地址"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>个人简介</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                placeholder="介绍一下自己吧..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.characterCount}>
                {formData.bio.length}/200
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.md,
  },
  cancelButton: {
    paddingVertical: spacing.xs,
  },
  cancelText: {
    fontSize: responsive.fontSize.md,
    color: colors.textSecondary,
  },
  title: {
    fontSize: responsive.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  saveButton: {
    paddingVertical: spacing.xs,
  },
  saveText: {
    fontSize: responsive.fontSize.md,
    fontWeight: '600',
    color: colors.primary,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: colors.primary,
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlayText: {
    color: colors.white,
    fontSize: responsive.fontSize.xs,
    marginTop: spacing.xs,
  },
  formSection: {
    padding: spacing.lg,
  },
  fieldGroup: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: responsive.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: responsive.fontSize.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioInput: {
    height: 100,
    paddingTop: spacing.md,
  },
  characterCount: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
});
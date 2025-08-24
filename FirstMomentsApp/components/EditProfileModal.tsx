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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Dimensions } from 'react-native';

export interface UserProfile {
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

export interface EditableProfile {
  name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  location: string;
  website: string;
  birthday: string;
  avatar: string;
}

interface EditProfileModalProps {
  visible: boolean;
  initialProfile: UserProfile;
  onClose: () => void;
  onSave: (profile: Partial<UserProfile>) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  initialProfile,
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
    cardBackground: colorScheme === 'dark' ? '#2a2a2a' : '#f8f9fa',
  };
  const { width } = Dimensions.get('window');
  
  const [profile, setProfile] = useState<EditableProfile>({
    name: initialProfile.username || '',
    username: initialProfile.username,
    email: initialProfile.email,
    phone: '',
    bio: initialProfile.bio,
    location: '',
    website: '',
    birthday: '',
    avatar: initialProfile.avatar,
  });

  const handleInputChange = (field: keyof EditableProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!profile.name.trim()) {
      Alert.alert('错误', '请输入姓名');
      return;
    }
    if (!profile.username.trim()) {
      Alert.alert('错误', '请输入用户名');
      return;
    }
    if (!profile.email.trim()) {
      Alert.alert('错误', '请输入邮箱');
      return;
    }
    
    // 转换为UserProfile格式
    const updatedProfile: Partial<UserProfile> = {
      username: profile.username,
      email: profile.email,
      bio: profile.bio,
      avatar: profile.avatar,
    };
    
    onSave(updatedProfile);
  };

  const handleAvatarChange = () => {
    Alert.alert(
      '更换头像',
      '选择头像来源',
      [
        { text: '取消', style: 'cancel' },
        { text: '拍照', onPress: () => Alert.alert('提示', '拍照功能开发中...') },
        { text: '相册', onPress: () => Alert.alert('提示', '相册功能开发中...') },
      ]
    );
  };

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
    avatarContainer: {
      alignItems: 'center',
      marginBottom: 20,
    },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.cardBackground,
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.cardBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    changeAvatarButton: {
      marginTop: 10,
      paddingVertical: 8,
      paddingHorizontal: 16,
      backgroundColor: theme.primary,
      borderRadius: 20,
    },
    changeAvatarText: {
      color: '#fff',
      fontSize: 14,
      fontWeight: '600',
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
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
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
    cancelButton: {
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
    cancelButtonText: {
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
            <Text style={styles.title}>编辑个人资料</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 头像 */}
            <View style={styles.avatarContainer}>
              {profile.avatar ? (
                <Image source={{ uri: profile.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={theme.textSecondary} />
                </View>
              )}
              <TouchableOpacity style={styles.changeAvatarButton} onPress={handleAvatarChange}>
                <Text style={styles.changeAvatarText}>更换头像</Text>
              </TouchableOpacity>
            </View>

            {/* 姓名 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>姓名 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入姓名"
                placeholderTextColor={theme.textSecondary}
                value={profile.name}
                onChangeText={(value) => handleInputChange('name', value)}
              />
            </View>

            {/* 用户名 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>用户名 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入用户名"
                placeholderTextColor={theme.textSecondary}
                value={profile.username}
                onChangeText={(value) => handleInputChange('username', value)}
                autoCapitalize="none"
              />
            </View>

            {/* 邮箱 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>邮箱 *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入邮箱"
                placeholderTextColor={theme.textSecondary}
                value={profile.email}
                onChangeText={(value) => handleInputChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* 手机号 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>手机号</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入手机号"
                placeholderTextColor={theme.textSecondary}
                value={profile.phone}
                onChangeText={(value) => handleInputChange('phone', value)}
                keyboardType="phone-pad"
              />
            </View>

            {/* 个人简介 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>个人简介</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="介绍一下自己..."
                placeholderTextColor={theme.textSecondary}
                value={profile.bio}
                onChangeText={(value) => handleInputChange('bio', value)}
                multiline
                maxLength={200}
              />
            </View>

            {/* 所在地 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>所在地</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入所在地"
                placeholderTextColor={theme.textSecondary}
                value={profile.location}
                onChangeText={(value) => handleInputChange('location', value)}
              />
            </View>

            {/* 个人网站 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>个人网站</Text>
              <TextInput
                style={styles.textInput}
                placeholder="请输入个人网站"
                placeholderTextColor={theme.textSecondary}
                value={profile.website}
                onChangeText={(value) => handleInputChange('website', value)}
                keyboardType="url"
                autoCapitalize="none"
              />
            </View>

            {/* 生日 */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>生日</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textSecondary}
                value={profile.birthday}
                onChangeText={(value) => handleInputChange('birthday', value)}
              />
            </View>

            {/* 按钮 */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
              >
                <Text style={[styles.buttonText, styles.cancelButtonText]}>取消</Text>
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

export default EditProfileModal;
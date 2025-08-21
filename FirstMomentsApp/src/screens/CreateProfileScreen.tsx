import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { createProfileAsync, clearError } from '../store/slices/profileSlice';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../styles';

interface CreateProfileData {
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  isDefault: boolean;
}

const CreateProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { isLoading, error } = useAppSelector((state) => state.profile);
  
  const [formData, setFormData] = useState<CreateProfileData>({
    name: '',
    description: '',
    avatar: '',
    coverImage: '',
    isDefault: false,
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name.trim()) {
      newErrors.name = '档案名称不能为空';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = '档案名称至少需要2个字符';
    } else if (formData.name.trim().length > 20) {
      newErrors.name = '档案名称不能超过20个字符';
    }
    
    if (formData.description && formData.description.length > 200) {
      newErrors.description = '描述不能超过200个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const profileData = {
        name: formData.name.trim(),
        description: formData.description?.trim() || undefined,
        avatar: formData.avatar?.trim() || undefined,
        coverImage: formData.coverImage?.trim() || undefined,
        isDefault: formData.isDefault,
      };
      
      await dispatch(createProfileAsync(profileData)).unwrap();
      Alert.alert('成功', '档案创建成功', [
        {
          text: '确定',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('创建档案失败:', error);
    }
  };

  const updateFormData = (field: keyof CreateProfileData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>创建档案</Text>
        <TouchableOpacity
          style={[styles.createButton, (!formData.name.trim() || isLoading) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!formData.name.trim() || isLoading}
        >
          <Text style={[styles.createButtonText, (!formData.name.trim() || isLoading) && styles.createButtonTextDisabled]}>
            {isLoading ? '创建中...' : '创建'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>
              档案名称 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.textInputError]}
              value={formData.name}
              onChangeText={(text) => updateFormData('name', text)}
              placeholder="请输入档案名称"
              maxLength={20}
              autoFocus
            />
            {errors.name ? (
              <Text style={styles.errorText}>{errors.name}</Text>
            ) : null}
            <Text style={styles.helperText}>
              {formData.name.length}/20 字符
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>描述</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, errors.description && styles.textInputError]}
              value={formData.description}
              onChangeText={(text) => updateFormData('description', text)}
              placeholder="请输入档案描述（可选）"
              multiline
              numberOfLines={4}
              maxLength={200}
              textAlignVertical="top"
            />
            {errors.description ? (
              <Text style={styles.errorText}>{errors.description}</Text>
            ) : null}
            <Text style={styles.helperText}>
              {(formData.description || '').length}/200 字符
            </Text>
          </View>
        </View>

        {/* 头像和封面 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>图片设置</Text>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>头像链接</Text>
            <TextInput
              style={styles.textInput}
              value={formData.avatar}
              onChangeText={(text) => updateFormData('avatar', text)}
              placeholder="请输入头像图片链接（可选）"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              支持 http:// 或 https:// 开头的图片链接
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>封面链接</Text>
            <TextInput
              style={styles.textInput}
              value={formData.coverImage}
              onChangeText={(text) => updateFormData('coverImage', text)}
              placeholder="请输入封面图片链接（可选）"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.helperText}>
              支持 http:// 或 https:// 开头的图片链接
            </Text>
          </View>
        </View>

        {/* 设置选项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>设置选项</Text>
          
          <View style={styles.switchField}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.fieldLabel}>设为默认档案</Text>
              <Text style={styles.helperText}>
                默认档案将在应用启动时自动选中
              </Text>
            </View>
            <Switch
              value={formData.isDefault}
              onValueChange={(value) => updateFormData('isDefault', value)}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={formData.isDefault ? colors.white : colors.textSecondary}
            />
          </View>
        </View>

        {/* 提示信息 */}
        <View style={styles.section}>
          <View style={styles.tipContainer}>
            <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.tipText}>
              创建档案后，您可以在档案详情页面进一步编辑和完善信息。
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  createButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  createButtonTextDisabled: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  field: {
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  required: {
    color: colors.error,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  textInputError: {
    borderColor: colors.error,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  helperText: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
  switchField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: spacing.md,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  tipText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.sm,
    flex: 1,
  },
});

export default CreateProfileScreen;
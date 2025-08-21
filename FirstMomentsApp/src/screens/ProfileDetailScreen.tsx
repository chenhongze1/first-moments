import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  TextInput,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import {
  updateProfileAsync,
  deleteProfileAsync,
  setCurrentProfile,
  clearError,
} from '../store/slices/profileSlice';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../styles';

interface Profile {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

type RootStackParamList = {
  ProfileDetail: { profileId: string };
};

type ProfileDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProfileDetail'>;
// type ProfileDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

const ProfileDetailScreen: React.FC = () => {
  const route = useRoute<ProfileDetailScreenRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  
  const { profileId } = route.params;
  const { profiles, isLoading, error } = useAppSelector((state) => state.profile);
  
  const profile = profiles.find(p => p.id === profileId);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({});
  const [profileType, setProfileType] = useState('self');
  const [privacy, setPrivacy] = useState('private');

  useEffect(() => {
    if (profile) {
      setEditedProfile({
        name: profile.name,
        description: profile.description,
        avatar: profile.avatar,
        coverImage: profile.coverImage,
      });
    }
  }, [profile]);

  useEffect(() => {
    if (error) {
      Alert.alert('错误', error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSave = async () => {
    if (!profile || !editedProfile.name?.trim()) {
      Alert.alert('错误', '档案名称不能为空');
      return;
    }

    try {
      await dispatch(updateProfileAsync({
        id: profile.id,
        data: editedProfile,
      })).unwrap();
      setIsEditing(false);
      Alert.alert('成功', '档案更新成功');
    } catch (error) {
      console.error('更新档案失败:', error);
    }
  };

  const handleDelete = () => {
    if (!profile) return;
    
    Alert.alert(
      '删除档案',
      `确定要删除档案"${profile.name}"吗？此操作不可撤销。`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              await dispatch(deleteProfileAsync(profile.id)).unwrap();
              navigation.goBack();
              Alert.alert('成功', '档案删除成功');
            } catch (error) {
              console.error('删除档案失败:', error);
            }
          },
        },
      ]
    );
  };

  const handleSetDefault = async () => {
    if (!profile) return;
    
    try {
      dispatch(setCurrentProfile(profile));
      Alert.alert('成功', '已设置为默认档案');
    } catch (error) {
      console.error('设置默认档案失败:', error);
    }
  };



  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>档案详情</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>档案不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>档案详情</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => {
            if (isEditing) {
              handleSave();
            } else {
              setIsEditing(true);
            }
          }}
        >
          <Text style={styles.editButtonText}>
            {isEditing ? '保存' : '编辑'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 封面图片 */}
        <View style={styles.coverContainer}>
          {profile.coverImage ? (
            <Image source={{ uri: profile.coverImage }} style={styles.coverImage} />
          ) : (
            <View style={styles.defaultCover}>
              <Ionicons name="person" size={60} color={colors.textSecondary} />
            </View>
          )}
          {profile.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>默认</Text>
            </View>
          )}
        </View>

        {/* 基本信息 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本信息</Text>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>档案名称</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editedProfile.name}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
                placeholder="请输入档案名称"
              />
            ) : (
              <Text style={styles.fieldValue}>{profile.name}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>描述</Text>
            {isEditing ? (
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={editedProfile.description}
                onChangeText={(text) => setEditedProfile({ ...editedProfile, description: text })}
                placeholder="请输入档案描述"
                multiline
                numberOfLines={3}
              />
            ) : (
              <Text style={styles.fieldValue}>
                {profile.description || '暂无描述'}
              </Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>档案ID</Text>
            <Text style={styles.fieldValue}>{profile.id}</Text>
          </View>
        </View>

        {/* 头像设置 */}
        {profile.avatar && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>头像</Text>
            
            <View style={styles.field}>
              <Image source={{ uri: profile.avatar }} style={styles.avatarImage} />
            </View>
          </View>
        )}

        {/* 操作按钮 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>操作</Text>
          
          {!profile.isDefault && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSetDefault}
            >
              <Ionicons name="star-outline" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>设为默认档案</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
              删除档案
            </Text>
          </TouchableOpacity>
        </View>

        {/* 创建时间 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>其他信息</Text>
          
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>创建时间</Text>
            <Text style={styles.fieldValue}>
              {new Date(profile.createdAt).toLocaleDateString('zh-CN')}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>更新时间</Text>
            <Text style={styles.fieldValue}>
              {new Date(profile.updatedAt).toLocaleDateString('zh-CN')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
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
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  editButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  coverContainer: {
    position: 'relative',
    height: 200,
    backgroundColor: colors.surface,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  defaultCover: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  defaultBadge: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
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
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 24,
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButtonText: {
    fontSize: fontSize.base,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  deleteButton: {
    borderBottomWidth: 0,
  },
  deleteButtonText: {
    color: colors.error,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    resizeMode: 'cover',
  },
});

export default ProfileDetailScreen;
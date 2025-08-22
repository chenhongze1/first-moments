import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { fetchProfilesAsync, deleteProfileAsync, setCurrentProfile } from '../store/slices/profileSlice';
import { OptimizedFlatList } from '../components/VirtualizedList';
import { colors, spacing, fontSize, fontWeight } from '../styles';

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

interface ProfileListScreenProps {
  navigation: any;
}

export const ProfileListScreen: React.FC<ProfileListScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { profiles, isLoading, error } = useAppSelector((state) => state.profile);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      await dispatch(fetchProfilesAsync()).unwrap();
    } catch (error) {
      Alert.alert('错误', '加载档案列表失败');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfiles();
    setRefreshing(false);
  };

  const handleCreateProfile = () => {
    navigation.navigate('CreateProfile');
  };

  const handleProfilePress = (profile: Profile) => {
    dispatch(setCurrentProfile(profile));
    navigation.navigate('ProfileDetail', { profileId: profile.id });
  };

  const handleEditProfile = (profile: Profile) => {
    navigation.navigate('EditProfile', { profileId: profile.id });
  };

  const handleDeleteProfile = (profile: Profile) => {
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
              Alert.alert('成功', '档案已删除');
            } catch (error) {
              Alert.alert('错误', '删除档案失败');
            }
          },
        },
      ]
    );
  };

  const renderProfileItem = ({ item }: { item: Profile }) => (
    <TouchableOpacity
      style={styles.profileCard}
      onPress={() => handleProfilePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.profileHeader}>
        <View style={styles.profileInfo}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Ionicons name="person" size={24} color={colors.gray500} />
            </View>
          )}
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{item.name}</Text>
            {item.description && (
              <Text style={styles.profileDescription} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.profileDate}>
              创建于 {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View style={styles.profileActions}>
          {item.isDefault && (
            <View style={styles.defaultBadge}>
              <Text style={styles.defaultBadgeText}>默认</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditProfile(item)}
          >
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteProfile(item)}
          >
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="folder-open-outline" size={64} color={colors.gray400} />
      <Text style={styles.emptyTitle}>还没有档案</Text>
      <Text style={styles.emptyDescription}>
        创建您的第一个档案，开始记录美好时光
      </Text>
      <TouchableOpacity style={styles.createButton} onPress={handleCreateProfile}>
        <Ionicons name="add" size={24} color={colors.white} />
        <Text style={styles.createButtonText}>创建档案</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的档案</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateProfile}>
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {profiles.length === 0 && !isLoading ? (
        renderEmptyState()
      ) : (
        <OptimizedFlatList
          data={profiles}
          renderItem={renderProfileItem}
          keyExtractor={(item) => item.id}
          config={{
            itemHeight: 100,
            windowSize: 8,
            initialNumToRender: 6,
            maxToRenderPerBatch: 4,
            updateCellsBatchingPeriod: 50,
            removeClippedSubviews: true,
          }}
          contentContainerStyle={styles.listContainer}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  headerTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: spacing.lg,
  },
  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: colors.gray900,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  profileInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: spacing.md,
  },
  defaultAvatar: {
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    flex: 1,
  },
  profileName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  profileDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  profileDate: {
    fontSize: fontSize.xs,
    color: colors.textTertiary,
  },
  profileActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  defaultBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    marginRight: spacing.sm,
  },
  defaultBadgeText: {
    fontSize: fontSize.xs,
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 25,
  },
  createButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
});
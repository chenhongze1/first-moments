import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchProfilesAsync } from '../store/slices/profileSlice';
import { fetchUserAchievementsAsync } from '../store/slices/achievementSlice';
import { Screen } from '../components/Screen';
import { Button } from '../components/Button';
import I18nDemo from '../components/ui/I18nDemo';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { colors, fontSize, fontWeight, spacing, textStyles } from '../styles';
import { MainTabParamList, RootStackParamList } from '../navigation/AppNavigator';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector(state => state.auth);
  const { profiles, isLoading: profilesLoading } = useAppSelector(state => state.profile);
  const { userAchievements, isLoading: achievementsLoading } = useAppSelector(state => state.achievement);
  const { showInfo } = useErrorHandler();

  useEffect(() => {
    // 加载用户档案和成就
    dispatch(fetchProfilesAsync());
    dispatch(fetchUserAchievementsAsync());
  }, [dispatch]);

  const handleCreateRecord = () => {
    navigation.navigate('Records', {
      screen: 'CreateMoment',
      params: { isEdit: false }
    });
  };

  const handleViewMap = () => {
    navigation.navigate('Map');
  };

  const handleViewAchievements = () => {
    navigation.navigate('Achievements');
  };

  const handleViewProfile = () => {
    navigation.navigate('Profile');
  };

  const handleViewRecords = () => {
    navigation.navigate('Records', {
      screen: 'MomentList'
    });
  };

  const handleViewStats = () => {
    navigation.navigate('Stats');
  };



  const defaultProfile = profiles.find(p => p.isDefault);
  const recentAchievements = userAchievements.slice(0, 3);

  return (
    <Screen safeArea={true} scrollable={true}>
      <View style={styles.container}>
        {/* 欢迎区域 */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            你好，{user?.username || '用户'}
          </Text>
          <Text style={styles.welcomeSubtext}>
            今天也要记录美好时光哦～
          </Text>
        </View>

        {/* 快速操作 */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={handleCreateRecord}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>📝</Text>
              </View>
              <Text style={styles.actionTitle}>创建记录</Text>
              <Text style={styles.actionSubtitle}>记录此刻的美好</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewMap}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>🗺️</Text>
              </View>
              <Text style={styles.actionTitle}>地图打卡</Text>
              <Text style={styles.actionSubtitle}>探索周边位置</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionCard} onPress={handleViewRecords}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>📚</Text>
              </View>
              <Text style={styles.actionTitle}>浏览记录</Text>
              <Text style={styles.actionSubtitle}>查看历史记录</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={handleViewStats}>
              <View style={styles.actionIcon}>
                <Text style={styles.actionIconText}>📊</Text>
              </View>
              <Text style={styles.actionTitle}>统计分析</Text>
              <Text style={styles.actionSubtitle}>数据趋势分析</Text>
            </TouchableOpacity>
          </View>
        </View>



        {/* 当前档案 */}
        {defaultProfile && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>当前档案</Text>
              <Button
                title="查看详情"
                variant="ghost"
                size="small"
                onPress={handleViewProfile}
              />
            </View>
            <View style={styles.profileCard}>
              <Text style={styles.profileName}>{defaultProfile.name}</Text>
              <Text style={styles.profileDescription}>
                {defaultProfile.description || '暂无描述'}
              </Text>
              <View style={styles.profileStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>记录数</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>0</Text>
                  <Text style={styles.statLabel}>打卡点</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userAchievements.length}</Text>
                  <Text style={styles.statLabel}>成就</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* 最近成就 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>最近成就</Text>
            <Button
              title="查看全部"
              variant="ghost"
              size="small"
              onPress={handleViewAchievements}
            />
          </View>
          {recentAchievements.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recentAchievements.map((achievement, index) => (
                <View key={index} style={styles.achievementCard}>
                  <Text style={styles.achievementIcon}>🏆</Text>
                  <Text style={styles.achievementTitle}>
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDate}>
                    {achievement.unlockedAt ? new Date(achievement.unlockedAt).toLocaleDateString() : ''}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>暂无成就</Text>
              <Text style={styles.emptyStateSubtext}>开始记录生活，解锁更多成就吧！</Text>
            </View>
          )}
        </View>

        {/* 今日提醒 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>今日提醒</Text>
          <View style={styles.reminderCard}>
            <Text style={styles.reminderText}>💡 记得记录今天的美好时光</Text>
          </View>
        </View>

        {/* 国际化演示 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>国际化功能演示</Text>
          <I18nDemo />
        </View>
      </View>


    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },

  welcomeSection: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },

  welcomeText: {
    ...textStyles.h2,
    marginBottom: spacing.xs,
  },

  welcomeSubtext: {
    ...textStyles.bodySecondary,
    textAlign: 'center',
  },

  quickActionsContainer: {
    marginBottom: spacing.xl,
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },

  actionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginHorizontal: spacing.xs,
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  actionIconText: {
    fontSize: 24,
  },

  actionTitle: {
    ...textStyles.body,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },

  actionSubtitle: {
    ...textStyles.caption,
    textAlign: 'center',
    color: colors.textSecondary,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  sectionTitle: {
    ...textStyles.h3,
  },

  profileCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  profileName: {
    ...textStyles.h3,
    marginBottom: spacing.xs,
  },

  profileDescription: {
    ...textStyles.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  statItem: {
    alignItems: 'center',
  },

  statValue: {
    ...textStyles.h3,
    color: colors.primary,
    marginBottom: spacing.xs,
  },

  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },

  achievementCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginRight: spacing.md,
    alignItems: 'center',
    minWidth: 120,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  achievementIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },

  achievementTitle: {
    ...textStyles.body,
    fontWeight: fontWeight.semibold,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },

  achievementDate: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  emptyState: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.xl,
    alignItems: 'center',
  },

  emptyStateText: {
    ...textStyles.body,
    fontWeight: fontWeight.semibold,
    marginBottom: spacing.xs,
  },

  emptyStateSubtext: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },

  reminderCard: {
    backgroundColor: colors.warning + '20',
    borderRadius: 12,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },

  reminderText: {
    ...textStyles.body,
    color: colors.warning,
  },


});
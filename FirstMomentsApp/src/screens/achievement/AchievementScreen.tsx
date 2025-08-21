import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '../../hooks';
import { fetchAchievementsAsync, fetchUserAchievementsAsync } from '../../store/slices/achievementSlice';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { colors, spacing, textStyles } from '../../styles';
import { AchievementCard } from '../../components/achievement/AchievementCard';
import { CategoryFilter } from '../../components/achievement/CategoryFilter';
import { AchievementStats } from '../../components/achievement/AchievementStats';

const getCategories = (userAchievements: any[]) => [
  { id: 'moments', name: '时光', icon: '⏰', count: userAchievements.filter(a => a.category === 'moments').length },
  { id: 'photos', name: '照片', icon: '📸', count: userAchievements.filter(a => a.category === 'photos').length },
  { id: 'videos', name: '视频', icon: '🎥', count: userAchievements.filter(a => a.category === 'videos').length },
  { id: 'locations', name: '地点', icon: '📍', count: userAchievements.filter(a => a.category === 'locations').length },
  { id: 'social', name: '社交', icon: '👥', count: userAchievements.filter(a => a.category === 'social').length },
  { id: 'time', name: '时间', icon: '⏱️', count: userAchievements.filter(a => a.category === 'time').length },
  { id: 'special', name: '特殊', icon: '⭐', count: userAchievements.filter(a => a.category === 'special').length },
];

interface AchievementScreenProps {
  navigation: any;
}

export const AchievementScreen: React.FC<AchievementScreenProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { achievements, userAchievements, isLoading, totalPoints } = useAppSelector(
    (state) => state.achievement
  );
  const { currentProfile } = useAppSelector((state) => state.profile);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      await Promise.all([
        dispatch(fetchAchievementsAsync()).unwrap(),
        dispatch(fetchUserAchievementsAsync()).unwrap(),
      ]);
    } catch (error) {
      console.error('加载成就失败:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAchievements();
    setRefreshing(false);
  };

  const filteredAchievements = userAchievements.filter((achievement) => {
    if (selectedCategory !== 'all' && achievement.category !== selectedCategory) {
      return false;
    }
    if (showUnlockedOnly && !achievement.isUnlocked) {
      return false;
    }
    return true;
  });

  const unlockedCount = userAchievements.filter(a => a.isUnlocked).length;
  const totalCount = userAchievements.length;
  const completionRate = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;
  const earnedPoints = userAchievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + (a.points || 0), 0);
  const categories = getCategories(userAchievements);

  const renderAchievementItem = ({ item }: { item: any }) => (
    <AchievementCard
      achievement={item}
      onPress={() => navigation.navigate('AchievementDetail', { achievementId: item.id })}
    />
  );

  if (isLoading && userAchievements.length === 0) {
    return (
      <Screen safeArea>
        <View style={styles.loadingContainer}>
          <LoadingSpinner size="large" />
          <Text style={styles.loadingText}>加载成就中...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 成就统计 */}
        <AchievementStats
          stats={{
            totalAchievements: totalCount,
            unlockedAchievements: unlockedCount,
            totalPoints: totalPoints,
            earnedPoints: earnedPoints,
            completionRate: completionRate,
            rank: 'bronze',
            nextRankPoints: 1000,
          }}
        />

        {/* 分类筛选 */}
        <CategoryFilter
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {/* 筛选选项 */}
        <View style={styles.filterOptions}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              showUnlockedOnly && styles.filterButtonActive,
            ]}
            onPress={() => setShowUnlockedOnly(!showUnlockedOnly)}
          >
            <Text
              style={[
                styles.filterButtonText,
                showUnlockedOnly && styles.filterButtonTextActive,
              ]}
            >
              {showUnlockedOnly ? '显示全部' : '仅显示已解锁'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 成就列表 */}
        <View style={styles.achievementList}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              成就列表 ({filteredAchievements.length})
            </Text>
          </View>

          {filteredAchievements.length > 0 ? (
            <FlatList
              data={filteredAchievements}
              renderItem={renderAchievementItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🏆</Text>
              <Text style={styles.emptyStateTitle}>暂无成就</Text>
              <Text style={styles.emptyStateText}>
                {showUnlockedOnly
                  ? '还没有解锁任何成就，快去创建时光记录吧！'
                  : '该分类下暂无成就'}
              </Text>
              {showUnlockedOnly && (
                <Button
                  title="开始记录"
                  onPress={() => navigation.navigate('CreateMoment')}
                  style={styles.emptyStateButton}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...textStyles.body,
    marginTop: spacing.md,
    color: colors.textSecondary,
  },
  filterOptions: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  filterButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterButtonText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  achievementList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  listTitle: {
    ...textStyles.h3,
  },
  separator: {
    height: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyStateTitle: {
    ...textStyles.h3,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...textStyles.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    marginTop: spacing.md,
  },
});
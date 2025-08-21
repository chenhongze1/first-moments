import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { FadeInView, SlideInView, AnimatedButton, AnimatedProgressBar } from '../../src/components/animations/AnimatedComponents';
import { useResponsive, responsive } from '../../src/utils/responsive';
import { fontSize, fontWeight, spacing, borderRadius, shadows } from '../../src/styles';

const { width, height } = Dimensions.get('window');

// 成就数据类型
interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  maxProgress: number;
  isUnlocked: boolean;
  category: 'moments' | 'location' | 'social' | 'time';
  reward: string;
  unlockedAt?: Date;
}

// 模拟成就数据
const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: '初次记录',
    description: '创建你的第一个时光记录',
    icon: 'camera-outline',
    progress: 1,
    maxProgress: 1,
    isUnlocked: true,
    category: 'moments',
    reward: '经验值 +10',
    unlockedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    title: '记录达人',
    description: '累计创建 50 个时光记录',
    icon: 'albums-outline',
    progress: 23,
    maxProgress: 50,
    isUnlocked: false,
    category: 'moments',
    reward: '专属头像框',
  },
  {
    id: '3',
    title: '探索者',
    description: '在 10 个不同地点打卡',
    icon: 'location-outline',
    progress: 7,
    maxProgress: 10,
    isUnlocked: false,
    category: 'location',
    reward: '地图主题',
  },
  {
    id: '4',
    title: '社交达人',
    description: '获得 100 个点赞',
    icon: 'heart-outline',
    progress: 45,
    maxProgress: 100,
    isUnlocked: false,
    category: 'social',
    reward: '特殊徽章',
  },
  {
    id: '5',
    title: '坚持不懈',
    description: '连续 7 天记录时光',
    icon: 'calendar-outline',
    progress: 4,
    maxProgress: 7,
    isUnlocked: false,
    category: 'time',
    reward: '连击特效',
  },
  {
    id: '6',
    title: '时光收藏家',
    description: '累计记录 365 天',
    icon: 'trophy-outline',
    progress: 89,
    maxProgress: 365,
    isUnlocked: false,
    category: 'time',
    reward: '黄金徽章',
  },
];

const categoryConfig = {
  moments: { name: '记录', color: '#FF6B6B', icon: 'camera' },
  location: { name: '地点', color: '#4ECDC4', icon: 'location' },
  social: { name: '社交', color: '#45B7D1', icon: 'people' },
  time: { name: '时间', color: '#96CEB4', icon: 'time' },
};

export default function AchievementsScreen() {
  const { theme } = useTheme();
  const responsiveUtils = useResponsive();
  const [achievements, setAchievements] = useState<Achievement[]>(mockAchievements);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const colors = theme.colors;
  const styles = createStyles(colors, responsiveUtils);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalProgress: 0,
  });

  useEffect(() => {
    calculateStats();
  }, [achievements]);

  const calculateStats = () => {
    const total = achievements.length;
    const unlocked = achievements.filter(a => a.isUnlocked).length;
    const totalProg = achievements.reduce((sum, a) => sum + (a.progress / a.maxProgress), 0);
    
    setStats({
      totalAchievements: total,
      unlockedAchievements: unlocked,
      totalProgress: Math.round((totalProg / total) * 100),
    });
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const renderProgressBar = (progress: number, maxProgress: number) => {
    const percentage = (progress / maxProgress) * 100;
    return (
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${percentage}%` }]} />
        <Text style={styles.progressText}>{progress}/{maxProgress}</Text>
      </View>
    );
  };

  const renderAchievementCard = (achievement: Achievement) => {
    const categoryInfo = categoryConfig[achievement.category];
    
    return (
      <TouchableOpacity
        key={achievement.id}
        style={[
          styles.achievementCard,
          achievement.isUnlocked && styles.unlockedCard
        ]}
        onPress={() => {
          Alert.alert(
            achievement.title,
            `${achievement.description}\n\n奖励: ${achievement.reward}${
              achievement.unlockedAt 
                ? `\n解锁时间: ${achievement.unlockedAt.toLocaleDateString()}`
                : ''
            }`
          );
        }}
      >
        <View style={styles.achievementHeader}>
          <View style={[
            styles.iconContainer,
            { backgroundColor: achievement.isUnlocked ? categoryInfo.color : colors.gray200 }
          ]}>
            <Ionicons 
              name={achievement.icon as any} 
              size={24} 
              color={achievement.isUnlocked ? colors.white : colors.textSecondary} 
            />
          </View>
          <View style={styles.achievementInfo}>
            <Text style={[
              styles.achievementTitle,
              !achievement.isUnlocked && styles.lockedText
            ]}>
              {achievement.title}
            </Text>
            <Text style={styles.achievementDescription}>
              {achievement.description}
            </Text>
          </View>
          {achievement.isUnlocked && (
            <Ionicons name="checkmark-circle" size={24} color={categoryInfo.color} />
          )}
        </View>
        
        {!achievement.isUnlocked && (
          <View style={styles.progressSection}>
            <AnimatedProgressBar
               progress={achievement.progress / achievement.maxProgress}
               height={8}
               backgroundColor={colors.border}
               progressColor={colors.primary}
             />
            <Text style={styles.progressText}>{achievement.progress}/{achievement.maxProgress}</Text>
          </View>
        )}
        
        <View style={styles.rewardSection}>
          <Text style={styles.rewardText}>🎁 {achievement.reward}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FadeInView>
        {/* 头部统计 */}
        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>成就系统</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.unlockedAchievements}</Text>
            <Text style={styles.statLabel}>已解锁</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalAchievements}</Text>
            <Text style={styles.statLabel}>总成就</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{stats.totalProgress}%</Text>
            <Text style={styles.statLabel}>完成度</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 分类筛选 */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContainer}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            selectedCategory === 'all' && styles.activeCategoryButton
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text style={[
            styles.categoryButtonText,
            selectedCategory === 'all' && styles.activeCategoryButtonText
          ]}>
            全部
          </Text>
        </TouchableOpacity>
        
        {Object.entries(categoryConfig).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.categoryButton,
              selectedCategory === key && styles.activeCategoryButton
            ]}
            onPress={() => setSelectedCategory(key)}
          >
            <Ionicons 
              name={config.icon as any} 
              size={16} 
              color={selectedCategory === key ? colors.white : colors.textSecondary}
              style={styles.categoryIcon}
            />
            <Text style={[
              styles.categoryButtonText,
              selectedCategory === key && styles.activeCategoryButtonText
            ]}>
              {config.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 成就列表 */}
      <ScrollView 
        style={styles.achievementsList}
        showsVerticalScrollIndicator={false}
      >
        {filteredAchievements.map(renderAchievementCard)}
        
        <View style={styles.bottomPadding} />
      </ScrollView>
      </FadeInView>
    </View>
  );
}

const createStyles = (colors: any, responsiveUtils: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: responsiveUtils.getSafeAreaPadding().top + responsive.spacing.lg,
    paddingBottom: responsive.spacing.lg,
    paddingHorizontal: responsiveUtils.getSafeAreaPadding().horizontal,
  },
  headerTitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xxxl : responsive.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
    marginBottom: responsive.spacing.lg,
  },
  statsContainer: {
    flexDirection: responsiveUtils.isSmallDevice ? 'column' : 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing.md,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xl : responsive.fontSize.lg,
    fontWeight: 'bold',
    color: colors.white,
  },
  statLabel: {
    fontSize: responsive.fontSize.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: responsive.spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.white,
    opacity: 0.3,
  },
  categoryScroll: {
    maxHeight: 60,
  },
  categoryContainer: {
    paddingHorizontal: responsiveUtils.getSafeAreaPadding().horizontal,
    paddingVertical: responsive.spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsive.spacing.md,
    paddingVertical: responsive.spacing.sm,
    marginRight: responsive.spacing.sm,
    borderRadius: responsive.borderRadius.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeCategoryButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryButtonText: {
    fontSize: responsive.fontSize.sm,
    color: colors.textSecondary,
  },
  activeCategoryButtonText: {
    color: colors.white,
    fontWeight: '600',
  },
  achievementsList: {
    flex: 1,
    paddingHorizontal: responsiveUtils.getSafeAreaPadding().horizontal,
  },
  achievementCard: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    padding: responsive.spacing.md,
    marginBottom: responsive.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    opacity: 0.7,
  },
  unlockedCard: {
    opacity: 1,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: responsiveUtils.isTablet ? 56 : 48,
    height: responsiveUtils.isTablet ? 56 : 48,
    borderRadius: responsiveUtils.isTablet ? 28 : 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsive.spacing.md,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: responsive.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.xs,
  },
  lockedText: {
    color: colors.textSecondary,
  },
  achievementDescription: {
    fontSize: responsive.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: responsive.fontSize.sm * 1.4,
  },
  progressSection: {
    marginBottom: responsive.spacing.sm,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    position: 'absolute',
    right: responsive.spacing.sm,
    top: -20,
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
  },
  rewardSection: {
    paddingTop: responsive.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardText: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: responsiveUtils.isTablet ? 120 : 100,
  },
});
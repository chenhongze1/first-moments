import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius } from '../../styles';
import { AnimatedProgressBar } from '../animations/AnimatedComponents';

interface AchievementStatsProps {
  stats: {
    totalAchievements: number;
    unlockedAchievements: number;
    totalPoints: number;
    earnedPoints: number;
    completionRate: number;
    rank?: string;
    nextRankPoints?: number;
  };
  style?: ViewStyle;
}

export const AchievementStats: React.FC<AchievementStatsProps> = ({
  stats,
  style,
}) => {
  const {
    totalAchievements,
    unlockedAchievements,
    totalPoints,
    earnedPoints,
    completionRate,
    rank,
    nextRankPoints,
  } = stats;

  const getRankIcon = (rank?: string) => {
    switch (rank) {
      case 'bronze':
        return '🥉';
      case 'silver':
        return '🥈';
      case 'gold':
        return '🥇';
      case 'platinum':
        return '💎';
      case 'diamond':
        return '💍';
      default:
        return '🌟';
    }
  };

  const getRankName = (rank?: string) => {
    switch (rank) {
      case 'bronze':
        return '青铜';
      case 'silver':
        return '白银';
      case 'gold':
        return '黄金';
      case 'platinum':
        return '铂金';
      case 'diamond':
        return '钻石';
      default:
        return '新手';
    }
  };

  const pointsToNextRank = nextRankPoints ? nextRankPoints - earnedPoints : 0;
  const nextRankProgress = nextRankPoints ? (earnedPoints / nextRankPoints) * 100 : 0;

  return (
    <View style={[styles.container, style]}>
      {/* 总体统计 */}
      <View style={styles.overallStats}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{unlockedAchievements}</Text>
          <Text style={styles.statLabel}>已解锁</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{totalAchievements}</Text>
          <Text style={styles.statLabel}>总成就</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round(completionRate)}%</Text>
          <Text style={styles.statLabel}>完成率</Text>
        </View>
      </View>

      {/* 完成进度条 */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>总体进度</Text>
          <Text style={styles.progressText}>
            {unlockedAchievements}/{totalAchievements}
          </Text>
        </View>
        <AnimatedProgressBar
          progress={completionRate / 100}
          height={8}
          backgroundColor={colors.border}
          progressColor={colors.primary}
          borderRadius={4}
        />
      </View>

      {/* 积分和等级 */}
      <View style={styles.pointsSection}>
        <View style={styles.pointsInfo}>
          <View style={styles.pointsRow}>
            <Text style={styles.pointsIcon}>💎</Text>
            <Text style={styles.pointsText}>
              {earnedPoints.toLocaleString()} / {totalPoints.toLocaleString()} 积分
            </Text>
          </View>
          
          {rank && (
            <View style={styles.rankInfo}>
              <Text style={styles.rankIcon}>{getRankIcon(rank)}</Text>
              <Text style={styles.rankText}>{getRankName(rank)}等级</Text>
            </View>
          )}
        </View>

        {/* 下一等级进度 */}
        {nextRankPoints && pointsToNextRank > 0 && (
          <View style={styles.nextRankSection}>
            <View style={styles.nextRankHeader}>
              <Text style={styles.nextRankLabel}>距离下一等级</Text>
              <Text style={styles.nextRankPoints}>
                还需 {pointsToNextRank.toLocaleString()} 积分
              </Text>
            </View>
            <AnimatedProgressBar
              progress={nextRankProgress / 100}
              height={6}
              backgroundColor={colors.border}
              progressColor={colors.warning}
              borderRadius={3}
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
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
  overallStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    ...textStyles.h2,
    color: colors.primary,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  statLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  progressSection: {
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    ...textStyles.body,
    fontWeight: '600',
  },
  progressText: {
    ...textStyles.body,
    color: colors.textSecondary,
  },
  pointsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  pointsInfo: {
    marginBottom: spacing.md,
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  pointsIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  pointsText: {
    ...textStyles.body,
    fontWeight: '600',
  },
  rankInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  rankText: {
    ...textStyles.body,
    color: colors.warning,
    fontWeight: '600',
  },
  nextRankSection: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  nextRankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nextRankLabel: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  nextRankPoints: {
    ...textStyles.caption,
    color: colors.warning,
    fontWeight: '600',
  },
});
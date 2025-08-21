import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors, spacing, textStyles, borderRadius } from '../../styles';
import { AnimatedProgressBar } from '../animations/AnimatedComponents';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface AchievementCardProps {
  achievement: Achievement;
  onPress?: () => void;
  style?: ViewStyle;
}

export const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  onPress,
  style,
}) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return '简单';
      case 'medium':
        return '中等';
      case 'hard':
        return '困难';
      default:
        return '未知';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        achievement.isUnlocked ? styles.unlockedContainer : styles.lockedContainer,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* 成就图标和基本信息 */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={[
            styles.icon,
            !achievement.isUnlocked && styles.lockedIcon
          ]}>
            {achievement.isUnlocked ? achievement.icon : '🔒'}
          </Text>
        </View>
        
        <View style={styles.info}>
          <View style={styles.titleRow}>
            <Text style={[
              styles.title,
              !achievement.isUnlocked && styles.lockedText
            ]}>
              {achievement.title}
            </Text>
            <View style={[
              styles.difficultyBadge,
              { backgroundColor: getDifficultyColor(achievement.difficulty) }
            ]}>
              <Text style={styles.difficultyText}>
                {getDifficultyText(achievement.difficulty)}
              </Text>
            </View>
          </View>
          
          <Text style={[
            styles.description,
            !achievement.isUnlocked && styles.lockedText
          ]}>
            {achievement.description}
          </Text>
        </View>
      </View>

      {/* 进度条 */}
      {!achievement.isUnlocked && (
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressText}>
              进度: {achievement.progress.current}/{achievement.progress.total}
            </Text>
            <Text style={styles.progressPercentage}>
              {Math.round(achievement.progress.percentage)}%
            </Text>
          </View>
          <AnimatedProgressBar
            progress={achievement.progress.percentage / 100}
            height={6}
            backgroundColor={colors.border}
            progressColor={colors.primary}
            borderRadius={3}
          />
        </View>
      )}

      {/* 底部信息 */}
      <View style={styles.footer}>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsIcon}>💎</Text>
          <Text style={styles.pointsText}>{achievement.points} 积分</Text>
        </View>
        
        {achievement.isUnlocked && achievement.unlockedAt && (
          <Text style={styles.unlockedDate}>
            解锁于 {formatDate(achievement.unlockedAt)}
          </Text>
        )}
      </View>

      {/* 解锁状态指示器 */}
      {achievement.isUnlocked && (
        <View style={styles.unlockedIndicator}>
          <Text style={styles.unlockedIndicatorText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
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
    position: 'relative',
  },
  unlockedContainer: {
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  lockedContainer: {
    opacity: 0.7,
    borderLeftWidth: 4,
    borderLeftColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  title: {
    ...textStyles.h4,
    flex: 1,
    marginRight: spacing.sm,
  },
  description: {
    ...textStyles.body,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  lockedText: {
    opacity: 0.6,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  difficultyText: {
    ...textStyles.caption,
    color: colors.white,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  progressPercentage: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pointsIcon: {
    fontSize: 16,
    marginRight: spacing.xs,
  },
  pointsText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  unlockedDate: {
    ...textStyles.caption,
    color: colors.success,
  },
  unlockedIndicator: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedIndicatorText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
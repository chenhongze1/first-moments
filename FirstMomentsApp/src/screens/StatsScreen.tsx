import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../hooks';
import { Screen } from '../components/Screen';
import { colors, fontSize, fontWeight, spacing, textStyles } from '../styles';

const { width } = Dimensions.get('window');

interface StatCard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { moments } = useAppSelector(state => state.moment);
  const { userAchievements } = useAppSelector(state => state.achievement);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  // 计算统计数据
  const calculateStats = (): StatCard[] => {
    const now = new Date();
    const periodStart = new Date();
    
    switch (selectedPeriod) {
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }

    const periodMoments = moments.filter(moment => 
      new Date(moment.createdAt) >= periodStart
    );

    return [
      {
        title: '总记录数',
        value: moments.length,
        icon: 'document-text',
        color: colors.primary,
        trend: {
          value: periodMoments.length,
          isPositive: periodMoments.length > 0
        }
      },
      {
        title: '本期新增',
        value: periodMoments.length,
        icon: 'add-circle',
        color: colors.success,
        trend: {
          value: 12,
          isPositive: true
        }
      },
      {
        title: '解锁成就',
        value: userAchievements.length,
        icon: 'trophy',
        color: colors.warning,
        trend: {
          value: 2,
          isPositive: true
        }
      },
      {
        title: '打卡地点',
        value: new Set(moments.filter(m => m.location).map(m => m.location?.address)).size,
        icon: 'location',
        color: colors.error,
        trend: {
          value: 5,
          isPositive: true
        }
      }
    ];
  };

  const stats = calculateStats();

  const renderStatCard = (stat: StatCard) => (
    <View key={stat.title} style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
          <Ionicons name={stat.icon as any} size={24} color={stat.color} />
        </View>
        {stat.trend && (
          <View style={styles.trendContainer}>
            <Ionicons 
              name={stat.trend.isPositive ? 'trending-up' : 'trending-down'} 
              size={16} 
              color={stat.trend.isPositive ? colors.success : colors.error} 
            />
            <Text style={[
              styles.trendText,
              { color: stat.trend.isPositive ? colors.success : colors.error }
            ]}>
              {stat.trend.value}
            </Text>
          </View>
        )}
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statTitle}>{stat.title}</Text>
    </View>
  );

  const renderPeriodSelector = () => (
    <View style={styles.periodSelector}>
      {(['week', 'month', 'year'] as const).map(period => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            selectedPeriod === period && styles.periodButtonActive
          ]}
          onPress={() => setSelectedPeriod(period)}
        >
          <Text style={[
            styles.periodButtonText,
            selectedPeriod === period && styles.periodButtonTextActive
          ]}>
            {period === 'week' ? '本周' : period === 'month' ? '本月' : '本年'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderActivityChart = () => (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>活跃度趋势</Text>
      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart" size={48} color={colors.textSecondary} />
        <Text style={styles.chartPlaceholderText}>图表功能开发中</Text>
      </View>
    </View>
  );

  const renderMoodAnalysis = () => (
    <View style={styles.analysisContainer}>
      <Text style={styles.analysisTitle}>心情分析</Text>
      <View style={styles.moodGrid}>
        {['😊', '😢', '😴', '😍', '😤', '🤔'].map((emoji, index) => (
          <View key={index} style={styles.moodItem}>
            <Text style={styles.moodEmoji}>{emoji}</Text>
            <Text style={styles.moodCount}>{Math.floor(Math.random() * 10)}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <Screen safeArea={true}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>统计分析</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {renderPeriodSelector()}
          
          <View style={styles.statsGrid}>
            {stats.map(renderStatCard)}
          </View>

          {renderActivityChart()}
          
          {renderMoodAnalysis()}

          <View style={styles.insightsContainer}>
            <Text style={styles.insightsTitle}>数据洞察</Text>
            <View style={styles.insightCard}>
              <Ionicons name="bulb" size={20} color={colors.warning} />
              <Text style={styles.insightText}>
                你在{selectedPeriod === 'week' ? '本周' : selectedPeriod === 'month' ? '本月' : '本年'}记录了 {stats[1].value} 个美好时光！
              </Text>
            </View>
            <View style={styles.insightCard}>
              <Ionicons name="heart" size={20} color={colors.error} />
              <Text style={styles.insightText}>
                最常记录的心情是开心，继续保持积极的生活态度！
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Screen>
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    ...textStyles.h3,
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    borderRadius: 8,
    padding: 4,
    marginBottom: spacing.lg,
  },
  periodButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: 6,
  },
  periodButtonActive: {
    backgroundColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  periodButtonTextActive: {
    color: colors.textPrimary,
    fontWeight: fontWeight.semibold,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  statCard: {
    width: (width - spacing.md * 3) / 2,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    marginLeft: 2,
  },
  statValue: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
  },
  chartContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartPlaceholder: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  analysisContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analysisTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodItem: {
    width: (width - spacing.md * 4) / 3,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  moodCount: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  insightsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.gray50,
    borderRadius: 8,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  insightText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    marginLeft: spacing.sm,
    lineHeight: 20,
  },
});

export default StatsScreen;
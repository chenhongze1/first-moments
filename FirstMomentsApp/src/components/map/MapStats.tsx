import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { responsive } from '../../utils/responsive';
import { spacing } from '../../styles';

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface MapStatsProps {
  checkedInLocations: LocationData[];
  onViewHistory?: () => void;
}

const MapStats: React.FC<MapStatsProps> = ({
  checkedInLocations,
  onViewHistory,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  // 计算统计数据
  const totalCheckIns = checkedInLocations.length;
  const uniqueCities = new Set(
    checkedInLocations
      .map(location => location.address?.split(' ')[0])
      .filter(Boolean)
  ).size;
  const thisMonthCheckIns = checkedInLocations.filter(location => {
    // 这里可以根据实际的时间戳来计算
    return true; // 暂时返回所有
  }).length;

  const stats = [
    {
      id: 'total',
      title: '总打卡',
      value: totalCheckIns,
      icon: 'location',
      color: colors.primary,
    },
    {
      id: 'cities',
      title: '城市数',
      value: uniqueCities,
      icon: 'business',
      color: colors.secondary,
    },
    {
      id: 'month',
      title: '本月',
      value: thisMonthCheckIns,
      icon: 'calendar',
      color: colors.success,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>我的足迹</Text>
        {totalCheckIns > 0 && (
          <TouchableOpacity onPress={onViewHistory} style={styles.viewAllButton}>
            <Text style={styles.viewAllText}>查看全部</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View key={stat.id} style={styles.statItem}>
            <LinearGradient
              colors={[stat.color + '20', stat.color + '10']}
              style={styles.statIconContainer}
            >
              <Ionicons name={stat.icon as any} size={24} color={stat.color} />
            </LinearGradient>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {totalCheckIns === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="map-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>还没有足迹记录</Text>
          <Text style={styles.emptySubtitle}>开始你的第一次打卡吧！</Text>
        </View>
      )}
    </View>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    title: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    viewAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    viewAllText: {
      fontSize: responsive.fontSize.sm,
      color: colors.primary,
      marginRight: spacing.xs,
    },
    statsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
    },
    statItem: {
      alignItems: 'center',
      flex: 1,
    },
    statIconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      fontSize: responsive.fontSize.xl,
      fontWeight: 'bold',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    statTitle: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyTitle: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });

export default MapStats;
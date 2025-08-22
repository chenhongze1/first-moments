import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../contexts/ThemeContext';
import { responsive } from '../../utils/responsive';
import { spacing } from '../../styles';
import { FadeInView, SlideInView } from '../../components/animations/AnimatedComponents';
import { OptimizedFlatList } from '../../components/VirtualizedList';

interface CheckInRecord {
  id: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    name?: string;
  };
  category: string;
  description?: string;
  images: string[];
  timestamp: Date;
  weather?: {
    temperature: number;
    condition: string;
    icon: string;
  };
}

interface MapHistoryScreenProps {
  navigation: any;
}

const MapHistoryScreen: React.FC<MapHistoryScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = createStyles(colors);

  const [records, setRecords] = useState<CheckInRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'recent' | 'favorites'>('all');

  // 模拟数据
  const mockRecords: CheckInRecord[] = [
    {
      id: '1',
      location: {
        latitude: 39.9042,
        longitude: 116.4074,
        address: '北京市东城区天安门广场',
        name: '天安门广场',
      },
      category: '景点',
      description: '第一次来到首都北京，心情激动！',
      images: [],
      timestamp: new Date('2024-01-15T10:30:00'),
      weather: {
        temperature: 5,
        condition: '晴',
        icon: 'sunny',
      },
    },
    {
      id: '2',
      location: {
        latitude: 31.2304,
        longitude: 121.4737,
        address: '上海市黄浦区外滩',
        name: '外滩',
      },
      category: '城市地标',
      description: '夜景真的太美了！',
      images: [],
      timestamp: new Date('2024-01-10T19:45:00'),
      weather: {
        temperature: 12,
        condition: '多云',
        icon: 'partly-sunny',
      },
    },
  ];

  useEffect(() => {
    loadRecords();
  }, [filter]);

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      // 这里可以调用API获取打卡记录
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRecords(mockRecords);
    } catch (error) {
      console.error('加载记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '昨天';
    if (diffDays <= 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case '景点':
        return 'camera';
      case '餐厅':
        return 'restaurant';
      case '城市地标':
        return 'business';
      case '自然风光':
        return 'leaf';
      default:
        return 'location';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case '景点':
        return colors.primary;
      case '餐厅':
        return colors.warning;
      case '城市地标':
        return colors.secondary;
      case '自然风光':
        return colors.success;
      default:
        return colors.textSecondary;
    }
  };

  const renderRecord = ({ item, index }: { item: CheckInRecord; index: number }) => (
    <SlideInView delay={index * 100}>
      <TouchableOpacity
        style={styles.recordCard}
        onPress={() => {
          // 导航到记录详情页面
          console.log('查看记录详情:', item.id);
        }}
      >
        <View style={styles.recordHeader}>
          <View style={styles.locationInfo}>
            <View style={[
              styles.categoryIcon,
              { backgroundColor: getCategoryColor(item.category) + '20' }
            ]}>
              <Ionicons
                name={getCategoryIcon(item.category) as any}
                size={20}
                color={getCategoryColor(item.category)}
              />
            </View>
            <View style={styles.locationText}>
              <Text style={styles.locationName} numberOfLines={1}>
                {item.location.name || '未知地点'}
              </Text>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {item.location.address || '地址未知'}
              </Text>
            </View>
          </View>
          <View style={styles.timeInfo}>
            <Text style={styles.timeText}>{formatDate(item.timestamp)}</Text>
            {item.weather && (
              <View style={styles.weatherInfo}>
                <Ionicons
                  name={item.weather.icon as any}
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.weatherText}>{item.weather.temperature}°</Text>
              </View>
            )}
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.recordFooter}>
          <View style={styles.categoryTag}>
            <Text style={[
              styles.categoryText,
              { color: getCategoryColor(item.category) }
            ]}>
              {item.category}
            </Text>
          </View>
          {item.images.length > 0 && (
            <View style={styles.imageCount}>
              <Ionicons name="images" size={14} color={colors.textSecondary} />
              <Text style={styles.imageCountText}>{item.images.length}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </SlideInView>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="map-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>还没有打卡记录</Text>
      <Text style={styles.emptySubtitle}>开始探索世界，记录你的足迹吧！</Text>
    </View>
  );

  const filterOptions = [
    { key: 'all', label: '全部', icon: 'list' },
    { key: 'recent', label: '最近', icon: 'time' },
    { key: 'favorites', label: '收藏', icon: 'heart' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <FadeInView>
        {/* 头部 */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>打卡历史</Text>
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* 筛选器 */}
        <View style={styles.filterContainer}>
          {filterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.filterButton,
                filter === option.key && styles.filterButtonActive,
              ]}
              onPress={() => setFilter(option.key as any)}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={filter === option.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.filterText,
                  filter === option.key && styles.filterTextActive,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 记录列表 */}
        <OptimizedFlatList
          data={records}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id}
          config={{
            itemHeight: 120, // 估算每个记录卡片的高度
            windowSize: 8,
            initialNumToRender: 6,
            maxToRenderPerBatch: 4,
            updateCellsBatchingPeriod: 50,
            removeClippedSubviews: true,
          }}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onRefresh={onRefresh}
          refreshing={refreshing}
          emptyComponent={renderEmptyState()}
        />
      </FadeInView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: spacing.sm,
    },
    headerTitle: {
      fontSize: responsive.fontSize.xl,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    searchButton: {
      padding: spacing.sm,
    },
    filterContainer: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
    },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: responsive.borderRadius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.xs,
    },
    filterButtonActive: {
      backgroundColor: colors.primary + '10',
      borderColor: colors.primary,
    },
    filterText: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
    },
    filterTextActive: {
      color: colors.primary,
      fontWeight: '500',
    },
    list: {
      flex: 1,
    },
    listContent: {
      padding: spacing.lg,
      paddingTop: spacing.md,
    },
    recordCard: {
      backgroundColor: colors.surface,
      borderRadius: responsive.borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    recordHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    locationInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.md,
    },
    categoryIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacing.md,
    },
    locationText: {
      flex: 1,
    },
    locationName: {
      fontSize: responsive.fontSize.md,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    locationAddress: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
    },
    timeInfo: {
      alignItems: 'flex-end',
    },
    timeText: {
      fontSize: responsive.fontSize.sm,
      color: colors.textSecondary,
      marginBottom: spacing.xs,
    },
    weatherInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    weatherText: {
      fontSize: responsive.fontSize.xs,
      color: colors.textSecondary,
    },
    description: {
      fontSize: responsive.fontSize.sm,
      color: colors.textPrimary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    recordFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    categoryTag: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: responsive.borderRadius.sm,
      backgroundColor: colors.background,
    },
    categoryText: {
      fontSize: responsive.fontSize.xs,
      fontWeight: '500',
    },
    imageCount: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    imageCountText: {
      fontSize: responsive.fontSize.xs,
      color: colors.textSecondary,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: spacing.xl * 2,
    },
    emptyTitle: {
      fontSize: responsive.fontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    emptySubtitle: {
      fontSize: responsive.fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
    },
  });

export default MapHistoryScreen;
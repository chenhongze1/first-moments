import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  FlatList,
  VirtualizedList,
  View,
  StyleSheet,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  Text,
  ViewToken,
} from 'react-native';
import { colors, spacing } from '../styles';
import { memoryManager, MemoryOptimizer, useMemoryOptimization } from '../utils/memoryManager';
import { useRenderPerformance, useMemoryLeakDetection } from './ui/PerformanceMonitor';

const { height: screenHeight } = Dimensions.get('window');

// 虚拟化列表配置
interface VirtualizedListConfig {
  itemHeight: number;
  windowSize?: number;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  removeClippedSubviews?: boolean;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
}

// 优化的FlatList组件
interface OptimizedFlatListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactElement;
  keyExtractor: (item: T, index: number) => string;
  config?: VirtualizedListConfig;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  emptyComponent?: React.ReactElement;
  headerComponent?: React.ReactElement;
  footerComponent?: React.ReactElement;
  style?: any;
  contentContainerStyle?: any;
  horizontal?: boolean;
  numColumns?: number;
}

export function OptimizedFlatList<T>({
  data,
  renderItem,
  keyExtractor,
  config,
  onEndReached,
  onRefresh,
  refreshing = false,
  loading = false,
  emptyComponent,
  headerComponent,
  footerComponent,
  style,
  contentContainerStyle,
  horizontal = false,
  numColumns = 1,
}: OptimizedFlatListProps<T>) {
  const [isRefreshing, setIsRefreshing] = useState(refreshing);
  const [viewableItems, setViewableItems] = useState<ViewToken[]>([]);
  const flatListRef = useRef<FlatList<T>>(null);
  
  // 性能监控
  const { getStats } = useRenderPerformance('OptimizedFlatList');
  const { addListener, safeSetTimeout } = useMemoryLeakDetection('OptimizedFlatList');
  const { addCleanup, setCache, getCache } = useMemoryOptimization();

  // 缓存渲染项
  const itemCache = useRef<Map<string, React.ReactElement>>(new Map());
  const maxCacheSize = 50;

  // 默认配置
  const defaultConfig: VirtualizedListConfig = {
    itemHeight: 100,
    windowSize: 10,
    initialNumToRender: 10,
    maxToRenderPerBatch: 5,
    updateCellsBatchingPeriod: 50,
    removeClippedSubviews: true,
  };

  const finalConfig = { ...defaultConfig, ...config };

  // 优化的getItemLayout
  const getItemLayout = useCallback(
    (data: any, index: number) => {
      if (finalConfig.getItemLayout) {
        return finalConfig.getItemLayout(data, index);
      }
      return {
        length: finalConfig.itemHeight,
        offset: finalConfig.itemHeight * index,
        index,
      };
    },
    [finalConfig]
  );

  // 处理可见项变化
  const onViewableItemsChanged = useCallback(
    ({ viewableItems: newViewableItems }: { viewableItems: ViewToken[] }) => {
      setViewableItems(newViewableItems);
      
      // 清理不可见项的缓存
      const visibleKeys = new Set(newViewableItems.map(item => 
        keyExtractor(item.item, item.index || 0)
      ));
      
      // 延迟清理缓存，避免频繁操作
      safeSetTimeout(() => {
        itemCache.current.forEach((_, key) => {
          if (!visibleKeys.has(key)) {
            itemCache.current.delete(key);
          }
        });
      }, 1000);
    },
    [keyExtractor, safeSetTimeout]
  );

  const viewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
    }),
    []
  );

  // 处理下拉刷新
  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  // 优化的滚动到底部处理
  const handleEndReached = useCallback(() => {
    if (onEndReached && !loading) {
      // 使用防抖避免重复触发
      const debouncedEndReached = MemoryOptimizer.debounce(onEndReached, 300);
      debouncedEndReached();
    }
  }, [onEndReached, loading]);

  // 渲染空状态
  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      );
    }

    if (emptyComponent) {
      return emptyComponent;
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>暂无数据</Text>
      </View>
    );
  };

  // 渲染底部加载
  const renderFooter = () => {
    if (footerComponent) {
      return footerComponent;
    }

    if (loading && data.length > 0) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.footerText}>加载更多...</Text>
        </View>
      );
    }

    return null;
  };

  // 优化的渲染项（带缓存）
  const optimizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => {
      const key = keyExtractor(item, index);
      
      // 检查缓存
      if (itemCache.current.has(key)) {
        return itemCache.current.get(key)!;
      }
      
      // 渲染新项
      const renderedItem = (
        <View key={key}>
          {renderItem({ item, index })}
        </View>
      );
      
      // 缓存渲染结果（限制缓存大小）
      if (itemCache.current.size < maxCacheSize) {
        itemCache.current.set(key, renderedItem);
      }
      
      return renderedItem;
    },
    [renderItem, keyExtractor]
  );

  // 清理缓存
  useEffect(() => {
    addCleanup(() => {
      itemCache.current.clear();
    });
  }, [addCleanup]);

  // 内存警告监听
  useEffect(() => {
    const handleMemoryWarning = () => {
      itemCache.current.clear();
    };
    
    memoryManager.addMemoryWarningListener(handleMemoryWarning);
    addListener(() => {
      memoryManager.removeMemoryWarningListener(handleMemoryWarning);
    });
  }, [addListener]);

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={optimizedRenderItem}
      keyExtractor={keyExtractor}
      style={style}
      contentContainerStyle={[
        contentContainerStyle,
        data.length === 0 && styles.emptyContentContainer,
      ]}
      horizontal={horizontal}
      numColumns={numColumns}
      // 性能优化配置
      windowSize={finalConfig.windowSize}
      initialNumToRender={finalConfig.initialNumToRender}
      maxToRenderPerBatch={finalConfig.maxToRenderPerBatch}
      updateCellsBatchingPeriod={finalConfig.updateCellsBatchingPeriod}
      removeClippedSubviews={finalConfig.removeClippedSubviews}
      getItemLayout={getItemLayout}
      // 交互配置
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.1}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      // 组件配置
      ListEmptyComponent={renderEmpty}
      ListHeaderComponent={headerComponent}
      ListFooterComponent={renderFooter}
      // 其他优化
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={!horizontal}
      showsHorizontalScrollIndicator={horizontal}
    />
  );
}

// 分页加载Hook
interface UsePaginationOptions<T> {
  fetchData: (page: number, pageSize: number) => Promise<T[]>;
  pageSize?: number;
  initialPage?: number;
}

interface UsePaginationResult<T> {
  data: T[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  error: string | null;
}

export function usePagination<T>({
  fetchData,
  pageSize = 20,
  initialPage = 1,
}: UsePaginationOptions<T>): UsePaginationResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载数据
  const loadData = useCallback(
    async (page: number, isRefresh = false) => {
      try {
        setError(null);
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const newData = await fetchData(page, pageSize);
        
        if (isRefresh) {
          setData(newData);
          setCurrentPage(initialPage + 1);
        } else {
          setData(prev => [...prev, ...newData]);
          setCurrentPage(prev => prev + 1);
        }

        // 检查是否还有更多数据
        setHasMore(newData.length === pageSize);
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载失败');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [fetchData, pageSize, initialPage]
  );

  // 加载更多
  const loadMore = useCallback(() => {
    if (!loading && !refreshing && hasMore) {
      loadData(currentPage);
    }
  }, [loading, refreshing, hasMore, currentPage, loadData]);

  // 刷新
  const refresh = useCallback(() => {
    if (!loading && !refreshing) {
      loadData(initialPage, true);
    }
  }, [loading, refreshing, initialPage, loadData]);

  // 初始加载
  React.useEffect(() => {
    loadData(initialPage, true);
  }, []);

  return {
    data,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
    error,
  };
}

// 内存优化的图片列表组件
interface ImageListItem {
  id: string;
  uri: string;
  title?: string;
  subtitle?: string;
}

interface OptimizedImageListProps {
  data: ImageListItem[];
  onItemPress?: (item: ImageListItem, index: number) => void;
  numColumns?: number;
  imageHeight?: number;
  onEndReached?: () => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
}

export const OptimizedImageList: React.FC<OptimizedImageListProps> = ({
  data,
  onItemPress,
  numColumns = 2,
  imageHeight = 200,
  onEndReached,
  onRefresh,
  refreshing,
  loading,
}) => {
  const { width } = Dimensions.get('window');
  const itemWidth = (width - spacing.lg * (numColumns + 1)) / numColumns;

  const renderItem = useCallback(
    ({ item, index }: { item: ImageListItem; index: number }) => {
      return (
        <View style={[styles.imageItem, { width: itemWidth }]}>
          {/* 这里可以使用LazyImage组件 */}
          <View
            style={[
              styles.imagePlaceholder,
              { height: imageHeight, backgroundColor: colors.gray100 },
            ]}
          />
          {item.title && (
            <Text style={styles.imageTitle} numberOfLines={1}>
              {item.title}
            </Text>
          )}
          {item.subtitle && (
            <Text style={styles.imageSubtitle} numberOfLines={1}>
              {item.subtitle}
            </Text>
          )}
        </View>
      );
    },
    [itemWidth, imageHeight]
  );

  const keyExtractor = useCallback(
    (item: ImageListItem) => item.id,
    []
  );

  const config: VirtualizedListConfig = {
    itemHeight: imageHeight + 60, // 图片高度 + 文字高度
    windowSize: 5,
    initialNumToRender: 6,
    maxToRenderPerBatch: 3,
  };

  return (
    <OptimizedFlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      config={config}
      numColumns={numColumns}
      onEndReached={onEndReached}
      onRefresh={onRefresh}
      refreshing={refreshing}
      loading={loading}
      contentContainerStyle={styles.imageListContainer}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.sm,
    fontSize: 14,
    color: colors.gray600,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray500,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  footerLoading: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  footerText: {
    marginLeft: spacing.sm,
    fontSize: 14,
    color: colors.gray600,
  },
  imageListContainer: {
    padding: spacing.md,
  },
  imageItem: {
    marginBottom: spacing.md,
    marginHorizontal: spacing.xs,
  },
  imagePlaceholder: {
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  imageTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 2,
  },
  imageSubtitle: {
    fontSize: 12,
    color: colors.gray600,
  },
});

export default OptimizedFlatList;
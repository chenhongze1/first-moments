import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  TextStyle,
  ListRenderItem,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { TouchableEnhanced } from './TouchableEnhanced';
import { LoadingEnhanced } from './LoadingEnhanced';
import { AnimationUtils } from '../../utils/animations';
import { HapticFeedback } from '../../utils/haptics';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// 列表项动画类型
export type ListItemAnimationType = 'none' | 'fade' | 'slide' | 'scale' | 'stagger';

// 列表布局类型
export type ListLayoutType = 'vertical' | 'horizontal' | 'grid';

// 列表状态
export interface ListState {
  loading: boolean;
  refreshing: boolean;
  loadingMore: boolean;
  error: string | null;
  hasMore: boolean;
  isEmpty: boolean;
}

// 列表配置
export interface ListConfig {
  // 基础配置
  itemHeight?: number;
  estimatedItemSize?: number;
  numColumns?: number;
  horizontal?: boolean;
  
  // 分页配置
  pageSize?: number;
  threshold?: number;
  
  // 动画配置
  animationType?: ListItemAnimationType;
  animationDuration?: number;
  staggerDelay?: number;
  
  // 功能开关
  enableRefresh?: boolean;
  enableLoadMore?: boolean;
  enableVirtualization?: boolean;
  enableHapticFeedback?: boolean;
  
  // 样式配置
  showSeparator?: boolean;
  separatorColor?: string;
  backgroundColor?: string;
}

// 列表增强组件属性
export interface ListEnhancedProps<T> {
  // 数据
  data: T[];
  renderItem: ListRenderItem<T>;
  keyExtractor?: (item: T, index: number) => string;
  
  // 配置
  config?: ListConfig;
  layout?: ListLayoutType;
  
  // 回调函数
  onRefresh?: () => Promise<void> | void;
  onLoadMore?: () => Promise<void> | void;
  onItemPress?: (item: T, index: number) => void;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  
  // 状态
  loading?: boolean;
  refreshing?: boolean;
  loadingMore?: boolean;
  error?: string | null;
  hasMore?: boolean;
  
  // 样式
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  
  // 空状态
  emptyComponent?: React.ReactNode;
  emptyText?: string;
  
  // 错误状态
  errorComponent?: React.ReactNode;
  errorText?: string;
  
  // 加载状态
  loadingComponent?: React.ReactNode;
  loadMoreComponent?: React.ReactNode;
  
  // 头部和尾部
  headerComponent?: React.ReactNode;
  footerComponent?: React.ReactNode;
}

// 默认配置
const defaultConfig: Required<ListConfig> = {
  itemHeight: 60,
  estimatedItemSize: 60,
  numColumns: 1,
  horizontal: false,
  pageSize: 20,
  threshold: 0.8,
  animationType: 'fade',
  animationDuration: 300,
  staggerDelay: 50,
  enableRefresh: true,
  enableLoadMore: true,
  enableVirtualization: true,
  enableHapticFeedback: true,
  showSeparator: true,
  separatorColor: '#E5E5E5',
  backgroundColor: 'transparent',
};

export function ListEnhanced<T>({
  data,
  renderItem,
  keyExtractor,
  config = {},
  layout = 'vertical',
  onRefresh,
  onLoadMore,
  onItemPress,
  onScroll,
  loading = false,
  refreshing = false,
  loadingMore = false,
  error = null,
  hasMore = true,
  style,
  contentContainerStyle,
  emptyComponent,
  emptyText = '暂无数据',
  errorComponent,
  errorText = '加载失败，请重试',
  loadingComponent,
  loadMoreComponent,
  headerComponent,
  footerComponent,
}: ListEnhancedProps<T>) {
  const mergedConfig = { ...defaultConfig, ...config };
  const flatListRef = useRef<FlatList>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  
  // 列表状态
  const listState: ListState = {
    loading,
    refreshing,
    loadingMore,
    error,
    hasMore,
    isEmpty: data.length === 0,
  };
  
  // 处理下拉刷新
  const handleRefresh = useCallback(async () => {
    if (!mergedConfig.enableRefresh || !onRefresh) return;
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
    
    try {
      await onRefresh();
    } catch (err) {
      console.error('Refresh failed:', err);
    }
  }, [onRefresh, mergedConfig.enableRefresh, mergedConfig.enableHapticFeedback]);
  
  // 处理加载更多
  const handleLoadMore = useCallback(async () => {
    if (!mergedConfig.enableLoadMore || !onLoadMore || loadingMore || !hasMore) return;
    
    if (mergedConfig.enableHapticFeedback) {
      HapticFeedback.light();
    }
    
    try {
      await onLoadMore();
    } catch (err) {
      console.error('Load more failed:', err);
    }
  }, [onLoadMore, mergedConfig.enableLoadMore, mergedConfig.enableHapticFeedback, loadingMore, hasMore]);
  
  // 处理滚动到底部
  const handleEndReached = useCallback(() => {
    handleLoadMore();
  }, [handleLoadMore]);
  
  // 处理可见项变化
  const handleViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    const newVisibleItems = new Set<number>(viewableItems.map((item: any) => item.index as number));
    setVisibleItems(newVisibleItems);
  }, []);
  
  // 渲染增强的列表项
  const renderEnhancedItem: ListRenderItem<T> = useCallback(({ item, index }) => {
    const isVisible = visibleItems.has(index);
    
    const handlePress = () => {
      if (mergedConfig.enableHapticFeedback) {
        HapticFeedback.selection();
      }
      onItemPress?.(item, index);
    };
    
    const animatedStyle = useMemo(() => {
      if (mergedConfig.animationType === 'none') return {};
      
      switch (mergedConfig.animationType) {
        case 'fade':
          return {
            opacity: isVisible ? 1 : 0,
          };
        case 'slide':
          return {
            opacity: isVisible ? 1 : 0,
            transform: [{ translateY: isVisible ? 0 : 20 }],
          };
        case 'scale':
          return {
            opacity: isVisible ? 1 : 0,
            transform: [{ scale: isVisible ? 1 : 0.9 }],
          };
        case 'stagger':
          const delay = index * mergedConfig.staggerDelay;
          return {
            opacity: isVisible ? 1 : 0,
          };
        default:
          return {
            opacity: isVisible ? 1 : 0,
          };
      }
    }, [isVisible, index, mergedConfig.animationType, mergedConfig.staggerDelay]);
    
    const content = renderItem({ item, index, separators: {} as any });
    
    if (onItemPress) {
      return (
        <TouchableEnhanced
          style={StyleSheet.flatten([styles.itemContainer, animatedStyle])}
          onPress={handlePress}
        >
          {content}
        </TouchableEnhanced>
      );
    }
    
    return (
      <View style={[styles.itemContainer, animatedStyle]}>
        {content}
      </View>
    );
  }, [renderItem, onItemPress, visibleItems, mergedConfig]);
  
  // 渲染分隔符
  const renderSeparator = useCallback(() => {
    if (!mergedConfig.showSeparator) return null;
    
    return (
      <View
        style={[
          styles.separator,
          { backgroundColor: mergedConfig.separatorColor },
        ]}
      />
    );
  }, [mergedConfig.showSeparator, mergedConfig.separatorColor]);
  
  // 渲染空状态
  const renderEmpty = useCallback(() => {
    if (loading) return null;
    
    if (emptyComponent) {
      return emptyComponent;
    }
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyText}</Text>
      </View>
    );
  }, [loading, emptyComponent, emptyText]);
  
  // 渲染错误状态
  const renderError = useCallback(() => {
    if (!error) return null;
    
    if (errorComponent) {
      return errorComponent;
    }
    
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{errorText}</Text>
        <TouchableEnhanced
          style={styles.retryButton}
          onPress={handleRefresh}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableEnhanced>
      </View>
    );
  }, [error, errorComponent, errorText, handleRefresh]);
  
  // 渲染加载更多
  const renderLoadMore = useCallback(() => {
    if (!loadingMore || !hasMore) return null;
    
    if (loadMoreComponent) {
      return loadMoreComponent;
    }
    
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#666" />
        <Text style={styles.loadMoreText}>加载中...</Text>
      </View>
    );
  }, [loadingMore, hasMore, loadMoreComponent]);
  
  // 渲染尾部
  const renderFooter = useCallback(() => {
    return (
      <View>
        {renderLoadMore()}
        {footerComponent}
      </View>
    );
  }, [renderLoadMore, footerComponent]);
  
  // 如果正在加载且没有数据，显示加载状态
  if (loading && data.length === 0) {
    if (loadingComponent) {
      return <View style={[styles.container, style]}>{loadingComponent}</View>;
    }
    
    return (
      <View style={[styles.container, styles.loadingContainer, style]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.emptyText}>加载中...</Text>
      </View>
    );
  }
  
  // 如果有错误且没有数据，显示错误状态
  if (error && data.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderError()}
      </View>
    );
  }
  
  // 计算列表属性
  const listProps = {
    horizontal: layout === 'horizontal' || mergedConfig.horizontal,
    numColumns: layout === 'grid' ? mergedConfig.numColumns : 1,
    getItemLayout: mergedConfig.enableVirtualization
      ? (data: any, index: number) => ({
          length: mergedConfig.itemHeight,
          offset: mergedConfig.itemHeight * index,
          index,
        })
      : undefined,
    removeClippedSubviews: mergedConfig.enableVirtualization,
    maxToRenderPerBatch: mergedConfig.pageSize,
    windowSize: 10,
    initialNumToRender: mergedConfig.pageSize,
    onEndReachedThreshold: mergedConfig.threshold,
  };
  
  return (
    <View style={[styles.container, { backgroundColor: mergedConfig.backgroundColor }, style]}>
      <FlatList
        ref={flatListRef}
        data={data}
        renderItem={renderEnhancedItem}
        keyExtractor={keyExtractor || ((item, index) => index.toString())}
        ItemSeparatorComponent={renderSeparator}
        ListEmptyComponent={data.length === 0 ? renderEmpty : null}
        ListHeaderComponent={headerComponent as React.ComponentType<any> | React.ReactElement | null}
        ListFooterComponent={renderFooter}
        refreshControl={
          mergedConfig.enableRefresh && onRefresh ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          ) : undefined
        }
        onEndReached={handleEndReached}
        onScroll={onScroll}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50,
        }}
        contentContainerStyle={[
          data.length === 0 && styles.emptyContentContainer,
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        {...listProps}
      />
    </View>
  );
}

// 预设组件
export const VerticalList = <T,>(props: Omit<ListEnhancedProps<T>, 'layout'>) => (
  <ListEnhanced {...props} layout="vertical" />
);

export const HorizontalList = <T,>(props: Omit<ListEnhancedProps<T>, 'layout'>) => (
  <ListEnhanced {...props} layout="horizontal" />
);

export const GridList = <T,>(props: Omit<ListEnhancedProps<T>, 'layout'>) => (
  <ListEnhanced {...props} layout="grid" />
);

// 样式
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemContainer: {
    // 基础容器样式
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E5E5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  loadMoreContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadMoreText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
});

export default ListEnhanced;
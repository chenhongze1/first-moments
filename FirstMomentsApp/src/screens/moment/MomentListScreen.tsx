import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { RootState, AppDispatch } from '../../store';
import { fetchMomentsAsync } from '../../store/slices/momentSlice';
import { Moment } from '../../services/momentAPI';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../styles';
import { LoadingIndicator } from '../../components/ui/LoadingStates';
import FloatingActionButton from '../../components/common/FloatingActionButton';
import { OptimizedFlatList } from '../../components/VirtualizedList';
import { LazyImage, preloadImages } from '../../components/LazyImage';

const { width } = Dimensions.get('window');

interface MomentListScreenProps {
  navigation: any;
}

const MomentListScreen: React.FC<MomentListScreenProps> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { moments, isLoading, error, pagination } = useSelector((state: RootState) => state.moment);
  const { handleError } = useErrorHandler();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 初始加载数据
  useFocusEffect(
    useCallback(() => {
      loadMoments();
    }, [])
  );

  const loadMoments = async (page = 1, refresh = false, search?: string) => {
    try {
      if (refresh) {
        setRefreshing(true);
      }
      const params: any = { page, limit: 10 };
      if (search && search.trim()) {
        params.search = search.trim();
      }
      const result = await dispatch(fetchMomentsAsync(params)).unwrap();
      
      // 预加载图片
        if (result && result.moments && result.moments.length > 0) {
          const imagesToPreload = result.moments
            .filter((moment: Moment) => moment.media && moment.media.length > 0)
            .flatMap((moment: Moment) => moment.media!.slice(0, 3).map((media: any) => media.thumbnail || media.url));
          
          if (imagesToPreload.length > 0) {
            preloadImages(imagesToPreload).catch(error => {
              console.warn('预加载图片失败:', error);
            });
          }
        }
    } catch (error) {
      handleError(error, {
        showAlert: true,
        showToast: false
      });
    } finally {
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    loadMoments(1, true, searchText);
  };

  const handleSearch = () => {
    loadMoments(1, true, searchText);
  };

  const handleClearSearch = () => {
    setSearchText('');
    setShowSearch(false);
    loadMoments(1, true);
  };

  const handleLoadMore = () => {
    if (!loadingMore && pagination && pagination.current < pagination.pages) {
      setLoadingMore(true);
      loadMoments(pagination.current + 1, false, searchText);
    }
  };

  // 设置导航栏右侧搜索按钮
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{ marginRight: 15 }}
        >
          <Ionicons 
            name={showSearch ? "close-outline" : "search-outline"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      )
    });
  }, [showSearch, navigation]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return '今天';
    } else if (diffDays === 2) {
      return '昨天';
    } else if (diffDays <= 7) {
      return `${diffDays - 1}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  const renderMomentItem = ({ item }: { item: Moment }) => (
    <TouchableOpacity
      style={styles.momentCard}
      onPress={() => navigation.navigate('MomentDetail', { momentId: item.id })}
    >
      <View style={styles.momentHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDate(item.momentDate)}</Text>
          {item.location && (
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
              <Text style={styles.locationText}>{item.location.address?.formatted || item.location.address?.city || '未知位置'}</Text>
            </View>
          )}
        </View>
        {item.mood && (
          <Text style={styles.moodEmoji}>{item.mood === 'happy' ? '😊' : item.mood === 'sad' ? '😢' : '😐'}</Text>
        )}
      </View>

      {item.content && (
        <Text style={styles.contentText} numberOfLines={3}>
          {item.content}
        </Text>
      )}

      {item.media && item.media.length > 0 && (
        <View style={styles.mediaContainer}>
          {item.media.slice(0, 3).map((media, index) => (
            <LazyImage
                key={index}
                source={{ uri: media.thumbnail || media.url }}
                style={styles.mediaImage}
                placeholder={<Image source={require('../../assets/placeholder.png')} style={styles.mediaImage} />}
                errorComponent={<Image source={require('../../assets/error.png')} style={styles.mediaImage} />}
              />
          ))}
          {item.media.length > 3 && (
            <View style={styles.moreMediaOverlay}>
              <Text style={styles.moreMediaText}>+{item.media.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {item.tags && item.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {item.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.momentFooter}>
        <View style={styles.statsContainer}>
          {item.likes && item.likes.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="heart" size={14} color={colors.primary} />
              <Text style={styles.statText}>{item.likes.length}</Text>
            </View>
          )}
          {item.comments && item.comments.length > 0 && (
            <View style={styles.statItem}>
              <Ionicons name="chatbubble-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.statText}>{item.comments.length}</Text>
            </View>
          )}
        </View>
        {item.weather && (
          <View style={styles.weatherContainer}>
            <Text style={styles.weatherText}>{item.weather.condition}</Text>
            <Text style={styles.temperatureText}>{item.weather.temperature}°</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>还没有时光记录</Text>
      <Text style={styles.emptySubtitle}>记录生活中的美好瞬间</Text>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => navigation.navigate('CreateMoment')}
      >
        <Text style={styles.createButtonText}>创建第一条记录</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = (): React.ReactElement | undefined => {
    if (!loadingMore) return undefined;
    return (
      <View style={styles.footerLoader}>
        <Text style={styles.loadingText}>加载更多...</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="搜索时光记录..."
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
            <Text style={styles.searchButtonText}>搜索</Text>
          </TouchableOpacity>
        </View>
      )}
      {isLoading && moments.length === 0 ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      ) : (
        <OptimizedFlatList
          data={moments}
          renderItem={renderMomentItem}
          keyExtractor={(item) => item.id}
          config={{
            itemHeight: 200, // 估算每个时光记录卡片的高度
            windowSize: 10,
            initialNumToRender: 8,
            maxToRenderPerBatch: 5,
            updateCellsBatchingPeriod: 50,
            removeClippedSubviews: true,
          }}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onEndReached={handleLoadMore}
          emptyComponent={renderEmptyState()}
          footerComponent={renderFooter()}
          style={styles.list}
          contentContainerStyle={moments.length === 0 ? styles.emptyListContainer : styles.listContainer}
        />
      )}
      
      <FloatingActionButton
        onPress={() => navigation.navigate('CreateMoment', {})}
        icon="add"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  listContainer: {
    padding: spacing.md
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.md
  },
  momentCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: colors.black,
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5
  },
  momentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  dateContainer: {
    flex: 1
  },
  dateText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: 4
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  locationText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4
  },
  moodEmoji: {
    fontSize: 24
  },
  contentText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: spacing.sm
  },
  mediaContainer: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
    position: 'relative'
  },
  mediaImage: {
    width: (width - spacing.md * 2 - spacing.md * 2 - 8) / 3,
    height: 80,
    borderRadius: borderRadius.sm,
    marginRight: 4
  },
  moreMediaOverlay: {
    position: 'absolute',
    right: 4,
    top: 0,
    width: (width - spacing.md * 2 - spacing.md * 2 - 8) / 3,
    height: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center'
  },
  moreMediaText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.white
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.sm
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginRight: 8,
    marginBottom: 4
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.primary
  },
  momentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statsContainer: {
    flexDirection: 'row'
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md
  },
  statText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  weatherText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginRight: 4
  },
  temperatureText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md * 2
  },
  emptyTitle: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.md,
    marginBottom: spacing.sm
  },
  emptySubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md * 2
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md * 2,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md
  },
  createButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary
  },
  footerLoader: {
    padding: spacing.md,
    alignItems: 'center'
  },
  searchContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
    alignItems: 'center'
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm
  },
  searchIcon: {
    marginRight: spacing.xs
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.textPrimary,
    paddingVertical: spacing.sm
  },
  clearButton: {
    padding: spacing.xs
  },
  searchButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md
  },
  searchButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white
  },
  list: {
    flex: 1
  },

});

export default MomentListScreen;
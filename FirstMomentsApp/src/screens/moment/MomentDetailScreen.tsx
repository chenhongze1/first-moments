import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../../store';
import {
  fetchMomentAsync,
  toggleLikeAsync,
  addCommentAsync,
  deleteCommentAsync,
  deleteMomentAsync
} from '../../store/slices/momentSlice';
import { LoadingIndicator } from '../../components/ui/LoadingStates';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { colors, fontSize, fontWeight, spacing, borderRadius } from '../../styles';

const { width } = Dimensions.get('window');

interface MomentDetailScreenProps {
  route: {
    params: {
      momentId: string;
    };
  };
  navigation: any;
}

const MomentDetailScreen: React.FC<MomentDetailScreenProps> = ({ route, navigation }) => {
  const { momentId } = route.params;
  const dispatch = useDispatch();
  const { currentMoment, isLoading, error } = useSelector((state: RootState) => state.moment);
  const { user } = useSelector((state: RootState) => state.auth);
  const { handleError, showSuccess, showWarning } = useErrorHandler();
  
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  useEffect(() => {
    if (momentId) {
      dispatch(fetchMomentAsync(momentId) as any);
    }
  }, [dispatch, momentId]);

  const handleLike = () => {
    if (currentMoment) {
      dispatch(toggleLikeAsync(currentMoment.id) as any);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !currentMoment) return;
    
    setIsSubmittingComment(true);
    try {
      await dispatch(addCommentAsync({
        id: currentMoment.id,
        content: commentText.trim()
      }) as any);
      setCommentText('');
      showSuccess('评论添加成功');
    } catch (error) {
      handleError(error, {
        showAlert: true,
        showToast: false
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    // 使用Alert进行确认对话框
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        '删除评论',
        '确定要删除这条评论吗？',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                if (currentMoment) {
                  await dispatch(deleteCommentAsync({
                    momentId: currentMoment.id,
                    commentId
                  }) as any);
                  showSuccess('评论删除成功');
                }
              } catch (error) {
                handleError(error, {
                  showAlert: true,
                  showToast: false
                });
              }
            }
          }
        ]
      );
    });
  };

  const handleEditMoment = () => {
    if (currentMoment) {
      navigation.navigate('CreateMoment', {
        moment: currentMoment,
        isEdit: true
      });
    }
  };

  const handleDeleteMoment = () => {
    // 使用Alert进行确认对话框
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        '删除时光记录',
        '确定要删除这条时光记录吗？此操作无法撤销。',
        [
          { text: '取消', style: 'cancel' },
          {
            text: '删除',
            style: 'destructive',
            onPress: async () => {
              try {
                if (currentMoment) {
                  await dispatch(deleteMomentAsync(currentMoment.id) as any);
                  showSuccess('时光记录删除成功');
                  navigation.goBack();
                }
              } catch (error) {
                handleError(error, {
                  showAlert: true,
                  showToast: false
                });
              }
            }
          }
        ]
      );
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMoodEmoji = (mood: string) => {
    const moodMap: { [key: string]: string } = {
      happy: '😊',
      sad: '😢',
      excited: '🤩',
      calm: '😌',
      angry: '😠',
      surprised: '😲',
      love: '😍',
      tired: '😴'
    };
    return moodMap[mood] || '😊';
  };

  const getWeatherIcon = (condition: string) => {
    const weatherMap: { [key: string]: string } = {
      sunny: 'sunny',
      cloudy: 'cloudy',
      rainy: 'rainy',
      snowy: 'snow',
      windy: 'leaf'
    };
    return weatherMap[condition] || 'sunny';
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingIndicator size="large" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (error || !currentMoment) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorTitle}>加载失败</Text>
        <Text style={styles.errorSubtitle}>{error || '时光记录不存在'}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => dispatch(fetchMomentAsync(momentId) as any)}
        >
          <Text style={styles.retryButtonText}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLiked = currentMoment.likes?.some(like => like.user.id === user?.id);
  const canDeleteComment = (comment: any) => comment.userId === user?.id;
  const isOwner = currentMoment.creator?.id === user?.id;

  // 设置导航栏右侧按钮
  useEffect(() => {
    if (isOwner && currentMoment) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity
              onPress={handleEditMoment}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="create-outline" size={24} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteMoment}>
              <Ionicons name="trash-outline" size={24} color={colors.error} />
            </TouchableOpacity>
          </View>
        )
      });
    }
  }, [isOwner, currentMoment, navigation]);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <Image
                  source={{ uri: currentMoment.creator?.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiM0RUNEQUM0Ii8+Cjx0ZXh0IHg9IjIwIiB5PSIyNSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5aS05YOP5aS05YOP</dGV4dD4KPHN2Zz4=' }}
                  style={styles.avatar}
                />
            <View style={styles.userDetails}>
              <Text style={styles.username}>{currentMoment.creator?.username || '未知用户'}</Text>
              <Text style={styles.dateText}>{formatDate(currentMoment.momentDate)}</Text>
            </View>
          </View>
          
          {currentMoment.location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.locationText}>
              {currentMoment.location.address?.formatted || 
               currentMoment.location.placeName || 
               '未知位置'}
            </Text>
          </View>
        )}
        </View>

        {/* Content */}
        <View style={styles.content}>
          {currentMoment.content && (
            <Text style={styles.contentText}>{currentMoment.content}</Text>
          )}

          {/* Media */}
          {currentMoment.media && currentMoment.media.length > 0 && (
            <View style={styles.mediaContainer}>
              {currentMoment.media.map((media, index) => (
                <Image
                  key={index}
                  source={{ uri: media.url }}
                  style={[
                    styles.mediaImage,
                    currentMoment.media.length === 1 && styles.singleMediaImage
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          )}

          {/* Tags */}
          {currentMoment.tags && currentMoment.tags.length > 0 && (
            <View style={styles.tagsContainer}>
              {currentMoment.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Mood & Weather */}
        <View style={styles.metaContainer}>
          {currentMoment.mood && (
            <View style={styles.moodContainer}>
              <Text style={styles.moodEmoji}>{getMoodEmoji(currentMoment.mood)}</Text>
              <Text style={styles.moodText}>{currentMoment.mood}</Text>
            </View>
          )}
          
          {currentMoment.weather && (
            <View style={styles.weatherContainer}>
              <Ionicons 
                name={getWeatherIcon(currentMoment.weather.condition) as any} 
                size={16} 
                color={colors.textSecondary} 
              />
              <Text style={styles.weatherText}>
                {currentMoment.weather.condition} {currentMoment.weather.temperature}°C
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, isLiked && styles.likedButton]}
            onPress={handleLike}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={20} 
              color={isLiked ? colors.error : colors.textSecondary} 
            />
            <Text style={[styles.actionText, isLiked && styles.likedText]}>
              {currentMoment.likes?.length || 0}
            </Text>
          </TouchableOpacity>
          
          <View style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.actionText}>{currentMoment.comments?.length || 0}</Text>
          </View>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>评论</Text>
          
          {currentMoment.comments && currentMoment.comments.length > 0 ? (
            currentMoment.comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <Image
                  source={{ uri: comment.user.avatar || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiM0RUNEQUM0Ii8+Cjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5aS05YOP</dGV4dD4KPHN2Zz4=' }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentUsername}>{comment.user.username}</Text>
                    <Text style={styles.commentDate}>
                      {formatDate(comment.createdAt)}
                    </Text>
                    {canDeleteComment(comment) && (
                      <TouchableOpacity
                        onPress={() => handleDeleteComment(comment.id)}
                        style={styles.deleteCommentButton}
                      >
                        <Ionicons name="trash-outline" size={16} color={colors.error} />
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={styles.commentText}>{comment.content}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>暂无评论</Text>
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder="写下你的评论..."
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!commentText.trim() || isSubmittingComment) && styles.sendButtonDisabled
          ]}
          onPress={handleAddComment}
          disabled={!commentText.trim() || isSubmittingComment}
        >
          {isSubmittingComment ? (
            <LoadingIndicator size="small" color={colors.white} />
          ) : (
            <Ionicons name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  scrollView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.sm
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  errorTitle: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.textPrimary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs
  },
  errorSubtitle: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md
  },
  retryButtonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
    color: colors.white
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm
  },
  userDetails: {
    flex: 1
  },
  username: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary
  },
  dateText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2
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
  content: {
    padding: spacing.md
  },
  contentText: {
    fontSize: fontSize.base,
    color: colors.textPrimary,
    lineHeight: 24,
    marginBottom: spacing.md
  },
  mediaContainer: {
    marginBottom: spacing.md
  },
  mediaImage: {
    width: (width - spacing.md * 2 - spacing.xs) / 2,
    height: 200,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
    marginRight: spacing.xs
  },
  singleMediaImage: {
    width: width - spacing.md * 2,
    height: 300,
    marginRight: 0
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  tag: {
    backgroundColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
    marginBottom: spacing.xs
  },
  tagText: {
    fontSize: fontSize.sm,
    color: colors.primary
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  moodEmoji: {
    fontSize: 20,
    marginRight: spacing.xs
  },
  moodText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary
  },
  weatherContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  weatherText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md
  },
  likedButton: {
    // Additional styling for liked state if needed
  },
  actionText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginLeft: 4
  },
  likedText: {
    color: colors.error
  },
  commentsSection: {
    padding: spacing.md
  },
  commentsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  commentItem: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm
  },
  commentContent: {
    flex: 1
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  commentUsername: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.textPrimary,
    marginRight: spacing.sm
  },
  commentDate: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    flex: 1
  },
  deleteCommentButton: {
    padding: spacing.xs
  },
  commentText: {
    fontSize: fontSize.sm,
    color: colors.textPrimary,
    lineHeight: 20
  },
  noCommentsText: {
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    fontStyle: 'italic'
  },
  commentInputContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray200,
    alignItems: 'flex-end'
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
    maxHeight: 100,
    marginRight: spacing.sm
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray300
  }
});

export default MomentDetailScreen;
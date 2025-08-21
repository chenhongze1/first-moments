import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { colors, fontSize, spacing, borderRadius } from '../styles';

const { width: screenWidth } = Dimensions.get('window');

interface LoadingProps {
  size?: 'small' | 'large';
  color?: string;
  text?: string;
  overlay?: boolean;
}

// 基础加载指示器
export const Loading: React.FC<LoadingProps> = ({
  size = 'large',
  color = colors.primary,
  text,
  overlay = false,
}) => {
  const content = (
    <View style={[styles.container, overlay && styles.overlay]}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={styles.loadingText}>{text}</Text>}
      </View>
    </View>
  );

  return overlay ? (
    <View style={styles.overlayContainer}>{content}</View>
  ) : (
    content
  );
};

// 骨架屏组件
interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  return (
    <View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}
    />
  );
};

// 卡片骨架屏
export const CardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.cardHeader}>
        <Skeleton width={40} height={40} borderRadius={20} />
        <View style={styles.cardHeaderText}>
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <Skeleton width="100%" height={120} style={{ marginTop: spacing.md }} />
      <View style={styles.cardFooter}>
        <Skeleton width="30%" height={14} />
        <Skeleton width="20%" height={14} />
      </View>
    </View>
  );
};

// 列表骨架屏
interface ListSkeletonProps {
  itemCount?: number;
  itemHeight?: number;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  itemCount = 5,
  itemHeight = 80,
}) => {
  return (
    <View style={styles.listSkeleton}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={[styles.listItem, { height: itemHeight }]}>
          <Skeleton width={50} height={50} borderRadius={25} />
          <View style={styles.listItemContent}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="50%" height={12} style={{ marginTop: 4 }} />
            <Skeleton width="30%" height={10} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
};

// 页面加载骨架屏
export const PageSkeleton: React.FC = () => {
  return (
    <View style={styles.pageSkeleton}>
      {/* 头部 */}
      <View style={styles.pageHeader}>
        <Skeleton width={120} height={24} />
        <Skeleton width={40} height={40} borderRadius={20} />
      </View>
      
      {/* 搜索栏 */}
      <Skeleton 
        width="100%" 
        height={44} 
        borderRadius={22} 
        style={{ marginTop: spacing.lg }} 
      />
      
      {/* 内容区域 */}
      <View style={styles.pageContent}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    </View>
  );
};

// 全屏加载
export const FullScreenLoading: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <View style={styles.fullScreenLoading}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text && <Text style={styles.fullScreenText}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  
  // 骨架屏样式
  skeleton: {
    backgroundColor: colors.gray200,
    opacity: 0.7,
  },
  
  // 卡片骨架屏
  cardSkeleton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  
  // 列表骨架屏
  listSkeleton: {
    padding: spacing.md,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  listItemContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  
  // 页面骨架屏
  pageSkeleton: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  pageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  pageContent: {
    marginTop: spacing.xl,
  },
  
  // 全屏加载
  fullScreenLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  fullScreenText: {
    marginTop: spacing.lg,
    fontSize: fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default Loading;
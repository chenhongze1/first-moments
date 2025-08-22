import React from 'react';
import { Alert } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/styles';
import { 
  FadeInView, 
  SlideInView, 
  AnimatedButton, 
  PulseView,
  AnimatedProgressBar 
} from '../../src/components/animations/AnimatedComponents';
// import { PullToRefresh } from '../../src/components/animations/GestureAnimations';
import { useResponsive, ResponsiveUtils, responsive } from '../../src/utils/responsive';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const responsiveUtils = useResponsive();
  const router = useRouter();
  const styles = createStyles(colors, responsiveUtils);
  
  const quickActions = [
    { id: 1, title: '创建记录', icon: 'add-circle', color: colors.primary, route: '/moments' },
    { id: 2, title: '地图打卡', icon: 'location', color: colors.secondary, route: '/map' },
    { id: 3, title: '浏览记录', icon: 'list', color: colors.error, route: '/moments' },
    { id: 4, title: '统计分析', icon: 'stats-chart', color: '#FF9500', route: '/achievements' },
  ];

  const handleQuickAction = (action: any) => {
    try {
      router.push(action.route);
    } catch (error) {
      Alert.alert('导航错误', `无法打开${action.title}页面`);
    }
  };

  const recentMoments = [
    {
      id: 1,
      title: '美好的一天',
      location: '北京·朝阳公园',
      time: '2小时前',
      image: 'https://picsum.photos/300/200?random=1',
      tags: ['生活', '快乐'],
    },
    {
      id: 2,
      title: '咖啡时光',
      location: '上海·静安区',
      time: '5小时前',
      image: 'https://picsum.photos/300/200?random=2',
      tags: ['咖啡', '放松'],
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 欢迎区域 */}
        <FadeInView delay={0}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.welcomeSection}
          >
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>初心时光</Text>
            <Text style={styles.welcomeSubtitle}>记录生活中的美好瞬间</Text>
            
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>128</Text>
                <Text style={styles.statLabel}>记录</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>45</Text>
                <Text style={styles.statLabel}>地点</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>成就</Text>
              </View>
            </View>
          </View>
          </LinearGradient>
        </FadeInView>

        {/* 快速操作 */}
        <SlideInView direction="right" delay={200}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>快速操作</Text>
            </View>
            <View style={styles.quickActionsGrid}>
              {quickActions.map((action, index) => (
                <FadeInView key={action.id} delay={400 + index * 100}>
                  <AnimatedButton onPress={() => handleQuickAction(action)}>
                    <View style={styles.quickActionItem}>
                      <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                         <PulseView>
                           <Ionicons name={action.icon as any} size={24} color="white" />
                         </PulseView>
                       </View>
                      <Text style={styles.quickActionTitle}>{action.title}</Text>
                    </View>
                  </AnimatedButton>
                </FadeInView>
              ))}
            </View>
          </View>
        </SlideInView>

        {/* 最近时光 */}
        <SlideInView direction="up" delay={300}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近时光</Text>
              <AnimatedButton onPress={() => Alert.alert('查看全部', '功能开发中...')}>
                <Text style={styles.seeAllText}>查看全部</Text>
              </AnimatedButton>
            </View>
            {recentMoments.map((moment, index) => (
              <FadeInView key={moment.id} delay={800 + index * 100}>
                <AnimatedButton onPress={() => Alert.alert('时光详情', `查看${moment.title}详情`)}>
                  <View style={styles.momentCard}>
                    <Image source={{ uri: moment.image }} style={styles.momentImage} />
                    <View style={styles.momentContent}>
                      <Text style={styles.momentTitle}>{moment.title}</Text>
                      <View style={styles.momentMeta}>
                        <Text style={styles.momentLocation}>
                          <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
                          {moment.location}
                        </Text>
                        <Text style={styles.momentTime}>{moment.time}</Text>
                      </View>
                      <View style={styles.momentTags}>
                        {moment.tags.map((tag, tagIndex) => (
                          <View key={tagIndex} style={styles.momentTag}>
                            <Text style={styles.momentTagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>
                </AnimatedButton>
              </FadeInView>
            ))}
          </View>
        </SlideInView>
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, responsiveUtils: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  welcomeSection: {
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
    borderBottomLeftRadius: responsive.borderRadius.xl,
    borderBottomRightRadius: responsive.borderRadius.xl,
  },
  welcomeContent: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: responsive.fontSize.xxxl,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: responsive.spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: responsive.fontSize.md,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: responsive.spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: spacing.md,
  },
  section: {
    padding: responsiveUtils.isTablet ? responsive.spacing.xl : responsive.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: responsive.spacing.md,
  },
  sectionTitle: {
    fontSize: responsive.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  seeAllText: {
    fontSize: responsive.fontSize.sm,
    color: colors.primary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'nowrap',
  },
  quickActionItem: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: responsive.spacing.xs,
  },
  quickActionIcon: {
    width: responsiveUtils.isTablet ? 72 : 56,
    height: responsiveUtils.isTablet ? 72 : 56,
    borderRadius: responsiveUtils.isTablet ? 36 : 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: responsive.spacing.sm,
  },
  quickActionTitle: {
    fontSize: responsive.fontSize.xs,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  momentCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    marginBottom: responsive.spacing.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  momentImage: {
    width: responsiveUtils.isTablet ? 120 : 80,
    height: responsiveUtils.isTablet ? 120 : 80,
  },
  momentContent: {
    flex: 1,
    padding: responsive.spacing.md,
  },
  momentTitle: {
    fontSize: responsive.fontSize.md,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.xs,
  },
  momentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: responsive.spacing.xs,
  },
  momentLocation: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
    flex: 1,
  },
  momentTime: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
  },
  momentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  momentTag: {
    backgroundColor: colors.primary + '20',
    borderRadius: responsive.borderRadius.sm,
    paddingHorizontal: responsive.spacing.xs,
    paddingVertical: 2,
     marginRight: responsive.spacing.xs,
     marginTop: 2,
   },
   momentTagText: {
     fontSize: responsive.fontSize.xs,
    color: colors.primary,
  },
});

export default HomeScreen;

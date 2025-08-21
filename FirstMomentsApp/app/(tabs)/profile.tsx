import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../src/contexts/ThemeContext';
import { FadeInView, SlideInView, AnimatedButton } from '../../src/components/animations/AnimatedComponents';
import { useResponsive, responsive } from '../../src/utils/responsive';
import { spacing } from '../../src/styles';

const { width } = Dimensions.get('window');

// 用户信息类型
interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  joinDate: Date;
  stats: {
    moments: number;
    locations: number;
    achievements: number;
    followers: number;
  };
}

// 设置选项类型
interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  type: 'navigation' | 'switch' | 'action';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

// 模拟用户数据
const mockUser: UserProfile = {
  id: '1',
  username: '时光记录者',
  email: 'user@firstmoments.com',
  avatar: 'https://via.placeholder.com/120x120/4ECDC4/FFFFFF?text=头像',
  bio: '记录生活中的美好时光，分享每一个珍贵瞬间',
  joinDate: new Date('2024-01-15'),
  stats: {
    moments: 156,
    locations: 23,
    achievements: 12,
    followers: 89,
  },
};

export default function ProfileScreen() {
  const { theme, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const responsiveUtils = useResponsive();
  
  const colors = theme.colors;
  const styles = createStyles(colors, responsiveUtils);

  const settingSections = [
    {
      title: '账户设置',
      items: [
        {
          id: 'edit-profile',
          title: '编辑个人资料',
          subtitle: '修改头像、昵称和个人简介',
          icon: 'person-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('编辑个人资料', '功能开发中...'),
        },
        {
          id: 'privacy',
          title: '隐私设置',
          subtitle: '管理你的隐私偏好',
          icon: 'shield-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('隐私设置', '功能开发中...'),
        },
        {
          id: 'security',
          title: '账户安全',
          subtitle: '密码和安全设置',
          icon: 'lock-closed-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('账户安全', '功能开发中...'),
        },
      ],
    },
    {
      title: '应用设置',
      items: [
        {
          id: 'theme-mode',
          title: '主题模式',
          subtitle: themeMode === 'light' ? '浅色模式' : themeMode === 'dark' ? '深色模式' : '跟随系统',
          icon: isDark ? 'moon-outline' : 'sunny-outline',
          type: 'navigation' as const,
          onPress: () => {
            Alert.alert(
              '选择主题',
              '请选择您偏好的主题模式',
              [
                {
                  text: '浅色模式',
                  onPress: () => setThemeMode('light'),
                  style: themeMode === 'light' ? 'default' : 'cancel'
                },
                {
                  text: '深色模式', 
                  onPress: () => setThemeMode('dark'),
                  style: themeMode === 'dark' ? 'default' : 'cancel'
                },
                {
                  text: '跟随系统',
                  onPress: () => setThemeMode('system'),
                  style: themeMode === 'system' ? 'default' : 'cancel'
                },
                { text: '取消', style: 'cancel' }
              ]
            );
          },
        },
        {
          id: 'notifications',
          title: '推送通知',
          subtitle: '接收应用通知',
          icon: 'notifications-outline',
          type: 'switch' as const,
          value: notifications,
          onToggle: setNotifications,
        },
        {
          id: 'location',
          title: '位置共享',
          subtitle: '允许分享位置信息',
          icon: 'location-outline',
          type: 'switch' as const,
          value: locationSharing,
          onToggle: setLocationSharing,
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          id: 'help',
          title: '帮助与反馈',
          subtitle: '获取帮助或提供反馈',
          icon: 'help-circle-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('帮助与反馈', '功能开发中...'),
        },
        {
          id: 'about',
          title: '关于我们',
          subtitle: '了解更多应用信息',
          icon: 'information-circle-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('关于我们', 'First Moments v1.0.0\n记录生活中的美好时光'),
        },
        {
          id: 'logout',
          title: '退出登录',
          icon: 'log-out-outline',
          type: 'action' as const,
          onPress: () => {
            Alert.alert(
              '退出登录',
              '确定要退出当前账户吗？',
              [
                { text: '取消', style: 'cancel' },
                { text: '确定', style: 'destructive', onPress: () => Alert.alert('已退出', '功能开发中...') },
              ]
            );
          },
        },
      ],
    },
  ];

  const renderStatItem = (label: string, value: number, icon: string) => (
    <View style={styles.statItem}>
      <Ionicons name={icon as any} size={24} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={[
        styles.settingItem,
        item.type === 'action' && styles.actionItem
      ]}
      onPress={item.onPress}
      disabled={item.type === 'switch'}
    >
      <View style={styles.settingItemLeft}>
        <View style={[
          styles.settingIcon,
          item.type === 'action' && styles.actionIcon
        ]}>
          <Ionicons 
            name={item.icon as any} 
            size={20} 
            color={item.type === 'action' ? colors.error : colors.primary} 
          />
        </View>
        <View style={styles.settingText}>
          <Text style={[
            styles.settingTitle,
            item.type === 'action' && styles.actionTitle
          ]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      <View style={styles.settingItemRight}>
        {item.type === 'switch' ? (
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: colors.gray200, true: colors.primaryLight }}
            thumbColor={item.value ? colors.primary : colors.gray400}
          />
        ) : (
          <Ionicons 
            name="chevron-forward" 
            size={20} 
            color={colors.textSecondary} 
          />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FadeInView>
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
        {/* 用户信息卡片 */}
        <SlideInView direction="up" delay={100}>
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.profileCard}
          >
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => Alert.alert('更换头像', '功能开发中...')}
            >
              <Ionicons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
          <Text style={styles.bio}>{user.bio}</Text>
          
          <Text style={styles.joinDate}>
            加入时间: {user.joinDate.toLocaleDateString()}
          </Text>
          </LinearGradient>
        </SlideInView>

        {/* 统计数据 */}
        <SlideInView direction="up" delay={200}>
          <View style={styles.statsContainer}>
          {renderStatItem('时光记录', user.stats.moments, 'camera')}
          {renderStatItem('打卡地点', user.stats.locations, 'location')}
          {renderStatItem('获得成就', user.stats.achievements, 'trophy')}
          {renderStatItem('关注者', user.stats.followers, 'people')}
          </View>
        </SlideInView>

        {/* 设置选项 */}
        {settingSections.map((section, sectionIndex) => (
          <SlideInView key={sectionIndex} direction="up" delay={300 + sectionIndex * 100}>
            <View style={styles.settingSection}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.settingGroup}>
              {section.items.map(renderSettingItem)}
            </View>
            </View>
          </SlideInView>
        ))}
        
        <View style={styles.bottomPadding} />
        </ScrollView>
      </FadeInView>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, responsiveUtils: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  profileCard: {
    paddingTop: responsiveUtils.isTablet ? 80 : 60,
    paddingBottom: responsiveUtils.isTablet ? 40 : 30,
    paddingHorizontal: responsiveUtils.isTablet ? responsive.spacing.xl : spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: responsiveUtils.isTablet ? 150 : 120,
    height: responsiveUtils.isTablet ? 150 : 120,
    borderRadius: responsiveUtils.isTablet ? 75 : 60,
    borderWidth: 4,
    borderColor: colors.white,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  username: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xxxl : 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  email: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : 16,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.sm,
  },
  bio: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  joinDate: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: responsiveUtils.isSmallDevice ? 'column' : 'row',
    backgroundColor: colors.surface,
    marginHorizontal: responsiveUtils.getSafeAreaPadding().horizontal,
    marginTop: -20,
    borderRadius: responsiveUtils.isTablet ? responsive.borderRadius.xl : 12,
    paddingVertical: responsiveUtils.isTablet ? responsive.spacing.xl : spacing.lg,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    marginBottom: responsiveUtils.isSmallDevice ? responsive.spacing.sm : 0,
  },
  statValue: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xl : responsive.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginTop: responsive.spacing.xs,
  },
  statLabel: {
    fontSize: responsive.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  settingSection: {
    marginTop: responsiveUtils.isTablet ? responsive.spacing.xl : spacing.lg,
    marginHorizontal: responsiveUtils.getSafeAreaPadding().horizontal,
  },
  sectionTitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.xl : responsive.fontSize.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: responsive.spacing.sm,
    marginLeft: responsive.spacing.xs,
  },
  settingGroup: {
    backgroundColor: colors.surface,
    borderRadius: responsive.borderRadius.lg,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: responsiveUtils.isTablet ? responsive.spacing.lg : spacing.md,
    paddingVertical: responsiveUtils.isTablet ? responsive.spacing.lg : spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItem: {
    borderBottomWidth: 0,
  },
  settingItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  actionIcon: {
     backgroundColor: colors.error + '20',
   },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.lg : responsive.fontSize.md,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  actionTitle: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: responsiveUtils.isTablet ? responsive.fontSize.md : responsive.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: responsiveUtils.isTablet ? 22 : 18,
  },
  settingItemRight: {
    marginLeft: spacing.sm,
  },
  bottomPadding: {
    height: 100,
  },
});
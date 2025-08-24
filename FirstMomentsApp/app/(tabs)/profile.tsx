import React, { useState, useEffect } from 'react';
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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch } from 'react-redux';
import { router } from 'expo-router';
import { useAppSelector } from '../../src/hooks/redux';
import { useTheme } from '../../src/contexts/ThemeContext';
import { FadeInView, SlideInView, AnimatedButton } from '../../src/components/animations/AnimatedComponents';
import { useResponsive, responsive } from '../../src/utils/responsive';
import { spacing } from '../../src/styles';
import EditProfileModal from '../../components/EditProfileModal';
import PrivacySettingsModal, { PrivacySettings } from '../../components/PrivacySettingsModal';
import SecuritySettingsModal, { SecuritySettings } from '../../components/SecuritySettingsModal';
import DataBackupModal, { BackupSettings } from '../../components/DataBackupModal';
import StorageManagementModal from '../../components/StorageManagementModal';
import DataExportModal, { ExportSettings } from '../../components/DataExportModal';
import FriendManagementModal from '../../components/FriendManagementModal';
import ShareSettingsModal, { ShareSettings } from '../../components/ShareSettingsModal';
import HelpFeedbackModal from '../../components/HelpFeedbackModal';
import { userAPI, UpdateUserProfileData } from '../../src/services/userAPI';
import { authAPI } from '../../src/services/authAPI';
import { logout } from '../../src/store/slices/authSlice';

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
  avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDEyMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxjaXJjbGUgY3g9IjYwIiBjeT0iNjAiIHI9IjYwIiBmaWxsPSIjNEVDREE0Ii8+Cjx0ZXh0IHg9IjYwIiB5PSI3MCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+5aS05YOP</dGV4dD4KPHN2Zz4=',
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
  const dispatch = useDispatch();
  const { theme, isDark, themeMode, setThemeMode, toggleTheme } = useTheme();
  const { isAuthenticated, user: authUser } = useAppSelector(state => state.auth);
  
  // 调试信息
  console.log('ProfileScreen - 认证状态:', isAuthenticated);
  console.log('ProfileScreen - 用户信息:', authUser);
  const [user, setUser] = useState<UserProfile>(mockUser);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  
  // 隐私设置模态框状态
  const [privacySettingsVisible, setPrivacySettingsVisible] = useState(false);
  
  // 隐私设置数据
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'friends',
    showOnlineStatus: true,
    allowFriendRequests: true,
    showLocation: true,
    dataCollection: false,
    personalizedAds: false,
    shareAnalytics: false,
  });
  
  // 安全设置模态框状态
  const [securitySettingsVisible, setSecuritySettingsVisible] = useState(false);
  
  // 安全设置数据
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    biometricEnabled: true,
    autoLockEnabled: true,
    autoLockTime: 15,
    loginNotifications: true,
    suspiciousActivityAlerts: true,
  });
  
  // 数据备份模态框状态
  const [dataBackupVisible, setDataBackupVisible] = useState(false);
  
  // 数据备份设置
  const [backupSettings, setBackupSettings] = useState<BackupSettings>({
    autoBackup: true,
    backupFrequency: 'weekly',
    includePhotos: true,
    includeVideos: false,
    includeMessages: true,
    includeSettings: true,
    cloudProvider: 'icloud',
  });
  
  // 存储管理模态框状态
  const [storageManagementVisible, setStorageManagementVisible] = useState(false);
  
  // 数据导出模态框状态
  const [dataExportVisible, setDataExportVisible] = useState(false);
  
  // 数据导出设置
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    includePhotos: true,
    includeVideos: false,
    includeMessages: true,
    includeSettings: true,
    includeContacts: false,
    exportFormat: 'json',
    dateRange: 'all',
  });
  
  // 好友管理模态框状态
  const [friendManagementVisible, setFriendManagementVisible] = useState(false);
  const [shareSettingsVisible, setShareSettingsVisible] = useState(false);
  const [helpFeedbackVisible, setHelpFeedbackVisible] = useState(false);
  const [shareSettings, setShareSettings] = useState<ShareSettings>({
    allowPublicSharing: false,
    allowFriendSharing: true,
    allowLocationSharing: false,
    autoShareToSocial: false,
    shareWithMetadata: true,
    watermarkEnabled: false,
    defaultSharePlatform: 'none',
    shareQuality: 'high',
  });
  const responsiveUtils = useResponsive();
  
  const colors = theme.colors;
  const styles = createStyles(colors, responsiveUtils);

  // 加载用户数据
  useEffect(() => {
    // 设置未授权处理器
    const { httpClient } = require('../../src/services/httpClient');
    httpClient.setUnauthorizedHandler(() => {
      Alert.alert('登录已过期', '请重新登录', [
        { text: '确定', onPress: () => {
          // 这里应该导航到登录页面
          console.log('导航到登录页面');
        }}
      ]);
    });
    
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const userData = await userAPI.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      console.error('加载用户数据失败:', error);
      // 如果是401错误，说明需要登录
      if (error.response?.status === 401) {
        console.log('用户未登录，使用模拟数据');
      }
      // 使用模拟数据作为后备
    } finally {
      setLoading(false);
    }
  };

  // 创建测试用户并登录
  const createTestUser = async () => {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      
      // 生成随机用户名和邮箱
      const randomId = Math.random().toString(36).substring(2, 8);
      const username = `testuser_${randomId}`;
      const email = `test_${randomId}@example.com`;
      
      console.log('Creating user:', { username, email });
      
      // 创建测试用户
      const registerResponse = await fetch('http://localhost:3001/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password: 'Test123456',
          confirmPassword: 'Test123456'
        })
      });
      
      if (registerResponse.ok) {
        // 登录获取token
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: 'Test123456'
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          await AsyncStorage.setItem('auth_token', loginData.data.accessToken);
          Alert.alert('成功', '测试用户创建并登录成功');
          loadUserData(); // 重新加载用户数据
        } else {
          Alert.alert('错误', '登录失败');
        }
      } else {
        // 用户可能已存在，尝试直接登录
        const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password: 'Test123456'
          })
        });
        
        if (loginResponse.ok) {
          const loginData = await loginResponse.json();
          await AsyncStorage.setItem('auth_token', loginData.data.accessToken);
          Alert.alert('成功', '登录成功');
          loadUserData(); // 重新加载用户数据
        } else {
          Alert.alert('错误', '创建用户和登录都失败');
        }
      }
    } catch (error: any) {
      console.error('创建测试用户失败:', error);
      Alert.alert('错误', '网络请求失败: ' + error.message);
    }
  };

  // 处理编辑个人资料
  const handleEditProfile = () => {
    setEditProfileVisible(true);
  };

  // 处理保存个人资料
  const handleSaveProfile = async (updatedData: Partial<UserProfile>) => {
    try {
      // 转换数据格式以匹配API
      const profileData: UpdateUserProfileData = {
        username: updatedData.username,
        email: updatedData.email,
        bio: updatedData.bio,
        avatar: updatedData.avatar,
      };

      // 调用API更新用户资料
      const response = await userAPI.updateProfile(profileData);
      
      if (response.data.success) {
        // 更新本地状态
        setUser(prev => ({ ...prev, ...updatedData }));
        setEditProfileVisible(false);
        Alert.alert('成功', '个人资料已更新');
      } else {
        Alert.alert('错误', response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  // 处理更换头像
  const handleChangeAvatar = () => {
    setEditProfileVisible(true);
  };

  // 处理隐私设置
  const handlePrivacySettings = () => {
    setPrivacySettingsVisible(true);
  };

  // 处理保存隐私设置
  const handleSavePrivacySettings = async (newSettings: PrivacySettings) => {
    try {
      // 调用API更新隐私设置
      const response = await userAPI.updatePrivacySettings(newSettings);
      
      if (response.data.success) {
        // 更新本地状态
        setPrivacySettings(newSettings);
        setPrivacySettingsVisible(false);
        Alert.alert('成功', '隐私设置已更新');
      } else {
        Alert.alert('错误', response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新隐私设置失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  // 处理安全设置
  const handleSecuritySettings = () => {
    setSecuritySettingsVisible(true);
  };

  // 处理保存安全设置
  const handleSaveSecuritySettings = async (newSettings: SecuritySettings) => {
    try {
      // 调用API更新安全设置
      const response = await userAPI.updateSecuritySettings(newSettings);
      
      if (response.data.success) {
        // 更新本地状态
        setSecuritySettings(newSettings);
        setSecuritySettingsVisible(false);
        Alert.alert('成功', '安全设置已更新');
      } else {
        Alert.alert('错误', response.data.message || '更新失败');
      }
    } catch (error) {
      console.error('更新安全设置失败:', error);
      Alert.alert('错误', '网络错误，请稍后重试');
    }
  };

  // 处理退出登录
  const handleLogout = () => {
    console.log('退出登录按钮被点击');
    
    const performLogout = async () => {
      console.log('用户确认退出登录');
      try {
        // 调用后端退出登录API
        console.log('正在调用后端退出登录API...');
        await authAPI.logout();
        console.log('后端退出登录API调用成功');
        
        // 调用Redux logout action清除本地状态
        console.log('正在清除Redux状态...');
        dispatch(logout());
        console.log('Redux状态已清除');
        
        // 认证状态变化会自动处理页面重定向
        if (Platform.OS === 'web') {
          alert('您已成功退出登录');
        } else {
          Alert.alert('已退出', '您已成功退出登录');
        }
      } catch (error) {
        console.error('退出登录失败:', error);
        if (Platform.OS === 'web') {
          alert('退出登录失败，请重试');
        } else {
          Alert.alert('错误', '退出登录失败，请重试');
        }
      }
    };
    
    if (Platform.OS === 'web') {
      // Web环境使用window.confirm
      console.log('Web环境，准备显示确认对话框');
      try {
        const confirmed = window.confirm('确定要退出当前账户吗？退出后需要重新登录。');
        console.log('用户确认结果:', confirmed);
        if (confirmed) {
          performLogout();
        } else {
          console.log('用户取消了退出登录');
        }
      } catch (error) {
        console.error('显示确认对话框失败:', error);
        // 如果window.confirm失败，直接执行退出登录
        performLogout();
      }
    } else {
      // 移动端使用Alert.alert
      Alert.alert(
        '退出登录',
        '确定要退出当前账户吗？退出后需要重新登录。',
        [
          { text: '取消', style: 'cancel' },
          { 
            text: '确定', 
            style: 'destructive', 
            onPress: performLogout
          }
        ]
      );
    }
  };

  // 处理数据备份
  const handleDataBackup = () => {
    setDataBackupVisible(true);
  };

  // 处理保存备份设置
  const handleSaveBackupSettings = (newSettings: BackupSettings) => {
    setBackupSettings(newSettings);
    setDataBackupVisible(false);
  };

  // 处理存储管理
  const handleStorageManagement = () => {
    setStorageManagementVisible(true);
  };

  // 处理数据导出
  const handleDataExport = () => {
    setDataExportVisible(true);
  };

  // 处理保存导出设置
  const handleSaveExportSettings = (newSettings: ExportSettings) => {
    setExportSettings(newSettings);
    setDataExportVisible(false);
  };

  // 处理好友管理
  const handleFriendManagement = () => {
    setFriendManagementVisible(true);
  };

  const handleShareSettings = () => {
    setShareSettingsVisible(true);
  };

  const handleSaveShareSettings = (newSettings: ShareSettings) => {
    setShareSettings(newSettings);
    setShareSettingsVisible(false);
    Alert.alert('成功', '分享设置已保存');
  };

  const handleHelpFeedback = () => {
    setHelpFeedbackVisible(true);
  };

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
          onPress: handleEditProfile,
        },
        {
          id: 'privacy',
          title: '隐私设置',
          subtitle: '管理你的隐私偏好',
          icon: 'shield-outline',
          type: 'navigation' as const,
          onPress: handlePrivacySettings,
        },
        {
          id: 'security',
          title: '账户安全',
          subtitle: '密码和安全设置',
          icon: 'lock-closed-outline',
          type: 'navigation' as const,
          onPress: handleSecuritySettings,
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
      title: '数据与存储',
      items: [
        {
          id: 'backup',
          title: '数据备份',
          subtitle: '备份您的记录数据',
          icon: 'cloud-upload-outline',
          type: 'navigation' as const,
          onPress: handleDataBackup,
        },
        {
          id: 'sync',
          title: '云端同步',
          subtitle: '同步数据到云端',
          icon: 'sync-outline',
          type: 'switch' as const,
          value: true,
          onToggle: () => {},
        },
        {
          id: 'storage',
          title: '存储管理',
          subtitle: '管理本地存储空间',
          icon: 'folder-outline',
          type: 'navigation' as const,
          onPress: handleStorageManagement,
        },
        {
          id: 'export',
          title: '导出数据',
          subtitle: '导出记录为文件',
          icon: 'download-outline',
          type: 'navigation' as const,
          onPress: handleDataExport,
        },
      ],
    },
    {
      title: '社交与分享',
      items: [
        {
          id: 'friends',
          title: '好友管理',
          subtitle: '管理您的好友列表',
          icon: 'people-outline',
          type: 'navigation' as const,
          onPress: handleFriendManagement,
        },
        {
          id: 'share_settings',
          title: '分享设置',
          subtitle: '设置默认分享选项',
          icon: 'share-outline',
          type: 'navigation' as const,
          onPress: handleShareSettings,
        },
        {
          id: 'social_connect',
          title: '社交账号绑定',
          subtitle: '绑定微信、微博等账号',
          icon: 'link-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('社交账号绑定', '功能开发中...'),
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
          onPress: handleHelpFeedback,
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
          id: 'terms',
          title: '服务条款',
          subtitle: '查看服务条款',
          icon: 'document-text-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('服务条款', '功能开发中...'),
        },
        {
          id: 'privacy',
          title: '隐私政策',
          subtitle: '查看隐私政策',
          icon: 'shield-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('隐私政策', '功能开发中...'),
        },
        {
          id: 'version',
          title: '版本信息',
          subtitle: 'v1.0.0 (Build 1)',
          icon: 'information-outline',
          type: 'navigation' as const,
          onPress: () => Alert.alert('版本信息', '当前版本：v1.0.0\n构建号：1\n发布日期：2024-01-15'),
        },
        {
          id: 'test-user',
          title: '创建测试用户',
          subtitle: '创建测试用户并登录',
          icon: 'person-add-outline',
          type: 'action' as const,
          onPress: createTestUser,
        },
        {
          id: 'logout',
          title: '退出登录',
          subtitle: '退出当前账户',
          icon: 'log-out-outline',
          type: 'action' as const,
          onPress: handleLogout,
          color: '#FF6B6B',
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
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <FadeInView>
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
              onPress={handleChangeAvatar}
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
        </FadeInView>
      </ScrollView>
      
      {/* 编辑个人资料模态框 */}
      <EditProfileModal
        visible={editProfileVisible}
        initialProfile={user}
        onClose={() => setEditProfileVisible(false)}
        onSave={handleSaveProfile}
      />
      
      {/* 隐私设置模态框 */}
      <PrivacySettingsModal
        visible={privacySettingsVisible}
        initialSettings={privacySettings}
        onClose={() => setPrivacySettingsVisible(false)}
        onSave={handleSavePrivacySettings}
      />
      
      {/* 安全设置模态框 */}
      <SecuritySettingsModal
        visible={securitySettingsVisible}
        initialSettings={securitySettings}
        onClose={() => setSecuritySettingsVisible(false)}
        onSave={handleSaveSecuritySettings}
      />
      
      {/* 数据备份模态框 */}
      <DataBackupModal
        visible={dataBackupVisible}
        initialSettings={backupSettings}
        onClose={() => setDataBackupVisible(false)}
        onSave={handleSaveBackupSettings}
      />

      <StorageManagementModal
        visible={storageManagementVisible}
        onClose={() => setStorageManagementVisible(false)}
      />

      <DataExportModal
        visible={dataExportVisible}
        initialSettings={exportSettings}
        onClose={() => setDataExportVisible(false)}
        onExport={handleSaveExportSettings}
      />

      <FriendManagementModal
        visible={friendManagementVisible}
        onClose={() => setFriendManagementVisible(false)}
      />

      <ShareSettingsModal
        visible={shareSettingsVisible}
        initialSettings={shareSettings}
        onClose={() => setShareSettingsVisible(false)}
        onSave={handleSaveShareSettings}
      />

      <HelpFeedbackModal
        visible={helpFeedbackVisible}
        onClose={() => setHelpFeedbackVisible(false)}
      />
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
    height: Platform.OS === 'web' ? 120 : 100, // 为底部导航栏留出空间
  },
});
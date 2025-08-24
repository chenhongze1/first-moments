import { httpClient } from './httpClient';

// 用户资料更新数据类型
export interface UpdateUserProfileData {
  username?: string;
  email?: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  website?: string;
  location?: string;
  birthday?: string;
}

// 隐私设置数据类型
export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showEmail: boolean;
  showPhone: boolean;
  showBirthday: boolean;
  showLocation: boolean;
  allowFriendRequests: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
}

// 安全设置数据类型
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  deviceManagement: boolean;
  sessionTimeout: number;
  passwordChangeRequired: boolean;
}

// 通知设置数据类型
export interface NotificationSettings {
  email: boolean;
  push: boolean;
  achievements: boolean;
  moments: boolean;
  profiles: boolean;
  system: boolean;
  friends: boolean;
  comments: boolean;
}

// 用户设置数据类型
export interface UserSettings {
  privacy: PrivacySettings;
  security: SecuritySettings;
  notifications: NotificationSettings;
  preferences: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

// 密码修改数据类型
export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// 用户API服务
export const userAPI = {
  // 获取当前用户信息
  getCurrentUser: async () => {
    const response = await httpClient.get('/users/me');
    const userData = response.data;
    
    // 转换后端数据格式到前端期望的格式，包含UserProfile所需的所有属性
    return {
      id: userData.id,
      username: userData.username,
      email: userData.email,
      avatar: userData.avatar || '',
      bio: userData.bio || '',
      joinDate: userData.createdAt ? new Date(userData.createdAt) : new Date(),
      stats: {
        moments: userData.stats?.moments || 0,
        locations: userData.stats?.locations || 0,
        achievements: userData.stats?.achievements || 0,
        followers: userData.stats?.followers || 0
      },
      location: userData.location || '',
      website: userData.website || '',
      birthDate: userData.birthDate,
      gender: userData.gender || 'other',
      phone: userData.phone || '',
      isEmailVerified: userData.isEmailVerified || false,
      isPhoneVerified: userData.isPhoneVerified || false,
      privacySettings: userData.privacySettings || {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowTagging: true,
        allowLocationSharing: false
      },
      notificationSettings: userData.notificationSettings || {
        pushNotifications: true,
        emailNotifications: true,
        smsNotifications: false,
        momentLikes: true,
        momentComments: true,
        newFollowers: true,
        friendRequests: true
      },
      securitySettings: userData.securitySettings || {
        twoFactorEnabled: false,
        loginAlerts: true,
        deviceManagement: true,
        sessionTimeout: 30
      },
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };
  },

  // 更新用户资料
  updateProfile: async (data: UpdateUserProfileData) => {
    return httpClient.put('/users/me', data);
  },

  // 获取用户设置
  getSettings: async () => {
    return httpClient.get('/users/me/settings');
  },

  // 更新用户设置
  updateSettings: async (settings: Partial<UserSettings>) => {
    return httpClient.put('/users/me/settings', settings);
  },

  // 更新隐私设置
  updatePrivacySettings: async (privacySettings: Partial<PrivacySettings>) => {
    return httpClient.put('/users/me/settings/privacy', privacySettings);
  },

  // 更新安全设置
  updateSecuritySettings: async (securitySettings: Partial<SecuritySettings>) => {
    return httpClient.put('/users/me/settings/security', securitySettings);
  },

  // 更新通知设置
  updateNotificationSettings: async (notificationSettings: Partial<NotificationSettings>) => {
    return httpClient.put('/users/me/settings/notifications', notificationSettings);
  },

  // 修改密码
  changePassword: async (passwordData: ChangePasswordData) => {
    return httpClient.post('/users/me/change-password', passwordData);
  },

  // 启用/禁用双因素认证
  toggleTwoFactor: async (enabled: boolean) => {
    return httpClient.post('/users/me/two-factor', { enabled });
  },

  // 获取登录设备列表
  getDevices: async () => {
    return httpClient.get('/users/me/devices');
  },

  // 删除登录设备
  removeDevice: async (deviceId: string) => {
    return httpClient.delete(`/users/me/devices/${deviceId}`);
  },

  // 上传头像
  uploadAvatar: async (file: FormData) => {
    return httpClient.post('/users/me/avatar', file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除账户
  deleteAccount: async (password: string) => {
    return httpClient.delete('/users/me', {
      data: { password }
    });
  },

  // 导出用户数据
  exportData: async () => {
    return httpClient.get('/users/me/export');
  },

  // 获取用户统计信息
  getStatistics: async () => {
    return httpClient.get('/users/me/statistics');
  },

  // 获取用户活动日志
  getActivityLog: async (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);

    return httpClient.get(`/users/me/activity?${queryParams.toString()}`);
  },
};
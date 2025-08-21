// 用户相关类型
export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// 档案相关类型
export interface Profile {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  isDefault: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// 记录相关类型
export interface Record {
  id: string;
  title: string;
  content?: string;
  media: MediaFile[];
  location?: Location;
  mood?: string;
  tags: string[];
  profileId: string;
  createdAt: string;
  updatedAt: string;
}

// 媒体文件类型
export interface MediaFile {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  duration?: number;
  size: number;
  filename: string;
}

// 位置类型
export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
  city?: string;
  country?: string;
}

// 成就相关类型
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  requirements: any;
}

export interface UserAchievement {
  id: string;
  achievementId: string;
  userId: string;
  profileId?: string;
  status: 'not_started' | 'in_progress' | 'achieved';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  startedAt?: string;
  achievedAt?: string;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 分页类型
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 导航相关类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Profile: { profileId?: string };
  Record: { recordId?: string };
  Camera: undefined;
  Map: undefined;
  Achievement: undefined;
  Settings: undefined;
};

export type TabParamList = {
  Home: undefined;
  Records: undefined;
  Camera: undefined;
  Map: undefined;
  Profile: undefined;
};
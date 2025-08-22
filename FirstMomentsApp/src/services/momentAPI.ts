import { httpClient } from './httpClient';
import { ApiResponse } from '../types';

// 时光记录类型定义
export interface Moment {
  id: string;
  title: string;
  content: string;
  profile: {
    id: string;
    name: string;
    avatar?: string;
  };
  creator: {
    id: string;
    username: string;
    avatar?: string;
  };
  momentDate: string;
  media: MediaItem[];
  tags: string[];
  location?: LocationInfo;
  mood?: MoodType;
  weather?: WeatherInfo;
  privacy: 'public' | 'private' | 'friends';
  likes: LikeInfo[];
  comments: CommentInfo[];
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaItem {
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface LocationInfo {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  address: {
    formatted?: string;
    country?: string;
    state?: string;
    city?: string;
    district?: string;
    street?: string;
  };
  placeName?: string;
}

export type MoodType = 'happy' | 'sad' | 'excited' | 'calm' | 'angry' | 'surprised' | 'love' | 'grateful' | 'proud' | 'other';

export interface WeatherInfo {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy' | 'foggy' | 'stormy';
  temperature?: number;
  humidity?: number;
}

export interface LikeInfo {
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  createdAt: string;
}

export interface CommentInfo {
  id: string;
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  content: string;
  createdAt: string;
}

// 创建时光记录的数据类型
export interface CreateMomentData {
  title: string;
  content: string;
  profileId: string;
  momentDate?: string;
  tags?: string[];
  location?: LocationInfo;
  mood?: MoodType;
  weather?: WeatherInfo;
  privacy?: 'public' | 'private' | 'friends';
}

// 更新时光记录的数据类型
export interface UpdateMomentData {
  title?: string;
  content?: string;
  tags?: string[];
  location?: LocationInfo;
  mood?: MoodType;
  weather?: WeatherInfo;
  privacy?: 'public' | 'private' | 'friends';
}

// 查询参数类型
export interface GetMomentsParams {
  page?: number;
  limit?: number;
  profileId?: string;
  tags?: string[];
  mood?: MoodType;
  privacy?: 'public' | 'private' | 'friends';
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'momentDate' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

// 分页响应类型
export interface PaginatedMomentsResponse {
  moments: Moment[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

// 获取时光记录列表
export const getMoments = async (params?: GetMomentsParams): Promise<ApiResponse<PaginatedMomentsResponse>> => {
  const queryParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          queryParams.append(key, value.join(','));
        } else {
          queryParams.append(key, value.toString());
        }
      }
    });
  }
  
  // 为列表请求启用缓存，缓存时间2分钟
  const response = await httpClient.get(`/moments?${queryParams.toString()}`, {
    cache: {
      enabled: true,
      ttl: 2 * 60 * 1000, // 2分钟缓存
      key: `moments_list_${queryParams.toString()}`
    }
  });
  return response.data;
};

// 获取指定时光记录
export const getMoment = async (id: string): Promise<ApiResponse<{ moment: Moment }>> => {
  // 为详情请求启用缓存，缓存时间5分钟
  const response = await httpClient.get(`/moments/${id}`, {
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5分钟缓存
      key: `moment_detail_${id}`
    }
  });
  return response.data;
};

// 创建时光记录
export const createMoment = async (data: CreateMomentData, files?: File[]): Promise<ApiResponse<{ moment: Moment }>> => {
  const formData = new FormData();
  
  // 添加文本数据
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    }
  });
  
  // 添加媒体文件
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('media', file);
    });
  }
  
  const response = await httpClient.post('/moments', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 更新时光记录
export const updateMoment = async (id: string, data: UpdateMomentData): Promise<ApiResponse<{ moment: Moment }>> => {
  const response = await httpClient.put(`/moments/${id}`, data);
  
  // 更新后清除相关缓存
  httpClient.clearCache(`moment_detail_${id}`);
  // 清除列表缓存（因为列表中的数据可能已过期）
  httpClient.clearCache(); // 清除所有缓存，简化处理
  
  return response.data;
};

// 删除时光记录
export const deleteMoment = async (id: string): Promise<ApiResponse<{}>> => {
  const response = await httpClient.delete(`/moments/${id}`);
  
  // 删除后清除相关缓存
  httpClient.clearCache(`moment_detail_${id}`);
  // 清除列表缓存
  httpClient.clearCache();
  
  return response.data;
};

// 点赞/取消点赞
export const toggleLike = async (id: string): Promise<ApiResponse<{ moment: Moment }>> => {
  const response = await httpClient.post(`/moments/${id}/like`);
  
  // 点赞后清除详情缓存（点赞数变化）
  httpClient.clearCache(`moment_detail_${id}`);
  
  return response.data;
};

// 添加评论
export const addComment = async (id: string, content: string): Promise<ApiResponse<{ moment: Moment }>> => {
  const response = await httpClient.post(`/moments/${id}/comments`, { content });
  
  // 添加评论后清除详情缓存（评论数变化）
  httpClient.clearCache(`moment_detail_${id}`);
  
  return response.data;
};

// 删除评论
export const deleteComment = async (momentId: string, commentId: string): Promise<ApiResponse<{ moment: Moment }>> => {
  const response = await httpClient.delete(`/moments/${momentId}/comments/${commentId}`);
  
  // 删除评论后清除详情缓存（评论数变化）
  httpClient.clearCache(`moment_detail_${momentId}`);
  
  return response.data;
};

// 上传媒体文件
export const uploadMedia = async (files: File[]): Promise<ApiResponse<{ media: MediaItem[] }>> => {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('media', file);
  });
  
  const response = await httpClient.post('/moments/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const momentAPI = {
  getMoments,
  getMoment,
  createMoment,
  updateMoment,
  deleteMoment,
  toggleLike,
  addComment,
  deleteComment,
  uploadMedia,
};
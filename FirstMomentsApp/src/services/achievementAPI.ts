import { httpClient } from './httpClient';
import { Achievement, UserAchievement, ApiResponse, PaginatedResponse } from '../types';

// 获取所有成就模板
export const getAllAchievements = async (): Promise<Achievement[]> => {
  const response = await httpClient.get<ApiResponse<Achievement[]>>('/achievements');
  return response.data.data;
};

// 根据分类获取成就
export const getAchievementsByCategory = async (category: string): Promise<Achievement[]> => {
  const response = await httpClient.get<ApiResponse<Achievement[]>>(`/achievements/category/${category}`);
  return response.data.data;
};

// 获取用户成就
export const getUserAchievements = async (userId: string): Promise<UserAchievement[]> => {
  const response = await httpClient.get<ApiResponse<UserAchievement[]>>(`/users/${userId}/achievements`);
  return response.data.data;
};

// 获取用户在特定档案下的成就
export const getUserAchievementsByProfile = async (
  userId: string,
  profileId: string
): Promise<UserAchievement[]> => {
  const response = await httpClient.get<ApiResponse<UserAchievement[]>>(
    `/users/${userId}/profiles/${profileId}/achievements`
  );
  return response.data.data;
};

// 获取用户总积分
export const getUserTotalPoints = async (userId: string): Promise<number> => {
  const response = await httpClient.get<ApiResponse<{ totalPoints: number }>>(
    `/users/${userId}/achievements/points`
  );
  return response.data.data.totalPoints;
};

// 获取用户在特定档案下的积分
export const getUserProfilePoints = async (
  userId: string,
  profileId: string
): Promise<number> => {
  const response = await httpClient.get<ApiResponse<{ totalPoints: number }>>(
    `/users/${userId}/profiles/${profileId}/achievements/points`
  );
  return response.data.data.totalPoints;
};

// 检查成就进度
export const checkAchievementProgress = async (
  userId: string,
  achievementId: string
): Promise<UserAchievement> => {
  const response = await httpClient.post<ApiResponse<UserAchievement>>(
    `/users/${userId}/achievements/${achievementId}/check`
  );
  return response.data.data;
};

// 手动触发成就检查（用于特定事件后）
export const triggerAchievementCheck = async (
  userId: string,
  eventType: string,
  eventData?: any
): Promise<UserAchievement[]> => {
  const response = await httpClient.post<ApiResponse<UserAchievement[]>>(
    `/users/${userId}/achievements/trigger`,
    {
      eventType,
      eventData
    }
  );
  return response.data.data;
};
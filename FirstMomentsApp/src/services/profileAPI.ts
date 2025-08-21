import { httpClient } from './httpClient';

interface Profile {
  id: string;
  name: string;
  description?: string;
  avatar?: string;
  coverImage?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

type CreateProfileData = Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateProfileData = Partial<Profile>;

export const profileAPI = {
  // 获取用户所有档案
  getProfiles: async () => {
    return httpClient.get<Profile[]>('/profiles');
  },

  // 获取单个档案
  getProfile: async (id: string) => {
    return httpClient.get<Profile>(`/profiles/${id}`);
  },

  // 创建新档案
  createProfile: async (data: CreateProfileData) => {
    return httpClient.post<Profile>('/profiles', data);
  },

  // 更新档案
  updateProfile: async (id: string, data: UpdateProfileData) => {
    return httpClient.put<Profile>(`/profiles/${id}`, data);
  },

  // 删除档案
  deleteProfile: async (id: string) => {
    return httpClient.delete(`/profiles/${id}`);
  },

  // 设置默认档案
  setDefaultProfile: async (id: string) => {
    return httpClient.patch<Profile>(`/profiles/${id}/default`);
  }
};
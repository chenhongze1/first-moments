import { httpClient } from './httpClient';
import { Location, ApiResponse } from '../types';

// 打卡记录类型
export interface CheckInRecord {
  id: string;
  userId: string;
  profileId?: string;
  location: Location;
  address: string;
  photos?: string[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建打卡记录
export const createCheckIn = async (checkInData: {
  location: Location;
  address: string;
  profileId?: string;
  photos?: string[];
  note?: string;
}): Promise<CheckInRecord> => {
  const response = await httpClient.post<ApiResponse<CheckInRecord>>('/checkins', checkInData);
  return response.data.data;
};

// 获取用户打卡记录
export const getUserCheckIns = async (
  userId: string,
  params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    profileId?: string;
  }
): Promise<CheckInRecord[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.startDate) queryParams.append('startDate', params.startDate);
  if (params?.endDate) queryParams.append('endDate', params.endDate);
  if (params?.profileId) queryParams.append('profileId', params.profileId);

  const response = await httpClient.get<ApiResponse<CheckInRecord[]>>(
    `/users/${userId}/checkins?${queryParams.toString()}`
  );
  return response.data.data;
};

// 获取附近的打卡记录
export const getNearbyCheckIns = async (
  latitude: number,
  longitude: number,
  radius: number = 1000 // 默认1公里
): Promise<CheckInRecord[]> => {
  const response = await httpClient.get<ApiResponse<CheckInRecord[]>>(
    `/checkins/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`
  );
  return response.data.data;
};

// 获取特定打卡记录详情
export const getCheckInById = async (checkInId: string): Promise<CheckInRecord> => {
  const response = await httpClient.get<ApiResponse<CheckInRecord>>(`/checkins/${checkInId}`);
  return response.data.data;
};

// 更新打卡记录
export const updateCheckIn = async (
  checkInId: string,
  updateData: {
    note?: string;
    photos?: string[];
  }
): Promise<CheckInRecord> => {
  const response = await httpClient.put<ApiResponse<CheckInRecord>>(
    `/checkins/${checkInId}`,
    updateData
  );
  return response.data.data;
};

// 删除打卡记录
export const deleteCheckIn = async (checkInId: string): Promise<void> => {
  await httpClient.delete(`/checkins/${checkInId}`);
};

// 地理编码 - 根据坐标获取地址
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<{
  address: string;
  city: string;
  country: string;
  name?: string;
}> => {
  const response = await httpClient.get<ApiResponse<any>>(
    `/map/reverse-geocode?lat=${latitude}&lng=${longitude}`
  );
  return response.data.data;
};

// 地址搜索
export const searchPlaces = async (
  query: string,
  latitude?: number,
  longitude?: number
): Promise<Array<{
  id: string;
  name: string;
  address: string;
  location: Location;
  category?: string;
}>> => {
  const params = new URLSearchParams({ query });
  if (latitude && longitude) {
    params.append('lat', latitude.toString());
    params.append('lng', longitude.toString());
  }

  const response = await httpClient.get<ApiResponse<any>>(
    `/map/search?${params.toString()}`
  );
  return response.data.data;
};
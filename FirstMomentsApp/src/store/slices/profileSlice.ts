import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { profileAPI } from '../../services/profileAPI';

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

interface ProfileState {
  profiles: Profile[];
  currentProfile: Profile | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: ProfileState = {
  profiles: [],
  currentProfile: null,
  isLoading: false,
  error: null
};

// 获取用户所有档案
export const fetchProfilesAsync = createAsyncThunk(
  'profile/fetchProfiles',
  async (_, { rejectWithValue }) => {
    try {
      const response = await profileAPI.getProfiles();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取档案失败');
    }
  }
);

// 创建新档案
export const createProfileAsync = createAsyncThunk(
  'profile/createProfile',
  async (profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>, { rejectWithValue }) => {
    try {
      const response = await profileAPI.createProfile(profileData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '创建档案失败');
    }
  }
);

// 更新档案
export const updateProfileAsync = createAsyncThunk(
  'profile/updateProfile',
  async ({ id, data }: { id: string; data: Partial<Profile> }, { rejectWithValue }) => {
    try {
      const response = await profileAPI.updateProfile(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '更新档案失败');
    }
  }
);

// 删除档案
export const deleteProfileAsync = createAsyncThunk(
  'profile/deleteProfile',
  async (id: string, { rejectWithValue }) => {
    try {
      await profileAPI.deleteProfile(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '删除档案失败');
    }
  }
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setCurrentProfile: (state, action: PayloadAction<Profile>) => {
      state.currentProfile = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    clearProfiles: (state) => {
      state.profiles = [];
      state.currentProfile = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取档案列表
      .addCase(fetchProfilesAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfilesAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profiles = action.payload;
        // 设置默认档案为当前档案
        const defaultProfile = action.payload.find((p: Profile) => p.isDefault);
        if (defaultProfile && !state.currentProfile) {
          state.currentProfile = defaultProfile;
        }
      })
      .addCase(fetchProfilesAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 创建档案
      .addCase(createProfileAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createProfileAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profiles.push(action.payload);
      })
      .addCase(createProfileAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 更新档案
      .addCase(updateProfileAsync.fulfilled, (state, action) => {
        const index = state.profiles.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.profiles[index] = action.payload;
        }
        if (state.currentProfile?.id === action.payload.id) {
          state.currentProfile = action.payload;
        }
      })
      // 删除档案
      .addCase(deleteProfileAsync.fulfilled, (state, action) => {
        state.profiles = state.profiles.filter(p => p.id !== action.payload);
        if (state.currentProfile?.id === action.payload) {
          state.currentProfile = null;
        }
      });
  }
});

export const { setCurrentProfile, clearError, clearProfiles } = profileSlice.actions;
export default profileSlice.reducer;
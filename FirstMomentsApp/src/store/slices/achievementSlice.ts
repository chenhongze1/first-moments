import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllAchievements, getUserAchievements } from '../../services/achievementAPI';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  requirements: any;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
}

interface AchievementState {
  achievements: Achievement[];
  userAchievements: Achievement[];
  isLoading: boolean;
  error: string | null;
  totalPoints: number;
}

const initialState: AchievementState = {
  achievements: [],
  userAchievements: [],
  isLoading: false,
  error: null,
  totalPoints: 0
};

// 获取所有成就模板
export const fetchAchievementsAsync = createAsyncThunk(
  'achievement/fetchAchievements',
  async (_, { rejectWithValue }) => {
    try {
      // 这里应该调用API，暂时返回模拟数据
      return [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取成就失败');
    }
  }
);

// 获取用户成就
export const fetchUserAchievementsAsync = createAsyncThunk(
  'achievement/fetchUserAchievements',
  async (_, { rejectWithValue }) => {
    try {
      // 这里应该调用API，暂时返回模拟数据
      return [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '获取用户成就失败');
    }
  }
);

const achievementSlice = createSlice({
  name: 'achievement',
  initialState,
  reducers: {
    updateAchievementProgress: (state, action: PayloadAction<{ id: string; progress: number }>) => {
      const achievement = state.userAchievements.find(a => a.id === action.payload.id);
      if (achievement) {
        achievement.progress.current = action.payload.progress;
        achievement.progress.percentage = (action.payload.progress / achievement.progress.total) * 100;
        
        // 检查是否完成成就
        if (achievement.progress.percentage >= 100 && !achievement.isUnlocked) {
          achievement.isUnlocked = true;
          achievement.unlockedAt = new Date().toISOString();
          state.totalPoints += achievement.points;
        }
      }
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取成就模板
      .addCase(fetchAchievementsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAchievementsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.achievements = action.payload;
      })
      .addCase(fetchAchievementsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取用户成就
      .addCase(fetchUserAchievementsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserAchievementsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userAchievements = action.payload;
        // 计算总积分
        state.totalPoints = action.payload
          .filter((a: Achievement) => a.isUnlocked)
          .reduce((total: number, a: Achievement) => total + a.points, 0);
      })
      .addCase(fetchUserAchievementsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { updateAchievementProgress, clearError } = achievementSlice.actions;
export default achievementSlice.reducer;
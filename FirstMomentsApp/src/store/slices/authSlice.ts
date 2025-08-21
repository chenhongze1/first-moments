import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../../services/authAPI';

interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null
};

// 异步登录
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '登录失败');
    }
  }
);

// 异步注册
export const registerAsync = createAsyncThunk(
  'auth/register',
  async (userData: { username: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await authAPI.register(userData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '注册失败');
    }
  }
);

// 自动登录（从本地存储恢复认证状态）
export const autoLoginAsync = createAsyncThunk(
  'auth/autoLogin',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No token found');
      }
      const response = await authAPI.getCurrentUser();
      return { user: response.data, token };
    } catch (error: any) {
      await AsyncStorage.removeItem('auth_token');
      return rejectWithValue('自动登录失败');
    }
  }
);

// 忘记密码
export const forgotPasswordAsync = createAsyncThunk(
  'auth/forgotPassword',
  async (email: string, { rejectWithValue }) => {
    try {
      await authAPI.forgotPassword(email);
      return { message: '重置密码邮件已发送' };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '发送重置邮件失败');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      // 清除本地存储的token
      AsyncStorage.removeItem('auth_token');
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // 登录
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        // 保存token到本地存储
        AsyncStorage.setItem('auth_token', action.payload.token);
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 注册
      .addCase(registerAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        // 保存token到本地存储
        AsyncStorage.setItem('auth_token', action.payload.token);
      })
      .addCase(registerAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 自动登录
      .addCase(autoLoginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(autoLoginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(autoLoginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 忘记密码
      .addCase(forgotPasswordAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPasswordAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { logout, clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;
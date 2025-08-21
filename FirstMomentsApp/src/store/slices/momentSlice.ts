import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { momentAPI, Moment, CreateMomentData, UpdateMomentData, GetMomentsParams, PaginatedMomentsResponse } from '../../services/momentAPI';

// 异步操作：获取时光记录列表
export const fetchMomentsAsync = createAsyncThunk(
  'moment/fetchMoments',
  async (params: GetMomentsParams | undefined, { rejectWithValue }) => {
    try {
      const response = await momentAPI.getMoments(params);
      if (response.success) {
        return response.data;
      } else {
        return rejectWithValue(response.message || '获取时光记录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：获取指定时光记录
export const fetchMomentAsync = createAsyncThunk(
  'moment/fetchMoment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await momentAPI.getMoment(id);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '获取时光记录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：创建时光记录
export const createMomentAsync = createAsyncThunk(
  'moment/createMoment',
  async ({ data, files }: { data: CreateMomentData; files?: File[] }, { rejectWithValue }) => {
    try {
      const response = await momentAPI.createMoment(data, files);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '创建时光记录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：更新时光记录
export const updateMomentAsync = createAsyncThunk(
  'moment/updateMoment',
  async ({ id, data }: { id: string; data: UpdateMomentData }, { rejectWithValue }) => {
    try {
      const response = await momentAPI.updateMoment(id, data);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '更新时光记录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：删除时光记录
export const deleteMomentAsync = createAsyncThunk(
  'moment/deleteMoment',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await momentAPI.deleteMoment(id);
      if (response.success) {
        return id;
      } else {
        return rejectWithValue(response.message || '删除时光记录失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：点赞/取消点赞
export const toggleLikeAsync = createAsyncThunk(
  'moment/toggleLike',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await momentAPI.toggleLike(id);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '操作失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：添加评论
export const addCommentAsync = createAsyncThunk(
  'moment/addComment',
  async ({ id, content }: { id: string; content: string }, { rejectWithValue }) => {
    try {
      const response = await momentAPI.addComment(id, content);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '添加评论失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 异步操作：删除评论
export const deleteCommentAsync = createAsyncThunk(
  'moment/deleteComment',
  async ({ momentId, commentId }: { momentId: string; commentId: string }, { rejectWithValue }) => {
    try {
      const response = await momentAPI.deleteComment(momentId, commentId);
      if (response.success) {
        return response.data.moment;
      } else {
        return rejectWithValue(response.message || '删除评论失败');
      }
    } catch (error: any) {
      return rejectWithValue(error.message || '网络错误');
    }
  }
);

// 状态接口
interface MomentState {
  moments: Moment[];
  currentMoment: Moment | null;
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  } | null;
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;
  lastFetchParams: GetMomentsParams | null;
}

// 初始状态
const initialState: MomentState = {
  moments: [],
  currentMoment: null,
  pagination: null,
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  lastFetchParams: null,
};

// 创建slice
const momentSlice = createSlice({
  name: 'moment',
  initialState,
  reducers: {
    // 清除错误
    clearError: (state) => {
      state.error = null;
    },
    // 清除当前时光记录
    clearCurrentMoment: (state) => {
      state.currentMoment = null;
    },
    // 重置状态
    resetMomentState: (state) => {
      return initialState;
    },
    // 设置当前时光记录
    setCurrentMoment: (state, action: PayloadAction<Moment>) => {
      state.currentMoment = action.payload;
    },
    // 更新时光记录在列表中
    updateMomentInList: (state, action: PayloadAction<Moment>) => {
      const index = state.moments.findIndex(moment => moment.id === action.payload.id);
      if (index !== -1) {
        state.moments[index] = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    // 获取时光记录列表
    builder
      .addCase(fetchMomentsAsync.pending, (state, action) => {
        state.isLoading = true;
        state.error = null;
        state.lastFetchParams = action.meta.arg || null;
      })
      .addCase(fetchMomentsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.moments = action.payload.moments;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchMomentsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 获取指定时光记录
    builder
      .addCase(fetchMomentAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMomentAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentMoment = action.payload;
        state.error = null;
      })
      .addCase(fetchMomentAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // 创建时光记录
    builder
      .addCase(createMomentAsync.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createMomentAsync.fulfilled, (state, action) => {
        state.isCreating = false;
        state.moments.unshift(action.payload); // 添加到列表开头
        state.error = null;
      })
      .addCase(createMomentAsync.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload as string;
      });

    // 更新时光记录
    builder
      .addCase(updateMomentAsync.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateMomentAsync.fulfilled, (state, action) => {
        state.isUpdating = false;
        const index = state.moments.findIndex(moment => moment.id === action.payload.id);
        if (index !== -1) {
          state.moments[index] = action.payload;
        }
        if (state.currentMoment && state.currentMoment.id === action.payload.id) {
          state.currentMoment = action.payload;
        }
        state.error = null;
      })
      .addCase(updateMomentAsync.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // 删除时光记录
    builder
      .addCase(deleteMomentAsync.pending, (state) => {
        state.isDeleting = true;
        state.error = null;
      })
      .addCase(deleteMomentAsync.fulfilled, (state, action) => {
        state.isDeleting = false;
        state.moments = state.moments.filter(moment => moment.id !== action.payload);
        if (state.currentMoment && state.currentMoment.id === action.payload) {
          state.currentMoment = null;
        }
        state.error = null;
      })
      .addCase(deleteMomentAsync.rejected, (state, action) => {
        state.isDeleting = false;
        state.error = action.payload as string;
      });

    // 点赞/取消点赞
    builder
      .addCase(toggleLikeAsync.fulfilled, (state, action) => {
        const index = state.moments.findIndex(moment => moment.id === action.payload.id);
        if (index !== -1) {
          state.moments[index] = action.payload;
        }
        if (state.currentMoment && state.currentMoment.id === action.payload.id) {
          state.currentMoment = action.payload;
        }
      })
      .addCase(toggleLikeAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 添加评论
    builder
      .addCase(addCommentAsync.fulfilled, (state, action) => {
        const index = state.moments.findIndex(moment => moment.id === action.payload.id);
        if (index !== -1) {
          state.moments[index] = action.payload;
        }
        if (state.currentMoment && state.currentMoment.id === action.payload.id) {
          state.currentMoment = action.payload;
        }
      })
      .addCase(addCommentAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // 删除评论
    builder
      .addCase(deleteCommentAsync.fulfilled, (state, action) => {
        const index = state.moments.findIndex(moment => moment.id === action.payload.id);
        if (index !== -1) {
          state.moments[index] = action.payload;
        }
        if (state.currentMoment && state.currentMoment.id === action.payload.id) {
          state.currentMoment = action.payload;
        }
      })
      .addCase(deleteCommentAsync.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// 导出actions
export const {
  clearError,
  clearCurrentMoment,
  resetMomentState,
  setCurrentMoment,
  updateMomentInList,
} = momentSlice.actions;

// 导出reducer
export default momentSlice.reducer;
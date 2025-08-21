import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { createCheckIn, getUserCheckIns } from '../../services/mapAPI';

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

interface CheckinRecord {
  id: string;
  location: Location;
  timestamp: string;
  photos?: string[];
  notes?: string;
  profileId: string;
}

interface MapState {
  currentLocation: Location | null;
  checkinRecords: CheckinRecord[];
  nearbyLocations: Location[];
  isLoading: boolean;
  error: string | null;
  locationPermission: 'granted' | 'denied' | 'pending';
}

const initialState: MapState = {
  currentLocation: null,
  checkinRecords: [],
  nearbyLocations: [],
  isLoading: false,
  error: null,
  locationPermission: 'pending'
};

// 获取当前位置
export const getCurrentLocationAsync = createAsyncThunk(
  'map/getCurrentLocation',
  async (_, { rejectWithValue }) => {
    try {
      // 这里应该调用位置服务API
      return {
        latitude: 0,
        longitude: 0
      };
    } catch (error: any) {
      return rejectWithValue('获取位置失败');
    }
  }
);

// 创建打卡记录
export const createCheckinAsync = createAsyncThunk(
  'map/createCheckin',
  async (checkinData: Omit<CheckinRecord, 'id' | 'timestamp'>, { rejectWithValue }) => {
    try {
      // 这里应该调用API创建打卡记录
      const newCheckin: CheckinRecord = {
        ...checkinData,
        id: Date.now().toString(),
        timestamp: new Date().toISOString()
      };
      return newCheckin;
    } catch (error: any) {
      return rejectWithValue('创建打卡记录失败');
    }
  }
);

// 获取打卡记录
export const fetchCheckinRecordsAsync = createAsyncThunk(
  'map/fetchCheckinRecords',
  async (profileId: string, { rejectWithValue }) => {
    try {
      // 这里应该调用API获取打卡记录
      return [];
    } catch (error: any) {
      return rejectWithValue('获取打卡记录失败');
    }
  }
);

const mapSlice = createSlice({
  name: 'map',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    setLocationPermission: (state, action: PayloadAction<'granted' | 'denied' | 'pending'>) => {
      state.locationPermission = action.payload;
    },
    addCheckinRecord: (state, action: PayloadAction<CheckinRecord>) => {
      state.checkinRecords.unshift(action.payload);
    },
    clearError: (state) => {
      state.error = null;
    },
    clearCheckinRecords: (state) => {
      state.checkinRecords = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // 获取当前位置
      .addCase(getCurrentLocationAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getCurrentLocationAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload;
      })
      .addCase(getCurrentLocationAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 创建打卡记录
      .addCase(createCheckinAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCheckinAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkinRecords.unshift(action.payload);
      })
      .addCase(createCheckinAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 获取打卡记录
      .addCase(fetchCheckinRecordsAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCheckinRecordsAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.checkinRecords = action.payload;
      })
      .addCase(fetchCheckinRecordsAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const {
  setCurrentLocation,
  setLocationPermission,
  addCheckinRecord,
  clearError,
  clearCheckinRecords
} = mapSlice.actions;
export default mapSlice.reducer;
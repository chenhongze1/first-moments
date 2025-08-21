import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface Modal {
  id: string;
  type: string;
  props?: any;
}

interface UIState {
  isLoading: boolean;
  toasts: Toast[];
  modals: Modal[];
  theme: 'light' | 'dark';
  tabBarVisible: boolean;
  headerVisible: boolean;
  keyboardHeight: number;
}

const initialState: UIState = {
  isLoading: false,
  toasts: [],
  modals: [],
  theme: 'light',
  tabBarVisible: true,
  headerVisible: true,
  keyboardHeight: 0
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    
    showToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        ...action.payload,
        id: Date.now().toString(),
        duration: action.payload.duration || 3000
      };
      state.toasts.push(toast);
    },
    
    hideToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    showModal: (state, action: PayloadAction<Omit<Modal, 'id'>>) => {
      const modal: Modal = {
        ...action.payload,
        id: Date.now().toString()
      };
      state.modals.push(modal);
    },
    
    hideModal: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.id !== action.payload);
    },
    
    hideModalByType: (state, action: PayloadAction<string>) => {
      state.modals = state.modals.filter(modal => modal.type !== action.payload);
    },
    
    clearModals: (state) => {
      state.modals = [];
    },
    
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },
    
    setTabBarVisible: (state, action: PayloadAction<boolean>) => {
      state.tabBarVisible = action.payload;
    },
    
    setHeaderVisible: (state, action: PayloadAction<boolean>) => {
      state.headerVisible = action.payload;
    },
    
    setKeyboardHeight: (state, action: PayloadAction<number>) => {
      state.keyboardHeight = action.payload;
    }
  }
});

export const {
  setLoading,
  showToast,
  hideToast,
  clearToasts,
  showModal,
  hideModal,
  hideModalByType,
  clearModals,
  setTheme,
  setTabBarVisible,
  setHeaderVisible,
  setKeyboardHeight
} = uiSlice.actions;

export default uiSlice.reducer;
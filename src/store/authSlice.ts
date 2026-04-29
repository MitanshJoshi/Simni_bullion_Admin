import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AdminUser } from '../services/authService';

interface AuthState {
  isAuthenticated: boolean;
  user: AdminUser | null;
  accessToken: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<{ user: AdminUser; accessToken: string }>) {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    clearCredentials(state) {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;

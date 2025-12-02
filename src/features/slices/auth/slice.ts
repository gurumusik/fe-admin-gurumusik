/* eslint-disable @typescript-eslint/no-explicit-any */
// src/features/auth/slice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as AuthAPI from '@/services/api/auth.api';

type AuthState = {
  user: null | Awaited<ReturnType<typeof AuthAPI.getMe>>; // MeResp { id, name, role }
  status: 'idle'|'loading'|'succeeded'|'failed';
  error?: string;
};

const initialState: AuthState = { user: null, status: 'idle' };

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: AuthAPI.LoginPayload, { rejectWithValue }) => {
    try {
      const me = await AuthAPI.login(payload); // login() kamu sudah simpan token + return getMe()
      return me; // MeResp
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Login gagal');
    }
  }
);

export const meThunk = createAsyncThunk('auth/me', async () => AuthAPI.getMe());

export const logoutThunk = createAsyncThunk(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await AuthAPI.logout(); // panggil endpoint + clear tokenStorage
      dispatch(logout());     // bersihkan state redux
      return true;
    } catch (e: any) {
      // tetap kosongkan state agar user benar-benar keluar
      dispatch(logout());
      return rejectWithValue(e?.message ?? 'Logout gagal');
    }
  }
);

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(s, a) { s.user = a.payload; },
    logout(s) {
      s.user = null;
      s.status = 'idle';
      s.error = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s)=>{ s.status='loading'; s.error=undefined; })
     .addCase(loginThunk.fulfilled, (s,a)=>{ s.status='succeeded'; s.user=a.payload; })
     .addCase(loginThunk.rejected, (s,a)=>{ s.status='failed'; s.error=a.payload as string; })

     .addCase(meThunk.pending, (s)=>{ if (s.status==='idle') s.status='loading'; })
     .addCase(meThunk.fulfilled, (s,a)=>{ s.user=a.payload; s.status='succeeded'; })
     .addCase(meThunk.rejected, (s)=>{ s.status='failed'; })

     .addCase(logoutThunk.pending, (s)=>{ s.status='loading'; })
     .addCase(logoutThunk.fulfilled, (s)=>{ s.status='idle'; s.user=null; })
     .addCase(logoutThunk.rejected, (s,a)=>{ s.status='idle'; s.user=null; s.error=a.payload as string; });
  }
});

export const { setUser, logout } = slice.actions;
export default slice.reducer;

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as AuthAPI from '@/services/api/auth.api';

type AuthState = {
  user: null | Awaited<ReturnType<typeof AuthAPI.getMe>>;
  status: 'idle'|'loading'|'succeeded'|'failed';
  error?: string;
};

const initialState: AuthState = { user: null, status: 'idle' };

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (payload: AuthAPI.LoginPayload, { rejectWithValue }) => {
    try {
      const me = await AuthAPI.login(payload);
      return me;
    } catch (e: any) {
      return rejectWithValue(e?.message ?? 'Login gagal');
    }
  }
);

export const meThunk = createAsyncThunk('auth/me', async () => AuthAPI.getMe());

const slice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser(s, a) { s.user = a.payload; },
    logout(s) { s.user = null; /* token dibersihkan di AuthAPI.logout() */ },
  },
  extraReducers: (b) => {
    b.addCase(loginThunk.pending, (s)=>{ s.status='loading'; })
     .addCase(loginThunk.fulfilled, (s,a)=>{ s.status='succeeded'; s.user=a.payload; })
     .addCase(loginThunk.rejected, (s,a)=>{ s.status='failed'; s.error=a.payload as string; })
     .addCase(meThunk.fulfilled, (s,a)=>{ s.user = a.payload; });
  }
});

export const { setUser, logout } = slice.actions;
export default slice.reducer;

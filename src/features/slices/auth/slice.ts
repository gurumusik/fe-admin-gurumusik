/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as AuthAPI from "@/services/api/auth.api";

type AuthState = {
  user: null | Awaited<ReturnType<typeof AuthAPI.getMe>>;
  status: "idle" | "loading" | "succeeded" | "failed";
  error?: string;
  magicLinkMessage?: string;
};

const initialState: AuthState = { user: null, status: "idle" };

export const requestMagicLinkThunk = createAsyncThunk(
  "auth/requestMagicLink",
  async (payload: AuthAPI.RequestMagicLinkPayload, { rejectWithValue }) => {
    try {
      return await AuthAPI.requestMagicLink(payload);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? "Gagal mengirim link login");
    }
  }
);

export const consumeMagicLinkThunk = createAsyncThunk(
  "auth/consumeMagicLink",
  async (token: string, { rejectWithValue }) => {
    try {
      return await AuthAPI.consumeMagicLink(token);
    } catch (e: any) {
      return rejectWithValue(e?.message ?? "Link login tidak valid");
    }
  }
);

export const meThunk = createAsyncThunk("auth/me", async () => AuthAPI.getMe());

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      await AuthAPI.logout();
      dispatch(logout());
      return true;
    } catch (e: any) {
      dispatch(logout());
      return rejectWithValue(e?.message ?? "Logout gagal");
    }
  }
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser(s, a) {
      s.user = a.payload;
    },
    logout(s) {
      s.user = null;
      s.status = "idle";
      s.error = undefined;
      s.magicLinkMessage = undefined;
    },
  },
  extraReducers: (b) => {
    b.addCase(requestMagicLinkThunk.pending, (s) => {
      s.status = "loading";
      s.error = undefined;
      s.magicLinkMessage = undefined;
    })
      .addCase(requestMagicLinkThunk.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.magicLinkMessage = a.payload.message;
      })
      .addCase(requestMagicLinkThunk.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string;
      })

      .addCase(consumeMagicLinkThunk.pending, (s) => {
        s.status = "loading";
        s.error = undefined;
      })
      .addCase(consumeMagicLinkThunk.fulfilled, (s, a) => {
        s.status = "succeeded";
        s.user = a.payload;
        s.magicLinkMessage = undefined;
      })
      .addCase(consumeMagicLinkThunk.rejected, (s, a) => {
        s.status = "failed";
        s.error = a.payload as string;
      })

      .addCase(meThunk.pending, (s) => {
        if (s.status === "idle") s.status = "loading";
      })
      .addCase(meThunk.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "succeeded";
      })
      .addCase(meThunk.rejected, (s) => {
        s.status = "failed";
        s.user = null;
      })

      .addCase(logoutThunk.pending, (s) => {
        s.status = "loading";
      })
      .addCase(logoutThunk.fulfilled, (s) => {
        s.status = "idle";
        s.user = null;
      })
      .addCase(logoutThunk.rejected, (s, a) => {
        s.status = "idle";
        s.user = null;
        s.error = a.payload as string;
      });
  },
});

export const { setUser, logout } = slice.actions;
export default slice.reducer;

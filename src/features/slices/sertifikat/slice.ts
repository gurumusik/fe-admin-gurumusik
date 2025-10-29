/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { patchSertifikatStatus } from '@/services/api/sertifikat.api';
import type {
  PatchSertifikatStatusPayload,
  PatchSertifikatStatusResponse,
  SertifikatSliceState,
} from './types';

export const patchSertifikatStatusThunk = createAsyncThunk<
  PatchSertifikatStatusResponse,
  PatchSertifikatStatusPayload,
  { rejectValue: string }
>('sertifikat/patchStatus', async (payload, { rejectWithValue }) => {
  try {
    const res = await patchSertifikatStatus(payload.id, {
      status: payload.status,
      alasan_penolakan: payload.alasan_penolakan ?? null,
    });
    return res;
  } catch (err: any) {
    return rejectWithValue(err?.message ?? 'Gagal memperbarui status sertifikat');
  }
});

const initialState: SertifikatSliceState = {
  updatingById: {},
  errorById: {},
  lastUpdated: null,
};

const sertifikatSlice = createSlice({
  name: 'sertifikat',
  initialState,
  reducers: {
    resetSertifikatStatusState(state) {
      state.updatingById = {};
      state.errorById = {};
      state.lastUpdated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(patchSertifikatStatusThunk.pending, (state, action) => {
        const id = String(action.meta.arg.id);
        state.updatingById[id] = true;
        state.errorById[id] = null;
      })
      .addCase(
        patchSertifikatStatusThunk.fulfilled,
        (state, action: PayloadAction<PatchSertifikatStatusResponse>) => {
          const id = String(action.payload.id);
          state.updatingById[id] = false;
          state.errorById[id] = null;
          state.lastUpdated = { id: action.payload.id, status: action.payload.status };
        }
      )
      .addCase(patchSertifikatStatusThunk.rejected, (state, action) => {
        const id = String(action.meta.arg.id);
        state.updatingById[id] = false;
        state.errorById[id] = action.payload ?? 'Gagal memperbarui status sertifikat';
      });
  },
});

export const { resetSertifikatStatusState } = sertifikatSlice.actions;
export default sertifikatSlice.reducer;

// Selectors
export const selectSertifikatUpdating = (id: number | string) => (s: any) =>
  Boolean(s.sertifikat?.updatingById?.[String(id)]);
export const selectSertifikatError = (id: number | string) => (s: any) =>
  s.sertifikat?.errorById?.[String(id)] ?? null;
export const selectSertifikatLastUpdated = (s: any) => s.sertifikat?.lastUpdated ?? null;

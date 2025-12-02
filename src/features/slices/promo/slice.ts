// src/features/slices/promo/slice.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '@/app/store';
import type { ApiPromo, PromoSliceState, PromoListParams } from './types';
import { listFlashPromos, listGeneralPromos } from '@/services/api/promo.api';

// ============== THUNKS ==============

// Flash (promo_for: 'modul' | 'class')
export const fetchFlashPromosThunk = createAsyncThunk<
  ApiPromo[],
  PromoListParams | undefined
>('promo/fetchFlashPromos', async (params, { rejectWithValue }) => {
  try {
    const data = await listFlashPromos(params);
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Gagal mengambil data flash sale');
  }
});

// General (promo_for: 'general')
export const fetchGeneralPromosThunk = createAsyncThunk<
  ApiPromo[],
  PromoListParams | undefined
>('promo/fetchGeneralPromos', async (params, { rejectWithValue }) => {
  try {
    const data = await listGeneralPromos(params);
    return data;
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Gagal mengambil promo general');
  }
});

// ============== STATE ==============
const initialState: PromoSliceState = {
  // FLASH
  items: [],
  status: 'idle',
  error: null,

  // GENERAL
  generalItems: [],
  generalStatus: 'idle',
  generalError: null,
};

// ============== SLICE ==============
const promoSlice = createSlice({
  name: 'promo',
  initialState,
  reducers: {},
  extraReducers: builder => {
    // --- FLASH ---
    builder
      .addCase(fetchFlashPromosThunk.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFlashPromosThunk.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchFlashPromosThunk.rejected, (state, action) => {
        state.status = 'failed';
        state.error = (action.payload as string) || 'Gagal mengambil data flash sale';
      });

    // --- GENERAL ---
    builder
      .addCase(fetchGeneralPromosThunk.pending, state => {
        state.generalStatus = 'loading';
        state.generalError = null;
      })
      .addCase(fetchGeneralPromosThunk.fulfilled, (state, action) => {
        state.generalStatus = 'succeeded';
        state.generalItems = action.payload;
      })
      .addCase(fetchGeneralPromosThunk.rejected, (state, action) => {
        state.generalStatus = 'failed';
        state.generalError = (action.payload as string) || 'Gagal mengambil promo general';
      });
  },
});

export default promoSlice.reducer;

// ============== SELECTORS (kompatibel dgn page) ==============
export const selectPromoStatus = (s: RootState) => s.promo.status;
export const selectPromoError = (s: RootState) => s.promo.error;
export const selectFlashPromos = (s: RootState) => s.promo.items;

export const selectGeneralStatus = (s: RootState) => s.promo.generalStatus;
export const selectGeneralError = (s: RootState) => s.promo.generalError;
export const selectGeneralPromos = (s: RootState) => s.promo.generalItems;

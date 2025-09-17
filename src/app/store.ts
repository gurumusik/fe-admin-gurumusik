import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    // tambahkan slice lain
  },
  // middleware default sudah cukup (immer, serializableCheck, thunk)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

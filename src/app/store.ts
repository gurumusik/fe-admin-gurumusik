import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/slices/auth/slice';
import instrumentReducer from '@/features/slices/instruments/slice'
import instrumentWizardReducer from '@/features/slices/instrumentWizard/slice';
import programReducer from '@/features/slices/program/slice';
import registrasiGuruReducer from '@/features/slices/registrasiGuru/slice';
import moduleReducer from '@/features/slices/module/slice';
import moduleAdminDetailReducer from '@/features/slices/module/detailSlice';
import guruReducer from '@/features/slices/guru/slice';
import performaMengajarAdminReducer from '@/features/slices/rating/slice';
import guruClassesReducer from '@/features/slices/guru/classes/classesSlice';
import promoReducer from '@/features/slices/promo/slice';
import muridReducer from '@/features/slices/murid/slice';
import transaksiReducer from '@/features/slices/transaksi/slice';
import payoutGuruReducer from '@/features/slices/payoutGuru/slice';
import earningsChartReducer from '@/features/slices/earnings/slice'


export const store = configureStore({
  reducer: {
    auth: authReducer,
    instrument: instrumentReducer,
    instrumentWizard: instrumentWizardReducer,
    program: programReducer,
    registrasiGuru: registrasiGuruReducer,
    modulesAdmin: moduleReducer,
    moduleAdminDetail: moduleAdminDetailReducer,
    guru: guruReducer,
    performaMengajarAdmin: performaMengajarAdminReducer,
    guruClasses: guruClassesReducer,
    promo: promoReducer,
    murid: muridReducer,
    transaksi: transaksiReducer,
    payoutGuru: payoutGuruReducer,
    earningsChart: earningsChartReducer,
    // tambahkan slice lain
  },
  // middleware default sudah cukup (immer, serializableCheck, thunk)
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

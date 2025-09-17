import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { PATHS } from '../paths';

export default function RequireAuth() {
  const user = useAppSelector(s => s.auth.user);
  return user ? <Outlet /> : <Navigate to={PATHS.LOGIN} replace />;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { baseUrl } from '../http/url';
import { ENDPOINTS } from '../endpoints';

export type EmployeeUser = {
  id: number;
  nama: string;
  email: string;
  role: string;
  profile_pic_url?: string | null;
};

export type EmployeeItem = {
  id: number;
  user_id: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  user?: EmployeeUser;
};

export async function listEmployees() {
  return baseUrl.request<{ data?: EmployeeItem[] } | EmployeeItem[]>(
    ENDPOINTS.EMPLOYEES.LIST,
    { method: 'GET' }
  );
}

export async function createEmployee(payload: { user_id?: number; email?: string; is_active?: boolean }) {
  return baseUrl.request<any>(ENDPOINTS.EMPLOYEES.CREATE, {
    method: 'POST',
    json: payload,
  });
}

export async function updateEmployeeStatus(id: number | string, is_active: boolean) {
  return baseUrl.request<any>(ENDPOINTS.EMPLOYEES.UPDATE(id), {
    method: 'PATCH',
    json: { is_active },
  });
}

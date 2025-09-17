import { ENV } from '@/config/env';
import { createFetchClient } from './fetcher';

export const baseUrl = createFetchClient({ baseUrl: ENV.API_BASE_URL });
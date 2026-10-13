import { api as httpApi } from './http.js';
import { mockApi } from './mock.js';

// Switch to the real backend by setting VITE_USE_MOCK=false in .env.
const useMock = import.meta.env.VITE_USE_MOCK !== 'false';

export const api = useMock ? mockApi : httpApi;
export const usingMockData = useMock;

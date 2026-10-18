export const API_BASE = (
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  (import.meta.env.PROD ? '' : 'http://localhost:3001')
).replace(/\/+$/, '');

export const API_URL = API_BASE;
export default API_BASE;

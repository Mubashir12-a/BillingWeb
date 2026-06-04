// API base — uses env variable in production (Vercel), falls back to proxy in dev
export const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

export const API = {
  customers:  `${API_BASE}/customers`,
  bills:      `${API_BASE}/bills`,
  billStats:  `${API_BASE}/bills/stats/summary`,
  adminVerify:`${API_BASE}/admin/verify`,
};

export const STORE = {
  name:          'Vegetable Store',
  address:       'Main Market, Soura Srinagar',
  pincode:       '190011',
  phone:         '+91-70068-89841',
  email:         'ma2625645@gmail.com',
  bankName:      'J&K Bank',
  accountHolder: 'JAVID AHMAD TELI',
  accountNo:     '0601010100000453',
  ifsc:          'JAKA01NAGGAM',
  upiPhone:      '7006889841',
  imgbbKey:      '30d62e9df87d6c179a578cdb3eb61c94',
};

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(d.getDate()).padStart(2,'0')}-${months[d.getMonth()]}-${d.getFullYear()}`;
}

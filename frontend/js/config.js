// Auto-detects local vs production — no changes needed after deploy!
const API_BASE = window.location.hostname === 'localhost'
  ? 'http://localhost:5000/api'
  : '/api';

const API = {
  customers: `${API_BASE}/customers`,
  bills: `${API_BASE}/bills`,
  billStats: `${API_BASE}/bills/stats/summary`,
  adminVerify: `${API_BASE}/admin/verify`,
  health: `${API_BASE}/health`,
};

// Store info (from original app)
const STORE = {
  name: 'Vegetable Store',
  address: 'Main Market, Soura Srinagar',
  pincode: '190011',
  phone: '+91-70068-89841',
  email: 'ma2625645@gmail.com',
  bankName: 'J&K Bank',
  accountHolder: 'JAVID AHMAD TELI',
  accountNo: '0601010100000453',
  ifsc: 'JAKA01NAGGAM',
  upiPhone: '7006889841',
  imgbbKey: '30d62e9df87d6c179a578cdb3eb61c94'
};

// Format date helper
function formatDate(dateStr) {
  const date = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${String(date.getDate()).padStart(2,'0')}-${months[date.getMonth()]}-${date.getFullYear()}`;
}

// Toast notification
function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Active nav link
function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('href') === page);
  });
}

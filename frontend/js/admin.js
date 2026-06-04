// ===== ADMIN PANEL =====
let pin = '';
let allCustomers = [];
let isAuthenticated = false;

document.addEventListener('DOMContentLoaded', () => {
  // PIN Keypad
  document.querySelectorAll('.key-btn').forEach(btn => {
    btn.addEventListener('click', () => handleKey(btn.dataset.key));
  });

  // Tab switching
  document.querySelectorAll('.pill-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.pill-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const tabId = tab.dataset.tab;
      document.getElementById('tab-add').style.display = tabId === 'add' ? 'block' : 'none';
      document.getElementById('tab-manage').style.display = tabId === 'manage' ? 'block' : 'none';
      if (tabId === 'manage') loadManageList();
    });
  });

  // Lock button
  document.getElementById('lockBtn').addEventListener('click', () => {
    isAuthenticated = false;
    pin = '';
    updateDots();
    document.getElementById('adminDashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
  });

  // Add Customer
  document.getElementById('addCustomerBtn').addEventListener('click', addCustomer);

  // Edit Modal
  document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
  document.getElementById('editModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeEditModal();
  });
  document.getElementById('saveEditBtn').addEventListener('click', saveEdit);
  document.getElementById('deleteCustomerBtn').addEventListener('click', deleteCustomer);

  // Manage search
  document.getElementById('manageSearch').addEventListener('input', e => {
    renderManageList(filterCustomers(e.target.value));
  });
});

// ===== PIN LOGIC =====
function handleKey(key) {
  if (key === 'clear') {
    pin = '';
  } else if (key === 'del') {
    pin = pin.slice(0, -1);
  } else if (pin.length < 4) {
    pin += key;
  }
  updateDots();
  if (pin.length === 4) {
    setTimeout(verifyPin, 150);
  }
}

function updateDots() {
  for (let i = 0; i < 4; i++) {
    const dot = document.getElementById(`dot-${i}`);
    dot.classList.toggle('filled', i < pin.length);
  }
}

async function verifyPin() {
  try {
    const res = await fetch(API.adminVerify, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const json = await res.json();
    if (json.success) {
      isAuthenticated = true;
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      pin = '';
      updateDots();
      loadDashboard();
    } else {
      showPinError('Incorrect PIN. Try again.');
    }
  } catch (err) {
    showPinError('Cannot connect to server');
  }
}

function showPinError(msg) {
  const dots = document.querySelectorAll('.pin-dot');
  dots.forEach(d => d.classList.add('shake'));
  document.getElementById('pinError').textContent = msg;
  setTimeout(() => {
    dots.forEach(d => d.classList.remove('shake', 'filled'));
    document.getElementById('pinError').textContent = '';
    pin = '';
  }, 800);
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [custRes, statsRes] = await Promise.all([
      fetch(API.customers),
      fetch(API.billStats)
    ]);
    const custJson = await custRes.json();
    const statsJson = await statsRes.json();

    if (custJson.success) {
      allCustomers = custJson.data;
      document.getElementById('statCustomers').textContent = allCustomers.length;
    }
    if (statsJson.success) {
      const { todayBills, monthTotal } = statsJson.data;
      document.getElementById('statToday').textContent = todayBills;
      document.getElementById('statMonth').textContent = monthTotal >= 1000
        ? `₹${(monthTotal / 1000).toFixed(1)}k`
        : `₹${monthTotal}`;
    }
  } catch (err) {
    console.error('Dashboard load error', err);
  }
}

// ===== ADD CUSTOMER =====
async function addCustomer() {
  const name = document.getElementById('newName').value.trim().toUpperCase();
  const phone = document.getElementById('newPhone').value.trim().replace(/\D/g, '');
  const notes = document.getElementById('newNotes').value.trim();

  if (!name) { showToast('Name is required', 'error'); document.getElementById('newName').focus(); return; }
  if (!phone || phone.length < 10) { showToast('Enter valid phone number', 'error'); document.getElementById('newPhone').focus(); return; }

  const btn = document.getElementById('addCustomerBtn');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    const res = await fetch(API.customers, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, notes })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`${name} added successfully!`, 'success');
      document.getElementById('newName').value = '';
      document.getElementById('newPhone').value = '';
      document.getElementById('newNotes').value = '';
      allCustomers.push(json.data);
      document.getElementById('statCustomers').textContent = allCustomers.length;
    } else {
      showToast(json.message || 'Failed to add', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg> Add Customer`;
  }
}

// ===== MANAGE =====
function loadManageList() {
  if (!allCustomers.length) {
    fetch(API.customers).then(r => r.json()).then(j => {
      allCustomers = j.data || [];
      renderManageList(allCustomers);
    });
  } else {
    renderManageList(allCustomers);
  }
}

function filterCustomers(q) {
  if (!q.trim()) return allCustomers;
  return allCustomers.filter(c => c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q));
}

function renderManageList(customers) {
  const list = document.getElementById('manageList');
  if (!customers.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">👤</div><p>No customers found</p></div>`;
    return;
  }
  list.innerHTML = customers.map((c, i) => `
    <div class="manage-item" style="animation-delay:${Math.min(i*0.02,0.5)}s">
      <div class="customer-avatar">${c.name.charAt(0)}</div>
      <div class="customer-info">
        <div class="customer-name">${c.name}</div>
        <div class="customer-phone">+${c.phone}</div>
      </div>
      <button class="edit-btn" data-id="${c._id}" data-name="${c.name.replace(/"/g,'&quot;')}" data-phone="${c.phone}" data-notes="${(c.notes||'').replace(/"/g,'&quot;')}" title="Edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset));
  });
}

// ===== EDIT MODAL =====
function openEditModal({ id, name, phone, notes }) {
  document.getElementById('editId').value = id;
  document.getElementById('editName').value = name;
  document.getElementById('editPhone').value = phone;
  document.getElementById('editNotes').value = notes || '';
  document.getElementById('editModal').classList.add('show');
}

function closeEditModal() {
  document.getElementById('editModal').classList.remove('show');
}

async function saveEdit() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('editName').value.trim().toUpperCase();
  const phone = document.getElementById('editPhone').value.trim().replace(/\D/g, '');
  const notes = document.getElementById('editNotes').value.trim();

  if (!name || !phone) { showToast('Name and phone required', 'error'); return; }

  try {
    const res = await fetch(`${API.customers}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone, notes })
    });
    const json = await res.json();
    if (json.success) {
      showToast('Customer updated!', 'success');
      closeEditModal();
      allCustomers = allCustomers.map(c => c._id === id ? json.data : c);
      renderManageList(allCustomers);
    } else {
      showToast('Update failed', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

async function deleteCustomer() {
  const id = document.getElementById('editId').value;
  const name = document.getElementById('editName').value;
  if (!confirm(`Remove "${name}" from the customer list?`)) return;
  try {
    const res = await fetch(`${API.customers}/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast(`${name} removed`, 'warning');
      closeEditModal();
      allCustomers = allCustomers.filter(c => c._id !== id);
      document.getElementById('statCustomers').textContent = allCustomers.length;
      renderManageList(allCustomers);
    } else {
      showToast('Delete failed', 'error');
    }
  } catch (err) {
    showToast('Server error', 'error');
  }
}

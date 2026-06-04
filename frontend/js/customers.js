let allCustomers = [];

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('searchInput').addEventListener('input', e => {
    renderCustomers(filterCustomers(e.target.value));
  });
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('historyModal').classList.remove('show');
  });
  document.getElementById('historyModal').addEventListener('click', e => {
    if (e.target === e.currentTarget) e.currentTarget.classList.remove('show');
  });
  await loadCustomers();
});

async function loadCustomers() {
  try {
    const res = await fetch(API.customers);
    const json = await res.json();
    if (json.success) {
      allCustomers = json.data;
      document.getElementById('customerCountLabel').textContent = `${allCustomers.length} active customers`;
      renderCustomers(allCustomers);
    }
  } catch (err) {
    document.getElementById('customerList').innerHTML = `<div class="empty-state"><div class="empty-icon">❌</div><p>Cannot reach server</p></div>`;
  }
}

function filterCustomers(q) {
  if (!q.trim()) return allCustomers;
  const query = q.toLowerCase();
  return allCustomers.filter(c => c.name.toLowerCase().includes(query) || c.phone.includes(query));
}

function renderCustomers(customers) {
  const list = document.getElementById('customerList');
  if (!customers.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No customers found</p></div>`;
    return;
  }

  // Group by first letter
  const grouped = {};
  customers.forEach(c => {
    const letter = c.name.charAt(0).toUpperCase();
    if (!grouped[letter]) grouped[letter] = [];
    grouped[letter].push(c);
  });

  let html = '';
  Object.keys(grouped).sort().forEach(letter => {
    html += `<div class="section-label">${letter}</div>`;
    grouped[letter].forEach((c, i) => {
      html += `
        <div class="customer-card" style="animation-delay:${i*0.02}s" data-id="${c._id}">
          <div class="customer-avatar">${c.name.charAt(0)}</div>
          <div class="customer-info">
            <div class="customer-name">${c.name}</div>
            <div class="customer-phone">+${c.phone}</div>
            ${c.notes ? `<div style="font-size:0.7rem;color:var(--text-muted);margin-top:2px">${c.notes}</div>` : ''}
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0">
            <a class="icon-btn" href="https://wa.me/${c.phone}" target="_blank" title="WhatsApp" style="text-decoration:none">
              <svg viewBox="0 0 24 24" fill="currentColor" style="color:#25d366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
            </a>
            <button class="icon-btn view-history-btn" data-id="${c._id}" data-name="${c.name}" title="Bill History">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </button>
          </div>
        </div>
      `;
    });
  });

  list.innerHTML = html;

  document.querySelectorAll('.view-history-btn').forEach(btn => {
    btn.addEventListener('click', () => showCustomerHistory(btn.dataset.id, btn.dataset.name));
  });
}

async function showCustomerHistory(customerId, customerName) {
  document.getElementById('modalCustomerName').textContent = customerName;
  document.getElementById('modalBillList').innerHTML = '<div style="text-align:center;padding:24px;color:var(--text-muted)">Loading...</div>';
  document.getElementById('historyModal').classList.add('show');

  try {
    const res = await fetch(`${API.bills}/customer/${customerId}`);
    const json = await res.json();
    const bills = json.data || [];

    if (!bills.length) {
      document.getElementById('modalBillList').innerHTML = `<div class="empty-state"><div class="empty-icon">📄</div><p>No bills sent yet</p></div>`;
      return;
    }

    const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
    document.getElementById('modalBillList').innerHTML = `
      <div style="background:var(--success-bg);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:12px 16px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center">
        <div style="font-size:0.75rem;color:var(--text-muted)">Total Billed</div>
        <div style="font-size:1.1rem;font-weight:800;color:var(--accent)">₹ ${totalAmount.toLocaleString('en-IN')}</div>
      </div>
      ${bills.map(b => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--border)">
          <div>
            <div style="font-size:0.85rem;font-weight:600">${formatDate(b.billDate)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted);margin-top:2px">${new Date(b.createdAt).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1rem;font-weight:700;color:var(--accent)">₹ ${b.amount.toLocaleString('en-IN')}</span>
            <span class="badge badge-${b.status === 'sent' ? 'success' : 'danger'}">${b.status}</span>
          </div>
        </div>
      `).join('')}
    `;
  } catch (err) {
    document.getElementById('modalBillList').innerHTML = '<div class="empty-state"><p>Failed to load history</p></div>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('filterBtn').addEventListener('click', loadBills);
  document.getElementById('resetBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('dateFrom').value = '';
    document.getElementById('dateTo').value = '';
    loadBills();
  });
  document.getElementById('searchInput').addEventListener('input', loadBills);
  loadBills();
});

async function loadBills() {
  const search = document.getElementById('searchInput').value.trim();
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;

  const params = new URLSearchParams({ limit: 200 });
  if (search) params.set('customerName', search);
  if (dateFrom) params.set('dateFrom', dateFrom);
  if (dateTo) params.set('dateTo', dateTo);

  const list = document.getElementById('billList');
  list.innerHTML = '<div class="empty-state"><div class="empty-icon">⏳</div><p>Loading...</p></div>';

  try {
    const res = await fetch(`${API.bills}?${params.toString()}`);
    const json = await res.json();
    const bills = json.data || [];

    document.getElementById('recordsLabel').textContent = `${bills.length} records`;

    const total = bills.reduce((s, b) => s + b.amount, 0);
    const strip = document.getElementById('summaryStrip');
    if (bills.length > 0) {
      strip.style.display = 'flex';
      document.getElementById('summaryCount').textContent = `${bills.length} bills`;
      document.getElementById('summaryTotal').textContent = `₹ ${total.toLocaleString('en-IN')}`;
    } else {
      strip.style.display = 'none';
    }

    renderBills(bills);
  } catch (err) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">❌</div><p>Cannot reach server</p></div>';
  }
}

function renderBills(bills) {
  const list = document.getElementById('billList');
  if (!bills.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>No bills found for this filter</p></div>`;
    return;
  }

  // Group by date
  const grouped = {};
  bills.forEach(b => {
    if (!grouped[b.billDate]) grouped[b.billDate] = [];
    grouped[b.billDate].push(b);
  });

  let html = '';
  Object.keys(grouped).sort().reverse().forEach(date => {
    const dayBills = grouped[date];
    const dayTotal = dayBills.reduce((s, b) => s + b.amount, 0);
    html += `
      <div class="section-label" style="display:flex;justify-content:space-between;align-items:center">
        <span>${formatDate(date)}</span>
        <span style="color:var(--accent)">₹ ${dayTotal.toLocaleString('en-IN')}</span>
      </div>
    `;
    dayBills.forEach(b => {
      html += `
        <div class="customer-card" style="margin-bottom:8px">
          <div class="customer-avatar">${b.customerName.charAt(0)}</div>
          <div class="customer-info">
            <div class="customer-name">${b.customerName}</div>
            <div class="customer-phone">+${b.customerPhone}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
            <span style="font-size:1rem;font-weight:800;color:var(--accent)">₹ ${b.amount.toLocaleString('en-IN')}</span>
            <span class="badge badge-${b.status === 'sent' ? 'success' : 'danger'}">${b.status}</span>
            ${b.imageUrl ? `<a href="${b.imageUrl}" target="_blank" style="font-size:0.65rem;color:var(--text-muted);text-decoration:none;border:1px solid var(--border);padding:2px 7px;border-radius:6px">View</a>` : ''}
          </div>
        </div>
      `;
    });
  });

  list.innerHTML = html;
}

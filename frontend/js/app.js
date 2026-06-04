// ===== MAIN BILLING APP =====
let allCustomers = [];
let currentDateStr = new Date().toISOString().split('T')[0];

document.addEventListener('DOMContentLoaded', async () => {
  // Set date
  const dateInput = document.getElementById('billDateInput');
  dateInput.value = currentDateStr;
  updateDateDisplay(currentDateStr);

  // Date button click → open hidden date input
  document.getElementById('dateBtn').addEventListener('click', () => dateInput.click());
  dateInput.addEventListener('change', (e) => {
    currentDateStr = e.target.value;
    updateDateDisplay(currentDateStr);
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderCustomers(filterCustomers(e.target.value));
  });

  // Load customers
  await loadCustomers();
});

function updateDateDisplay(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  document.getElementById('dateDisplay').textContent = `${d}-${months[parseInt(m)-1]}-${y}`;
}

async function loadCustomers() {
  try {
    const res = await fetch(API.customers);
    const json = await res.json();
    if (json.success) {
      allCustomers = json.data;
      document.getElementById('customerCount').textContent = `${allCustomers.length} customers`;
      renderCustomers(allCustomers);
    } else {
      showError('Failed to load customers');
    }
  } catch (err) {
    showError('Cannot connect to server. Is the backend running?');
    console.error(err);
  }
}

function filterCustomers(query) {
  if (!query.trim()) return allCustomers;
  const q = query.toLowerCase();
  return allCustomers.filter(c =>
    c.name.toLowerCase().includes(q) || c.phone.includes(q)
  );
}

function renderCustomers(customers) {
  const list = document.getElementById('customerList');
  if (!customers.length) {
    list.innerHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><p>No customers found</p></div>`;
    return;
  }

  list.innerHTML = customers.map((c, i) => `
    <div class="customer-card" style="animation-delay:${Math.min(i * 0.03, 0.5)}s">
      <div class="customer-avatar">${c.name.charAt(0)}</div>
      <div class="customer-info">
        <div class="customer-name">${c.name}</div>
        <div class="customer-phone">+${c.phone}</div>
      </div>
      <input class="amount-input" type="number" placeholder="₹ Amount" min="1" id="amount-${c._id}" />
      <button class="send-btn" data-id="${c._id}" data-name="${escapeAttr(c.name)}" data-phone="${c.phone}" title="Send Bill">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
        </svg>
      </button>
    </div>
  `).join('');

  // Attach send handlers
  document.querySelectorAll('.send-btn').forEach(btn => {
    btn.addEventListener('click', handleSendBill);
  });
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;');
}

async function handleSendBill() {
  const customerId = this.dataset.id;
  const customerName = this.dataset.name;
  const customerPhone = this.dataset.phone;
  const amountInput = document.getElementById(`amount-${customerId}`);
  const amount = parseFloat(amountInput.value);

  if (!amount || isNaN(amount) || amount <= 0) {
    amountInput.focus();
    amountInput.style.borderColor = 'var(--danger)';
    setTimeout(() => amountInput.style.borderColor = '', 2000);
    showToast('Enter a valid amount', 'error');
    return;
  }

  // Fill bill preview
  document.getElementById('bp-name').textContent = customerName;
  document.getElementById('bp-date').textContent = formatDate(currentDateStr);
  document.getElementById('bp-amount').textContent = amount.toLocaleString('en-IN');

  showLoading('Generating bill image...');

  try {
    // Capture bill image
    const billEl = document.getElementById('billPreview');
    billEl.style.position = 'fixed';
    billEl.style.top = '0';
    billEl.style.left = '-9999px';

    const canvas = await html2canvas(billEl, {
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });

    billEl.style.top = '-9999px';

    updateLoadingText('Uploading bill...');

    // Upload to ImgBB
    let imageUrl = '';
    try {
      const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
      const fd = new FormData();
      fd.append('image', blob);
      const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${STORE.imgbbKey}`, { method: 'POST', body: fd });
      const imgJson = await imgRes.json();
      if (imgJson.success) imageUrl = imgJson.data.url;
    } catch (e) {
      console.warn('ImgBB upload failed, sending text-only', e);
    }

    updateLoadingText('Opening WhatsApp...');

    // Save bill to DB
    try {
      await fetch(API.bills, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          customerName,
          customerPhone,
          amount,
          billDate: currentDateStr,
          imageUrl,
          status: 'sent'
        })
      });
    } catch (e) {
      console.warn('Failed to save bill to DB', e);
    }

    // Build WhatsApp message
    const dateFormatted = formatDate(currentDateStr);
    const msg = imageUrl
      ? `Assalamu-Alaikum, your Vegetables bill:\n\nDate: ${dateFormatted}\nAmount: ₹ ${amount}\n\nPayment:\n• Google Pay\n• Paytm\n• PhonePe\n• Bank Transfer: 7006889841 / Javid Ahmad Teli\n  A/c: 0601010100000453\n\nView bill receipt: ${imageUrl}\n\nThank you!\n\nNote: Please send screenshot of payment!`
      : `Assalamu-Alaikum, your Vegetables bill:\n\nCustomer: ${customerName}\nDate: ${dateFormatted}\nAmount: ₹ ${amount}\n\nPayment:\n• Google Pay\n• Paytm\n• PhonePe\n• Bank Transfer: 7006889841\n\nThank you for your purchase!`;

    window.open(`https://wa.me/${customerPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    amountInput.value = '';
    showToast(`Bill sent to ${customerName} ✓`, 'success');

  } catch (err) {
    console.error('Send bill error:', err);
    showToast('Error generating bill', 'error');
  } finally {
    hideLoading();
  }
}

function showLoading(text = 'Please wait...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.add('show');
}
function updateLoadingText(text) {
  document.getElementById('loadingText').textContent = text;
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.remove('show');
}
function showError(msg) {
  document.getElementById('customerList').innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">❌</div>
      <p>${msg}</p>
      <button class="btn btn-secondary btn-sm" style="margin-top:12px" onclick="loadCustomers()">Retry</button>
    </div>`;
}

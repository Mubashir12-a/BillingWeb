import { useState, useEffect } from 'react'
import { API } from '../config'
import Toast from '../components/Toast'

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [pin, setPin] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinShake, setPinShake] = useState(false)

  const [stats, setStats] = useState({ customers: '—', today: '—', month: '—' })
  const [tab, setTab] = useState('add')
  const [customers, setCustomers] = useState([])
  const [manageSearch, setManageSearch] = useState('')
  const [toast, setToast] = useState({ message: '', type: 'success' })

  // Add form
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newNotes, setNewNotes] = useState('')
  const [adding, setAdding] = useState(false)

  // Edit modal
  const [editModal, setEditModal] = useState(null) // { _id, name, phone, notes }
  const [saving, setSaving] = useState(false)

  function showToast(message, type = 'success') { setToast({ message, type }) }

  // PIN
  function handleKey(key) {
    if (key === 'clear') { setPin(''); return }
    if (key === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) setTimeout(() => verifyPin(next), 150)
  }

  async function verifyPin(p) {
    try {
      const res = await fetch(API.adminVerify, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: p })
      })
      const json = await res.json()
      if (json.success) {
        setAuthed(true); setPin('')
        loadDashboard()
      } else { triggerPinError('Incorrect PIN') }
    } catch { triggerPinError('Cannot connect to server') }
  }

  function triggerPinError(msg) {
    setPinError(msg); setPinShake(true)
    setTimeout(() => { setPin(''); setPinError(''); setPinShake(false) }, 900)
  }

  // Dashboard
  async function loadDashboard() {
    try {
      const [custRes, statsRes] = await Promise.all([fetch(API.customers), fetch(API.billStats)])
      const custJson = await custRes.json(); const statsJson = await statsRes.json()
      if (custJson.success) setCustomers(custJson.data)
      if (statsJson.success) {
        const { todayBills, monthTotal } = statsJson.data
        setStats({
          customers: custJson.data.length,
          today: todayBills,
          month: monthTotal >= 1000 ? `₹${(monthTotal/1000).toFixed(1)}k` : `₹${monthTotal}`
        })
      }
    } catch { console.error('Dashboard load error') }
  }

  // Add Customer
  async function addCustomer() {
    const name = newName.trim().toUpperCase()
    const phone = newPhone.trim().replace(/\D/g, '')
    const notes = newNotes.trim()
    if (!name) { showToast('Name required', 'error'); return }
    if (!phone || phone.length < 10) { showToast('Enter valid phone', 'error'); return }
    setAdding(true)
    try {
      const res = await fetch(API.customers, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, notes })
      })
      const json = await res.json()
      if (json.success) {
        showToast(`${name} added!`, 'success')
        setNewName(''); setNewPhone(''); setNewNotes('')
        const updated = [...customers, json.data]
        setCustomers(updated)
        setStats(s => ({ ...s, customers: updated.length }))
      } else { showToast(json.message || 'Failed', 'error') }
    } catch { showToast('Server error', 'error') }
    setAdding(false)
  }

  // Edit / Delete
  async function saveEdit() {
    const name = editModal.name.trim().toUpperCase()
    const phone = editModal.phone.trim().replace(/\D/g, '')
    if (!name || !phone) { showToast('Name and phone required', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch(`${API.customers}/${editModal._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, notes: editModal.notes })
      })
      const json = await res.json()
      if (json.success) {
        showToast('Customer updated!', 'success')
        setCustomers(prev => prev.map(c => c._id === editModal._id ? json.data : c))
        setEditModal(null)
      } else { showToast('Update failed', 'error') }
    } catch { showToast('Server error', 'error') }
    setSaving(false)
  }

  async function deleteCustomer() {
    if (!confirm(`Remove "${editModal.name}"?`)) return
    try {
      const res = await fetch(`${API.customers}/${editModal._id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        showToast(`${editModal.name} removed`, 'warning')
        const updated = customers.filter(c => c._id !== editModal._id)
        setCustomers(updated); setStats(s => ({ ...s, customers: updated.length }))
        setEditModal(null)
      } else { showToast('Delete failed', 'error') }
    } catch { showToast('Server error', 'error') }
  }

  async function clearAllHistory() {
    const confirmation = prompt('Type "ERASE" to confirm deleting all billing history. This cannot be undone:');
    if (confirmation !== 'ERASE') {
      showToast('Erase cancelled', 'warning');
      return;
    }
    try {
      const res = await fetch(`${API.bills}/actions/clear-all`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        showToast('All bill history erased!', 'success');
        loadDashboard();
      } else {
        showToast(json.message || 'Erase failed', 'error');
      }
    } catch {
      showToast('Server error during erase', 'error');
    }
  }

  const filteredManage = customers.filter(c =>
    c.name.toLowerCase().includes(manageSearch.toLowerCase()) || c.phone.includes(manageSearch)
  )

  // PIN screen
  if (!authed) return (
    <div className="pin-screen">
      <div className="pin-container">
        <span className="pin-icon">🔐</span>
        <h1 className="pin-title">Admin Panel</h1>
        <p className="pin-subtitle">Enter your PIN to access</p>
        <div className="pin-dots">
          {[0,1,2,3].map(i => <span key={i} className={`pin-dot ${i < pin.length ? (pinShake ? 'error' : 'filled') : ''}`} />)}
        </div>
        <div className="pin-error">{pinError}</div>
        <div className="pin-keypad">
          {[1,2,3,4,5,6,7,8,9].map(n => <button key={n} className="key-btn" onClick={() => handleKey(String(n))}>{n}</button>)}
          <button className="key-btn key-clear" onClick={() => handleKey('clear')}>✕</button>
          <button className="key-btn" onClick={() => handleKey('0')}>0</button>
          <button className="key-btn key-del" onClick={() => handleKey('del')}>⌫</button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <Toast message={toast.message} type={toast.type} onHide={() => setToast({ message: '' })} />

      <header className="page-header">
        <div className="store-icon">🛡️</div>
        <div className="header-text"><h1>Admin Panel</h1><p>Vegetable Store Management</p></div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => { setAuthed(false); setPin('') }} title="Lock">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </button>
        </div>
      </header>

      <main className="main-content">
        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card"><div className="stat-value">{stats.customers}</div><div className="stat-label">Customers</div></div>
          <div className="stat-card"><div className="stat-value">{stats.today}</div><div className="stat-label">Today's Bills</div></div>
          <div className="stat-card"><div className="stat-value">{stats.month}</div><div className="stat-label">Month Total</div></div>
        </div>

        {/* Tabs */}
        <div className="pill-tabs">
          <button className={`pill-tab ${tab==='add'?'active':''}`} onClick={() => setTab('add')}>➕ Add Customer</button>
          <button className={`pill-tab ${tab==='manage'?'active':''}`} onClick={() => setTab('manage')}>👥 Manage</button>
        </div>

        {/* Add Tab */}
        {tab === 'add' && (
          <div className="card">
            <div style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:16, color:'var(--text-secondary)' }}>New Customer</div>
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" type="text" placeholder="e.g. MOHD RIYAZ" value={newName} onChange={e => setNewName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Phone *</label>
              <input className="form-input" type="tel" placeholder="e.g. 919876543210" value={newPhone} onChange={e => setNewPhone(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <input className="form-input" type="text" placeholder="e.g. Near Masjid" value={newNotes} onChange={e => setNewNotes(e.target.value)} />
            </div>
            <button className="btn btn-primary btn-full" onClick={addCustomer} disabled={adding}>
              {adding ? 'Adding...' : '+ Add Customer'}
            </button>
          </div>
        )}

        {/* Manage Tab */}
        {tab === 'manage' && (
          <>
            <div className="search-bar">
              <span className="search-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></span>
              <input type="text" placeholder="Search customers..." value={manageSearch} onChange={e => setManageSearch(e.target.value)} />
            </div>
            {filteredManage.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">👤</div><p>No customers found</p></div>
            ) : filteredManage.map((c, i) => (
              <div key={c._id} className="manage-item" style={{ animationDelay: `${Math.min(i*0.02,0.5)}s` }}>
                <div className="customer-avatar">{c.name.charAt(0)}</div>
                <div className="customer-info"><div className="customer-name">{c.name}</div><div className="customer-phone">+{c.phone}</div></div>
                <button className="edit-btn" onClick={() => setEditModal({ ...c })} title="Edit">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            ))}
          </>
        )}

        {/* Danger Zone */}
        <div style={{ marginTop: '36px', borderTop: '1px solid rgba(239,68,68,0.2)', paddingTop: '20px' }}>
          <div className="section-label" style={{ color: 'var(--danger)', margin: '0 0 12px 4px' }}>Danger Zone</div>
          <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Delete all sent bills and transaction history permanently. Customers and contact details are not affected.
              </div>
              <button 
                className="btn btn-danger btn-full btn-sm" 
                onClick={clearAllHistory}
                style={{ marginTop: '8px' }}
              >
                🗑️ Erase All Bill History
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {editModal && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setEditModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">Edit Customer</span>
              <button className="modal-close" onClick={() => setEditModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" type="text" value={editModal.name} onChange={e => setEditModal(m => ({ ...m, name: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Phone</label><input className="form-input" type="tel" value={editModal.phone} onChange={e => setEditModal(m => ({ ...m, phone: e.target.value }))} /></div>
            <div className="form-group"><label className="form-label">Notes</label><input className="form-input" type="text" value={editModal.notes || ''} onChange={e => setEditModal(m => ({ ...m, notes: e.target.value }))} /></div>
            <div style={{ display:'flex', gap:10, marginTop:4 }}>
              <button className="btn btn-primary" style={{ flex:1 }} onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
              <button className="btn btn-danger btn-sm" onClick={deleteCustomer}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import { useState, useEffect } from 'react'
import { API, formatDate } from '../config'
import Toast from '../components/Toast'

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null) // { customer, bills }
  const [toast, setToast] = useState({ message: '', type: 'success' })

  useEffect(() => { loadCustomers() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)))
  }, [search, customers])

  async function loadCustomers() {
    try {
      const res = await fetch(API.customers)
      const json = await res.json()
      if (json.success) { setCustomers(json.data); setFiltered(json.data) }
    } catch { setToast({ message: 'Cannot reach server', type: 'error' }) }
  }

  async function openHistory(customer) {
    setModal({ customer, bills: null })
    try {
      const res = await fetch(`${API.bills}/customer/${customer._id}`)
      const json = await res.json()
      setModal({ customer, bills: json.data || [] })
    } catch { setModal({ customer, bills: [] }) }
  }

  // Group by first letter
  const grouped = {}
  filtered.forEach(c => {
    const letter = c.name.charAt(0).toUpperCase()
    if (!grouped[letter]) grouped[letter] = []
    grouped[letter].push(c)
  })

  return (
    <>
      <Toast message={toast.message} type={toast.type} onHide={() => setToast({ message: '' })} />

      <header className="page-header">
        <div className="store-icon">👥</div>
        <div className="header-text">
          <h1>Customers</h1>
          <p>{customers.length} active customers</p>
        </div>
      </header>

      <main className="main-content">
        <div className="search-bar">
          <span className="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input type="text" placeholder="Search by name or phone..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🔍</div><p>No customers found</p></div>
        ) : Object.keys(grouped).sort().map(letter => (
          <div key={letter}>
            <div className="section-label">{letter}</div>
            {grouped[letter].map((c, i) => (
              <div key={c._id} className="customer-card" style={{ animationDelay: `${i * 0.02}s` }}>
                <div className="customer-avatar">{c.name.charAt(0)}</div>
                <div className="customer-info">
                  <div className="customer-name">{c.name}</div>
                  <div className="customer-phone">+{c.phone}</div>
                  {c.notes && <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>{c.notes}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, flexShrink:0 }}>
                  <a className="icon-btn" href={`https://wa.me/${c.phone}`} target="_blank" rel="noreferrer" title="WhatsApp" style={{ color:'#25d366' }}>
                    <svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                  </a>
                  <button className="icon-btn" onClick={() => openHistory(c)} title="Bill History">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </main>

      {/* History Modal */}
      {modal && (
        <div className="modal-overlay show" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-header">
              <span className="modal-title">{modal.customer.name}</span>
              <button className="modal-close" onClick={() => setModal(null)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ maxHeight:'60vh', overflowY:'auto' }}>
              {modal.bills === null ? (
                <div style={{ textAlign:'center', padding:24, color:'var(--text-muted)' }}>Loading...</div>
              ) : modal.bills.length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📄</div><p>No bills sent yet</p></div>
              ) : (
                <>
                  <div style={{ background:'var(--success-bg)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Total Billed</div>
                    <div style={{ fontSize:'1.1rem', fontWeight:800, color:'var(--accent)' }}>₹ {modal.bills.reduce((s,b)=>s+b.amount,0).toLocaleString('en-IN')}</div>
                  </div>
                  {modal.bills.map(b => (
                    <div key={b._id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderBottom:'1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize:'0.85rem', fontWeight:600 }}>{formatDate(b.billDate)}</div>
                        <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:2 }}>{new Date(b.createdAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'1rem', fontWeight:700, color:'var(--accent)' }}>₹ {b.amount.toLocaleString('en-IN')}</span>
                        <span className={`badge badge-${b.status==='sent'?'success':'danger'}`}>{b.status}</span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

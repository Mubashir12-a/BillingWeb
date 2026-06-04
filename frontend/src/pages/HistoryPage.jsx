import { useState, useEffect, useCallback } from 'react'
import { API, formatDate } from '../config'

export default function HistoryPage() {
  const [bills, setBills] = useState([])
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { loadBills() }, [])

  const loadBills = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: 300 })
    if (search.trim()) params.set('customerName', search.trim())
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    try {
      const res = await fetch(`${API.bills}?${params}`)
      const json = await res.json()
      setBills(json.data || [])
    } catch { setBills([]) }
    finally { setLoading(false) }
  }, [search, dateFrom, dateTo])

  function reset() { setSearch(''); setDateFrom(''); setDateTo(''); }
  useEffect(() => {
    if (!search && !dateFrom && !dateTo) loadBills()
  }, [search, dateFrom, dateTo])

  const total = bills.reduce((s, b) => s + b.amount, 0)

  // Group by date
  const grouped = {}
  bills.forEach(b => {
    if (!grouped[b.billDate]) grouped[b.billDate] = []
    grouped[b.billDate].push(b)
  })

  return (
    <>
      <header className="page-header">
        <div className="store-icon">🕐</div>
        <div className="header-text">
          <h1>Bill History</h1>
          <p>{bills.length} records</p>
        </div>
      </header>

      <main className="main-content">
        <div className="search-bar">
          <span className="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input type="text" placeholder="Search by customer name..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
          <div>
            <label className="form-label" style={{ marginBottom:4 }}>From Date</label>
            <input type="date" className="form-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ padding:'9px 12px', fontSize:'0.82rem' }} />
          </div>
          <div>
            <label className="form-label" style={{ marginBottom:4 }}>To Date</label>
            <input type="date" className="form-input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ padding:'9px 12px', fontSize:'0.82rem' }} />
          </div>
        </div>

        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <button className="btn btn-primary btn-sm" onClick={loadBills}>🔍 Filter</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { reset(); setTimeout(loadBills, 50) }}>Reset</button>
        </div>

        {bills.length > 0 && (
          <div style={{ background:'var(--success-bg)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{bills.length} bills</span>
            <span style={{ fontSize:'1rem', fontWeight:800, color:'var(--accent)' }}>₹ {total.toLocaleString('en-IN')}</span>
          </div>
        )}

        {loading ? (
          <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
        ) : bills.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📭</div><p>No bills found</p></div>
        ) : Object.keys(grouped).sort().reverse().map(date => {
          const dayBills = grouped[date]
          const dayTotal = dayBills.reduce((s, b) => s + b.amount, 0)
          return (
            <div key={date}>
              <div className="section-label" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>{formatDate(date)}</span>
                <span style={{ color:'var(--accent)' }}>₹ {dayTotal.toLocaleString('en-IN')}</span>
              </div>
              {dayBills.map(b => (
                <div key={b._id} className="customer-card" style={{ marginBottom:8 }}>
                  <div className="customer-avatar">{b.customerName.charAt(0)}</div>
                  <div className="customer-info">
                    <div className="customer-name">{b.customerName}</div>
                    <div className="customer-phone">+{b.customerPhone}</div>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:5, flexShrink:0 }}>
                    <span style={{ fontSize:'1rem', fontWeight:800, color:'var(--accent)' }}>₹ {b.amount.toLocaleString('en-IN')}</span>
                    <span className={`badge badge-${b.status==='sent'?'success':'danger'}`}>{b.status}</span>
                    {b.imageUrl && <a href={b.imageUrl} target="_blank" rel="noreferrer" style={{ fontSize:'0.65rem', color:'var(--text-muted)', textDecoration:'none', border:'1px solid var(--border)', padding:'2px 7px', borderRadius:6 }}>View</a>}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </main>
    </>
  )
}

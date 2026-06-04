import { useState, useEffect, useRef } from 'react'
import { API, STORE, formatDate } from '../config'
import Toast from '../components/Toast'
import html2canvas from 'html2canvas'

export default function BillingPage() {
  const [customers, setCustomers] = useState([])
  const [filtered, setFiltered] = useState([])
  const [search, setSearch] = useState('')
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0])
  const [amounts, setAmounts] = useState({})
  const [loading, setLoading] = useState(false)
  const [loadingText, setLoadingText] = useState('Please wait...')
  const [toast, setToast] = useState({ message: '', type: 'success' })
  const [billData, setBillData] = useState({ name: '', amount: '', date: '' })
  const dateInputRef = useRef()

  useEffect(() => { loadCustomers() }, [])
  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.phone.includes(q)
    ))
  }, [search, customers])

  async function loadCustomers() {
    try {
      const res = await fetch(API.customers)
      const json = await res.json()
      if (json.success) { setCustomers(json.data); setFiltered(json.data) }
    } catch { showToast('Cannot connect to server', 'error') }
  }

  function showToast(message, type = 'success') { setToast({ message, type }) }

  function displayDate(ds) {
    const [y, m, d] = ds.split('-')
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    return `${d}-${months[parseInt(m) - 1]}-${y}`
  }

  async function handleSend(customer) {
    const amount = parseFloat(amounts[customer._id] || '')
    if (!amount || isNaN(amount) || amount <= 0) {
      showToast('Enter a valid amount', 'error'); return
    }

    setBillData({ name: customer.name, amount, date: displayDate(dateStr) })
    setLoadingText('Generating bill...')
    setLoading(true)

    await new Promise(r => setTimeout(r, 200)) // let React render bill preview

    try {
      const billEl = document.getElementById('bill-preview')
      const canvas = await html2canvas(billEl, {
        scale: 2, logging: false, useCORS: true, allowTaint: true, backgroundColor: '#ffffff'
      })

      setLoadingText('Uploading...')
      let imageUrl = ''
      try {
        const blob = await new Promise(r => canvas.toBlob(r, 'image/png'))
        const fd = new FormData(); fd.append('image', blob)
        const imgRes = await fetch(`https://api.imgbb.com/1/upload?key=${STORE.imgbbKey}`, { method: 'POST', body: fd })
        const imgJson = await imgRes.json()
        if (imgJson.success) imageUrl = imgJson.data.url
      } catch (e) { console.warn('ImgBB upload failed', e) }

      // Save to DB
      try {
        await fetch(API.bills, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customerId: customer._id, customerName: customer.name, customerPhone: customer.phone, amount, billDate: dateStr, imageUrl, status: 'sent' })
        })
      } catch (e) { console.warn('DB save failed', e) }

      setLoadingText('Opening WhatsApp...')
      const msg = imageUrl
        ? `Assalamu-Alaikum, your Vegetables bill:\n\nDate: ${displayDate(dateStr)}\nAmount: ₹ ${amount}\n\nPayment:\n• Google Pay\n• Paytm\n• PhonePe\n• Bank: 7006889841 / Javid Ahmad Teli\n  A/c: 0601010100000453\n\nView receipt: ${imageUrl}\n\nThank you!\nNote: Please send screenshot of payment!`
        : `Assalamu-Alaikum, your Vegetables bill:\n\nCustomer: ${customer.name}\nDate: ${displayDate(dateStr)}\nAmount: ₹ ${amount}\n\nPayment: GPay / Paytm / PhonePe / Bank Transfer\n\nThank you!`

      window.open(`https://wa.me/${customer.phone}?text=${encodeURIComponent(msg)}`, '_blank')
      setAmounts(prev => ({ ...prev, [customer._id]: '' }))
      showToast(`Bill sent to ${customer.name} ✓`, 'success')
    } catch (err) {
      console.error(err); showToast('Error generating bill', 'error')
    } finally { setLoading(false) }
  }

  return (
    <>
      {/* Off-screen bill preview */}
      <div id="bill-preview" className="bill-preview-container">
        <div style={{ textAlign:'center', marginBottom:16, borderBottom:'2px dashed #ddd', paddingBottom:12 }}>
          <h2 style={{ fontSize:'1.2rem', fontWeight:800, color:'#111' }}>🥦 Vegetable Store</h2>
          <p style={{ fontSize:'0.8rem', color:'#555' }}>Main Market, Soura Srinagar | PIN: 190011</p>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', margin:'6px 0', fontSize:'0.85rem' }}><span>Customer:</span><strong>{billData.name}</strong></div>
        <div style={{ display:'flex', justifyContent:'space-between', margin:'6px 0', fontSize:'0.85rem' }}><span>Date:</span><span>{billData.date}</span></div>
        <div style={{ fontSize:'1.3rem', fontWeight:800, color:'#059669', textAlign:'center', margin:'12px 0' }}>₹ {billData.amount} /-</div>
        <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', color:'#777', margin:'12px 0 6px', borderTop:'1px solid #eee', paddingTop:10 }}>Payment Options</p>
        <div style={{ display:'flex', gap:8, alignItems:'center', margin:'8px 0' }}>
          <img src="/gpay.png" alt="GPay" style={{ height:28, objectFit:'contain' }} />
          <img src="/paytm.png" alt="Paytm" style={{ height:28, objectFit:'contain' }} />
          <img src="/phonepay.png" alt="PhonePe" style={{ height:28, objectFit:'contain' }} />
        </div>
        <img src="/paymentqr.jpg" alt="QR" style={{ display:'block', margin:'8px auto', width:100, height:100, objectFit:'contain' }} />
        <p style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', color:'#777', margin:'12px 0 6px', borderTop:'1px solid #eee', paddingTop:10 }}>Bank Transfer</p>
        {[['Bank','J&K Bank'],['Name','JAVID AHMAD TELI'],['A/C','0601010100000453'],['IFSC','JAKA01NAGGAM'],['UPI','7006889841']].map(([k,v]) => (
          <div key={k} style={{ display:'flex', justifyContent:'space-between', margin:'4px 0', fontSize:'0.78rem' }}><span>{k}:</span><span>{v}</span></div>
        ))}
        <div style={{ textAlign:'center', fontSize:'0.72rem', color:'#666', marginTop:14, borderTop:'1px solid #eee', paddingTop:10 }}>
          <p>Thank you for shopping with us!</p>
          <p>Contact: +91-70068-89841</p>
          <p>Note: Please send screenshot of payment</p>
        </div>
      </div>

      {/* Loading overlay */}
      <div className={`loading-overlay ${loading ? 'show' : ''}`}>
        <div className="spinner" />
        <div className="loading-text">{loadingText}</div>
      </div>

      <Toast message={toast.message} type={toast.type} onHide={() => setToast({ message: '' })} />

      {/* Header */}
      <header className="page-header">
        <div className="store-icon">🥦</div>
        <div className="header-text">
          <h1>Vegetable Store</h1>
          <p>Soura, Srinagar</p>
        </div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => dateInputRef.current?.click()} title="Change Date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
          </button>
          <input ref={dateInputRef} type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} style={{ display:'none' }} />
        </div>
      </header>

      <main className="main-content">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.08em' }}>Bill Date</div>
            <div style={{ fontSize:'1.1rem', fontWeight:700, color:'var(--accent)', marginTop:2 }}>{displayDate(dateStr)}</div>
          </div>
          <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{customers.length} customers</div>
        </div>

        <div className="search-bar">
          <span className="search-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          </span>
          <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} autoComplete="off" />
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{customers.length === 0 ? '⏳' : '🔍'}</div>
            <p>{customers.length === 0 ? 'Loading customers...' : 'No customers found'}</p>
          </div>
        ) : filtered.map((c, i) => (
          <div key={c._id} className="bill-customer-card" style={{ animationDelay: `${Math.min(i * 0.03, 0.5)}s` }}>
            <div className="card-index">{String(i + 1).padStart(2, '0')}</div>
            <div className="card-name">{c.name}</div>
            <div className="card-amount-row">
              <span>Amount ₹</span>
              <input
                className="card-amount-input"
                type="number"
                placeholder="0"
                min="1"
                value={amounts[c._id] || ''}
                onChange={e => setAmounts(prev => ({ ...prev, [c._id]: e.target.value }))}
              />
              <span>/-</span>
            </div>
            <button className="card-send-btn" onClick={() => handleSend(c)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '16px', height: '16px', marginRight: '8px', display: 'inline-block', verticalAlign: 'middle' }}>
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
              <span style={{ verticalAlign: 'middle' }}>SEND</span>
            </button>
          </div>
        ))}
      </main>
    </>
  )
}

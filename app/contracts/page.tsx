'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const empty = { client_id: '', title: '', status: 'draft', start_date: '', end_date: '', value: '', terms: '' }

export default function Contracts() {
  const [contracts, setContracts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [viewModal, setViewModal] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [c, cl] = await Promise.all([
      supabase.from('contracts').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setContracts(c.data || [])
    setClients(cl.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, value: Number(form.value) || 0 }
    if (editing) await supabase.from('contracts').update(payload).eq('id', editing)
    else await supabase.from('contracts').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const sign = async (id: string) => {
    await supabase.from('contracts').update({ status: 'signed', signed_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete contract?')) return
    await supabase.from('contracts').delete().eq('id', id)
    load()
  }

  // Check renewals
  const expiringSoon = contracts.filter(c => {
    if (!c.end_date || c.status !== 'active') return false
    const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 30 && days > 0
  })

  const statusColor: Record<string, string> = { draft: 'gray', sent: 'blue', signed: 'green', active: 'green', expired: 'red', cancelled: 'red' }
  const totalValue = contracts.filter(c => ['signed', 'active'].includes(c.status)).reduce((s, c) => s + (c.value || 0), 0)

  const DEFAULT_TERMS = `1. SCOPE OF WORK
The Agency will provide digital marketing services as agreed upon in the proposal.

2. PAYMENT TERMS
Payment is due within 7 days of invoice. Late payment may result in service suspension.

3. DURATION
This contract is valid for the period mentioned above and auto-renews unless terminated with 30 days notice.

4. CONFIDENTIALITY
Both parties agree to maintain confidentiality of business information.

5. INTELLECTUAL PROPERTY
All creative work produced remains property of the client upon full payment.

6. TERMINATION
Either party may terminate with 30 days written notice.

7. GOVERNING LAW
This agreement is governed by the laws of India.`

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📝 Contracts</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{contracts.length} contracts · {expiringSoon.length} expiring soon</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem' }}>
          {expiringSoon.length > 0 && (
            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 7, padding: '0.4rem 0.875rem', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
              ⚠️ {expiringSoon.length} expiring in 30 days
            </div>
          )}
          <button className="btn-primary" onClick={() => { setForm({ ...empty, terms: DEFAULT_TERMS }); setEditing(null); setModal(true) }}>+ New Contract</button>
        </div>
      </div>

      <div className="page">
        {expiringSoon.length > 0 && (
          <div className="flag-warning" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#f59e0b', marginBottom: '0.5rem' }}>⚠️ Contracts Expiring Soon</div>
            {expiringSoon.map(c => {
              const days = Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              return <div key={c.id} style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>• {c.clients?.name} — "{c.title}" expires in <strong style={{ color: '#f59e0b' }}>{days} days</strong></div>
            })}
          </div>
        )}

        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Contracts', value: contracts.length, color: 'var(--accent-blue)', icon: '📝' },
            { label: 'Active', value: contracts.filter(c => ['signed','active'].includes(c.status)).length, color: 'var(--accent-green)', icon: '✅' },
            { label: 'Expiring Soon', value: expiringSoon.length, color: 'var(--accent-orange)', icon: '⚠️' },
            { label: 'Total Value', value: `₹${totalValue.toLocaleString()}`, color: 'var(--accent-green)', icon: '💰' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
                <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Contract</th><th>Client</th><th>Value</th><th>Start</th><th>End</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : contracts.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No contracts yet</td></tr>
                : contracts.map(c => {
                  const daysLeft = c.end_date ? Math.ceil((new Date(c.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.title}</td>
                      <td style={{ color: 'var(--accent-orange)' }}>{c.clients?.name || '—'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₹{(c.value || 0).toLocaleString()}/mo</td>
                      <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.start_date ? new Date(c.start_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td>
                        <div style={{ fontSize: '0.75rem', color: daysLeft && daysLeft <= 30 ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                          {c.end_date ? new Date(c.end_date).toLocaleDateString('en-IN') : '—'}
                          {daysLeft && daysLeft <= 30 && daysLeft > 0 && <div style={{ fontSize: '0.65rem', color: 'var(--accent-orange)', fontWeight: 700 }}>{daysLeft}d left</div>}
                        </div>
                      </td>
                      <td><span className={`badge badge-${statusColor[c.status] || 'gray'}`}>{c.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem' }}>
                          <button onClick={() => setViewModal(c)} className="btn-primary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>👁 View</button>
                          {c.status === 'draft' && <button onClick={() => sign(c.id)} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>✍️ Sign</button>}
                          <button onClick={() => { setForm({ ...c, value: c.value?.toString() }); setEditing(c.id); setModal(true) }} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem' }}>✏️</button>
                          <button onClick={() => del(c.id)} className="btn-danger" style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem' }}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Contract' : '+ New Contract'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Contract Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. SEO Retainer Agreement — ABC Company" /></div>
              <div className="grid-2">
                <div><label>Client *</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label>Monthly Value (₹)</label><input className="input" type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><label>End Date</label><input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div><label>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="draft">Draft</option><option value="sent">Sent to Client</option><option value="signed">Signed</option><option value="active">Active</option><option value="expired">Expired</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div><label>Terms & Conditions</label><textarea className="input" value={form.terms} onChange={e => setForm(f => ({ ...f, terms: e.target.value }))} rows={8} /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.title || !form.client_id}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Contract'}</button>
            </div>
          </div>
        </div>
      )}

      {viewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--accent-orange)' }}>Vraj Digital Marketing</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>SERVICE AGREEMENT</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className={`badge badge-${statusColor[viewModal.status] || 'gray'}`}>{viewModal.status.toUpperCase()}</span>
                {viewModal.signed_at && <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', marginTop: '0.25rem' }}>Signed: {new Date(viewModal.signed_at).toLocaleDateString('en-IN')}</div>}
              </div>
            </div>
            <div style={{ borderBottom: '2px solid var(--accent-orange)', marginBottom: '1rem', paddingBottom: '0.875rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{viewModal.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-orange)', marginTop: '0.2rem' }}>Client: {viewModal.clients?.name}</div>
              <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>Start: {viewModal.start_date ? new Date(viewModal.start_date).toLocaleDateString('en-IN') : '—'}</span>
                <span>End: {viewModal.end_date ? new Date(viewModal.end_date).toLocaleDateString('en-IN') : '—'}</span>
                <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹{(viewModal.value || 0).toLocaleString()}/month</span>
              </div>
            </div>
            {viewModal.terms && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-line', maxHeight: 300, overflowY: 'auto', marginBottom: '1rem' }}>{viewModal.terms}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setViewModal(null)}>Close</button>
              {viewModal.status === 'draft' && <button className="btn-primary" onClick={() => { sign(viewModal.id); setViewModal(null) }}>✍️ Mark as Signed</button>}
              <button className="btn-secondary" onClick={() => window.print()}>🖨️ Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

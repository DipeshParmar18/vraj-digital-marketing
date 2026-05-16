'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Budget() {
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ client_id: '', name: '', platform: 'google_ads', budget: '', spent: '', status: 'active', start_date: '', end_date: '' })
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const [cl, ca] = await Promise.all([
      supabase.from('clients').select('id, name'),
      supabase.from('campaigns').select('*, clients(name)').order('created_at', { ascending: false })
    ])
    setClients(cl.data || [])
    setCampaigns(ca.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, budget: Number(form.budget), spent: Number(form.spent) }
    if (editing) await supabase.from('campaigns').update(payload).eq('id', editing)
    else await supabase.from('campaigns').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm({ client_id: '', name: '', platform: 'google_ads', budget: '', spent: '', status: 'active', start_date: '', end_date: '' }); load()
  }

  const totalBudget = campaigns.reduce((s, c) => s + (c.budget || 0), 0)
  const totalSpent = campaigns.reduce((s, c) => s + (c.spent || 0), 0)
  const totalRemaining = totalBudget - totalSpent

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>💰 Budget Tracker</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Track ad spend across all campaigns</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-primary" onClick={() => { setEditing(null); setModal(true) }}>+ Add Campaign</button>
        </div>
      </div>
      <div className="page">
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}`, color: '#3b82f6', icon: '💼' },
            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, color: '#ef4444', icon: '💸' },
            { label: 'Remaining', value: `₹${totalRemaining.toLocaleString()}`, color: '#10b981', icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>{s.icon}</div>
              </div>
              <div style={{ marginTop: '0.75rem' }}>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: totalBudget > 0 ? `${Math.min((totalSpent/totalBudget)*100, 100)}%` : '0%' }}></div>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{totalBudget > 0 ? Math.round((totalSpent/totalBudget)*100) : 0}% utilized</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Campaign</th><th>Client</th><th>Platform</th><th>Budget</th><th>Spent</th><th>Remaining</th><th>Usage</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Loading...</td></tr>
                : campaigns.length === 0 ? <tr><td colSpan={9} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No campaigns yet</td></tr>
                : campaigns.map(c => {
                  const pct = c.budget > 0 ? Math.round((c.spent / c.budget) * 100) : 0
                  const remaining = (c.budget || 0) - (c.spent || 0)
                  return (
                    <tr key={c.id}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{c.name}</td>
                      <td>{c.clients?.name || '—'}</td>
                      <td><span className="badge badge-blue">{c.platform}</span></td>
                      <td>₹{(c.budget||0).toLocaleString()}</td>
                      <td>₹{(c.spent||0).toLocaleString()}</td>
                      <td style={{ color: remaining < 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight:600 }}>₹{remaining.toLocaleString()}</td>
                      <td style={{ minWidth: 100 }}>
                        <div className="progress-bar">
                          <div className="progress-fill" style={{ width: `${Math.min(pct,100)}%`, background: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981' }}></div>
                        </div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginTop:2 }}>{pct}%</div>
                      </td>
                      <td><span className={`badge badge-${c.status==='active'?'green':'gray'}`}>{c.status}</span></td>
                      <td>
                        <button className="btn-secondary" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }}
                          onClick={() => { setForm({ ...c, budget: c.budget?.toString(), spent: c.spent?.toString() }); setEditing(c.id); setModal(true) }}>Edit</button>
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
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing ? 'Edit Campaign' : 'Add Campaign'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div><label>Client</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({...f, client_id: e.target.value}))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Campaign Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} /></div>
              <div><label>Platform</label>
                <select className="input" value={form.platform} onChange={e => setForm(f => ({...f, platform: e.target.value}))}>
                  <option value="google_ads">Google Ads</option><option value="meta_ads">Meta Ads</option>
                  <option value="instagram">Instagram</option><option value="youtube">YouTube</option><option value="other">Other</option>
                </select>
              </div>
              <div className="grid-2">
                <div><label>Budget (₹)</label><input className="input" type="number" value={form.budget} onChange={e => setForm(f => ({...f, budget: e.target.value}))} /></div>
                <div><label>Spent (₹)</label><input className="input" type="number" value={form.spent} onChange={e => setForm(f => ({...f, spent: e.target.value}))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({...f, start_date: e.target.value}))} /></div>
                <div><label>End Date</label><input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({...f, end_date: e.target.value}))} /></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.name}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

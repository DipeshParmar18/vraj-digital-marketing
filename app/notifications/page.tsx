'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Page() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState<any>({})
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string|null>(null)

  const load = async () => {
    const [d, c] = await Promise.all([
      supabase.from('notifications').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setData(d.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    if (editing) await supabase.from('notifications').update(form).eq('id', editing)
    else await supabase.from('notifications').insert(form)
    setSaving(false); setModal(false); setEditing(null); setForm({}); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this item?')) return
    await supabase.from('notifications').delete().eq('id', id)
    load()
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight:700, color:'var(--text-primary)' }}>🔔 Notifications</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{data.length} records</div>
        </div>
        <div style={{ marginLeft:'auto' }}>
          <button className="btn-primary" onClick={() => { setForm({}); setEditing(null); setModal(true) }}>+ Add New</button>
        </div>
      </div>
      <div className="page">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Client</th><th>Name</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Loading...</td></tr>
                : data.length === 0 ? <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No records yet. Add your first one!</td></tr>
                : data.map(row => (
                  <tr key={row.id}>
                    <td>{row.clients?.name || '—'}</td>
                    <td style={{ color:'var(--text-primary)', fontWeight:600 }}>{row.name || row.title || row.keyword || row.subject || '—'}</td>
                    <td><span className={`badge badge-${row.status==='active'||row.status==='paid'||row.status==='published'?'green':row.status==='pending'||row.status==='scheduled'?'orange':row.status==='draft'?'gray':'blue'}`}>{row.status||'—'}</span></td>
                    <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{row.created_at ? new Date(row.created_at).toLocaleDateString('en-IN') : '—'}</td>
                    <td><div style={{ display:'flex', gap:'0.5rem' }}>
                      <button className="btn-secondary" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => { setForm(row); setEditing(row.id); setModal(true) }}>Edit</button>
                      <button className="btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => del(row.id)}>Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing ? 'Edit' : 'Add'} Notifications</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem' }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div><label>Client</label>
                <select className="input" value={form.client_id||''} onChange={e => setForm((f:any) => ({...f, client_id: e.target.value}))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Name / Title</label><input className="input" value={form.name||form.title||''} onChange={e => setForm((f:any) => ({...f, name: e.target.value, title: e.target.value}))} /></div>
              <div><label>Status</label>
                <select className="input" value={form.status||'active'} onChange={e => setForm((f:any) => ({...f, status: e.target.value}))}>
                  <option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option><option value="completed">Completed</option>
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

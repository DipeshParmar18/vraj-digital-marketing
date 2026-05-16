'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const empty = { name: '', email: '', phone: '', company: '', website: '', industry: '', monthly_budget: '', status: 'active', notes: '' }
const industries = ['E-Commerce','Real Estate','Healthcare','Education','Restaurant','Retail','Technology','Finance','Travel','Fashion','Other']

export default function Clients() {
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string|null>(null)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    setClients(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, monthly_budget: Number(form.monthly_budget) || 0 }
    if (editing) await supabase.from('clients').update(payload).eq('id', editing)
    else await supabase.from('clients').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this client and all their data?')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  const edit = (c: any) => { setForm({ ...c, monthly_budget: c.monthly_budget?.toString() || '' }); setEditing(c.id); setModal(true) }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>👥 Clients</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{clients.length} total clients</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <input className="input" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 200 }} />
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Add Client</button>
        </div>
      </div>
      <div className="page">
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Client</th><th>Company</th><th>Phone</th><th>Industry</th><th>Budget/mo</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No clients found</td></tr>
                : filtered.map(c => (
                  <tr key={c.id}>
                    <td><div style={{ fontWeight:600, color:'var(--text-primary)' }}>{c.name}</div><div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.email}</div></td>
                    <td>{c.company||'—'}</td><td>{c.phone||'—'}</td><td>{c.industry||'—'}</td>
                    <td>₹{(c.monthly_budget||0).toLocaleString()}</td>
                    <td><span className={`badge badge-${c.status==='active'?'green':c.status==='paused'?'orange':'gray'}`}>{c.status}</span></td>
                    <td><div style={{ display:'flex', gap:'0.5rem' }}>
                      <button className="btn-secondary" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => edit(c)}>Edit</button>
                      <button className="btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => del(c.id)}>Delete</button>
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
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing ? 'Edit Client' : 'Add New Client'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              {[['Name *','name','text'],['Email','email','email'],['Phone','phone','text'],['Company','company','text'],['Website','website','text'],['Monthly Budget (₹)','monthly_budget','number']].map(([lbl,key,type]) => (
                <div key={key as string}>
                  <label>{lbl as string}</label>
                  <input className="input" type={type as string} value={(form as any)[key as string]} onChange={e => setForm(f => ({...f,[key as string]:e.target.value}))} />
                </div>
              ))}
              <div><label>Industry</label>
                <select className="input" value={form.industry} onChange={e => setForm(f => ({...f,industry:e.target.value}))}>
                  <option value="">Select industry</option>
                  {industries.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div><label>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value}))}>
                  <option value="active">Active</option><option value="paused">Paused</option><option value="inactive">Inactive</option>
                </select>
              </div>
              <div><label>Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Client'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const empty = { name:'', email:'', phone:'', company:'', website:'', industry:'', monthly_budget:'', mrr:'', status:'active', notes:'', contract_type:'retainer', manager:'Dipesh Parmar', health_score:80, services:[] as string[] }
const industries = ['E-Commerce','Real Estate','Healthcare','Education','Restaurant','Retail','Technology','Finance','Travel','Fashion','Construction','Other']
const ALL_SERVICES = ['SEO','Google Ads','Meta Ads','Social Media','Web Development','Email Marketing','WhatsApp Marketing','Content Writing','Graphic Design']
const CONTRACT_TYPES = ['retainer','project','hourly','performance']

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

  const toggleService = (s: string) => {
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }))
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, monthly_budget: Number(form.monthly_budget)||0, mrr: Number(form.mrr)||0, health_score: Number(form.health_score)||80 }
    let clientId = editing

    if (editing) {
      await supabase.from('clients').update(payload).eq('id', editing)
    } else {
      const { data } = await supabase.from('clients').insert(payload).select().single()
      clientId = data?.id

      // AUTO-CREATE PROJECT for new client
      if (clientId) {
        await supabase.from('projects').insert({
          client_id: clientId,
          name: `${form.name} — Main Project`,
          description: `Default project for ${form.company || form.name}`,
          status: 'active',
          budget: Number(form.monthly_budget) || 0,
          type: 'general'
        })

        // Auto-create tasks for selected services
        const serviceTasks = (form.services || []).map((s: string) => ({
          client_id: clientId,
          title: `Setup ${s} for ${form.name}`,
          status: 'todo',
          priority: 'high',
          assigned_to: form.manager
        }))
        if (serviceTasks.length > 0) {
          await supabase.from('tasks').insert(serviceTasks)
        }
      }
    }

    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this client and all data?')) return
    await supabase.from('clients').delete().eq('id', id)
    load()
  }

  const edit = (c: any) => {
    setForm({ ...c, monthly_budget: c.monthly_budget?.toString()||'', mrr: c.mrr?.toString()||'', services: c.services||[] })
    setEditing(c.id); setModal(true)
  }

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.company?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  )

  const healthColor = (score: number) => score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const healthLabel = (score: number) => score >= 80 ? 'Healthy' : score >= 60 ? 'Needs attention' : 'Critical'

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight:700, color:'var(--text-primary)' }}>👥 Clients</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{clients.length} total clients</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <input className="input" placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} style={{ width:220 }} />
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Add Client</button>
        </div>
      </div>

      <div className="page">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom:'1.5rem' }}>
          {[
            { label:'Total Clients', value:clients.length, icon:'👥', color:'#3b82f6' },
            { label:'Active', value:clients.filter(c=>c.status==='active').length, icon:'✅', color:'#10b981' },
            { label:'Total MRR', value:`₹${clients.reduce((s,c)=>s+(c.mrr||0),0).toLocaleString()}`, icon:'💰', color:'#8b5cf6' },
            { label:'Avg Health', value:`${Math.round(clients.reduce((s,c)=>s+(c.health_score||80),0)/(clients.length||1))}%`, icon:'❤️', color:'#ef4444' },
          ].map((s,i) => (
            <div key={i} className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--text-primary)' }}>{s.value}</div>
                </div>
                <div style={{ fontSize:'1.75rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Client Cards */}
        <div className="grid-3">
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:220 }}></div>)
          : filtered.length === 0 ? (
            <div className="card" style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>👥</div>
              <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem' }}>No clients yet</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'1rem' }}>Add your first client — a project will be created automatically</div>
              <button className="btn-primary" onClick={() => { setForm(empty); setModal(true) }}>+ Add First Client</button>
            </div>
          ) : filtered.map(c => (
            <div key={c.id} className="card" style={{ position:'relative', overflow:'hidden' }}>
              {/* Health indicator bar at top */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:'var(--border)' }}>
                <div style={{ height:'100%', width:`${c.health_score||80}%`, background:healthColor(c.health_score||80), transition:'width 0.5s' }}></div>
              </div>

              <div style={{ display:'flex', alignItems:'flex-start', gap:'0.875rem', marginTop:'0.5rem', marginBottom:'0.875rem' }}>
                {/* Avatar */}
                <div style={{ width:44, height:44, borderRadius:'50%', background:`linear-gradient(135deg, #3b82f6, #8b5cf6)`, display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1rem', flexShrink:0 }}>
                  {c.name?.charAt(0)?.toUpperCase()}{c.name?.split(' ')[1]?.charAt(0)?.toUpperCase()||''}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.9rem' }}>{c.name}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{c.company}</div>
                  {c.website && <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize:'0.72rem', color:'var(--accent-blue)', textDecoration:'none' }}>{c.website.replace('https://','')}</a>}
                </div>
                <span className={`badge badge-${c.status==='active'?'green':c.status==='paused'?'orange':'gray'}`}>{c.status}</span>
              </div>

              {/* Info Grid */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.875rem', fontSize:'0.78rem' }}>
                <div style={{ color:'var(--text-muted)' }}>Contract: <span style={{ color:'var(--text-secondary)', fontWeight:600, textTransform:'capitalize' }}>{c.contract_type||'retainer'}</span></div>
                <div style={{ color:'var(--text-muted)' }}>MRR: <span style={{ color:'var(--accent-green)', fontWeight:600 }}>₹{(c.mrr||0).toLocaleString()}</span></div>
                <div style={{ color:'var(--text-muted)' }}>Manager: <span style={{ color:'var(--text-secondary)', fontWeight:600 }}>{c.manager||'—'}</span></div>
                <div style={{ color:'var(--text-muted)' }}>Budget: <span style={{ color:'var(--text-secondary)', fontWeight:600 }}>₹{(c.monthly_budget||0).toLocaleString()}</span></div>
              </div>

              {/* Health Score */}
              <div style={{ marginBottom:'0.875rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.72rem', marginBottom:'0.3rem' }}>
                  <span style={{ color:'var(--text-muted)' }}>Health Score</span>
                  <span style={{ color:healthColor(c.health_score||80), fontWeight:700 }}>{c.health_score||80}/100 · {healthLabel(c.health_score||80)}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width:`${c.health_score||80}%`, background:healthColor(c.health_score||80) }}></div>
                </div>
              </div>

              {/* Services */}
              {(c.services||[]).length > 0 && (
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem', marginBottom:'0.875rem' }}>
                  {(c.services||[]).slice(0,4).map((s: string) => (
                    <span key={s} style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:4, color:'var(--accent-blue)', fontWeight:600 }}>{s}</span>
                  ))}
                  {(c.services||[]).length > 4 && <span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>+{c.services.length-4}</span>}
                </div>
              )}

              {/* Actions */}
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <Link href={`/clients/${c.id}`} className="btn-primary" style={{ flex:1, justifyContent:'center', fontSize:'0.78rem', padding:'0.4rem', textDecoration:'none' }}>
                  👁 View Profile
                </Link>
                <button className="btn-secondary" style={{ padding:'0.4rem 0.75rem', fontSize:'0.78rem' }} onClick={() => edit(c)}>Edit</button>
                <button className="btn-danger" style={{ padding:'0.4rem 0.6rem', fontSize:'0.78rem' }} onClick={() => del(c.id)}>🗑</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:640 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing?'Edit Client':'Add New Client'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>

            {!editing && (
              <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'0.75rem', marginBottom:'1rem', fontSize:'0.8rem', color:'#10b981' }}>
                ✅ A project will be created automatically when you add this client
              </div>
            )}

            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div className="grid-2">
                <div><label>Client Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="Full name" /></div>
                <div><label>Company</label><input className="input" value={form.company} onChange={e => setForm(f => ({...f,company:e.target.value}))} placeholder="Company name" /></div>
              </div>
              <div className="grid-2">
                <div><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} /></div>
                <div><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Website</label><input className="input" value={form.website} onChange={e => setForm(f => ({...f,website:e.target.value}))} placeholder="https://" /></div>
                <div><label>Industry</label>
                  <select className="input" value={form.industry} onChange={e => setForm(f => ({...f,industry:e.target.value}))}>
                    <option value="">Select industry</option>
                    {industries.map(i => <option key={i}>{i}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Contract Type</label>
                  <select className="input" value={form.contract_type} onChange={e => setForm(f => ({...f,contract_type:e.target.value}))}>
                    {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                  </select>
                </div>
                <div><label>Manager</label><input className="input" value={form.manager} onChange={e => setForm(f => ({...f,manager:e.target.value}))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Monthly Budget (₹)</label><input className="input" type="number" value={form.monthly_budget} onChange={e => setForm(f => ({...f,monthly_budget:e.target.value}))} /></div>
                <div><label>MRR / Value (₹)</label><input className="input" type="number" value={form.mrr} onChange={e => setForm(f => ({...f,mrr:e.target.value}))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value}))}>
                    <option value="active">Active</option><option value="paused">Paused</option><option value="inactive">Inactive</option>
                  </select>
                </div>
                <div><label>Health Score (0-100)</label><input className="input" type="number" min="0" max="100" value={form.health_score} onChange={e => setForm(f => ({...f,health_score:Number(e.target.value)}))} /></div>
              </div>

              {/* Active Services */}
              <div>
                <label style={{ marginBottom:'0.625rem', display:'block' }}>Active Services Map</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'0.4rem' }}>
                  {ALL_SERVICES.map(s => (
                    <div key={s} onClick={() => toggleService(s)}
                      style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.5rem 0.75rem', background:form.services.includes(s)?'rgba(59,130,246,0.1)':'var(--bg-secondary)', border:`1px solid ${form.services.includes(s)?'var(--accent-blue)':'var(--border)'}`, borderRadius:8, cursor:'pointer', fontSize:'0.78rem', fontWeight:600, color:form.services.includes(s)?'var(--accent-blue)':'var(--text-muted)', transition:'all 0.15s' }}>
                      <div style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${form.services.includes(s)?'var(--accent-blue)':'var(--border)'}`, background:form.services.includes(s)?'var(--accent-blue)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {form.services.includes(s) && <span style={{ color:'white', fontSize:'0.55rem' }}>✓</span>}
                      </div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>

              <div><label>Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(f => ({...f,notes:e.target.value}))} /></div>
            </div>

            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.name}>{saving?'Saving...':editing?'Update Client':'Add Client + Create Project'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

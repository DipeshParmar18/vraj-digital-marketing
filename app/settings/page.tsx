'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const ROLES = [
  { value: 'owner', label: 'Owner', color: '#f59e0b', desc: 'Full access to everything' },
  { value: 'admin', label: 'Admin', color: '#8b5cf6', desc: 'All access except billing' },
  { value: 'manager', label: 'Manager', color: '#3b82f6', desc: 'Manage clients & campaigns' },
  { value: 'analyst', label: 'Analyst', color: '#06b6d4', desc: 'View reports & analytics only' },
  { value: 'viewer', label: 'Viewer', color: '#94a3b8', desc: 'View only access' },
]

const ALL_PERMISSIONS = [
  { key: 'clients', label: '👥 Clients', desc: 'Add/edit/delete clients' },
  { key: 'campaigns', label: '📢 Campaigns', desc: 'Manage ad campaigns' },
  { key: 'invoices', label: '🧾 Invoices', desc: 'Create & manage invoices' },
  { key: 'reports', label: '📊 Reports', desc: 'View & generate reports' },
  { key: 'team', label: '👤 Team', desc: 'Manage team members' },
  { key: 'settings', label: '⚙️ Settings', desc: 'Change app settings' },
  { key: 'integrations', label: '🔌 Integrations', desc: 'Connect/disconnect APIs' },
  { key: 'delete', label: '🗑️ Delete', desc: 'Delete any records' },
]

const ROLE_DEFAULTS: Record<string, string[]> = {
  owner: ['clients','campaigns','invoices','reports','team','settings','integrations','delete'],
  admin: ['clients','campaigns','invoices','reports','team','settings','integrations'],
  manager: ['clients','campaigns','reports'],
  analyst: ['reports'],
  viewer: [],
}

const empty = { name: '', email: '', role: 'viewer', status: 'active', permissions: {} as Record<string,boolean> }

export default function Settings() {
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'team'|'agency'>('team')
  const [agency, setAgency] = useState({ name: 'Vraj Digital Marketing', email: 'owner@vrajdigital.com', phone: '+91 98765 43210', address: 'Rajkot, Gujarat, India', website: 'https://vrajdigital.com', gst: '' })
  const [saved, setSaved] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('team_members').select('*').order('created_at')
    setTeam(data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const setRoleDefaults = (role: string) => {
    const perms: Record<string,boolean> = {}
    ALL_PERMISSIONS.forEach(p => { perms[p.key] = ROLE_DEFAULTS[role]?.includes(p.key) || false })
    setForm(f => ({ ...f, role, permissions: perms }))
  }

  const save = async () => {
    setSaving(true)
    const payload = { name: form.name, email: form.email, role: form.role, status: form.status, permissions: form.permissions }
    if (editing) await supabase.from('team_members').update(payload).eq('id', editing)
    else await supabase.from('team_members').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const del = async (id: string, role: string) => {
    if (role === 'owner') return alert('Cannot remove the owner!')
    if (!confirm('Remove this team member?')) return
    await supabase.from('team_members').delete().eq('id', id)
    load()
  }

  const edit = (m: any) => { setForm({ ...m, permissions: m.permissions || {} }); setEditing(m.id); setModal(true) }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight:700, color:'var(--text-primary)' }}>⚙️ Settings & Team</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Super Admin Panel</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem' }}>
          {(['team','agency'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'0.4rem 1rem', borderRadius:8, border:`1px solid ${tab===t?'var(--accent-blue)':'var(--border)'}`, background:tab===t?'rgba(59,130,246,0.15)':'transparent', color:tab===t?'var(--accent-blue)':'var(--text-muted)', cursor:'pointer', fontSize:'0.82rem', fontWeight:600, fontFamily:'inherit' }}>
              {t==='team'?'👥 Team':'🏢 Agency'}
            </button>
          ))}
        </div>
      </div>

      <div className="page">
        {tab === 'team' ? (
          <>
            <div style={{ background:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.08))', border:'1px solid rgba(245,158,11,0.3)', borderRadius:12, padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'1rem' }}>
              <div style={{ fontSize:'2.5rem' }}>👑</div>
              <div>
                <div style={{ fontWeight:700, color:'#f59e0b', fontSize:'0.95rem' }}>You are the Owner — Super Admin</div>
                <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginTop:'0.2rem' }}>Full access to all features, team management, billing, and settings.</div>
              </div>
              <button className="btn-primary" style={{ marginLeft:'auto' }} onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Invite Member</button>
            </div>

            <div className="card" style={{ marginBottom:'1.5rem' }}>
              <div style={{ fontSize:'0.85rem', fontWeight:700, marginBottom:'0.875rem', color:'var(--text-primary)' }}>🎭 Roles</div>
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                {ROLES.map(r => (
                  <div key={r.value} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'0.5rem 0.875rem' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:r.color }}></div>
                    <div>
                      <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-primary)' }}>{r.label}</div>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{r.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="table-container">
                <table>
                  <thead><tr><th>Member</th><th>Role</th><th>Permissions</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {loading ? <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Loading...</td></tr>
                    : team.map(m => {
                      const role = ROLES.find(r => r.value === m.role)
                      const perms = Object.keys(m.permissions||{}).filter(k => m.permissions[k])
                      return (
                        <tr key={m.id}>
                          <td>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                              <div style={{ width:36, height:36, borderRadius:'50%', background:`${role?.color}20`, border:`2px solid ${role?.color}40`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, color:role?.color, fontSize:'0.875rem', flexShrink:0 }}>
                                {m.name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.875rem' }}>{m.name}</div>
                                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{m.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.25rem 0.75rem', borderRadius:999, background:`${role?.color}15`, color:role?.color, fontSize:'0.75rem', fontWeight:700 }}>
                              {m.role==='owner'&&'👑'} {role?.label}
                            </span>
                          </td>
                          <td>
                            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.25rem', maxWidth:260 }}>
                              {perms.length===0?<span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>View only</span>
                              :perms.slice(0,3).map(p => {
                                const perm = ALL_PERMISSIONS.find(ap => ap.key===p)
                                return <span key={p} style={{ fontSize:'0.65rem', padding:'0.15rem 0.4rem', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:4, color:'var(--text-muted)' }}>{perm?.label}</span>
                              })}
                              {perms.length>3&&<span style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>+{perms.length-3}</span>}
                            </div>
                          </td>
                          <td><span className={`badge badge-${m.status==='active'?'green':'gray'}`}>{m.status}</span></td>
                          <td>
                            <div style={{ display:'flex', gap:'0.5rem' }}>
                              <button className="btn-secondary" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => edit(m)}>Edit</button>
                              {m.role!=='owner'&&<button className="btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => del(m.id, m.role)}>Remove</button>}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div style={{ maxWidth:600 }}>
            <div className="card">
              <div style={{ fontSize:'0.9rem', fontWeight:700, marginBottom:'1.25rem', color:'var(--text-primary)' }}>🏢 Agency Profile</div>
              <div style={{ display:'grid', gap:'0.875rem' }}>
                {[['Agency Name','name'],['Email','email'],['Phone','phone'],['Website','website'],['GST Number','gst'],['Address','address']].map(([lbl,key]) => (
                  <div key={key}><label>{lbl}</label><input className="input" value={(agency as any)[key]||''} onChange={e => setAgency(a => ({...a,[key]:e.target.value}))} /></div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }} style={{ marginTop:'1.25rem' }}>
                {saved?'✅ Saved!':'💾 Save Settings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth:620 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing?'Edit Member':'+ Invite Team Member'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div className="grid-2">
                <div><label>Full Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} placeholder="e.g. Rahul Sharma" /></div>
                <div><label>Email *</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({...f,email:e.target.value}))} placeholder="rahul@example.com" /></div>
              </div>
              <div className="grid-2">
                <div><label>Role *</label>
                  <select className="input" value={form.role} onChange={e => setRoleDefaults(e.target.value)}>
                    {ROLES.filter(r => r.value!=='owner').map(r => <option key={r.value} value={r.value}>{r.label} — {r.desc}</option>)}
                  </select>
                </div>
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({...f,status:e.target.value}))}>
                    <option value="active">Active</option><option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ marginBottom:'0.625rem', display:'block' }}>Permissions</label>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.5rem' }}>
                  {ALL_PERMISSIONS.map(p => (
                    <div key={p.key} onClick={() => setForm(f => ({...f,permissions:{...f.permissions,[p.key]:!f.permissions[p.key]}}))}
                      style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', background:form.permissions[p.key]?'rgba(59,130,246,0.1)':'var(--bg-secondary)', border:`1px solid ${form.permissions[p.key]?'var(--accent-blue)':'var(--border)'}`, borderRadius:8, cursor:'pointer', transition:'all 0.15s' }}>
                      <div style={{ width:18, height:18, borderRadius:4, border:`2px solid ${form.permissions[p.key]?'var(--accent-blue)':'var(--border)'}`, background:form.permissions[p.key]?'var(--accent-blue)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        {form.permissions[p.key]&&<span style={{ color:'white', fontSize:'0.7rem' }}>✓</span>}
                      </div>
                      <div>
                        <div style={{ fontSize:'0.8rem', fontWeight:600, color:'var(--text-primary)' }}>{p.label}</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{p.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.name||!form.email}>{saving?'Saving...':editing?'Update Member':'Invite Member'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

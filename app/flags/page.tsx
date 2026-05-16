'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const FLAG_TYPES = [
  { value: 'critical', label: 'Critical', color: '#ef4444', icon: '🔴', cls: 'flag-critical' },
  { value: 'warning', label: 'Warning', color: '#f59e0b', icon: '🟡', cls: 'flag-warning' },
  { value: 'info', label: 'Info', color: '#2563eb', icon: '🔵', cls: 'flag-info' },
  { value: 'success', label: 'Success', color: '#10b981', icon: '🟢', cls: 'flag-success' },
]

const empty = { client_id: '', title: '', description: '', type: 'warning', priority: 'medium', status: 'open' }

export default function Flags() {
  const [flags, setFlags] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const [f, c] = await Promise.all([
      supabase.from('flags').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setFlags(f.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    if (editing) await supabase.from('flags').update(form).eq('id', editing)
    else await supabase.from('flags').insert(form)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const resolve = async (id: string) => {
    await supabase.from('flags').update({ status: 'resolved', resolved_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this flag?')) return
    await supabase.from('flags').delete().eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? flags : flags.filter(f => f.status === filter || f.type === filter)
  const critical = flags.filter(f => f.type === 'critical' && f.status === 'open').length
  const open = flags.filter(f => f.status === 'open').length
  const resolved = flags.filter(f => f.status === 'resolved').length

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🚩 Flags & Alerts</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{open} open · {critical} critical</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All Flags</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Raise Flag</button>
        </div>
      </div>

      <div className="page">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Flags', value: flags.length, color: 'var(--accent-blue)', icon: '🚩' },
            { label: 'Critical', value: critical, color: 'var(--accent-red)', icon: '🔴' },
            { label: 'Open', value: open, color: 'var(--accent-orange)', icon: '⚠️' },
            { label: 'Resolved', value: resolved, color: 'var(--accent-green)', icon: '✅' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
                </div>
                <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Flags List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 80 }}></div>)
          : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚩</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No flags found</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.5rem' }}>Raise a flag to alert your team about issues</div>
            </div>
          ) : filtered.map(flag => {
            const type = FLAG_TYPES.find(t => t.value === flag.type) || FLAG_TYPES[1]
            return (
              <div key={flag.id} className={type.cls} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <div style={{ fontSize: '1.25rem', flexShrink: 0, marginTop: '0.1rem' }}>{type.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{flag.title}</span>
                    <span className={`badge badge-${flag.type === 'critical' ? 'red' : flag.type === 'warning' ? 'orange' : flag.type === 'success' ? 'green' : 'blue'}`}>{flag.type}</span>
                    <span className={`badge badge-${flag.status === 'open' ? 'orange' : 'green'}`}>{flag.status}</span>
                    <span className={`badge badge-${flag.priority === 'high' ? 'red' : flag.priority === 'medium' ? 'yellow' : 'gray'}`}>{flag.priority}</span>
                  </div>
                  {flag.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', lineHeight: 1.5 }}>{flag.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {flag.clients?.name && <span>👤 {flag.clients.name}</span>}
                    <span>🕒 {new Date(flag.created_at).toLocaleDateString('en-IN')}</span>
                    {flag.resolved_at && <span>✅ Resolved {new Date(flag.resolved_at).toLocaleDateString('en-IN')}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {flag.status === 'open' && <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem', borderColor: 'rgba(16,185,129,0.3)', color: '#10b981' }} onClick={() => resolve(flag.id)}>✅ Resolve</button>}
                  <button className="btn-secondary" style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }} onClick={() => { setForm({ ...flag }); setEditing(flag.id); setModal(true) }}>Edit</button>
                  <button className="btn-danger" style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }} onClick={() => del(flag.id)}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Flag' : '🚩 Raise New Flag'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Budget overspend on Google Ads" /></div>
              <div><label>Client</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Select client (optional)</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Describe the issue in detail..." /></div>
              <div className="grid-2">
                <div><label>Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    {FLAG_TYPES.map(t => <option key={t.value} value={t.value}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <div><label>Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <div><label>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="open">Open</option><option value="resolved">Resolved</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.title}>{saving ? 'Saving...' : editing ? 'Update' : 'Raise Flag'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

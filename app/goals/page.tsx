'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const METRICS = [
  { value: 'leads', label: 'Leads Generated', unit: 'leads', icon: '⚡' },
  { value: 'revenue', label: 'Revenue (₹)', unit: '₹', icon: '💰' },
  { value: 'roas', label: 'ROAS Target', unit: 'x', icon: '📈' },
  { value: 'keywords_top10', label: 'Keywords in Top 10', unit: 'keywords', icon: '🔍' },
  { value: 'organic_traffic', label: 'Organic Traffic', unit: 'sessions', icon: '🌐' },
  { value: 'followers', label: 'Social Followers', unit: 'followers', icon: '👥' },
  { value: 'cpl', label: 'Cost Per Lead (₹)', unit: '₹', icon: '🎯' },
  { value: 'conversions', label: 'Conversions', unit: 'conv.', icon: '✅' },
  { value: 'ad_spend', label: 'Ad Spend (₹)', unit: '₹', icon: '💸' },
  { value: 'backlinks', label: 'Backlinks Built', unit: 'links', icon: '🔗' },
]

const empty = { client_id: '', metric: 'leads', target: '', actual: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), status: 'in_progress' }

export default function Goals() {
  const [goals, setGoals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterClient, setFilterClient] = useState('')

  const load = async () => {
    const [g, c] = await Promise.all([
      supabase.from('goals').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setGoals(g.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, target: Number(form.target) || 0, actual: Number(form.actual) || 0 }
    if (editing) await supabase.from('goals').update(payload).eq('id', editing)
    else await supabase.from('goals').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const updateActual = async (id: string, actual: number) => {
    const goal = goals.find(g => g.id === id)
    const status = actual >= (goal?.target || 0) ? 'achieved' : 'in_progress'
    await supabase.from('goals').update({ actual, status }).eq('id', id)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete goal?')) return
    await supabase.from('goals').delete().eq('id', id)
    load()
  }

  const filtered = filterClient ? goals.filter(g => g.client_id === filterClient) : goals
  const achieved = goals.filter(g => g.status === 'achieved').length
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🎯 Goal Tracking</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{goals.length} goals · {achieved} achieved</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="input" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ width: 160 }}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Set Goal</button>
        </div>
      </div>

      <div className="page">
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Goals', value: goals.length, color: 'var(--accent-blue)', icon: '🎯' },
            { label: 'Achieved', value: achieved, color: 'var(--accent-green)', icon: '✅' },
            { label: 'In Progress', value: goals.filter(g => g.status === 'in_progress').length, color: 'var(--accent-orange)', icon: '⏳' },
            { label: 'Achievement Rate', value: `${goals.length ? Math.round((achieved / goals.length) * 100) : 0}%`, color: 'var(--accent-purple)', icon: '📈' },
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

        <div style={{ display: 'grid', gap: '0.875rem' }}>
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 90 }}></div>)
          : filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No goals set yet</div>
              <button className="btn-primary" onClick={() => setModal(true)}>+ Set First Goal</button>
            </div>
          ) : filtered.map(goal => {
            const metric = METRICS.find(m => m.value === goal.metric)
            const pct = goal.target > 0 ? Math.min(Math.round((goal.actual / goal.target) * 100), 100) : 0
            const achieved = goal.status === 'achieved' || pct >= 100
            return (
              <div key={goal.id} className="card" style={{ borderLeft: `3px solid ${achieved ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-orange)' : 'var(--accent-blue)'}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div style={{ fontSize: '1.75rem', flexShrink: 0 }}>{metric?.icon || '🎯'}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{metric?.label || goal.metric}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-orange)' }}>👤 {goal.clients?.name} · {months[goal.month - 1]} {goal.year}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge badge-${achieved ? 'green' : pct >= 70 ? 'orange' : 'blue'}`}>{achieved ? '🏆 Achieved' : `${pct}%`}</span>
                        <button className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.68rem' }} onClick={() => { setForm({ ...goal, target: goal.target?.toString(), actual: goal.actual?.toString() }); setEditing(goal.id); setModal(true) }}>Edit</button>
                        <button className="btn-danger" style={{ padding: '0.2rem 0.4rem', fontSize: '0.68rem' }} onClick={() => del(goal.id)}>🗑</button>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                      <div style={{ flex: 1 }}>
                        <div className="progress-bar" style={{ height: 8 }}>
                          <div className="progress-fill" style={{ width: `${pct}%`, background: achieved ? 'var(--accent-green)' : pct >= 70 ? 'var(--accent-orange)' : 'var(--accent-blue)' }}></div>
                        </div>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <span style={{ color: achieved ? 'var(--accent-green)' : 'var(--text-primary)', fontWeight: 700 }}>{goal.actual}</span>
                        <span style={{ color: 'var(--text-muted)' }}> / {goal.target} {metric?.unit}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Update actual:</span>
                      <input type="number" defaultValue={goal.actual} onBlur={e => updateActual(goal.id, Number(e.target.value))}
                        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 6, padding: '0.2rem 0.5rem', color: 'var(--text-primary)', fontSize: '0.78rem', width: 80, fontFamily: 'inherit' }} />
                    </div>
                  </div>
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
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Goal' : '🎯 Set New Goal'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Client *</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Metric *</label>
                <select className="input" value={form.metric} onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}>
                  {METRICS.map(m => <option key={m.value} value={m.value}>{m.icon} {m.label}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div><label>Target *</label><input className="input" type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. 100" /></div>
                <div><label>Actual (current)</label><input className="input" type="number" value={form.actual} onChange={e => setForm(f => ({ ...f, actual: e.target.value }))} placeholder="e.g. 45" /></div>
              </div>
              <div className="grid-2">
                <div><label>Month</label>
                  <select className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: Number(e.target.value) }))}>
                    {months.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div><label>Year</label>
                  <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: Number(e.target.value) }))}>
                    {[2025, 2026, 2027].map(y => <option key={y}>{y}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.client_id || !form.target}>{saving ? 'Saving...' : editing ? 'Update' : 'Set Goal'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const STAGES = [
  { id: 'new', label: 'New Lead', color: '#94a3b8', icon: '🆕' },
  { id: 'contacted', label: 'Contacted', color: '#3b82f6', icon: '📞' },
  { id: 'demo', label: 'Demo Done', color: '#8b5cf6', icon: '🎯' },
  { id: 'proposal', label: 'Proposal Sent', color: '#f59e0b', icon: '📄' },
  { id: 'negotiation', label: 'Negotiating', color: '#f97316', icon: '🤝' },
  { id: 'closed_won', label: 'Won ✅', color: '#10b981', icon: '🏆' },
  { id: 'closed_lost', label: 'Lost ❌', color: '#ef4444', icon: '❌' },
]

const SOURCES = ['Google Search', 'Instagram', 'Facebook', 'Referral', 'Walk-in', 'LinkedIn', 'WhatsApp', 'Cold Outreach', 'Website Form', 'Other']
const ALL_SERVICES = ['SEO', 'Google Ads', 'Meta Ads', 'Social Media', 'Web Development', 'Email Marketing', 'WhatsApp Marketing', 'Content Writing']

const empty = { name: '', email: '', phone: '', company: '', website: '', source: 'Google Search', stage: 'new', deal_value: '', probability: '20', services: [] as string[], notes: '', assigned_to: '', follow_up_date: '', lost_reason: '' }

export default function Pipeline() {
  const [leads, setLeads] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [converting, setConverting] = useState<string | null>(null)

  const load = async () => {
    const [l, t] = await Promise.all([
      supabase.from('leads_pipeline').select('*').order('created_at', { ascending: false }),
      supabase.from('team_members').select('id, name').eq('status', 'active')
    ])
    setLeads(l.data || [])
    setTeam(t.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, deal_value: Number(form.deal_value) || 0, probability: Number(form.probability) || 0 }
    if (editing) await supabase.from('leads_pipeline').update(payload).eq('id', editing)
    else await supabase.from('leads_pipeline').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const updateStage = async (id: string, stage: string) => {
    await supabase.from('leads_pipeline').update({ stage }).eq('id', id)
    load()
  }

  const convertToClient = async (lead: any) => {
    setConverting(lead.id)
    const { data } = await supabase.from('clients').insert({
      name: lead.name, email: lead.email, phone: lead.phone,
      company: lead.company, website: lead.website,
      status: 'active', services: lead.services || [],
      manager: lead.assigned_to || 'Dipesh Parmar',
      monthly_budget: lead.deal_value || 0,
    }).select().single()
    if (data) {
      await supabase.from('leads_pipeline').update({ stage: 'closed_won', converted_client_id: data.id }).eq('id', lead.id)
      alert(`✅ ${lead.name} converted to client! Project auto-created.`)
    }
    setConverting(null)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    await supabase.from('leads_pipeline').delete().eq('id', id)
    load()
  }

  const totalPipeline = leads.filter(l => !['closed_won','closed_lost'].includes(l.stage)).reduce((s, l) => s + ((l.deal_value * l.probability) / 100), 0)
  const wonValue = leads.filter(l => l.stage === 'closed_won').reduce((s, l) => s + (l.deal_value || 0), 0)
  const convRate = leads.length ? Math.round((leads.filter(l => l.stage === 'closed_won').length / leads.length) * 100) : 0

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⚡ Lead Pipeline</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{leads.length} leads · ₹{Math.round(totalPipeline).toLocaleString()} pipeline value</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {(['kanban','list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '0.4rem 0.75rem', background: view===v?'rgba(249,115,22,0.15)':'transparent', color: view===v?'var(--accent-orange)':'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                {v==='kanban'?'⊞ Funnel':'☰ List'}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Add Lead</button>
        </div>
      </div>

      <div className="page">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Leads', value: leads.length, color: 'var(--accent-blue)', icon: '⚡' },
            { label: 'Pipeline Value', value: `₹${Math.round(totalPipeline).toLocaleString()}`, color: 'var(--accent-orange)', icon: '💰' },
            { label: 'Won Value', value: `₹${wonValue.toLocaleString()}`, color: 'var(--accent-green)', icon: '🏆' },
            { label: 'Conv. Rate', value: `${convRate}%`, color: 'var(--accent-purple)', icon: '📈' },
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

        {view === 'kanban' ? (
          <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '1rem', alignItems: 'flex-start' }}>
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage.id)
              const stageValue = stageLeads.reduce((s, l) => s + (l.deal_value || 0), 0)
              return (
                <div key={stage.id} style={{ minWidth: 240, flexShrink: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-card)', borderRadius: 8, border: `1px solid ${stage.color}30` }}>
                    <span>{stage.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: stage.color }}>{stage.label}</div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stageLeads.length} · ₹{stageValue.toLocaleString()}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {stageLeads.map(lead => (
                      <div key={lead.id} className="card" style={{ padding: '0.875rem', borderLeft: `3px solid ${stage.color}` }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem', marginBottom: '0.2rem' }}>{lead.name}</div>
                        {lead.company && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>🏢 {lead.company}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--accent-green)', fontWeight: 700 }}>₹{(lead.deal_value || 0).toLocaleString()}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{lead.probability}% likely</span>
                        </div>
                        {lead.source && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📍 {lead.source}</div>}
                        {lead.follow_up_date && <div style={{ fontSize: '0.65rem', color: new Date(lead.follow_up_date) < new Date() ? 'var(--accent-red)' : 'var(--accent-orange)', marginBottom: '0.5rem', fontWeight: 600 }}>📅 Follow up: {new Date(lead.follow_up_date).toLocaleDateString('en-IN')}</div>}
                        {(lead.services || []).length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginBottom: '0.5rem' }}>
                            {lead.services.slice(0, 2).map((s: string) => <span key={s} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4, color: 'var(--accent-orange)' }}>{s}</span>)}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {lead.stage !== 'closed_won' && lead.stage !== 'closed_lost' && (
                            <button onClick={() => convertToClient(lead)} disabled={!!converting} style={{ fontSize: '0.62rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, cursor: 'pointer', color: '#10b981', fontFamily: 'inherit', fontWeight: 600 }}>
                              {converting === lead.id ? '...' : '✅ Convert'}
                            </button>
                          )}
                          <button onClick={() => { setForm({ ...lead, deal_value: lead.deal_value?.toString() || '', probability: lead.probability?.toString() || '20', services: lead.services || [] }); setEditing(lead.id); setModal(true) }} style={{ fontSize: '0.62rem', padding: '0.25rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>✏️ Edit</button>
                          <button onClick={() => del(lead.id)} style={{ fontSize: '0.62rem', padding: '0.25rem 0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-red)', fontFamily: 'inherit' }}>🗑</button>
                        </div>
                        {/* Move stage buttons */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.2rem', flexWrap: 'wrap' }}>
                          {STAGES.filter(s => s.id !== stage.id).slice(0, 2).map(s => (
                            <button key={s.id} onClick={() => updateStage(lead.id, s.id)} style={{ fontSize: '0.58rem', padding: '0.15rem 0.4rem', background: `${s.color}10`, border: `1px solid ${s.color}30`, borderRadius: 4, cursor: 'pointer', color: s.color, fontFamily: 'inherit' }}>→ {s.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {stageLeads.length === 0 && <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.72rem', border: '1px dashed var(--border)', borderRadius: 8 }}>No leads</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Lead</th><th>Source</th><th>Services</th><th>Deal Value</th><th>Probability</th><th>Stage</th><th>Follow Up</th><th>Assigned</th><th>Actions</th></tr></thead>
                <tbody>
                  {leads.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leads yet</td></tr>
                  : leads.map(lead => {
                    const stage = STAGES.find(s => s.id === lead.stage)
                    return (
                      <tr key={lead.id}>
                        <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lead.name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lead.company} · {lead.phone}</div></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lead.source}</td>
                        <td><div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>{(lead.services || []).slice(0, 2).map((s: string) => <span key={s} style={{ fontSize: '0.6rem', padding: '0.1rem 0.4rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 4, color: 'var(--accent-orange)' }}>{s}</span>)}</div></td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹{(lead.deal_value || 0).toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{lead.probability}%</td>
                        <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.2rem 0.6rem', borderRadius: 999, background: `${stage?.color}15`, color: stage?.color, fontSize: '0.72rem', fontWeight: 700 }}>{stage?.icon} {stage?.label}</span></td>
                        <td style={{ fontSize: '0.75rem', color: lead.follow_up_date && new Date(lead.follow_up_date) < new Date() ? 'var(--accent-red)' : 'var(--text-muted)' }}>{lead.follow_up_date ? new Date(lead.follow_up_date).toLocaleDateString('en-IN') : '—'}</td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{lead.assigned_to || '—'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {lead.stage !== 'closed_won' && <button onClick={() => convertToClient(lead)} style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, cursor: 'pointer', color: '#10b981', fontFamily: 'inherit' }}>Convert</button>}
                            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }} onClick={() => { setForm({ ...lead, deal_value: lead.deal_value?.toString() || '', probability: lead.probability?.toString() || '20', services: lead.services || [] }); setEditing(lead.id); setModal(true) }}>Edit</button>
                            <button className="btn-danger" style={{ padding: '0.25rem 0.4rem', fontSize: '0.68rem' }} onClick={() => del(lead.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Lead' : '+ Add New Lead'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div className="grid-2">
                <div><label>Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Lead name" /></div>
                <div><label>Company</label><input className="input" value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Phone</label><input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
                <div><label>Email</label><input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Source</label>
                  <select className="input" value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}>
                    {SOURCES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div><label>Stage</label>
                  <select className="input" value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))}>
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Deal Value (₹)</label><input className="input" type="number" value={form.deal_value} onChange={e => setForm(f => ({ ...f, deal_value: e.target.value }))} /></div>
                <div><label>Probability (%)</label><input className="input" type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Follow-up Date</label><input className="input" type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} /></div>
                <div><label>Assign To</label>
                  <select className="input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Select member</option>
                    {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    <option value="Dipesh Parmar">Dipesh Parmar (Owner)</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ marginBottom: '0.5rem', display: 'block' }}>Interested Services</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.4rem' }}>
                  {ALL_SERVICES.map(s => (
                    <div key={s} onClick={() => setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }))}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.6rem', background: form.services.includes(s) ? 'rgba(249,115,22,0.1)' : 'var(--bg-secondary)', border: `1px solid ${form.services.includes(s) ? 'var(--accent-orange)' : 'var(--border)'}`, borderRadius: 7, cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, color: form.services.includes(s) ? 'var(--accent-orange)' : 'var(--text-muted)' }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${form.services.includes(s) ? 'var(--accent-orange)' : 'var(--border)'}`, background: form.services.includes(s) ? 'var(--accent-orange)' : 'transparent', flexShrink: 0 }}></div>
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div><label>Notes</label><textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any notes about this lead..." /></div>
              {form.stage === 'closed_lost' && <div><label>Lost Reason</label><input className="input" value={form.lost_reason} onChange={e => setForm(f => ({ ...f, lost_reason: e.target.value }))} placeholder="Why did we lose this?" /></div>}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.name}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Lead'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

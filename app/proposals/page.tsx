'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const SERVICE_PACKAGES = [
  { name: 'SEO Basic', price: 15000, desc: 'On-page SEO, keyword research, monthly report' },
  { name: 'SEO Advanced', price: 30000, desc: 'Full SEO — technical, on-page, off-page, backlinks' },
  { name: 'Google Ads Management', price: 20000, desc: 'Campaign setup, optimization, monthly report' },
  { name: 'Meta Ads Management', price: 18000, desc: 'FB + Instagram ads, creatives, optimization' },
  { name: 'Social Media Management', price: 15000, desc: '30 posts/month across 2 platforms' },
  { name: 'Website Development', price: 50000, desc: 'Custom website design + development' },
  { name: 'Email Marketing', price: 10000, desc: '4 campaigns/month, list management' },
  { name: 'WhatsApp Marketing', price: 8000, desc: 'Bulk campaigns, automation setup' },
  { name: 'Content Writing', price: 12000, desc: '8 blog posts/month, SEO optimized' },
  { name: 'Complete Digital Package', price: 75000, desc: 'SEO + Google Ads + Meta Ads + Social Media' },
]

const empty = {
  client_id: '', lead_id: '', title: '', status: 'draft',
  services: [] as { name: string; price: number; desc: string; qty: number }[],
  notes: '', valid_until: '', total_amount: 0
}

export default function Proposals() {
  const [proposals, setProposals] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [previewModal, setPreviewModal] = useState<any>(null)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [customService, setCustomService] = useState({ name: '', price: '', desc: '' })

  const load = async () => {
    const [p, c, l] = await Promise.all([
      supabase.from('proposals').select('*, clients(name), leads_pipeline(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('leads_pipeline').select('id, name').not('stage', 'eq', 'closed_won')
    ])
    setProposals(p.data || [])
    setClients(c.data || [])
    setLeads(l.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const toggleService = (svc: typeof SERVICE_PACKAGES[0]) => {
    const exists = form.services.find(s => s.name === svc.name)
    if (exists) {
      setForm(f => ({ ...f, services: f.services.filter(s => s.name !== svc.name) }))
    } else {
      setForm(f => ({ ...f, services: [...f.services, { ...svc, qty: 1 }] }))
    }
  }

  const addCustom = () => {
    if (!customService.name || !customService.price) return
    setForm(f => ({ ...f, services: [...f.services, { name: customService.name, price: Number(customService.price), desc: customService.desc, qty: 1 }] }))
    setCustomService({ name: '', price: '', desc: '' })
  }

  const total = form.services.reduce((s, svc) => s + (svc.price * (svc.qty || 1)), 0)
  const tax = Math.round(total * 0.18)
  const grandTotal = total + tax

  const save = async () => {
    setSaving(true)
    const payload = { ...form, total_amount: grandTotal, services: form.services }
    if (editing) await supabase.from('proposals').update(payload).eq('id', editing)
    else await supabase.from('proposals').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('proposals').update({ status, ...(status === 'sent' ? { sent_at: new Date().toISOString() } : {}) }).eq('id', id)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete proposal?')) return
    await supabase.from('proposals').delete().eq('id', id)
    load()
  }

  const statusColor: Record<string, string> = { draft: 'gray', sent: 'blue', viewed: 'orange', accepted: 'green', rejected: 'red' }

  const totalValue = proposals.filter(p => p.status === 'accepted').reduce((s, p) => s + (p.total_amount || 0), 0)

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📄 Proposals</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{proposals.length} proposals · ₹{totalValue.toLocaleString()} accepted</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ New Proposal</button>
        </div>
      </div>

      <div className="page">
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total', value: proposals.length, color: 'var(--accent-blue)', icon: '📄' },
            { label: 'Sent', value: proposals.filter(p => p.status === 'sent').length, color: 'var(--accent-orange)', icon: '📤' },
            { label: 'Accepted', value: proposals.filter(p => p.status === 'accepted').length, color: 'var(--accent-green)', icon: '✅' },
            { label: 'Won Value', value: `₹${totalValue.toLocaleString()}`, color: 'var(--accent-green)', icon: '💰' },
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
              <thead><tr><th>Proposal</th><th>Client / Lead</th><th>Services</th><th>Amount</th><th>Valid Until</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : proposals.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No proposals yet. Create your first one!</td></tr>
                : proposals.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</td>
                    <td style={{ color: 'var(--accent-orange)' }}>{p.clients?.name || p.leads_pipeline?.name || '—'}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(p.services || []).length} services</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-green)' }}>₹{(p.total_amount || 0).toLocaleString()}</td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.valid_until ? new Date(p.valid_until).toLocaleDateString('en-IN') : '—'}</td>
                    <td><span className={`badge badge-${statusColor[p.status] || 'gray'}`}>{p.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                        <button onClick={() => setPreviewModal(p)} className="btn-primary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>👁 View</button>
                        {p.status === 'draft' && <button onClick={() => updateStatus(p.id, 'sent')} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>📤 Send</button>}
                        {p.status === 'sent' && <button onClick={() => updateStatus(p.id, 'accepted')} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', borderColor: 'var(--accent-green)', color: 'var(--accent-green)' }}>✅ Accept</button>}
                        <button onClick={() => { setForm({ ...p, services: p.services || [] }); setEditing(p.id); setModal(true) }} className="btn-secondary" style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem' }}>✏️</button>
                        <button onClick={() => del(p.id)} className="btn-danger" style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem' }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Proposal' : '+ New Proposal'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Proposal Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Digital Marketing Proposal for ABC Company" /></div>
              <div className="grid-2">
                <div><label>Client (existing)</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, lead_id: '' }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label>Or Lead (prospect)</label>
                  <select className="input" value={form.lead_id} onChange={e => setForm(f => ({ ...f, lead_id: e.target.value, client_id: '' }))}>
                    <option value="">Select lead</option>
                    {leads.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Valid Until</label><input className="input" type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} /></div>
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="draft">Draft</option><option value="sent">Sent</option><option value="viewed">Viewed</option><option value="accepted">Accepted</option><option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>

              {/* Service Packages */}
              <div>
                <label style={{ marginBottom: '0.625rem', display: 'block' }}>Select Services / Packages</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {SERVICE_PACKAGES.map(svc => {
                    const selected = form.services.find(s => s.name === svc.name)
                    return (
                      <div key={svc.name} onClick={() => toggleService(svc)}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '0.625rem', padding: '0.625rem 0.75rem', background: selected ? 'rgba(249,115,22,0.08)' : 'var(--bg-secondary)', border: `1px solid ${selected ? 'var(--accent-orange)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${selected ? 'var(--accent-orange)' : 'var(--border)'}`, background: selected ? 'var(--accent-orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                          {selected && <span style={{ color: 'white', fontSize: '0.6rem', fontWeight: 700 }}>✓</span>}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: selected ? 'var(--accent-orange)' : 'var(--text-primary)' }}>{svc.name}</div>
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{svc.desc}</div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-green)', marginTop: '0.2rem' }}>₹{svc.price.toLocaleString()}/mo</div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Custom service */}
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.75rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>+ Add Custom Service</div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="Service name" value={customService.name} onChange={e => setCustomService(f => ({ ...f, name: e.target.value }))} style={{ flex: 2 }} />
                    <input className="input" type="number" placeholder="Price ₹" value={customService.price} onChange={e => setCustomService(f => ({ ...f, price: e.target.value }))} style={{ flex: 1 }} />
                    <button onClick={addCustom} className="btn-secondary" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>+ Add</button>
                  </div>
                </div>
              </div>

              {/* Selected services */}
              {form.services.length > 0 && (
                <div style={{ background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 8, padding: '0.875rem' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.625rem' }}>📋 Selected Services</div>
                  {form.services.map((svc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.375rem 0', borderBottom: '1px solid rgba(249,115,22,0.1)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{svc.name}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--accent-green)' }}>₹{(svc.price * svc.qty).toLocaleString()}</span>
                        <button onClick={() => setForm(f => ({ ...f, services: f.services.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', fontSize: '0.875rem' }}>×</button>
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Subtotal</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{total.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>GST 18%</span><span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>₹{tax.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontWeight: 800, marginTop: '0.375rem', paddingTop: '0.375rem', borderTop: '1px solid rgba(249,115,22,0.2)' }}>
                    <span style={{ color: 'var(--text-primary)' }}>Total</span><span style={{ color: 'var(--accent-orange)' }}>₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              )}
              <div><label>Notes / Terms</label><textarea className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, scope of work, deliverables..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.title}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Proposal'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setPreviewModal(null)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--accent-orange)' }}>Vraj Digital Marketing</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>vrajdigitalmarketing.com</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>PROPOSAL</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Valid until: {previewModal.valid_until ? new Date(previewModal.valid_until).toLocaleDateString('en-IN') : 'N/A'}</div>
              </div>
            </div>
            <div style={{ borderBottom: '2px solid var(--accent-orange)', marginBottom: '1.25rem', paddingBottom: '1rem' }}>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{previewModal.title}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--accent-orange)' }}>For: {previewModal.clients?.name || previewModal.leads_pipeline?.name || '—'}</div>
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Services Included</div>
              {(previewModal.services || []).map((svc: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{svc.name}</div>
                    {svc.desc && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{svc.desc}</div>}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '0.85rem' }}>₹{(svc.price || 0).toLocaleString()}/mo</div>
                </div>
              ))}
              <div style={{ marginTop: '0.875rem', background: 'rgba(249,115,22,0.05)', border: '1px solid rgba(249,115,22,0.15)', borderRadius: 8, padding: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
                  <span style={{ color: 'var(--text-primary)' }}>₹{Math.round((previewModal.total_amount || 0) / 1.18).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>GST 18%</span>
                  <span style={{ color: 'var(--text-primary)' }}>₹{Math.round((previewModal.total_amount || 0) - (previewModal.total_amount || 0) / 1.18).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 900, paddingTop: '0.5rem', borderTop: '1px solid rgba(249,115,22,0.2)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>TOTAL</span>
                  <span style={{ color: 'var(--accent-orange)' }}>₹{(previewModal.total_amount || 0).toLocaleString()}/month</span>
                </div>
              </div>
            </div>
            {previewModal.notes && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '0.875rem', borderRadius: 8, marginBottom: '1rem', lineHeight: 1.6 }}>{previewModal.notes}</div>}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setPreviewModal(null)}>Close</button>
              <button className="btn-primary" onClick={() => window.print()}>🖨️ Print / PDF</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

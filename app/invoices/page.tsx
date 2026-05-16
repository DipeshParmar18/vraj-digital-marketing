'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const emptyForm = { client_id: '', invoice_number: '', amount: '', tax: '18', status: 'pending', due_date: '', items: [] as any[] }

export default function Invoices() {
  const [invoices, setInvoices] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const [inv, cl] = await Promise.all([
      supabase.from('invoices').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setInvoices(inv.data || [])
    setClients(cl.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const genInvoiceNo = () => `INV-${Date.now().toString().slice(-6)}`

  const save = async () => {
    setSaving(true)
    const payload = { ...form, amount: Number(form.amount), tax: Number(form.tax), invoice_number: form.invoice_number || genInvoiceNo() }
    if (editing) await supabase.from('invoices').update(payload).eq('id', editing)
    else await supabase.from('invoices').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(emptyForm); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete invoice?')) return
    await supabase.from('invoices').delete().eq('id', id)
    load()
  }

  const markPaid = async (id: string) => {
    await supabase.from('invoices').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', id)
    load()
  }

  const filtered = filter === 'all' ? invoices : invoices.filter(i => i.status === filter)
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.amount || 0), 0)

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🧾 Invoices</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{invoices.length} total invoices</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 140 }}>
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="btn-primary" onClick={() => { setForm({ ...emptyForm, invoice_number: genInvoiceNo() }); setEditing(null); setModal(true) }}>+ New Invoice</button>
        </div>
      </div>
      <div className="page">
        <div className="grid-3" style={{ marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: '#10b981', icon: '✅' },
            { label: 'Pending Amount', value: `₹${totalPending.toLocaleString()}`, color: '#f59e0b', icon: '⏳' },
            { label: 'Total Invoices', value: invoices.length, color: '#3b82f6', icon: '🧾' },
          ].map((s, i) => (
            <div key={i} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{s.value}</div>
                </div>
                <div style={{ fontSize: '2rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Invoice #</th><th>Client</th><th>Amount</th><th>Tax</th><th>Total</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No invoices found</td></tr>
                : filtered.map(inv => {
                  const tax = (inv.amount * (inv.tax || 0)) / 100
                  const total = inv.amount + tax
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                      <td>{inv.clients?.name || '—'}</td>
                      <td>₹{(inv.amount || 0).toLocaleString()}</td>
                      <td>{inv.tax || 0}%</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{total.toLocaleString()}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td><span className={`badge badge-${inv.status === 'paid' ? 'green' : inv.status === 'pending' ? 'orange' : inv.status === 'overdue' ? 'red' : 'gray'}`}>{inv.status}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {inv.status === 'pending' && <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981' }} onClick={() => markPaid(inv.id)}>Mark Paid</button>}
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => { setForm({ ...inv, amount: inv.amount?.toString(), tax: inv.tax?.toString() }); setEditing(inv.id); setModal(true) }}>Edit</button>
                          <button className="btn-danger" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => del(inv.id)}>Del</button>
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
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>{editing ? 'Edit Invoice' : 'Create Invoice'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Invoice Number</label><input className="input" value={form.invoice_number} onChange={e => setForm(f => ({ ...f, invoice_number: e.target.value }))} /></div>
              <div><label>Client *</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="grid-2">
                <div><label>Amount (₹) *</label><input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><label>Tax (%)</label><input className="input" type="number" value={form.tax} onChange={e => setForm(f => ({ ...f, tax: e.target.value }))} /></div>
              </div>
              {form.amount && <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal:</span><span>₹{Number(form.amount).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Tax ({form.tax}%):</span><span>₹{((Number(form.amount) * Number(form.tax)) / 100).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-primary)', fontWeight: 700, marginTop: '0.25rem', borderTop: '1px solid var(--border)', paddingTop: '0.25rem' }}>
                  <span>Total:</span><span>₹{(Number(form.amount) + (Number(form.amount) * Number(form.tax)) / 100).toLocaleString()}</span>
                </div>
              </div>}
              <div><label>Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
              <div><label>Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="pending">Pending</option><option value="paid">Paid</option><option value="overdue">Overdue</option><option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.client_id || !form.amount}>{saving ? 'Saving...' : editing ? 'Update' : 'Create Invoice'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

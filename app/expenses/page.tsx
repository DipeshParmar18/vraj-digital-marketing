'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['Google Ads Top-up', 'Meta Ads Top-up', 'SEO Tools', 'Design Tools', 'Hosting', 'Domain', 'Freelancer Payment', 'Software Subscription', 'Office Expense', 'Travel', 'Other']
const empty = { client_id: '', category: 'SEO Tools', description: '', amount: '', date: new Date().toISOString().split('T')[0], paid_by: 'Agency', billable: false }

export default function Expenses() {
  const [expenses, setExpenses] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1)
  const [filterYear, setFilterYear] = useState(new Date().getFullYear())

  const load = async () => {
    const [e, c] = await Promise.all([
      supabase.from('expenses').select('*, clients(name)').order('date', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setExpenses(e.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    const payload = { ...form, amount: Number(form.amount) || 0 }
    if (editing) await supabase.from('expenses').update(payload).eq('id', editing)
    else await supabase.from('expenses').insert(payload)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete expense?')) return
    await supabase.from('expenses').delete().eq('id', id)
    load()
  }

  const filtered = expenses.filter(e => {
    const d = new Date(e.date)
    return d.getMonth() + 1 === filterMonth && d.getFullYear() === filterYear
  })

  const totalExpenses = filtered.reduce((s, e) => s + (e.amount || 0), 0)
  const billableExpenses = filtered.filter(e => e.billable).reduce((s, e) => s + (e.amount || 0), 0)
  const byCategory = CATEGORIES.map(cat => ({
    cat, total: filtered.filter(e => e.category === cat).reduce((s, e) => s + (e.amount || 0), 0)
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>💸 Expense Tracker</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total this month: ₹{totalExpenses.toLocaleString()}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <select className="input" value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={{ width: 120 }}>
            {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
          </select>
          <select className="input" value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={{ width: 90 }}>
            {[2024, 2025, 2026].map(y => <option key={y}>{y}</option>)}
          </select>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Add Expense</button>
        </div>
      </div>

      <div className="page">
        <div className="grid-3" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString()}`, color: 'var(--accent-red)', icon: '💸' },
            { label: 'Billable to Client', value: `₹${billableExpenses.toLocaleString()}`, color: 'var(--accent-green)', icon: '🧾' },
            { label: 'Agency Cost', value: `₹${(totalExpenses - billableExpenses).toLocaleString()}`, color: 'var(--accent-orange)', icon: '🏢' },
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

        <div className="grid-2" style={{ marginBottom: '1.25rem' }}>
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📊 By Category</div>
            {byCategory.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>No expenses this month</div>
            : byCategory.map(c => (
              <div key={c.cat} style={{ marginBottom: '0.625rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.cat}</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>₹{c.total.toLocaleString()}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${totalExpenses ? (c.total / totalExpenses) * 100 : 0}%` }}></div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>👥 By Client</div>
            {clients.map(c => {
              const total = filtered.filter(e => e.client_id === c.id).reduce((s, e) => s + (e.amount || 0), 0)
              if (!total) return null
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{c.name}</span>
                  <span style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>₹{total.toLocaleString()}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Description</th><th>Category</th><th>Client</th><th>Amount</th><th>Date</th><th>Paid By</th><th>Billable</th><th>Actions</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No expenses this month</td></tr>
                : filtered.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{e.description || '—'}</td>
                    <td><span className="badge badge-blue">{e.category}</span></td>
                    <td style={{ color: 'var(--accent-orange)' }}>{e.clients?.name || '—'}</td>
                    <td style={{ color: 'var(--accent-red)', fontWeight: 700 }}>₹{(e.amount || 0).toLocaleString()}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{e.paid_by}</td>
                    <td><span className={`badge badge-${e.billable ? 'green' : 'gray'}`}>{e.billable ? 'Yes' : 'No'}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.3rem' }}>
                        <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.68rem' }} onClick={() => { setForm({ ...e, amount: e.amount?.toString() }); setEditing(e.id); setModal(true) }}>Edit</button>
                        <button className="btn-danger" style={{ padding: '0.25rem 0.4rem', fontSize: '0.68rem' }} onClick={() => del(e.id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Expense' : '+ Add Expense'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Description</label><input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What was this expense for?" /></div>
              <div className="grid-2">
                <div><label>Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label>Client (optional)</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">Agency expense</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Amount (₹) *</label><input className="input" type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
                <div><label>Date</label><input className="input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Paid By</label>
                  <select className="input" value={form.paid_by} onChange={e => setForm(f => ({ ...f, paid_by: e.target.value }))}>
                    <option value="Agency">Agency</option>
                    <option value="Dipesh Parmar">Dipesh Parmar</option>
                    <option value="Client">Client</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
                  <input type="checkbox" id="billable" checked={form.billable} onChange={e => setForm(f => ({ ...f, billable: e.target.checked }))} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                  <label htmlFor="billable" style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 0, marginBottom: 0, cursor: 'pointer' }}>Billable to client</label>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.amount}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Expense'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

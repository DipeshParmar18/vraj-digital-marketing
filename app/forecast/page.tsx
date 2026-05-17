'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Forecast() {
  const [clients, setClients] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [growth, setGrowth] = useState(10)

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').eq('status', 'active'),
      supabase.from('leads_pipeline').select('*').not('stage', 'in', '("closed_won","closed_lost")'),
      supabase.from('invoices').select('*').order('created_at', { ascending: false }),
      supabase.from('contracts').select('*, clients(name)').in('status', ['active', 'signed'])
    ]).then(([c, l, inv, con]) => {
      setClients(c.data || [])
      setLeads(l.data || [])
      setInvoices(inv.data || [])
      setContracts(con.data || [])
      setLoading(false)
    })
  }, [])

  const currentMRR = clients.reduce((s, c) => s + (c.mrr || 0), 0)
  const pipelineValue = leads.reduce((s, l) => s + ((l.deal_value * l.probability) / 100), 0)
  const avgMonthlyRevenue = invoices.length > 0 ? invoices.slice(0, 6).reduce((s, i) => s + (i.amount || 0), 0) / Math.min(invoices.length, 6) : currentMRR

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const forecast = Array.from({ length: 6 }, (_, i) => {
    const monthIdx = (currentMonth + i) % 12
    const year = currentYear + Math.floor((currentMonth + i) / 12)
    const base = currentMRR * Math.pow(1 + growth / 100 / 12, i)
    const pipeline = i <= 1 ? pipelineValue * 0.3 : pipelineValue * 0.1
    const projected = Math.round(base + pipeline)
    return { month: `${months[monthIdx]} ${year}`, projected, base: Math.round(base), pipeline: Math.round(pipeline), growth: i > 0 ? Math.round(((projected / currentMRR) - 1) * 100) : 0 }
  })

  const maxProjected = Math.max(...forecast.map(f => f.projected))

  const revenueByMonth = invoices.reduce((acc: any, inv) => {
    if (!inv.created_at || inv.status !== 'paid') return acc
    const d = new Date(inv.created_at)
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`
    acc[key] = (acc[key] || 0) + (inv.amount || 0)
    return acc
  }, {})

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🔮 Revenue Forecast</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>6-month projection based on MRR + pipeline</div>
        </div>
      </div>

      <div className="page">
        {/* Key Numbers */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Current MRR', value: `₹${currentMRR.toLocaleString()}`, color: 'var(--accent-orange)', icon: '💰', sub: 'Monthly recurring' },
            { label: 'Pipeline Value', value: `₹${Math.round(pipelineValue).toLocaleString()}`, color: 'var(--accent-blue)', icon: '⚡', sub: 'Weighted by probability' },
            { label: '6-Month Projection', value: `₹${forecast[5]?.projected.toLocaleString()}`, color: 'var(--accent-green)', icon: '🔮', sub: 'Estimated MRR in 6mo' },
            { label: 'Active Contracts', value: contracts.length, color: 'var(--accent-purple)', icon: '📝', sub: 'Guaranteed revenue' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{s.sub}</div>
                </div>
                <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Growth Rate Control */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>📈 Assumed Monthly Growth Rate</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Adjust to see different scenarios</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 200 }}>
              <input type="range" min="0" max="50" value={growth} onChange={e => setGrowth(Number(e.target.value))} style={{ flex: 1, accentColor: 'var(--accent-orange)' }} />
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-orange)', minWidth: 60, textAlign: 'right' }}>{growth}%</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {[5, 10, 20, 30].map(v => (
                <button key={v} onClick={() => setGrowth(v)} style={{ padding: '0.3rem 0.75rem', borderRadius: 6, border: `1px solid ${growth === v ? 'var(--accent-orange)' : 'var(--border)'}`, background: growth === v ? 'rgba(249,115,22,0.15)' : 'var(--bg-secondary)', color: growth === v ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>{v}%</button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Chart */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>📊 6-Month Revenue Forecast</div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', height: 200, padding: '0 0.5rem' }}>
            {forecast.map((f, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ fontSize: '0.68rem', color: 'var(--accent-green)', fontWeight: 700 }}>₹{(f.projected / 1000).toFixed(0)}k</div>
                <div style={{ width: '100%', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 140 }}>
                  <div style={{ width: '100%', borderRadius: '4px 4px 0 0', background: i === 0 ? 'var(--accent-orange)' : 'linear-gradient(180deg, rgba(249,115,22,0.7), rgba(37,99,235,0.5))', height: `${Math.max((f.projected / maxProjected) * 140, 8)}px`, transition: 'height 0.5s ease', position: 'relative' }}>
                    {f.pipeline > 0 && i > 0 && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(f.pipeline / f.projected) * 100}%`, background: 'rgba(37,99,235,0.4)', borderRadius: '0 0 4px 4px' }}></div>}
                  </div>
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center', whiteSpace: 'nowrap' }}>{f.month.split(' ')[0]}</div>
                {f.growth > 0 && <div style={{ fontSize: '0.62rem', color: 'var(--accent-green)', fontWeight: 700 }}>+{f.growth}%</div>}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--accent-orange)' }}></div>Base MRR</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'rgba(37,99,235,0.5)' }}></div>Pipeline Expected</div>
          </div>
        </div>

        {/* Monthly breakdown */}
        <div className="grid-2">
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>🔮 Month-by-Month Projection</div>
            <table><thead><tr><th>Month</th><th>Base</th><th>Pipeline</th><th>Projected</th></tr></thead>
            <tbody>
              {forecast.map((f, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600, color: i === 0 ? 'var(--accent-orange)' : 'var(--text-primary)', fontSize: '0.82rem' }}>{f.month} {i === 0 ? '(Now)' : ''}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>₹{f.base.toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-blue)', fontSize: '0.78rem' }}>₹{f.pipeline.toLocaleString()}</td>
                  <td style={{ color: 'var(--accent-green)', fontWeight: 700, fontSize: '0.82rem' }}>₹{f.projected.toLocaleString()}</td>
                </tr>
              ))}
            </tbody></table>
          </div>

          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📅 Active Contracts (Guaranteed)</div>
            {contracts.length === 0 ? <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', textAlign: 'center', padding: '1rem' }}>No active contracts</div>
            : contracts.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.82rem' }}>{c.clients?.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Ends: {c.end_date ? new Date(c.end_date).toLocaleDateString('en-IN') : 'Ongoing'}</div>
                </div>
                <div style={{ fontWeight: 700, color: 'var(--accent-green)', fontSize: '0.85rem' }}>₹{(c.value || 0).toLocaleString()}/mo</div>
              </div>
            ))}
            <div style={{ marginTop: '0.875rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.82rem' }}>Guaranteed MRR</span>
              <span style={{ color: 'var(--accent-green)' }}>₹{contracts.reduce((s, c) => s + (c.value || 0), 0).toLocaleString()}/mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

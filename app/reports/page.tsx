'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reports() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [dateRange, setDateRange] = useState('30')
  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<any>(null)

  useEffect(() => {
    supabase.from('clients').select('id, name').then(({ data }) => setClients(data || []))
  }, [])

  const generateReport = async () => {
    setLoading(true)
    const [campaigns, leads, invoices, tasks] = await Promise.all([
      supabase.from('campaigns').select('*').eq(selectedClient ? 'client_id' : 'id', selectedClient || 'id'),
      supabase.from('leads').select('*').eq(selectedClient ? 'client_id' : 'id', selectedClient || 'id'),
      supabase.from('invoices').select('*').eq(selectedClient ? 'client_id' : 'id', selectedClient || 'id'),
      supabase.from('tasks').select('*').eq(selectedClient ? 'client_id' : 'id', selectedClient || 'id'),
    ])
    const allCampaigns = await supabase.from('campaigns').select('*')
    const allLeads = await supabase.from('leads').select('*')
    const allInvoices = await supabase.from('invoices').select('*')
    const allTasks = await supabase.from('tasks').select('*')

    setReportData({
      campaigns: allCampaigns.data || [],
      leads: allLeads.data || [],
      invoices: allInvoices.data || [],
      tasks: allTasks.data || [],
      totalSpend: (allCampaigns.data || []).reduce((s: number, c: any) => s + (c.spent || 0), 0),
      totalRevenue: (allInvoices.data || []).filter((i: any) => i.status === 'paid').reduce((s: number, i: any) => s + (i.amount || 0), 0),
      totalLeads: allLeads.data?.length || 0,
      convLeads: (allLeads.data || []).filter((l: any) => l.status === 'converted').length,
    })
    setLoading(false)
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📊 Reports & Analytics</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Generate comprehensive performance reports</div>
        </div>
      </div>
      <div className="page">
        {/* Report Generator */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>⚙️ Report Settings</div>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label>Client (Optional)</label>
              <select className="input" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">All Clients</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label>Time Period</label>
              <select className="input" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="365">Last year</option>
              </select>
            </div>
            <button className="btn-primary" onClick={generateReport} disabled={loading}>{loading ? '⏳ Generating...' : '📊 Generate Report'}</button>
          </div>
        </div>

        {reportData ? (
          <>
            {/* KPI Cards */}
            <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Total Ad Spend', value: `₹${reportData.totalSpend.toLocaleString()}`, icon: '💸', color: '#ef4444' },
                { label: 'Total Revenue', value: `₹${reportData.totalRevenue.toLocaleString()}`, icon: '💰', color: '#10b981' },
                { label: 'Total Leads', value: reportData.totalLeads, icon: '⚡', color: '#3b82f6' },
                { label: 'Conversions', value: reportData.convLeads, icon: '✅', color: '#8b5cf6' },
              ].map((k, i) => (
                <div key={i} className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{k.label}</div>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>{k.value}</div>
                    </div>
                    <div style={{ fontSize: '1.75rem' }}>{k.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Campaign Performance */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>📢 Campaign Performance</div>
              {reportData.campaigns.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No campaigns data yet</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead><tr><th>Campaign</th><th>Platform</th><th>Budget</th><th>Spent</th><th>Clicks</th><th>Conv.</th><th>ROAS</th></tr></thead>
                    <tbody>
                      {reportData.campaigns.map((c: any) => (
                        <tr key={c.id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{c.name}</td>
                          <td><span className="badge badge-blue">{c.platform}</span></td>
                          <td>₹{(c.budget || 0).toLocaleString()}</td>
                          <td>₹{(c.spent || 0).toLocaleString()}</td>
                          <td>{(c.clicks || 0).toLocaleString()}</td>
                          <td>{c.conversions || 0}</td>
                          <td style={{ color: c.roas >= 2 ? 'var(--accent-green)' : 'var(--accent-orange)', fontWeight: 600 }}>{c.roas ? `${c.roas}x` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Lead Summary */}
            <div className="grid-2">
              <div className="card">
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>⚡ Lead Summary</div>
                {['new', 'contacted', 'qualified', 'converted', 'lost'].map(status => {
                  const count = reportData.leads.filter((l: any) => l.status === status).length
                  const pct = reportData.totalLeads ? Math.round((count / reportData.totalLeads) * 100) : 0
                  return (
                    <div key={status} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status}</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }}></div></div>
                    </div>
                  )
                })}
              </div>
              <div className="card">
                <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>🧾 Invoice Summary</div>
                {['pending', 'paid', 'overdue'].map(status => {
                  const invs = reportData.invoices.filter((i: any) => i.status === status)
                  const total = invs.reduce((s: number, i: any) => s + (i.amount || 0), 0)
                  return (
                    <div key={status} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className={`badge badge-${status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}`}>{status}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{invs.length} invoices</span>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{total.toLocaleString()}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
            <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Generate Your First Report</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Select a client and time period, then click Generate Report</div>
          </div>
        )}
      </div>
    </div>
  )
}

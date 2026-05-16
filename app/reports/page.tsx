'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Reports() {
  const [clients, setClients] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [seoKeywords, setSeoKeywords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')

  useEffect(() => {
    async function load() {
      const [cl, ca, inv, t, l, tm, tl, kw] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('campaigns').select('*, clients(name)'),
        supabase.from('invoices').select('*, clients(name)'),
        supabase.from('tasks').select('*'),
        supabase.from('leads').select('*, clients(name)'),
        supabase.from('team_members').select('*').eq('status', 'active'),
        supabase.from('time_logs').select('*, clients(name)'),
        supabase.from('seo_keywords').select('*, clients(name)'),
      ])
      setClients(cl.data || [])
      setCampaigns(ca.data || [])
      setInvoices(inv.data || [])
      setTasks(t.data || [])
      setLeads(l.data || [])
      setTeam(tm.data || [])
      setTimeLogs(tl.data || [])
      setSeoKeywords(kw.data || [])
      setLoading(false)
    }
    load()
  }, [])

  // Calculations
  const totalMRR = clients.reduce((s, c) => s + (c.mrr || 0), 0)
  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + (i.amount || 0), 0)
  const totalAdSpend = campaigns.reduce((s, c) => s + (c.spent || 0), 0)
  const totalProfit = totalRevenue - totalAdSpend
  const avgROAS = campaigns.length ? (campaigns.reduce((s, c) => s + (c.roas || 0), 0) / campaigns.length).toFixed(1) : '0'
  const totalHours = timeLogs.reduce((s, l) => s + (l.hours || 0), 0)
  const tasksDone = tasks.filter(t => t.status === 'done').length
  const tasksTotal = tasks.length

  // Client P&L
  const clientPL = clients.map(c => {
    const cInvoices = invoices.filter(i => i.client_id === c.id)
    const cCampaigns = campaigns.filter(ca => ca.client_id === c.id)
    const revenue = cInvoices.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount || 0), 0)
    const adSpend = cCampaigns.reduce((s, ca) => s + (ca.spent || 0), 0)
    const profit = revenue - adSpend
    const hours = timeLogs.filter(l => l.client_id === c.id).reduce((s, l) => s + (l.hours || 0), 0)
    return { ...c, revenue, adSpend, profit, hours, campaigns: cCampaigns.length }
  }).sort((a, b) => b.revenue - a.revenue)

  // Team performance
  const teamPerf = team.map(m => {
    const mTasks = tasks.filter(t => t.assigned_to === m.name)
    const mHours = timeLogs.filter(l => l.logged_by === m.name).reduce((s, l) => s + (l.hours || 0), 0)
    const done = mTasks.filter(t => t.status === 'done').length
    return { ...m, totalTasks: mTasks.length, doneTasks: done, hours: mHours, completion: mTasks.length ? Math.round((done / mTasks.length) * 100) : 0 }
  })

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'pl', label: '💰 P&L per Client' },
    { id: 'campaigns', label: '📢 Campaign ROI' },
    { id: 'team', label: '👥 Team Performance' },
    { id: 'seo', label: '🔍 SEO Rankings' },
  ]

  if (loading) return (
    <div>
      <div className="topbar"><div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📊 Reports</div></div>
      <div className="page"><div style={{ color: 'var(--text-muted)', textAlign: 'center', paddingTop: '3rem' }}>Loading reports...</div></div>
    </div>
  )

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📊 Owner Reports</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Complete agency performance overview</div>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn-secondary" onClick={() => window.print()} style={{ fontSize: '0.78rem' }}>🖨️ Print Report</button>
        </div>
      </div>

      <div className="page">
        {/* Tab Nav */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.25rem', overflowX: 'auto' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.45rem 1rem', borderRadius: 7, border: 'none', background: tab === t.id ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(37,99,235,0.1))' : 'transparent', color: tab === t.id ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.78rem', fontWeight: tab === t.id ? 700 : 500, fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {/* KPI Cards */}
            <div className="grid-4">
              {[
                { label: 'Total MRR', value: `₹${totalMRR.toLocaleString()}`, sub: 'Monthly recurring revenue', color: 'var(--accent-orange)', icon: '💰' },
                { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, sub: 'From paid invoices', color: 'var(--accent-green)', icon: '📈' },
                { label: 'Total Ad Spend', value: `₹${totalAdSpend.toLocaleString()}`, sub: 'Across all campaigns', color: 'var(--accent-red)', icon: '💸' },
                { label: 'Net Profit', value: `₹${totalProfit.toLocaleString()}`, sub: 'Revenue minus ad spend', color: totalProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', icon: '💵' },
                { label: 'Active Clients', value: clients.filter(c => c.status === 'active').length, sub: 'Currently active', color: 'var(--accent-blue)', icon: '👥' },
                { label: 'Avg ROAS', value: `${avgROAS}x`, sub: 'Return on ad spend', color: Number(avgROAS) >= 2 ? 'var(--accent-green)' : 'var(--accent-orange)', icon: '🎯' },
                { label: 'Pending Revenue', value: `₹${totalPending.toLocaleString()}`, sub: 'Unpaid invoices', color: 'var(--accent-yellow)', icon: '⏳' },
                { label: 'Hours Logged', value: `${totalHours}h`, sub: 'Team time this month', color: 'var(--accent-purple)', icon: '⏱️' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                      <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color, letterSpacing: '-0.02em' }}>{s.value}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{s.sub}</div>
                    </div>
                    <div style={{ fontSize: '1.5rem' }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Tasks Summary */}
            <div className="grid-2">
              <div className="card">
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>✅ Task Completion</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent-orange)' }}>{tasksTotal ? Math.round((tasksDone / tasksTotal) * 100) : 0}%</div>
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{tasksDone} of {tasksTotal} tasks done</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-red)' }}>{tasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done').length} overdue</div>
                  </div>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div className="progress-fill" style={{ width: `${tasksTotal ? (tasksDone / tasksTotal) * 100 : 0}%` }}></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem', marginTop: '1rem' }}>
                  {['todo', 'in_progress', 'review', 'done'].map(s => (
                    <div key={s} style={{ textAlign: 'center', padding: '0.5rem', background: 'var(--bg-secondary)', borderRadius: 6 }}>
                      <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{tasks.filter(t => t.status === s).length}</div>
                      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{s.replace('_', ' ')}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>⚡ Lead Pipeline</div>
                {['new', 'contacted', 'qualified', 'converted', 'lost'].map(status => {
                  const count = leads.filter(l => l.status === status).length
                  const pct = leads.length ? Math.round((count / leads.length) * 100) : 0
                  const colors: Record<string,string> = { new: 'var(--accent-blue)', contacted: 'var(--accent-cyan)', qualified: 'var(--accent-orange)', converted: 'var(--accent-green)', lost: 'var(--accent-red)' }
                  return (
                    <div key={status} style={{ marginBottom: '0.625rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{status}</span>
                        <span style={{ color: colors[status], fontWeight: 700 }}>{count} ({pct}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${pct}%`, background: colors[status] }}></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* P&L TAB */}
        {tab === 'pl' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
              {[
                { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, color: 'var(--accent-green)' },
                { label: 'Total Ad Spend', value: `₹${totalAdSpend.toLocaleString()}`, color: 'var(--accent-red)' },
                { label: 'Net Profit', value: `₹${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' },
                { label: 'Profit Margin', value: `${totalRevenue ? Math.round((totalProfit / totalRevenue) * 100) : 0}%`, color: 'var(--accent-orange)' },
              ].map((s, i) => (
                <div key={i} className="card" style={{ flex: 1, minWidth: 140 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>💰 Client-wise P&L</div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Client</th><th>MRR</th><th>Revenue</th><th>Ad Spend</th><th>Profit</th><th>Margin</th><th>Hours</th><th>Campaigns</th><th>Health</th></tr></thead>
                  <tbody>
                    {clientPL.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No data yet</td></tr>
                    : clientPL.map(c => {
                      const margin = c.revenue ? Math.round((c.profit / c.revenue) * 100) : 0
                      const hc = c.health_score >= 80 ? 'var(--accent-green)' : c.health_score >= 60 ? 'var(--accent-orange)' : 'var(--accent-red)'
                      return (
                        <tr key={c.id}>
                          <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.company}</div></td>
                          <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>₹{(c.mrr || 0).toLocaleString()}</td>
                          <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>₹{c.revenue.toLocaleString()}</td>
                          <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>₹{c.adSpend.toLocaleString()}</td>
                          <td style={{ color: c.profit >= 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700 }}>₹{c.profit.toLocaleString()}</td>
                          <td style={{ color: margin >= 50 ? 'var(--accent-green)' : margin >= 20 ? 'var(--accent-orange)' : 'var(--accent-red)', fontWeight: 600 }}>{margin}%</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.hours}h</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.campaigns}</td>
                          <td><span style={{ color: hc, fontWeight: 700, fontSize: '0.78rem' }}>{c.health_score || 80}/100</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* CAMPAIGN ROI TAB */}
        {tab === 'campaigns' && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📢 Campaign ROI Analysis</div>
            <div className="table-container">
              <table>
                <thead><tr><th>Campaign</th><th>Client</th><th>Platform</th><th>Budget</th><th>Spent</th><th>Revenue</th><th>ROAS</th><th>Clicks</th><th>Conv.</th><th>Status</th></tr></thead>
                <tbody>
                  {campaigns.length === 0 ? <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No campaigns yet</td></tr>
                  : campaigns.map(c => {
                    const roi = c.spent > 0 ? Math.round(((c.roas - 1) * 100)) : 0
                    return (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</td>
                        <td style={{ color: 'var(--accent-orange)' }}>{c.clients?.name || '—'}</td>
                        <td><span className="badge badge-blue">{c.platform}</span></td>
                        <td>₹{(c.budget || 0).toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-red)', fontWeight: 600 }}>₹{(c.spent || 0).toLocaleString()}</td>
                        <td style={{ color: 'var(--accent-green)', fontWeight: 600 }}>₹{((c.roas || 0) * (c.spent || 0)).toLocaleString()}</td>
                        <td>
                          <span style={{ color: c.roas >= 3 ? 'var(--accent-green)' : c.roas >= 2 ? 'var(--accent-orange)' : 'var(--accent-red)', fontWeight: 700 }}>
                            {c.roas ? `${c.roas}x` : '—'}
                          </span>
                        </td>
                        <td>{(c.clicks || 0).toLocaleString()}</td>
                        <td>{c.conversions || 0}</td>
                        <td><span className={`badge badge-${c.status === 'active' ? 'green' : 'gray'}`}>{c.status}</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TEAM PERFORMANCE TAB */}
        {tab === 'team' && (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="grid-3">
              {[
                { label: 'Total Hours', value: `${totalHours}h`, color: 'var(--accent-orange)', icon: '⏱️' },
                { label: 'Tasks Done', value: tasksDone, color: 'var(--accent-green)', icon: '✅' },
                { label: 'Team Members', value: team.length, color: 'var(--accent-blue)', icon: '👥' },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                    </div>
                    <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>👥 Team Performance</div>
              {teamPerf.length === 0 ? <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No team members yet</div>
              : teamPerf.map(m => {
                const roleColors: Record<string,string> = { owner: '#f59e0b', admin: '#8b5cf6', manager: '#3b82f6', analyst: '#06b6d4', viewer: '#94a3b8' }
                return (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: `${roleColors[m.role] || '#94a3b8'}20`, border: `2px solid ${roleColors[m.role] || '#94a3b8'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColors[m.role] || '#94a3b8', fontSize: '0.875rem', flexShrink: 0 }}>
                      {m.name?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{m.name}</span>
                          <span style={{ marginLeft: '0.5rem', fontSize: '0.7rem', color: roleColors[m.role], fontWeight: 600, textTransform: 'capitalize' }}>{m.role}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Tasks: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{m.doneTasks}/{m.totalTasks}</span></span>
                          <span style={{ color: 'var(--text-muted)' }}>Hours: <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>{m.hours}h</span></span>
                          <span style={{ color: 'var(--text-muted)' }}>Done: <span style={{ color: m.completion >= 80 ? 'var(--accent-green)' : m.completion >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)', fontWeight: 700 }}>{m.completion}%</span></span>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${m.completion}%`, background: m.completion >= 80 ? 'var(--accent-green)' : m.completion >= 50 ? 'var(--accent-orange)' : 'var(--accent-red)' }}></div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* SEO TAB */}
        {tab === 'seo' && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>🔍 SEO Keyword Rankings</div>
            {seoKeywords.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                <div>No keywords tracked yet. Add keywords in the SEO Manager.</div>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead><tr><th>Keyword</th><th>Client</th><th>Position</th><th>Change</th><th>Search Volume</th><th>Difficulty</th><th>URL</th></tr></thead>
                  <tbody>
                    {seoKeywords.map(k => {
                      const change = k.prev_position ? k.prev_position - (k.position || 0) : 0
                      return (
                        <tr key={k.id}>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{k.keyword}</td>
                          <td style={{ color: 'var(--accent-orange)' }}>{k.clients?.name || '—'}</td>
                          <td>
                            <span style={{ fontSize: '1rem', fontWeight: 800, color: k.position <= 3 ? 'var(--accent-green)' : k.position <= 10 ? 'var(--accent-orange)' : 'var(--accent-red)' }}>
                              #{k.position || '—'}
                            </span>
                          </td>
                          <td>
                            {change !== 0 && (
                              <span style={{ color: change > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 700, fontSize: '0.82rem' }}>
                                {change > 0 ? '↑' : '↓'} {Math.abs(change)}
                              </span>
                            )}
                          </td>
                          <td>{k.search_volume?.toLocaleString() || '—'}</td>
                          <td>
                            {k.difficulty && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 999, minWidth: 50 }}>
                                  <div style={{ height: '100%', width: `${k.difficulty}%`, background: k.difficulty > 70 ? 'var(--accent-red)' : k.difficulty > 40 ? 'var(--accent-orange)' : 'var(--accent-green)', borderRadius: 999 }}></div>
                                </div>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{k.difficulty}</span>
                              </div>
                            )}
                          </td>
                          <td>{k.url ? <a href={k.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)', fontSize: '0.75rem' }}>View →</a> : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const TABS = ['Overview','Tasks','Performance','Backlinks','Content','Social Posts','Time','Documents','SEO','Integrations']
const ALL_SERVICES = ['SEO','Google Ads','Meta Ads','Social Media','Web Development','Email Marketing','WhatsApp Marketing','Content Writing','Graphic Design']

export default function ClientProfile() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [client, setClient] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [tab, setTab] = useState('Overview')
  const [loading, setLoading] = useState(true)
  const [editingHealth, setEditingHealth] = useState(false)
  const [newTask, setNewTask] = useState({ title:'', priority:'medium', due_date:'', assigned_to:'' })
  const [addingTask, setAddingTask] = useState(false)
  const [newTimeLog, setNewTimeLog] = useState({ description:'', hours:'', date:new Date().toISOString().split('T')[0] })

  const load = async () => {
    const [c, t, p, tm, ca, inv, l, tl] = await Promise.all([
      supabase.from('clients').select('*').eq('id', id).single(),
      supabase.from('tasks').select('*').eq('client_id', id).order('created_at', { ascending: false }),
      supabase.from('projects').select('*').eq('client_id', id),
      supabase.from('team_members').select('*').eq('status','active'),
      supabase.from('campaigns').select('*').eq('client_id', id),
      supabase.from('invoices').select('*').eq('client_id', id),
      supabase.from('leads').select('*').eq('client_id', id),
      supabase.from('time_logs').select('*').eq('client_id', id).order('date', { ascending: false }),
    ])
    setClient(c.data)
    setTasks(t.data || [])
    setProjects(p.data || [])
    setTeam(tm.data || [])
    setCampaigns(ca.data || [])
    setInvoices(inv.data || [])
    setLeads(l.data || [])
    setTimeLogs(tl.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [id])

  const updateHealth = async (score: number) => {
    await supabase.from('clients').update({ health_score: score }).eq('id', id)
    setClient((c: any) => ({ ...c, health_score: score }))
    setEditingHealth(false)
  }

  const addTask = async () => {
    if (!newTask.title) return
    await supabase.from('tasks').insert({ ...newTask, client_id: id, status: 'todo' })
    setNewTask({ title:'', priority:'medium', due_date:'', assigned_to:'' })
    setAddingTask(false)
    load()
  }

  const updateTaskStatus = async (taskId: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    load()
  }

  const addTimeLog = async () => {
    if (!newTimeLog.description || !newTimeLog.hours) return
    await supabase.from('time_logs').insert({ ...newTimeLog, client_id: id, hours: Number(newTimeLog.hours) })
    setNewTimeLog({ description:'', hours:'', date: new Date().toISOString().split('T')[0] })
    load()
  }

  const toggleService = async (service: string) => {
    const services = client?.services || []
    const updated = services.includes(service) ? services.filter((s: string) => s !== service) : [...services, service]
    await supabase.from('clients').update({ services: updated }).eq('id', id)
    setClient((c: any) => ({ ...c, services: updated }))
  }

  if (loading) return <div className="page" style={{ color:'var(--text-muted)', textAlign:'center', paddingTop:'4rem' }}>Loading client profile...</div>
  if (!client) return <div className="page" style={{ color:'var(--text-muted)', textAlign:'center', paddingTop:'4rem' }}>Client not found. <Link href="/clients" style={{ color:'var(--accent-blue)' }}>Go back</Link></div>

  const healthColor = (s: number) => s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'
  const healthLabel = (s: number) => s >= 80 ? 'Healthy' : s >= 60 ? 'Needs attention' : 'Critical'
  const overdueTask = tasks.find(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done')
  const totalRevenue = invoices.filter(i => i.status==='paid').reduce((s,i) => s+(i.amount||0), 0)
  const totalHours = timeLogs.reduce((s,l) => s+(l.hours||0), 0)

  return (
    <div>
      <div className="topbar">
        <Link href="/clients" style={{ color:'var(--text-muted)', fontSize:'0.85rem', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.4rem' }}>← Clients</Link>
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.75rem' }}>
          <button className="btn-secondary" onClick={() => router.push(`/invoices`)}>🧾 Create Invoice</button>
          <button className="btn-primary" onClick={() => setTab('Tasks')}>+ Add Task</button>
        </div>
      </div>

      <div style={{ display:'flex', gap:'1.5rem', padding:'1.5rem', alignItems:'flex-start' }}>
        {/* Left Sidebar */}
        <div style={{ width:260, flexShrink:0 }}>
          <div className="card" style={{ textAlign:'center', marginBottom:'1rem' }}>
            {/* Avatar */}
            <div style={{ width:72, height:72, borderRadius:'50%', background:'linear-gradient(135deg, #3b82f6, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontWeight:800, fontSize:'1.5rem', margin:'0 auto 0.875rem' }}>
              {client.name?.charAt(0)}{client.name?.split(' ')[1]?.charAt(0)||''}
            </div>
            <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)', marginBottom:'0.25rem' }}>{client.name}</div>
            <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>{client.industry} {client.company ? `· ${client.company}` : ''}</div>
            {client.website && <a href={client.website} target="_blank" rel="noreferrer" style={{ fontSize:'0.75rem', color:'var(--accent-blue)', textDecoration:'none' }}>{client.website}</a>}

            <div style={{ marginTop:'1rem', display:'grid', gap:'0.5rem', textAlign:'left' }}>
              {[
                ['Status', <span key="s" className={`badge badge-${client.status==='active'?'green':'gray'}`}>{client.status}</span>],
                ['Contract', <span key="c" style={{ color:'var(--text-primary)', fontWeight:600, textTransform:'capitalize', fontSize:'0.82rem' }}>{client.contract_type||'retainer'}</span>],
                ['MRR / Value', <span key="m" style={{ color:'var(--accent-green)', fontWeight:700, fontSize:'0.82rem' }}>₹{(client.mrr||0).toLocaleString()}</span>],
                ['Manager', <span key="mg" style={{ color:'var(--text-primary)', fontWeight:600, fontSize:'0.82rem' }}>{client.manager||'—'}</span>],
                ['Phone', <span key="p" style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{client.phone||'—'}</span>],
                ['Email', <span key="e" style={{ color:'var(--text-secondary)', fontSize:'0.75rem' }}>{client.email||'—'}</span>],
              ].map(([lbl, val]) => (
                <div key={lbl as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.375rem 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{lbl}</span>
                  {val}
                </div>
              ))}
            </div>
          </div>

          {/* Health Score */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
              <div style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--text-primary)' }}>❤️ Health Score</div>
              <button onClick={() => setEditingHealth(!editingHealth)} style={{ fontSize:'0.7rem', color:'var(--accent-blue)', background:'none', border:'none', cursor:'pointer' }}>Edit</button>
            </div>
            {editingHealth ? (
              <div>
                <input type="range" min="0" max="100" value={client.health_score||80}
                  onChange={e => setClient((c: any) => ({...c, health_score: Number(e.target.value)}))}
                  style={{ width:'100%', marginBottom:'0.5rem' }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'1.25rem', fontWeight:800, color:healthColor(client.health_score||80) }}>{client.health_score||80}/100</span>
                  <button className="btn-primary" style={{ fontSize:'0.75rem', padding:'0.3rem 0.75rem' }} onClick={() => updateHealth(client.health_score||80)}>Save</button>
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                  <span style={{ fontSize:'1.25rem', fontWeight:800, color:healthColor(client.health_score||80) }}>{client.health_score||80}/100</span>
                  <span style={{ fontSize:'0.75rem', color:healthColor(client.health_score||80), fontWeight:600 }}>{healthLabel(client.health_score||80)}</span>
                </div>
                <div className="progress-bar" style={{ height:8 }}>
                  <div className="progress-fill" style={{ width:`${client.health_score||80}%`, background:healthColor(client.health_score||80) }}></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div style={{ flex:1, minWidth:0 }}>
          {/* Tabs */}
          <div style={{ display:'flex', gap:'0.25rem', marginBottom:'1.25rem', flexWrap:'wrap', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, padding:'0.25rem' }}>
            {TABS.map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding:'0.4rem 0.875rem', borderRadius:7, border:'none', background:tab===t?'rgba(59,130,246,0.2)':'transparent', color:tab===t?'var(--accent-blue)':'var(--text-muted)', cursor:'pointer', fontSize:'0.8rem', fontWeight:tab===t?700:500, fontFamily:'inherit', whiteSpace:'nowrap' }}>
                {t}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {tab==='Overview' && (
            <div style={{ display:'grid', gap:'1rem' }}>
              {/* Client Intelligence */}
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <span style={{ fontSize:'1.1rem' }}>💡</span>
                    <span style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>Client Intelligence</span>
                    {overdueTask && <span className="badge badge-red">Critical</span>}
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', textTransform:'uppercase' }}>HEALTH</div>
                    <div style={{ fontSize:'0.85rem', fontWeight:700, color:healthColor(client.health_score||80) }}>{client.health_score||80}/100 · {healthLabel(client.health_score||80)}</div>
                    <div style={{ width:80, height:4, background:'var(--border)', borderRadius:999, marginTop:'0.25rem', marginLeft:'auto' }}>
                      <div style={{ height:'100%', width:`${client.health_score||80}%`, background:healthColor(client.health_score||80), borderRadius:999 }}></div>
                    </div>
                  </div>
                </div>
                {overdueTask ? (
                  <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:8, padding:'0.875rem', marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.25rem' }}>
                      <span>📅</span><span style={{ fontWeight:700, color:'var(--accent-red)', fontSize:'0.85rem' }}>1 task overdue</span>
                    </div>
                    <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>"{overdueTask.title}"</div>
                    <button onClick={() => setTab('Tasks')} style={{ fontSize:'0.75rem', color:'var(--accent-blue)', background:'none', border:'none', cursor:'pointer', marginTop:'0.4rem', padding:0 }}>Review tasks ↗</button>
                  </div>
                ) : (
                  <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:8, padding:'0.875rem' }}>
                    <div style={{ fontSize:'0.85rem', color:'#10b981', fontWeight:600 }}>✅ All tasks on track. Client is healthy!</div>
                  </div>
                )}
              </div>

              {/* Stats Row */}
              <div className="grid-4">
                {[
                  { label:'Active Campaigns', value:campaigns.filter(c=>c.status==='active').length, icon:'📢', color:'#8b5cf6' },
                  { label:'Total Revenue', value:`₹${totalRevenue.toLocaleString()}`, icon:'💰', color:'#10b981' },
                  { label:'Total Leads', value:leads.length, icon:'⚡', color:'#3b82f6' },
                  { label:'Hours Logged', value:`${totalHours}h`, icon:'⏱️', color:'#f59e0b' },
                ].map((s,i) => (
                  <div key={i} className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem' }}>{s.icon}</div>
                    <div style={{ fontSize:'1.25rem', fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Assigned Team + Active Services */}
              <div className="grid-2">
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
                    <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>👥 Assigned Team</div>
                    <button className="btn-secondary" style={{ fontSize:'0.72rem', padding:'0.25rem 0.6rem' }}>+ Add</button>
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                    {team.slice(0,4).map(m => (
                      <div key={m.id} style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:999, padding:'0.3rem 0.75rem' }}>
                        <div style={{ width:24, height:24, borderRadius:'50%', background:'linear-gradient(135deg, #3b82f6, #8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:'0.65rem', fontWeight:700 }}>
                          {m.name?.split(' ').map((n: string) => n[0]).join('').slice(0,2)}
                        </div>
                        <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>{m.name}</span>
                        <span style={{ color:'var(--text-muted)', cursor:'pointer', fontSize:'0.75rem' }}>×</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card">
                  <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', marginBottom:'0.875rem' }}>🗺️ Active Services Map</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'0.4rem' }}>
                    {ALL_SERVICES.map(s => {
                      const active = (client.services||[]).includes(s)
                      return (
                        <div key={s} onClick={() => toggleService(s)} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.4rem 0.6rem', borderRadius:8, cursor:'pointer', border:`1px solid ${active?'rgba(59,130,246,0.3)':'var(--border)'}`, background:active?'rgba(59,130,246,0.08)':'transparent', transition:'all 0.15s' }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', border:`2px solid ${active?'var(--accent-blue)':'var(--border)'}`, background:active?'var(--accent-blue)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                            {active && <span style={{ color:'white', fontSize:'0.55rem' }}>✓</span>}
                          </div>
                          <span style={{ fontSize:'0.75rem', color:active?'var(--accent-blue)':'var(--text-muted)', fontWeight:active?600:400 }}>{s}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Projects */}
              {projects.length > 0 && (
                <div className="card">
                  <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', marginBottom:'0.875rem' }}>📁 Projects</div>
                  <div style={{ display:'grid', gap:'0.5rem' }}>
                    {projects.map(p => (
                      <div key={p.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.75rem', background:'var(--bg-secondary)', borderRadius:8, border:'1px solid var(--border)' }}>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--text-primary)' }}>{p.name}</div>
                          <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.25rem' }}>
                            <span style={{ fontSize:'0.7rem', color:p.gsc_connected?'#34a853':'var(--text-muted)' }}>🔍 GSC {p.gsc_connected?'✅':'—'}</span>
                            <span style={{ fontSize:'0.7rem', color:p.ga4_connected?'#f9ab00':'var(--text-muted)' }}>📊 GA4 {p.ga4_connected?'✅':'—'}</span>
                          </div>
                        </div>
                        <span className={`badge badge-${p.status==='active'?'green':'gray'}`}>{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TASKS TAB */}
          {tab==='Tasks' && (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>✅ Tasks</div>
                <button className="btn-primary" style={{ fontSize:'0.8rem' }} onClick={() => setAddingTask(!addingTask)}>+ Add Task</button>
              </div>
              {addingTask && (
                <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'1rem', marginBottom:'1rem', display:'grid', gap:'0.75rem' }}>
                  <input className="input" placeholder="Task title *" value={newTask.title} onChange={e => setNewTask(f => ({...f,title:e.target.value}))} />
                  <div className="grid-2">
                    <select className="input" value={newTask.priority} onChange={e => setNewTask(f => ({...f,priority:e.target.value}))}>
                      <option value="low">Low Priority</option><option value="medium">Medium Priority</option><option value="high">High Priority</option>
                    </select>
                    <input className="input" type="date" value={newTask.due_date} onChange={e => setNewTask(f => ({...f,due_date:e.target.value}))} />
                  </div>
                  <input className="input" placeholder="Assigned to" value={newTask.assigned_to} onChange={e => setNewTask(f => ({...f,assigned_to:e.target.value}))} />
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button className="btn-primary" onClick={addTask} style={{ fontSize:'0.82rem' }}>Add Task</button>
                    <button className="btn-secondary" onClick={() => setAddingTask(false)} style={{ fontSize:'0.82rem' }}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="table-container">
                <table>
                  <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Assigned</th><th>Actions</th></tr></thead>
                  <tbody>
                    {tasks.length === 0 ? <tr><td colSpan={6} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No tasks yet</td></tr>
                    : tasks.map(t => {
                      const pColor: Record<string,string> = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' }
                      const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
                      return (
                        <tr key={t.id} style={{ background:overdue?'rgba(239,68,68,0.04)':'transparent' }}>
                          <td style={{ color:'var(--text-primary)', fontWeight:600 }}>
                            {overdue && <span style={{ color:'var(--accent-red)', fontSize:'0.7rem', marginRight:'0.4rem' }}>⚠️ OVERDUE</span>}
                            {t.title}
                          </td>
                          <td><span style={{ color:pColor[t.priority]||'#94a3b8', fontWeight:600, fontSize:'0.8rem', textTransform:'capitalize' }}>● {t.priority}</span></td>
                          <td>
                            <select value={t.status} onChange={e => updateTaskStatus(t.id, e.target.value)} style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:6, padding:'0.2rem 0.5rem', color:'var(--text-primary)', fontSize:'0.78rem', cursor:'pointer', fontFamily:'inherit' }}>
                              <option value="todo">To Do</option><option value="in_progress">In Progress</option><option value="review">Review</option><option value="done">Done</option>
                            </select>
                          </td>
                          <td style={{ color:overdue?'var(--accent-red)':'var(--text-muted)', fontSize:'0.8rem', fontWeight:overdue?700:400 }}>{t.due_date?new Date(t.due_date).toLocaleDateString('en-IN'):'—'}</td>
                          <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{t.assigned_to||'—'}</td>
                          <td>
                            <button onClick={async () => { await supabase.from('tasks').delete().eq('id',t.id); load() }} style={{ background:'none', border:'none', color:'var(--accent-red)', cursor:'pointer', fontSize:'0.85rem' }}>🗑</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PERFORMANCE TAB */}
          {tab==='Performance' && (
            <div style={{ display:'grid', gap:'1rem' }}>
              <div className="grid-3">
                {[
                  { label:'Total Ad Spend', value:`₹${campaigns.reduce((s,c)=>s+(c.spent||0),0).toLocaleString()}`, icon:'💸', color:'#ef4444' },
                  { label:'Total Revenue', value:`₹${totalRevenue.toLocaleString()}`, icon:'💰', color:'#10b981' },
                  { label:'Avg ROAS', value:`${campaigns.length?((campaigns.reduce((s,c)=>s+(c.roas||0),0)/campaigns.length)).toFixed(1):0}x`, icon:'📈', color:'#8b5cf6' },
                ].map((s,i) => (
                  <div key={i} className="card" style={{ textAlign:'center' }}>
                    <div style={{ fontSize:'1.75rem', marginBottom:'0.5rem' }}>{s.icon}</div>
                    <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color }}>{s.value}</div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="card">
                <div style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'1rem', color:'var(--text-primary)' }}>📢 Campaigns</div>
                {campaigns.length === 0 ? <div style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem' }}>No campaigns yet</div>
                : <div className="table-container"><table>
                  <thead><tr><th>Campaign</th><th>Platform</th><th>Budget</th><th>Spent</th><th>Clicks</th><th>ROAS</th><th>Status</th></tr></thead>
                  <tbody>{campaigns.map(c => (
                    <tr key={c.id}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{c.name}</td>
                      <td><span className="badge badge-blue">{c.platform}</span></td>
                      <td>₹{(c.budget||0).toLocaleString()}</td>
                      <td>₹{(c.spent||0).toLocaleString()}</td>
                      <td>{(c.clicks||0).toLocaleString()}</td>
                      <td style={{ color:c.roas>=2?'var(--accent-green)':'var(--accent-orange)', fontWeight:600 }}>{c.roas?`${c.roas}x`:'—'}</td>
                      <td><span className={`badge badge-${c.status==='active'?'green':'gray'}`}>{c.status}</span></td>
                    </tr>
                  ))}</tbody>
                </table></div>}
              </div>
            </div>
          )}

          {/* TIME TAB */}
          {tab==='Time' && (
            <div className="card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>⏱️ Time Tracking</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>Total: {totalHours} hours logged</div>
                </div>
              </div>
              <div style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:8, padding:'1rem', marginBottom:'1rem', display:'grid', gap:'0.75rem' }}>
                <input className="input" placeholder="What did you work on? *" value={newTimeLog.description} onChange={e => setNewTimeLog(f => ({...f,description:e.target.value}))} />
                <div className="grid-2">
                  <input className="input" type="number" placeholder="Hours (e.g. 2.5)" value={newTimeLog.hours} onChange={e => setNewTimeLog(f => ({...f,hours:e.target.value}))} />
                  <input className="input" type="date" value={newTimeLog.date} onChange={e => setNewTimeLog(f => ({...f,date:e.target.value}))} />
                </div>
                <button className="btn-primary" onClick={addTimeLog} style={{ fontSize:'0.82rem', width:'fit-content' }}>+ Log Time</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Description</th><th>Hours</th><th>Date</th><th>Logged By</th></tr></thead>
                  <tbody>
                    {timeLogs.length === 0 ? <tr><td colSpan={4} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No time logged yet</td></tr>
                    : timeLogs.map(l => (
                      <tr key={l.id}>
                        <td style={{ color:'var(--text-primary)' }}>{l.description}</td>
                        <td style={{ color:'var(--accent-blue)', fontWeight:600 }}>{l.hours}h</td>
                        <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                        <td style={{ color:'var(--text-secondary)', fontSize:'0.8rem' }}>{l.logged_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* INTEGRATIONS TAB */}
          {tab==='Integrations' && (
            <div style={{ display:'grid', gap:'1rem' }}>
              {projects.map(p => (
                <div key={p.id} className="card">
                  <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)', marginBottom:'1rem' }}>📁 {p.name}</div>
                  <div className="grid-2">
                    <div style={{ background:p.gsc_connected?'rgba(52,168,83,0.08)':'var(--bg-secondary)', border:`1px solid ${p.gsc_connected?'rgba(52,168,83,0.3)':'var(--border)'}`, borderRadius:10, padding:'1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                        <span style={{ fontSize:'1.25rem' }}>🔍</span>
                        <div><div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-primary)' }}>Google Search Console</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{p.gsc_property_url||'Not configured'}</div></div>
                        {p.gsc_connected && <span className="badge badge-green" style={{ marginLeft:'auto' }}>✅</span>}
                      </div>
                      <Link href="/projects" style={{ fontSize:'0.78rem', color:'var(--accent-blue)', textDecoration:'none' }}>
                        {p.gsc_connected?'Manage →':'Connect →'}
                      </Link>
                    </div>
                    <div style={{ background:p.ga4_connected?'rgba(249,171,0,0.08)':'var(--bg-secondary)', border:`1px solid ${p.ga4_connected?'rgba(249,171,0,0.3)':'var(--border)'}`, borderRadius:10, padding:'1rem' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                        <span style={{ fontSize:'1.25rem' }}>📊</span>
                        <div><div style={{ fontWeight:700, fontSize:'0.82rem', color:'var(--text-primary)' }}>Google Analytics 4</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{p.ga4_measurement_id||'Not configured'}</div></div>
                        {p.ga4_connected && <span className="badge badge-green" style={{ marginLeft:'auto' }}>✅</span>}
                      </div>
                      <Link href="/projects" style={{ fontSize:'0.78rem', color:'var(--accent-blue)', textDecoration:'none' }}>
                        {p.ga4_connected?'Manage →':'Connect →'}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              {projects.length === 0 && <div className="card" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No projects found. <Link href="/projects" style={{ color:'var(--accent-blue)' }}>Add a project →</Link></div>}
            </div>
          )}

          {/* Other tabs placeholder */}
          {['Backlinks','Content','Social Posts','Documents','SEO'].includes(tab) && (
            <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
              <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>
                {tab==='Backlinks'?'🔗':tab==='Content'?'📝':tab==='Social Posts'?'📱':tab==='Documents'?'📄':'🔍'}
              </div>
              <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:'0.5rem' }}>{tab}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>Coming soon — this module is being built</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

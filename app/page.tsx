'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ clients:0, campaigns:0, leads:0, revenue:0, tasks:0, flags:0, mrr:0, hours:0 })
  const [clients, setClients] = useState<any[]>([])
  const [flags, setFlags] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, ca, l, inv, t, f, tl] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('campaigns').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('tasks').select('*').neq('status','done').limit(5),
        supabase.from('flags').select('*, clients(name)').eq('status','open').order('created_at',{ascending:false}).limit(5),
        supabase.from('time_logs').select('hours'),
      ])
      const revenue = (inv.data||[]).filter((i:any)=>i.status==='paid').reduce((s:number,i:any)=>s+i.amount,0)
      const mrr = (c.data||[]).reduce((s:number,cl:any)=>s+(cl.mrr||0),0)
      const hours = (tl.data||[]).reduce((s:number,l:any)=>s+(l.hours||0),0)
      setStats({ clients:c.data?.length||0, campaigns:ca.data?.length||0, leads:l.data?.length||0, revenue, tasks:t.data?.length||0, flags:f.data?.length||0, mrr, hours })
      setClients((c.data||[]).slice(0,6))
      setFlags(f.data||[])
      setTasks(t.data||[])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label:'Total MRR', value:`₹${stats.mrr.toLocaleString()}`, color:'var(--accent-orange)', icon:'💰', href:'/clients', sub:'Monthly recurring' },
    { label:'Active Clients', value:stats.clients, color:'var(--accent-blue)', icon:'👥', href:'/clients', sub:'Total clients' },
    { label:'Open Tasks', value:stats.tasks, color:'var(--accent-yellow)', icon:'✅', href:'/projects', sub:'Pending work' },
    { label:'Active Flags', value:stats.flags, color:'var(--accent-red)', icon:'🚩', href:'/flags', sub:'Need attention' },
    { label:'Total Leads', value:stats.leads, color:'var(--accent-purple)', icon:'⚡', href:'/leads', sub:'In pipeline' },
    { label:'Revenue', value:`₹${stats.revenue.toLocaleString()}`, color:'var(--accent-green)', icon:'📈', href:'/invoices', sub:'Total collected' },
    { label:'Campaigns', value:stats.campaigns, color:'var(--accent-cyan)', icon:'📢', href:'/google-ads', sub:'Running now' },
    { label:'Hours Logged', value:`${stats.hours}h`, color:'#a78bfa', icon:'⏱️', href:'/projects', sub:'Team time' },
  ]

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontSize:'1rem', fontWeight:800, color:'var(--text-primary)', letterSpacing:'-0.02em' }}>Good morning, Dipesh 👋</div>
          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.625rem' }}>
          <Link href="/clients" className="btn-primary">+ Add Client</Link>
          <Link href="/flags" className="btn-secondary" style={{ borderColor:'rgba(239,68,68,0.3)', color:'var(--accent-red)' }}>🚩 {stats.flags} Flags</Link>
        </div>
      </div>

      <div className="page">
        {/* Hero */}
        <div style={{ background:'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(37,99,235,0.08))', border:'1px solid rgba(249,115,22,0.2)', borderRadius:12, padding:'1.25rem 1.5rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <div style={{ fontSize:'1.375rem', fontWeight:900, letterSpacing:'-0.03em', marginBottom:'0.25rem' }}>
              <span className="gradient-text">Vraj Digital Marketing</span>
            </div>
            <div style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>Complete agency management — clients, campaigns, tasks, finance & AI in one place</div>
          </div>
          <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap' }}>
            <Link href="/integrations" className="btn-primary">🔌 Integrations</Link>
            <Link href="/ai-content" className="btn-secondary">🤖 AI Content</Link>
            <Link href="/reports" className="btn-secondary">📊 Reports</Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid-4" style={{ marginBottom:'1.25rem' }}>
          {statCards.map((s,i) => (
            <Link key={i} href={s.href} style={{ textDecoration:'none' }}>
              <div className="stat-card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em' }}>{s.label}</div>
                  <div style={{ fontSize:'1.375rem', lineHeight:1 }}>{s.icon}</div>
                </div>
                <div style={{ fontSize:'1.625rem', fontWeight:900, color:s.color, letterSpacing:'-0.02em', marginBottom:'0.25rem' }}>{loading?'—':s.value}</div>
                <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{s.sub}</div>
                <div style={{ marginTop:'0.75rem', height:2, background:'var(--border)', borderRadius:999 }}>
                  <div style={{ height:'100%', width:'65%', background:s.color, borderRadius:999, opacity:0.6 }}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom:'1.25rem' }}>
          {/* Open Flags */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>🚩 Open Flags</div>
              <Link href="/flags" style={{ fontSize:'0.72rem', color:'var(--accent-orange)', textDecoration:'none' }}>View all →</Link>
            </div>
            {loading ? [1,2].map(i=><div key={i} className="skeleton" style={{height:48,marginBottom:8}}></div>)
            : flags.length===0 ? <div style={{color:'var(--text-muted)',fontSize:'0.82rem',textAlign:'center',padding:'1.5rem'}}>✅ No open flags</div>
            : flags.map(f => {
              const colors: Record<string,string> = { critical:'var(--accent-red)', warning:'var(--accent-orange)', info:'var(--accent-blue)', success:'var(--accent-green)' }
              return (
                <div key={f.id} style={{display:'flex',gap:'0.75rem',alignItems:'flex-start',padding:'0.625rem 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:colors[f.type]||'var(--accent-orange)',flexShrink:0,marginTop:5}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>{f.title}</div>
                    {f.clients?.name&&<div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{f.clients.name}</div>}
                  </div>
                  <span className={`badge badge-${f.type==='critical'?'red':f.type==='warning'?'orange':'blue'}`}>{f.type}</span>
                </div>
              )
            })}
          </div>

          {/* Pending Tasks */}
          <div className="card">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
              <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>✅ Pending Tasks</div>
              <Link href="/projects" style={{ fontSize:'0.72rem', color:'var(--accent-orange)', textDecoration:'none' }}>View all →</Link>
            </div>
            {loading ? [1,2,3].map(i=><div key={i} className="skeleton" style={{height:40,marginBottom:8}}></div>)
            : tasks.length===0 ? <div style={{color:'var(--text-muted)',fontSize:'0.82rem',textAlign:'center',padding:'1.5rem'}}>✅ All tasks done!</div>
            : tasks.map(t => {
              const pColor: Record<string,string> = { high:'var(--accent-red)', medium:'var(--accent-orange)', low:'var(--accent-green)' }
              const overdue = t.due_date && new Date(t.due_date) < new Date()
              return (
                <div key={t.id} style={{display:'flex',gap:'0.75rem',alignItems:'center',padding:'0.5rem 0',borderBottom:'1px solid var(--border)'}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:pColor[t.priority]||'#94a3b8',flexShrink:0}}></div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-primary)'}}>{t.title}</div>
                    {t.due_date&&<div style={{fontSize:'0.7rem',color:overdue?'var(--accent-red)':'var(--text-muted)'}}>{overdue?'⚠️ Overdue: ':''}{new Date(t.due_date).toLocaleDateString('en-IN')}</div>}
                  </div>
                  <span style={{fontSize:'0.68rem',padding:'0.15rem 0.5rem',borderRadius:999,background:`${pColor[t.priority]||'#94a3b8'}15`,color:pColor[t.priority]||'#94a3b8',fontWeight:600,textTransform:'uppercase'}}>{t.priority}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Recent Clients */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
            <div style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>👥 Recent Clients</div>
            <Link href="/clients" className="btn-primary" style={{fontSize:'0.72rem',padding:'0.3rem 0.75rem'}}>+ Add Client</Link>
          </div>
          {loading ? <div className="skeleton" style={{height:120}}></div>
          : clients.length===0 ? (
            <div style={{textAlign:'center',padding:'2rem',color:'var(--text-muted)'}}>
              <div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>👥</div>
              <div style={{fontSize:'0.85rem'}}>No clients yet. <Link href="/clients" style={{color:'var(--accent-orange)'}}>Add your first client →</Link></div>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead><tr><th>Client</th><th>Company</th><th>Services</th><th>MRR</th><th>Health</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {clients.map(c => {
                    const h = c.health_score||80
                    const hc = h>=80?'var(--accent-green)':h>=60?'var(--accent-orange)':'var(--accent-red)'
                    return (
                      <tr key={c.id}>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:'0.625rem'}}>
                            <div style={{width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg, var(--accent-orange), var(--accent-blue))',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontWeight:800,fontSize:'0.7rem',flexShrink:0}}>
                              {c.name?.charAt(0)}{c.name?.split(' ')[1]?.charAt(0)||''}
                            </div>
                            <div>
                              <div style={{fontWeight:600,color:'var(--text-primary)',fontSize:'0.82rem'}}>{c.name}</div>
                              <div style={{fontSize:'0.7rem',color:'var(--text-muted)'}}>{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>{c.company||'—'}</td>
                        <td>
                          <div style={{display:'flex',gap:'0.25rem',flexWrap:'wrap'}}>
                            {(c.services||[]).slice(0,2).map((s:string)=>(
                              <span key={s} style={{fontSize:'0.62rem',padding:'0.1rem 0.4rem',background:'rgba(249,115,22,0.1)',border:'1px solid rgba(249,115,22,0.2)',borderRadius:4,color:'var(--accent-orange)',fontWeight:600}}>{s}</span>
                            ))}
                            {(c.services||[]).length>2&&<span style={{fontSize:'0.62rem',color:'var(--text-muted)'}}>+{c.services.length-2}</span>}
                          </div>
                        </td>
                        <td style={{color:'var(--accent-green)',fontWeight:700}}>₹{(c.mrr||0).toLocaleString()}</td>
                        <td>
                          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                            <div style={{flex:1,height:4,background:'var(--border)',borderRadius:999,minWidth:50}}>
                              <div style={{height:'100%',width:`${h}%`,background:hc,borderRadius:999}}></div>
                            </div>
                            <span style={{fontSize:'0.72rem',color:hc,fontWeight:700}}>{h}%</span>
                          </div>
                        </td>
                        <td><span className={`badge badge-${c.status==='active'?'green':'gray'}`}>{c.status}</span></td>
                        <td><Link href={`/clients/${c.id}`} style={{fontSize:'0.72rem',color:'var(--accent-orange)',textDecoration:'none',fontWeight:600}}>View →</Link></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

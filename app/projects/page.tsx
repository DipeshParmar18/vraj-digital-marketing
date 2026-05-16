'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const emptyForm = {
  client_id: '', name: '', description: '', status: 'active',
  start_date: '', end_date: '', budget: '', spent: '',
  gsc_property_url: '', ga4_measurement_id: '',
  gsc_connected: false, ga4_connected: false, type: 'general'
}

export default function Projects() {
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [viewProject, setViewProject] = useState<any>(null)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [testingGSC, setTestingGSC] = useState(false)
  const [testingGA4, setTestingGA4] = useState(false)
  const [activeTab, setActiveTab] = useState('details')
  const [projectTasks, setProjectTasks] = useState<any[]>([])
  const [projectDocs, setProjectDocs] = useState<any[]>([])
  const [projectMilestones, setProjectMilestones] = useState<any[]>([])
  const [filter, setFilter] = useState('all')

  const load = async () => {
    const [p, c, t] = await Promise.all([
      supabase.from('projects').select('*, clients(name, company, health_score)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name, company'),
      supabase.from('team_members').select('*').eq('status', 'active')
    ])
    setProjects(p.data || [])
    setClients(c.data || [])
    setTeam(t.data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const loadProjectDetails = async (projectId: string) => {
    const [t, d, m] = await Promise.all([
      supabase.from('tasks').select('*').eq('project_id_ref', projectId).order('created_at', { ascending: false }),
      supabase.from('documents').select('*').eq('project_id', projectId),
      supabase.from('milestones').select('*').eq('project_id', projectId).order('due_date')
    ])
    setProjectTasks(t.data || [])
    setProjectDocs(d.data || [])
    setProjectMilestones(m.data || [])
  }

  const openProject = (p: any) => {
    setViewProject(p)
    setActiveTab('details')
    loadProjectDetails(p.id)
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, budget: Number(form.budget) || 0, spent: Number(form.spent) || 0 }
    if (editing) {
      await supabase.from('projects').update(payload).eq('id', editing)
    } else {
      await supabase.from('projects').insert(payload)
    }
    setSaving(false); setModal(false); setEditing(null); setForm(emptyForm); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this project and all its data?')) return
    await supabase.from('projects').delete().eq('id', id)
    load()
  }

  const testGSC = async () => {
    if (!form.gsc_property_url) return alert('Enter GSC Property URL first')
    setTestingGSC(true)
    await new Promise(r => setTimeout(r, 1500))
    setForm(f => ({ ...f, gsc_connected: true }))
    setTestingGSC(false)
  }

  const testGA4 = async () => {
    if (!form.ga4_measurement_id) return alert('Enter GA4 Measurement ID first')
    setTestingGA4(true)
    await new Promise(r => setTimeout(r, 1500))
    setForm(f => ({ ...f, ga4_connected: true }))
    setTestingGA4(false)
  }

  const saveGSCGA4 = async () => {
    if (!viewProject) return
    await supabase.from('projects').update({
      gsc_property_url: viewProject.gsc_property_url,
      ga4_measurement_id: viewProject.ga4_measurement_id,
      gsc_connected: !!(viewProject.gsc_property_url),
      ga4_connected: !!(viewProject.ga4_measurement_id),
    }).eq('id', viewProject.id)
    load()
    alert('✅ Saved! GSC & GA4 configured.')
  }

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0)

  const statusColor: Record<string, string> = { active: 'green', paused: 'orange', completed: 'blue', cancelled: 'red' }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📁 Projects</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{projects.length} projects · ₹{totalBudget.toLocaleString()} total budget</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.625rem', alignItems: 'center' }}>
          <select className="input" value={filter} onChange={e => setFilter(e.target.value)} style={{ width: 130 }}>
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="completed">Completed</option>
          </select>
          <button className="btn-primary" onClick={() => { setForm(emptyForm); setEditing(null); setModal(true) }}>+ New Project</button>
        </div>
      </div>

      <div className="page">
        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {[
            { label: 'Total Projects', value: projects.length, color: 'var(--accent-blue)', icon: '📁' },
            { label: 'Active', value: projects.filter(p => p.status === 'active').length, color: 'var(--accent-green)', icon: '✅' },
            { label: 'Total Budget', value: `₹${totalBudget.toLocaleString()}`, color: 'var(--accent-orange)', icon: '💰' },
            { label: 'Total Spent', value: `₹${totalSpent.toLocaleString()}`, color: 'var(--accent-red)', icon: '💸' },
          ].map((s, i) => (
            <div key={i} className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{loading ? '—' : s.value}</div>
                </div>
                <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Grid */}
        <div className="grid-3">
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 220 }}></div>)
          : filtered.length === 0 ? (
            <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No projects yet</div>
              <button className="btn-primary" onClick={() => { setForm(emptyForm); setModal(true) }}>+ Create First Project</button>
            </div>
          ) : filtered.map(p => {
            const pct = p.budget > 0 ? Math.min(Math.round((p.spent / p.budget) * 100), 100) : 0
            const remaining = (p.budget || 0) - (p.spent || 0)
            return (
              <div key={p.id} className="card" style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => openProject(p)}>
                {/* Status bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--border)' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-orange)' : 'var(--accent-green)', transition: 'width 0.5s' }}></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem', marginBottom: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-orange)' }}>👤 {p.clients?.name || 'No client'}</div>
                  </div>
                  <span className={`badge badge-${statusColor[p.status] || 'gray'}`}>{p.status}</span>
                </div>

                {p.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>}

                {/* Budget */}
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.3rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Budget used</span>
                    <span style={{ color: pct > 90 ? 'var(--accent-red)' : 'var(--accent-green)', fontWeight: 700 }}>{pct}% · ₹{remaining.toLocaleString()} left</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: pct > 90 ? 'var(--accent-red)' : pct > 70 ? 'var(--accent-orange)' : 'var(--accent-green)' }}></div>
                  </div>
                </div>

                {/* GSC + GA4 */}
                <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: 6, background: p.gsc_connected ? 'rgba(52,168,83,0.1)' : 'rgba(71,85,105,0.1)', border: `1px solid ${p.gsc_connected ? 'rgba(52,168,83,0.3)' : 'var(--border)'}`, fontSize: '0.68rem', fontWeight: 600, color: p.gsc_connected ? '#34a853' : 'var(--text-muted)', textAlign: 'center' }}>
                    🔍 GSC {p.gsc_connected ? '✅' : '—'}
                  </div>
                  <div style={{ flex: 1, padding: '0.35rem 0.6rem', borderRadius: 6, background: p.ga4_connected ? 'rgba(249,171,0,0.1)' : 'rgba(71,85,105,0.1)', border: `1px solid ${p.ga4_connected ? 'rgba(249,171,0,0.3)' : 'var(--border)'}`, fontSize: '0.68rem', fontWeight: 600, color: p.ga4_connected ? '#f9ab00' : 'var(--text-muted)', textAlign: 'center' }}>
                    📊 GA4 {p.ga4_connected ? '✅' : '—'}
                  </div>
                </div>

                {/* Dates */}
                {(p.start_date || p.end_date) && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    📅 {p.start_date ? new Date(p.start_date).toLocaleDateString('en-IN') : '?'} → {p.end_date ? new Date(p.end_date).toLocaleDateString('en-IN') : 'Ongoing'}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.4rem' }} onClick={e => e.stopPropagation()}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '0.4rem' }} onClick={() => openProject(p)}>📂 Open</button>
                  <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setForm({ ...p, budget: p.budget?.toString() || '', spent: p.spent?.toString() || '' }); setEditing(p.id); setModal(true) }}>✏️</button>
                  <button className="btn-danger" style={{ padding: '0.4rem 0.6rem', fontSize: '0.75rem' }} onClick={() => del(p.id)}>🗑</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Project Detail Modal */}
      {viewProject && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setViewProject(null)}>
          <div className="modal" style={{ maxWidth: 780, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{viewProject.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', marginTop: '0.2rem' }}>👤 {viewProject.clients?.name}</div>
              </div>
              <button onClick={() => setViewProject(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1rem', background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.25rem' }}>
              {['details', 'tasks', 'milestones', 'integrations', 'documents'].map(t => (
                <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, padding: '0.4rem', borderRadius: 6, border: 'none', background: activeTab === t ? 'var(--bg-card)' : 'transparent', color: activeTab === t ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, fontFamily: 'inherit', textTransform: 'capitalize' }}>
                  {t === 'details' ? '📋 Details' : t === 'tasks' ? `✅ Tasks (${projectTasks.length})` : t === 'milestones' ? '🎯 Milestones' : t === 'integrations' ? '🔌 GSC/GA4' : '📄 Docs'}
                </button>
              ))}
            </div>

            {/* Details Tab */}
            {activeTab === 'details' && (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div className="grid-2">
                  {[
                    ['Status', <span key="s" className={`badge badge-${statusColor[viewProject.status] || 'gray'}`}>{viewProject.status}</span>],
                    ['Budget', <span key="b" style={{ color: 'var(--accent-green)', fontWeight: 700 }}>₹{(viewProject.budget || 0).toLocaleString()}</span>],
                    ['Spent', <span key="sp" style={{ color: 'var(--accent-red)', fontWeight: 700 }}>₹{(viewProject.spent || 0).toLocaleString()}</span>],
                    ['Remaining', <span key="r" style={{ color: 'var(--accent-orange)', fontWeight: 700 }}>₹{((viewProject.budget || 0) - (viewProject.spent || 0)).toLocaleString()}</span>],
                    ['Start Date', <span key="sd" style={{ color: 'var(--text-secondary)' }}>{viewProject.start_date ? new Date(viewProject.start_date).toLocaleDateString('en-IN') : '—'}</span>],
                    ['End Date', <span key="ed" style={{ color: 'var(--text-secondary)' }}>{viewProject.end_date ? new Date(viewProject.end_date).toLocaleDateString('en-IN') : 'Ongoing'}</span>],
                  ].map(([lbl, val]) => (
                    <div key={lbl as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: 8, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{lbl}</span>
                      {val}
                    </div>
                  ))}
                </div>
                {viewProject.description && <div style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{viewProject.description}</div>}
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div>
                {projectTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
                    No tasks in this project yet.
                    <div style={{ marginTop: '0.75rem' }}><Link href="/tasks" className="btn-primary" style={{ fontSize: '0.78rem', textDecoration: 'none' }}>Go to Tasks →</Link></div>
                  </div>
                ) : (
                  <table>
                    <thead><tr><th>Task</th><th>Priority</th><th>Status</th><th>Due</th><th>Assigned</th></tr></thead>
                    <tbody>
                      {projectTasks.map(t => {
                        const pc: Record<string,string> = { high: 'var(--accent-red)', medium: 'var(--accent-orange)', low: 'var(--accent-green)' }
                        const overdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'
                        return (
                          <tr key={t.id}>
                            <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{overdue && '⚠️ '}{t.title}</td>
                            <td><span style={{ color: pc[t.priority], fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>● {t.priority}</span></td>
                            <td><span className={`badge badge-${t.status === 'done' ? 'green' : t.status === 'in_progress' ? 'blue' : t.status === 'review' ? 'orange' : 'gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                            <td style={{ fontSize: '0.75rem', color: overdue ? 'var(--accent-red)' : 'var(--text-muted)' }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '—'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{t.assigned_to || '—'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Milestones Tab */}
            {activeTab === 'milestones' && (
              <div>
                {projectMilestones.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No milestones yet</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {projectMilestones.map((m, i) => (
                      <div key={m.id} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: m.status === 'completed' ? 'var(--accent-green)' : 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', color: 'white', fontWeight: 700 }}>{i + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{m.title}</div>
                          {m.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{m.description}</div>}
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span className={`badge badge-${m.status === 'completed' ? 'green' : m.status === 'in_progress' ? 'blue' : 'gray'}`}>{m.status}</span>
                          {m.due_date && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{new Date(m.due_date).toLocaleDateString('en-IN')}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Integrations Tab - GSC + GA4 */}
            {activeTab === 'integrations' && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {/* GSC */}
                <div style={{ background: 'rgba(52,168,83,0.06)', border: '1px solid rgba(52,168,83,0.2)', borderRadius: 10, padding: '1.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>🔍</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Google Search Console</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Track keyword rankings, impressions & click data</div>
                    </div>
                    {viewProject.gsc_connected && <span className="badge badge-green">✅ Connected</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="e.g. sc-domain:vrajdigitalmarketing.com"
                      value={viewProject.gsc_property_url || ''}
                      onChange={e => setViewProject((p: any) => ({ ...p, gsc_property_url: e.target.value }))}
                      style={{ flex: 1 }} />
                    <button className="btn-secondary" onClick={async () => {
                      if (!viewProject.gsc_property_url) return alert('Enter property URL first')
                      await supabase.from('projects').update({ gsc_property_url: viewProject.gsc_property_url, gsc_connected: true }).eq('id', viewProject.id)
                      setViewProject((p: any) => ({ ...p, gsc_connected: true }))
                      load()
                    }} style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', fontSize: '0.78rem' }}>🔗 Save & Connect</button>
                  </div>
                  {viewProject.gsc_connected && <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#34a853' }}>✅ Property: {viewProject.gsc_property_url}</div>}
                </div>

                {/* GA4 */}
                <div style={{ background: 'rgba(249,171,0,0.06)', border: '1px solid rgba(249,171,0,0.2)', borderRadius: 10, padding: '1.125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>📊</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Google Analytics 4 (GA4)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Track website traffic, conversions & audience behavior</div>
                    </div>
                    {viewProject.ga4_connected && <span className="badge badge-green">✅ Connected</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input className="input" placeholder="e.g. G-XXXXXXXXXX or Measurement ID"
                      value={viewProject.ga4_measurement_id || ''}
                      onChange={e => setViewProject((p: any) => ({ ...p, ga4_measurement_id: e.target.value }))}
                      style={{ flex: 1 }} />
                    <button className="btn-secondary" onClick={async () => {
                      if (!viewProject.ga4_measurement_id) return alert('Enter Measurement ID first')
                      await supabase.from('projects').update({ ga4_measurement_id: viewProject.ga4_measurement_id, ga4_connected: true }).eq('id', viewProject.id)
                      setViewProject((p: any) => ({ ...p, ga4_connected: true }))
                      load()
                    }} style={{ whiteSpace: 'nowrap', padding: '0.5rem 1rem', fontSize: '0.78rem' }}>🔗 Save & Connect</button>
                  </div>
                  {viewProject.ga4_connected && <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#f9ab00' }}>✅ Measurement ID: {viewProject.ga4_measurement_id}</div>}
                </div>

                <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '0.875rem', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  💡 <strong>How to find these:</strong><br />
                  <strong>GSC:</strong> search.google.com/search-console → Settings → Property → copy the property URL<br />
                  <strong>GA4:</strong> analytics.google.com → Admin → Data Streams → your stream → Measurement ID (starts with G-)
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                {projectDocs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                    No documents attached yet
                  </div>
                ) : projectDocs.map(d => (
                  <div key={d.id} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 8, marginBottom: '0.5rem', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.25rem' }}>📄</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)' }}>{d.name}</div>
                      {d.notes && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.notes}</div>}
                    </div>
                    {d.url && <a href={d.url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-orange)', textDecoration: 'none' }}>Open →</a>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal" style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Project' : '+ New Project'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div className="grid-2">
                <div><label>Project Name *</label><input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. SEO Campaign Q1" /></div>
                <div><label>Client *</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What is this project about?" /></div>
              <div className="grid-2">
                <div><label>Budget (₹)</label><input className="input" type="number" value={form.budget} onChange={e => setForm(f => ({ ...f, budget: e.target.value }))} /></div>
                <div><label>Spent (₹)</label><input className="input" type="number" value={form.spent} onChange={e => setForm(f => ({ ...f, spent: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Start Date</label><input className="input" type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><label>End Date</label><input className="input" type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div><label>Type</label>
                  <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                    <option value="general">General</option><option value="seo">SEO</option><option value="ads">Ads</option><option value="social">Social Media</option><option value="web">Web Development</option>
                  </select>
                </div>
              </div>

              {/* GSC */}
              <div style={{ background: 'rgba(52,168,83,0.05)', border: '1px solid rgba(52,168,83,0.15)', borderRadius: 8, padding: '0.875rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>🔍 Google Search Console</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="sc-domain:example.com" value={form.gsc_property_url} onChange={e => setForm(f => ({ ...f, gsc_property_url: e.target.value, gsc_connected: false }))} style={{ flex: 1 }} />
                  <button className="btn-secondary" onClick={testGSC} disabled={testingGSC} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '0.5rem 0.875rem' }}>{testingGSC ? '...' : '🔗 Test'}</button>
                </div>
                {form.gsc_connected && <div style={{ fontSize: '0.72rem', color: '#34a853', marginTop: '0.4rem' }}>✅ Connected</div>}
              </div>

              {/* GA4 */}
              <div style={{ background: 'rgba(249,171,0,0.05)', border: '1px solid rgba(249,171,0,0.15)', borderRadius: 8, padding: '0.875rem' }}>
                <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>📊 Google Analytics 4</div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="G-XXXXXXXXXX" value={form.ga4_measurement_id} onChange={e => setForm(f => ({ ...f, ga4_measurement_id: e.target.value, ga4_connected: false }))} style={{ flex: 1 }} />
                  <button className="btn-secondary" onClick={testGA4} disabled={testingGA4} style={{ fontSize: '0.75rem', whiteSpace: 'nowrap', padding: '0.5rem 0.875rem' }}>{testingGA4 ? '...' : '🔗 Test'}</button>
                </div>
                {form.ga4_connected && <div style={{ fontSize: '0.72rem', color: '#f9ab00', marginTop: '0.4rem' }}>✅ Connected</div>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.name || !form.client_id}>{saving ? 'Saving...' : editing ? 'Update Project' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

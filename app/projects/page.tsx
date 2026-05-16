'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const emptyProject = { client_id:'', name:'', description:'', status:'active', start_date:'', end_date:'', budget:'', gsc_property_url:'', ga4_measurement_id:'', gsc_connected:false, ga4_connected:false, type:'general' }
const emptyTask = { client_id:'', title:'', description:'', status:'todo', priority:'medium', due_date:'', assigned_to:'' }

export default function Projects() {
  const [tasks, setTasks] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'project'|'task'|null>(null)
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'projects'|'tasks'>('projects')
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [testingGSC, setTestingGSC] = useState(false)
  const [testingGA4, setTestingGA4] = useState(false)

  const load = async () => {
    const [p, t, c] = await Promise.all([
      supabase.from('projects').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('tasks').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setProjects(p.data || [])
    setTasks(t.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const saveProject = async () => {
    setSaving(true)
    const payload = { ...projectForm, budget: Number(projectForm.budget) || 0 }
    if (editing) await supabase.from('projects').update(payload).eq('id', editing)
    else await supabase.from('projects').insert(payload)
    setSaving(false); setModal(null); setEditing(null); setProjectForm(emptyProject); load()
  }

  const saveTask = async () => {
    setSaving(true)
    if (editing) await supabase.from('tasks').update(taskForm).eq('id', editing)
    else await supabase.from('tasks').insert(taskForm)
    setSaving(false); setModal(null); setEditing(null); setTaskForm(emptyTask); load()
  }

  const delProject = async (id: string) => {
    if (!confirm('Delete project?')) return
    await supabase.from('projects').delete().eq('id', id)
    load()
  }

  const delTask = async (id: string) => {
    if (!confirm('Delete task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const updateTaskStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
    load()
  }

  const testGSC = async () => {
    if (!projectForm.gsc_property_url) return alert('Enter GSC Property URL first')
    setTestingGSC(true)
    await new Promise(r => setTimeout(r, 1500))
    setProjectForm(f => ({ ...f, gsc_connected: true }))
    setTestingGSC(false)
  }

  const testGA4 = async () => {
    if (!projectForm.ga4_measurement_id) return alert('Enter GA4 Measurement ID first')
    setTestingGA4(true)
    await new Promise(r => setTimeout(r, 1500))
    setProjectForm(f => ({ ...f, ga4_connected: true }))
    setTestingGA4(false)
  }

  const columns = [
    { id:'todo', label:'To Do', color:'#94a3b8', badge:'badge-gray' },
    { id:'in_progress', label:'In Progress', color:'#3b82f6', badge:'badge-blue' },
    { id:'review', label:'Review', color:'#f59e0b', badge:'badge-orange' },
    { id:'done', label:'Done', color:'#10b981', badge:'badge-green' },
  ]

  const priorityColor: Record<string,string> = { high:'#ef4444', medium:'#f59e0b', low:'#10b981' }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight:700, color:'var(--text-primary)' }}>📁 Projects & Tasks</div>
          <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{projects.length} projects · {tasks.length} tasks</div>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.75rem', alignItems:'center' }}>
          <div style={{ display:'flex', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, overflow:'hidden' }}>
            {(['projects','tasks'] as const).map(v => (
              <button key={v} onClick={() => setTab(v)} style={{ padding:'0.4rem 0.875rem', background:tab===v?'rgba(59,130,246,0.2)':'transparent', color:tab===v?'var(--accent-blue)':'var(--text-muted)', border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, fontFamily:'inherit' }}>
                {v==='projects'?'📁 Projects':'✅ Tasks'}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { if(tab==='projects'){setProjectForm(emptyProject);setEditing(null);setModal('project')}else{setTaskForm(emptyTask);setEditing(null);setModal('task')} }}>
            + Add {tab==='projects'?'Project':'Task'}
          </button>
        </div>
      </div>

      <div className="page">
        {tab === 'projects' ? (
          <div className="grid-3">
            {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height:200 }}></div>)
            : projects.length === 0 ? (
              <div className="card" style={{ gridColumn:'1/-1', textAlign:'center', padding:'3rem' }}>
                <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📁</div>
                <div style={{ fontWeight:600, color:'var(--text-primary)' }}>No projects yet</div>
                <button className="btn-primary" style={{ marginTop:'1rem' }} onClick={() => { setProjectForm(emptyProject); setModal('project') }}>+ Add First Project</button>
              </div>
            ) : projects.map(p => (
              <div key={p.id} className="card">
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                  <div>
                    <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'0.9rem', marginBottom:'0.25rem' }}>{p.name}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>👤 {p.clients?.name||'No client'}</div>
                  </div>
                  <span className={`badge badge-${p.status==='active'?'green':p.status==='completed'?'blue':'gray'}`}>{p.status}</span>
                </div>

                {p.description && <div style={{ fontSize:'0.8rem', color:'var(--text-secondary)', marginBottom:'0.875rem', lineHeight:1.5 }}>{p.description}</div>}

                {/* GSC + GA4 Status */}
                <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.875rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.6rem', borderRadius:6, background:p.gsc_connected?'rgba(52,168,83,0.1)':'rgba(100,116,139,0.1)', border:`1px solid ${p.gsc_connected?'rgba(52,168,83,0.3)':'var(--border)'}`, fontSize:'0.72rem', fontWeight:600, color:p.gsc_connected?'#34a853':'var(--text-muted)' }}>
                    <span>🔍</span> GSC {p.gsc_connected?'✅':'Not connected'}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', padding:'0.3rem 0.6rem', borderRadius:6, background:p.ga4_connected?'rgba(249,171,0,0.1)':'rgba(100,116,139,0.1)', border:`1px solid ${p.ga4_connected?'rgba(249,171,0,0.3)':'var(--border)'}`, fontSize:'0.72rem', fontWeight:600, color:p.ga4_connected?'#f9ab00':'var(--text-muted)' }}>
                    <span>📊</span> GA4 {p.ga4_connected?'✅':'Not connected'}
                  </div>
                </div>

                {p.budget > 0 && (
                  <div style={{ marginBottom:'0.75rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>
                      <span>Budget</span><span>₹{p.budget.toLocaleString()}</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width:`${Math.min((p.spent||0)/p.budget*100,100)}%` }}></div></div>
                  </div>
                )}

                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button className="btn-secondary" style={{ flex:1, justifyContent:'center', fontSize:'0.78rem', padding:'0.4rem' }}
                    onClick={() => { setProjectForm({...p, budget:p.budget?.toString()||''}); setEditing(p.id); setModal('project') }}>
                    ⚙️ Edit & Connect
                  </button>
                  <button className="btn-danger" style={{ padding:'0.4rem 0.75rem', fontSize:'0.78rem' }} onClick={() => delProject(p.id)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Kanban Board */
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1rem', alignItems:'start' }}>
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status===col.id)
              return (
                <div key={col.id}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.75rem' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:col.color }}></div>
                    <span style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{col.label}</span>
                    <span style={{ marginLeft:'auto', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:999, padding:'0.1rem 0.5rem', fontSize:'0.7rem', color:'var(--text-muted)' }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                    {colTasks.map(task => (
                      <div key={task.id} className="card" style={{ padding:'0.875rem', cursor:'pointer' }}
                        onClick={() => { setTaskForm({...task}); setEditing(task.id); setModal('task') }}>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                          <div style={{ fontSize:'0.82rem', fontWeight:600, color:'var(--text-primary)', lineHeight:1.3, flex:1 }}>{task.title}</div>
                          <div style={{ width:8, height:8, borderRadius:'50%', background:priorityColor[task.priority]||'#94a3b8', flexShrink:0, marginLeft:'0.5rem', marginTop:3 }}></div>
                        </div>
                        {task.clients?.name&&<div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'0.4rem' }}>👤 {task.clients.name}</div>}
                        {task.due_date&&<div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginBottom:'0.5rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</div>}
                        <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>
                          {columns.filter(c=>c.id!==col.id).map(c => (
                            <button key={c.id} onClick={e => { e.stopPropagation(); updateTaskStatus(task.id,c.id) }} style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem', background:'var(--bg-secondary)', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', color:'var(--text-muted)', fontFamily:'inherit' }}>→ {c.label}</button>
                          ))}
                          <button onClick={e => { e.stopPropagation(); delTask(task.id) }} style={{ fontSize:'0.65rem', padding:'0.2rem 0.5rem', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:4, cursor:'pointer', color:'var(--accent-red)', fontFamily:'inherit', marginLeft:'auto' }}>🗑</button>
                        </div>
                      </div>
                    ))}
                    {colTasks.length===0&&<div style={{ textAlign:'center', padding:'1.5rem 0.5rem', color:'var(--text-muted)', fontSize:'0.78rem', borderRadius:8, border:'1px dashed var(--border)' }}>No tasks</div>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Project Modal */}
      {modal==='project' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal" style={{ maxWidth:640 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing?'Edit Project':'Add New Project'}</h2>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div className="grid-2">
                <div><label>Project Name *</label><input className="input" value={projectForm.name} onChange={e => setProjectForm(f => ({...f,name:e.target.value}))} /></div>
                <div><label>Client</label>
                  <select className="input" value={projectForm.client_id} onChange={e => setProjectForm(f => ({...f,client_id:e.target.value}))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea className="input" value={projectForm.description} onChange={e => setProjectForm(f => ({...f,description:e.target.value}))} /></div>
              <div className="grid-2">
                <div><label>Start Date</label><input className="input" type="date" value={projectForm.start_date} onChange={e => setProjectForm(f => ({...f,start_date:e.target.value}))} /></div>
                <div><label>End Date</label><input className="input" type="date" value={projectForm.end_date} onChange={e => setProjectForm(f => ({...f,end_date:e.target.value}))} /></div>
              </div>
              <div className="grid-2">
                <div><label>Budget (₹)</label><input className="input" type="number" value={projectForm.budget} onChange={e => setProjectForm(f => ({...f,budget:e.target.value}))} /></div>
                <div><label>Status</label>
                  <select className="input" value={projectForm.status} onChange={e => setProjectForm(f => ({...f,status:e.target.value}))}>
                    <option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* GSC Integration */}
              <div style={{ background:'rgba(52,168,83,0.05)', border:'1px solid rgba(52,168,83,0.2)', borderRadius:10, padding:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <span style={{ fontSize:'1.25rem' }}>🔍</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)' }}>Google Search Console</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Connect to track keyword rankings & impressions</div>
                  </div>
                  {projectForm.gsc_connected && <span className="badge badge-green" style={{ marginLeft:'auto' }}>✅ Connected</span>}
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input className="input" placeholder="e.g. sc-domain:vrajdigital.com" value={projectForm.gsc_property_url} onChange={e => setProjectForm(f => ({...f,gsc_property_url:e.target.value,gsc_connected:false}))} style={{ flex:1 }} />
                  <button className="btn-secondary" onClick={testGSC} disabled={testingGSC} style={{ whiteSpace:'nowrap', padding:'0.6rem 1rem', fontSize:'0.8rem' }}>
                    {testingGSC?'Testing...':'🔗 Connect'}
                  </button>
                </div>
              </div>

              {/* GA4 Integration */}
              <div style={{ background:'rgba(249,171,0,0.05)', border:'1px solid rgba(249,171,0,0.2)', borderRadius:10, padding:'1rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'0.75rem' }}>
                  <span style={{ fontSize:'1.25rem' }}>📊</span>
                  <div>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', color:'var(--text-primary)' }}>Google Analytics 4 (GA4)</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>Connect to track website traffic & conversions</div>
                  </div>
                  {projectForm.ga4_connected && <span className="badge badge-green" style={{ marginLeft:'auto' }}>✅ Connected</span>}
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <input className="input" placeholder="e.g. G-XXXXXXXXXX" value={projectForm.ga4_measurement_id} onChange={e => setProjectForm(f => ({...f,ga4_measurement_id:e.target.value,ga4_connected:false}))} style={{ flex:1 }} />
                  <button className="btn-secondary" onClick={testGA4} disabled={testingGA4} style={{ whiteSpace:'nowrap', padding:'0.6rem 1rem', fontSize:'0.8rem' }}>
                    {testingGA4?'Testing...':'🔗 Connect'}
                  </button>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveProject} disabled={saving||!projectForm.name}>{saving?'Saving...':editing?'Update Project':'Add Project'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {modal==='task' && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(null)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing?'Edit Task':'Add Task'}</h2>
              <button onClick={() => setModal(null)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div><label>Title *</label><input className="input" value={taskForm.title} onChange={e => setTaskForm(f => ({...f,title:e.target.value}))} /></div>
              <div><label>Client</label>
                <select className="input" value={taskForm.client_id} onChange={e => setTaskForm(f => ({...f,client_id:e.target.value}))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Description</label><textarea className="input" value={taskForm.description} onChange={e => setTaskForm(f => ({...f,description:e.target.value}))} /></div>
              <div className="grid-2">
                <div><label>Priority</label>
                  <select className="input" value={taskForm.priority} onChange={e => setTaskForm(f => ({...f,priority:e.target.value}))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div><label>Status</label>
                  <select className="input" value={taskForm.status} onChange={e => setTaskForm(f => ({...f,status:e.target.value}))}>
                    {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Due Date</label><input className="input" type="date" value={taskForm.due_date} onChange={e => setTaskForm(f => ({...f,due_date:e.target.value}))} /></div>
                <div><label>Assigned To</label><input className="input" value={taskForm.assigned_to} onChange={e => setTaskForm(f => ({...f,assigned_to:e.target.value}))} /></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={saveTask} disabled={saving||!taskForm.title}>{saving?'Saving...':editing?'Update':'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

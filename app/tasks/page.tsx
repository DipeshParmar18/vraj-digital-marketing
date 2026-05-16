'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const empty = { client_id: '', project_id_ref: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' }
const columns = [
  { id: 'todo', label: 'To Do', color: '#94a3b8', badge: 'badge-gray' },
  { id: 'in_progress', label: 'In Progress', color: 'var(--accent-blue)', badge: 'badge-blue' },
  { id: 'review', label: 'Review', color: 'var(--accent-orange)', badge: 'badge-orange' },
  { id: 'done', label: 'Done', color: 'var(--accent-green)', badge: 'badge-green' },
]

export default function Tasks() {
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(empty)
  const [editing, setEditing] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [filterClient, setFilterClient] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterPriority, setFilterPriority] = useState('')

  const load = async () => {
    const [t, c, p, tm] = await Promise.all([
      supabase.from('tasks').select('*, clients(name), projects!tasks_project_id_ref_fkey(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name'),
      supabase.from('projects').select('id, name, client_id'),
      supabase.from('team_members').select('id, name').eq('status', 'active'),
    ])
    setTasks(t.data || [])
    setClients(c.data || [])
    setProjects(p.data || [])
    setTeam(tm.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const clientProjects = projects.filter(p => !form.client_id || p.client_id === form.client_id)

  const save = async () => {
    setSaving(true)
    if (editing) await supabase.from('tasks').update(form).eq('id', editing)
    else await supabase.from('tasks').insert(form)
    setSaving(false); setModal(false); setEditing(null); setForm(empty); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
    load()
  }

  let filtered = tasks
  if (filterClient) filtered = filtered.filter(t => t.client_id === filterClient)
  if (filterStatus) filtered = filtered.filter(t => t.status === filterStatus)
  if (filterPriority) filtered = filtered.filter(t => t.priority === filterPriority)

  const priorityColor: Record<string, string> = { high: 'var(--accent-red)', medium: 'var(--accent-orange)', low: 'var(--accent-green)' }
  const overdue = (t: any) => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done'

  const counts = { todo: tasks.filter(t => t.status === 'todo').length, in_progress: tasks.filter(t => t.status === 'in_progress').length, review: tasks.filter(t => t.status === 'review').length, done: tasks.filter(t => t.status === 'done').length }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>✅ Tasks</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tasks.length} total · {tasks.filter(t => overdue(t)).length} overdue</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <select className="input" value={filterClient} onChange={e => setFilterClient(e.target.value)} style={{ width: 140 }}>
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)} style={{ width: 120 }}>
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '0.4rem 0.75rem', background: view === v ? 'rgba(249,115,22,0.15)' : 'transparent', color: view === v ? 'var(--accent-orange)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit' }}>
                {v === 'kanban' ? '⊞ Board' : '☰ List'}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setForm(empty); setEditing(null); setModal(true) }}>+ Add Task</button>
        </div>
      </div>

      <div className="page">
        {/* Summary */}
        <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
          {columns.map(col => (
            <div key={col.id} className="card" style={{ borderTop: `3px solid ${col.color}` }}>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{col.label}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: col.color }}>{counts[col.id as keyof typeof counts] || 0}</div>
            </div>
          ))}
        </div>

        {view === 'kanban' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', alignItems: 'start' }}>
            {columns.map(col => {
              const colTasks = filtered.filter(t => t.status === col.id)
              return (
                <div key={col.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
                    <span style={{ marginLeft: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.1rem 0.5rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {colTasks.map(task => (
                      <div key={task.id} className="card" style={{ padding: '0.8rem', borderLeft: `3px solid ${priorityColor[task.priority] || '#94a3b8'}`, cursor: 'pointer' }}
                        onClick={() => { setForm({ ...task, project_id_ref: task.project_id_ref || '' }); setEditing(task.id); setModal(true) }}>
                        {overdue(task) && <div style={{ fontSize: '0.65rem', color: 'var(--accent-red)', fontWeight: 700, marginBottom: '0.3rem' }}>⚠️ OVERDUE</div>}
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: '0.4rem' }}>{task.title}</div>
                        {task.clients?.name && <div style={{ fontSize: '0.68rem', color: 'var(--accent-orange)', marginBottom: '0.25rem' }}>👤 {task.clients.name}</div>}
                        {task.projects?.name && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>📁 {task.projects.name}</div>}
                        {task.due_date && <div style={{ fontSize: '0.68rem', color: overdue(task) ? 'var(--accent-red)' : 'var(--text-muted)', marginBottom: '0.5rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</div>}
                        {task.assigned_to && <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>👤 {task.assigned_to}</div>}
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }} onClick={e => e.stopPropagation()}>
                          {columns.filter(c => c.id !== col.id).map(c => (
                            <button key={c.id} onClick={() => updateStatus(task.id, c.id)} style={{ fontSize: '0.62rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>→ {c.label}</button>
                          ))}
                          <button onClick={() => del(task.id)} style={{ fontSize: '0.62rem', padding: '0.2rem 0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-red)', fontFamily: 'inherit', marginLeft: 'auto' }}>🗑</button>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: '1.25rem', color: 'var(--text-muted)', fontSize: '0.75rem', border: '1px dashed var(--border)', borderRadius: 8 }}>No tasks</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Task</th><th>Client</th><th>Project</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Assigned</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</td></tr>
                  : filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No tasks found</td></tr>
                  : filtered.map(t => (
                    <tr key={t.id} style={{ background: overdue(t) ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                      <td><div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{overdue(t) && '⚠️ '}{t.title}</div>{t.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{t.description.slice(0, 50)}...</div>}</td>
                      <td style={{ color: 'var(--accent-orange)', fontWeight: 500 }}>{t.clients?.name || '—'}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{t.projects?.name || '—'}</td>
                      <td><span style={{ color: priorityColor[t.priority], fontWeight: 600, fontSize: '0.75rem', textTransform: 'capitalize' }}>● {t.priority}</span></td>
                      <td><span className={`badge ${columns.find(c => c.id === t.status)?.badge || 'badge-gray'}`}>{t.status?.replace('_', ' ')}</span></td>
                      <td style={{ color: overdue(t) ? 'var(--accent-red)' : 'var(--text-muted)', fontSize: '0.78rem', fontWeight: overdue(t) ? 700 : 400 }}>{t.due_date ? new Date(t.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{t.assigned_to || '—'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.72rem' }} onClick={() => { setForm({ ...t, project_id_ref: t.project_id_ref || '' }); setEditing(t.id); setModal(true) }}>Edit</button>
                          <button className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem' }} onClick={() => del(t.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>{editing ? 'Edit Task' : '+ Add Task'}</h2>
              <button onClick={() => setModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div><label>Task Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What needs to be done?" /></div>
              <div className="grid-2">
                <div><label>Client</label>
                  <select className="input" value={form.client_id} onChange={e => setForm(f => ({ ...f, client_id: e.target.value, project_id_ref: '' }))}>
                    <option value="">Select client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label>Project</label>
                  <select className="input" value={form.project_id_ref} onChange={e => setForm(f => ({ ...f, project_id_ref: e.target.value }))}>
                    <option value="">Select project</option>
                    {clientProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              </div>
              <div><label>Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Task details..." /></div>
              <div className="grid-2">
                <div><label>Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                    <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🔴 High</option>
                  </select>
                </div>
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                    {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
                <div><label>Assign To</label>
                  <select className="input" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
                    <option value="">Select team member</option>
                    {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                    <option value="Dipesh Parmar">Dipesh Parmar (Owner)</option>
                  </select>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving || !form.title}>{saving ? 'Saving...' : editing ? 'Update Task' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

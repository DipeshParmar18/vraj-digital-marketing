'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const emptyTask = { client_id: '', title: '', description: '', status: 'todo', priority: 'medium', due_date: '', assigned_to: '' }

export default function Projects() {
  const [tasks, setTasks] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(emptyTask)
  const [editing, setEditing] = useState<string|null>(null)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'kanban'|'list'>('kanban')

  const load = async () => {
    const [t, c] = await Promise.all([
      supabase.from('tasks').select('*, clients(name)').order('created_at', { ascending: false }),
      supabase.from('clients').select('id, name')
    ])
    setTasks(t.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    if (editing) await supabase.from('tasks').update(form).eq('id', editing)
    else await supabase.from('tasks').insert(form)
    setSaving(false); setModal(false); setEditing(null); setForm(emptyTask); load()
  }

  const del = async (id: string) => {
    if (!confirm('Delete task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    load()
  }

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('tasks').update({ status }).eq('id', id)
    load()
  }

  const columns = [
    { id: 'todo', label: 'To Do', color: '#94a3b8', badge: 'badge-gray' },
    { id: 'in_progress', label: 'In Progress', color: '#3b82f6', badge: 'badge-blue' },
    { id: 'review', label: 'Review', color: '#f59e0b', badge: 'badge-orange' },
    { id: 'done', label: 'Done', color: '#10b981', badge: 'badge-green' },
  ]

  const priorityColor: Record<string,string> = { high: '#ef4444', medium: '#f59e0b', low: '#10b981' }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📁 Projects & Tasks</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tasks.length} total tasks</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden' }}>
            {(['kanban', 'list'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '0.4rem 0.875rem', background: view === v ? 'rgba(59,130,246,0.2)' : 'transparent', color: view === v ? 'var(--accent-blue)' : 'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}>
                {v === 'kanban' ? '⊞ Kanban' : '☰ List'}
              </button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => { setForm(emptyTask); setEditing(null); setModal(true) }}>+ Add Task</button>
        </div>
      </div>
      <div className="page">
        {view === 'kanban' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', alignItems: 'start' }}>
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id)
              return (
                <div key={col.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', padding: '0 0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{col.label}</span>
                    <span style={{ marginLeft: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 999, padding: '0.1rem 0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{colTasks.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                    {colTasks.map(task => (
                      <div key={task.id} className="card" style={{ padding: '0.875rem', cursor: 'pointer' }} onClick={() => { setForm({ ...task }); setEditing(task.id); setModal(true) }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, flex: 1 }}>{task.title}</div>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: priorityColor[task.priority] || '#94a3b8', flexShrink: 0, marginLeft: '0.5rem', marginTop: 3 }}></div>
                        </div>
                        {task.clients?.name && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>👤 {task.clients.name}</div>}
                        {task.due_date && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>📅 {new Date(task.due_date).toLocaleDateString('en-IN')}</div>}
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {columns.filter(c => c.id !== col.id).map(c => (
                            <button key={c.id} onClick={e => { e.stopPropagation(); updateStatus(task.id, c.id) }} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text-muted)', fontFamily: 'inherit' }}>
                              → {c.label}
                            </button>
                          ))}
                          <button onClick={e => { e.stopPropagation(); del(task.id) }} style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-red)', fontFamily: 'inherit', marginLeft: 'auto' }}>🗑</button>
                        </div>
                      </div>
                    ))}
                    {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem', color: 'var(--text-muted)', fontSize: '0.78rem', borderRadius: 8, border: '1px dashed var(--border)' }}>No tasks</div>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="card">
            <div className="table-container">
              <table>
                <thead><tr><th>Task</th><th>Client</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Assigned</th><th>Actions</th></tr></thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>Loading...</td></tr>
                  : tasks.map(task => (
                    <tr key={task.id}>
                      <td style={{ fontWeight:600, color:'var(--text-primary)' }}>{task.title}</td>
                      <td>{task.clients?.name || '—'}</td>
                      <td><span style={{ color: priorityColor[task.priority] || '#94a3b8', fontWeight:600, fontSize:'0.8rem', textTransform:'capitalize' }}>● {task.priority}</span></td>
                      <td><span className={`badge ${columns.find(c=>c.id===task.status)?.badge || 'badge-gray'}`}>{task.status.replace('_',' ')}</span></td>
                      <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{task.assigned_to || '—'}</td>
                      <td><div style={{ display:'flex', gap:'0.5rem' }}>
                        <button className="btn-secondary" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => { setForm({...task}); setEditing(task.id); setModal(true) }}>Edit</button>
                        <button className="btn-danger" style={{ padding:'0.3rem 0.75rem', fontSize:'0.75rem' }} onClick={() => del(task.id)}>Del</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'1rem', fontWeight:700 }}>{editing ? 'Edit Task' : 'Add Task'}</h2>
              <button onClick={() => setModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div><label>Title *</label><input className="input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} /></div>
              <div><label>Client</label>
                <select className="input" value={form.client_id} onChange={e => setForm(f => ({...f, client_id: e.target.value}))}>
                  <option value="">Select client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label>Description</label><textarea className="input" value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} /></div>
              <div className="grid-2">
                <div><label>Priority</label>
                  <select className="input" value={form.priority} onChange={e => setForm(f => ({...f, priority: e.target.value}))}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div><label>Status</label>
                  <select className="input" value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))}>
                    {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid-2">
                <div><label>Due Date</label><input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({...f, due_date: e.target.value}))} /></div>
                <div><label>Assigned To</label><input className="input" value={form.assigned_to} onChange={e => setForm(f => ({...f, assigned_to: e.target.value}))} /></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={save} disabled={saving||!form.title}>{saving ? 'Saving...' : editing ? 'Update' : 'Add Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

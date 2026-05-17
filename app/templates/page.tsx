'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Templates() {
  const [templates, setTemplates] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [applyModal, setApplyModal] = useState<any>(null)
  const [selectedClient, setSelectedClient] = useState('')
  const [applying, setApplying] = useState(false)
  const [success, setSuccess] = useState('')

  const load = async () => {
    const [t, c] = await Promise.all([
      supabase.from('task_templates').select('*').order('service'),
      supabase.from('clients').select('id, name')
    ])
    setTemplates(t.data || [])
    setClients(c.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const applyTemplate = async () => {
    if (!selectedClient || !applyModal) return
    setApplying(true)
    const tasks = (applyModal.tasks || []).map((t: any) => {
      const due = new Date()
      due.setDate(due.getDate() + (t.days || 7))
      return {
        client_id: selectedClient,
        title: t.title,
        priority: t.priority || 'medium',
        status: 'todo',
        due_date: due.toISOString().split('T')[0],
        assigned_to: 'Dipesh Parmar'
      }
    })
    await supabase.from('tasks').insert(tasks)
    setApplying(false)
    setApplyModal(null)
    setSelectedClient('')
    setSuccess(`✅ ${tasks.length} tasks created from "${applyModal.name}" template!`)
    setTimeout(() => setSuccess(''), 4000)
  }

  const serviceColors: Record<string, string> = { SEO: '#34a853', 'Google Ads': '#ea4335', 'Meta Ads': '#1877f2', 'Social Media': '#e1306c', 'Web Development': '#6366f1', 'Email Marketing': '#06b6d4' }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📋 Task Templates</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Apply standard task sets to any client instantly</div>
        </div>
      </div>

      <div className="page">
        {success && (
          <div className="flag-success" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--accent-green)' }}>{success}</div>
          </div>
        )}

        <div style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          💡 <strong>How it works:</strong> Select a template → Choose a client → All tasks auto-created with due dates. Perfect for onboarding new clients!
        </div>

        <div className="grid-2">
          {loading ? [1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200 }}></div>)
          : templates.map(tmpl => {
            const color = serviceColors[tmpl.service] || 'var(--accent-orange)'
            const tasks = tmpl.tasks || []
            return (
              <div key={tmpl.id} className="card" style={{ borderTop: `3px solid ${color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{tmpl.name}</div>
                    <span style={{ display: 'inline-block', marginTop: '0.25rem', padding: '0.15rem 0.5rem', borderRadius: 999, background: `${color}15`, color, fontSize: '0.68rem', fontWeight: 700 }}>{tmpl.service}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color }}>{tasks.length}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>tasks</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '0.875rem' }}>
                  {tasks.slice(0, 5).map((t: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: t.priority === 'high' ? 'var(--accent-red)' : t.priority === 'medium' ? 'var(--accent-orange)' : 'var(--accent-green)', flexShrink: 0 }}></div>
                      <span style={{ flex: 1 }}>{t.title}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', whiteSpace: 'nowrap' }}>Day {t.days}</span>
                    </div>
                  ))}
                  {tasks.length > 5 && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', paddingLeft: '0.875rem' }}>+{tasks.length - 5} more tasks...</div>}
                </div>
                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setApplyModal(tmpl)}>
                  🚀 Apply to Client
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {applyModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setApplyModal(null)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🚀 Apply Template: {applyModal.name}</h2>
              <button onClick={() => setApplyModal(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 8, padding: '0.875rem', marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              This will create <strong style={{ color: 'var(--accent-orange)' }}>{(applyModal.tasks || []).length} tasks</strong> with due dates starting from today, all assigned to <strong>Dipesh Parmar</strong>.
            </div>
            <div><label>Select Client *</label>
              <select className="input" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">Choose client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginTop: '1rem', maxHeight: 200, overflowY: 'auto' }}>
              {(applyModal.tasks || []).map((t: any, i: number) => {
                const due = new Date(); due.setDate(due.getDate() + (t.days || 7))
                return (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', padding: '0.375rem 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{t.title}</span>
                    <span style={{ color: 'var(--text-muted)' }}>Due: {due.toLocaleDateString('en-IN')}</span>
                  </div>
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setApplyModal(null)}>Cancel</button>
              <button className="btn-primary" onClick={applyTemplate} disabled={applying || !selectedClient}>{applying ? 'Creating tasks...' : `🚀 Create ${(applyModal.tasks || []).length} Tasks`}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

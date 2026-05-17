'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Workload() {
  const [team, setTeam] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [timeLogs, setTimeLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('team_members').select('*').eq('status', 'active'),
      supabase.from('tasks').select('*, clients(name)').neq('status', 'done'),
      supabase.from('time_logs').select('*')
    ]).then(([t, tk, tl]) => {
      setTeam(t.data || [])
      setTasks(tk.data || [])
      setTimeLogs(tl.data || [])
      setLoading(false)
    })
  }, [])

  const getMemberData = (name: string) => {
    const memberTasks = tasks.filter(t => t.assigned_to === name)
    const high = memberTasks.filter(t => t.priority === 'high').length
    const overdue = memberTasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).length
    const hours = timeLogs.filter(l => l.logged_by === name).reduce((s, l) => s + (l.hours || 0), 0)
    const load = Math.min(Math.round((memberTasks.length / 10) * 100), 100)
    return { tasks: memberTasks, high, overdue, hours, load }
  }

  const loadColor = (pct: number) => pct >= 80 ? 'var(--accent-red)' : pct >= 60 ? 'var(--accent-orange)' : 'var(--accent-green)'
  const loadLabel = (pct: number) => pct >= 80 ? '🔴 Overloaded' : pct >= 60 ? '🟡 Busy' : '🟢 Available'

  const unassigned = tasks.filter(t => !t.assigned_to || t.assigned_to === '')

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⚖️ Workload View</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Team capacity & task distribution</div>
        </div>
      </div>

      <div className="page">
        {unassigned.length > 0 && (
          <div className="flag-warning" style={{ marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: '0.4rem' }}>⚠️ {unassigned.length} Unassigned Tasks</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>These tasks have no team member assigned: {unassigned.slice(0, 3).map(t => t.title).join(', ')}{unassigned.length > 3 ? ` +${unassigned.length - 3} more` : ''}</div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '1rem' }}>
          {loading ? [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 150 }}></div>)
          : team.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
              <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No team members yet</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add team members in Settings → Team & Roles</div>
            </div>
          ) : team.map(member => {
            const data = getMemberData(member.name)
            const roleColors: Record<string, string> = { owner: '#f59e0b', admin: '#8b5cf6', manager: '#3b82f6', analyst: '#06b6d4', viewer: '#94a3b8' }
            return (
              <div key={member.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  {/* Avatar */}
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${roleColors[member.role] || '#94a3b8'}20`, border: `2px solid ${roleColors[member.role] || '#94a3b8'}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: roleColors[member.role] || '#94a3b8', fontSize: '1rem', flexShrink: 0 }}>
                    {member.name?.charAt(0)}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.625rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{member.name}</span>
                        <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', color: roleColors[member.role], fontWeight: 600, textTransform: 'capitalize' }}>{member.role}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Tasks: <strong style={{ color: 'var(--text-primary)' }}>{data.tasks.length}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>High: <strong style={{ color: 'var(--accent-red)' }}>{data.high}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Overdue: <strong style={{ color: data.overdue > 0 ? 'var(--accent-red)' : 'var(--text-primary)' }}>{data.overdue}</strong></span>
                        <span style={{ color: 'var(--text-muted)' }}>Hours: <strong style={{ color: 'var(--accent-orange)' }}>{data.hours}h</strong></span>
                      </div>
                    </div>

                    {/* Workload bar */}
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', marginBottom: '0.3rem' }}>
                        <span style={{ color: 'var(--text-muted)' }}>Workload</span>
                        <span style={{ color: loadColor(data.load), fontWeight: 700 }}>{loadLabel(data.load)} · {data.load}%</span>
                      </div>
                      <div className="progress-bar" style={{ height: 8 }}>
                        <div className="progress-fill" style={{ width: `${data.load}%`, background: loadColor(data.load) }}></div>
                      </div>
                    </div>

                    {/* Tasks */}
                    {data.tasks.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {data.tasks.slice(0, 6).map(t => {
                          const overdue = t.due_date && new Date(t.due_date) < new Date()
                          return (
                            <div key={t.id} style={{ padding: '0.25rem 0.6rem', borderRadius: 6, background: overdue ? 'rgba(239,68,68,0.1)' : t.priority === 'high' ? 'rgba(249,115,22,0.08)' : 'var(--bg-secondary)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.2)' : t.priority === 'high' ? 'rgba(249,115,22,0.2)' : 'var(--border)'}`, fontSize: '0.68rem', color: overdue ? 'var(--accent-red)' : t.priority === 'high' ? 'var(--accent-orange)' : 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {overdue ? '⚠️ ' : ''}{t.title}
                            </div>
                          )
                        })}
                        {data.tasks.length > 6 && <div style={{ padding: '0.25rem 0.6rem', fontSize: '0.68rem', color: 'var(--text-muted)' }}>+{data.tasks.length - 6} more</div>}
                      </div>
                    )}
                    {data.tasks.length === 0 && <div style={{ fontSize: '0.78rem', color: 'var(--accent-green)' }}>✅ No pending tasks — available for new work!</div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add owner */}
        {team.length === 0 && (
          <div className="card" style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: 'white', fontSize: '1rem', flexShrink: 0 }}>DP</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Dipesh Parmar <span style={{ color: 'var(--accent-orange)', fontSize: '0.72rem' }}>👑 Owner</span></div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Managing all tasks across {tasks.length} open items</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

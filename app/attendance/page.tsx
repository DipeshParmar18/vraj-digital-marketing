'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function Attendance() {
  const [team, setTeam] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'attendance'|'leaves'>('attendance')
  const [leaveModal, setLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({ member_id: '', type: 'casual', from_date: '', to_date: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    const [t, a, l] = await Promise.all([
      supabase.from('team_members').select('*').eq('status', 'active'),
      supabase.from('attendance').select('*, team_members(name)').eq('date', today),
      supabase.from('leaves').select('*, team_members(name)').order('created_at', { ascending: false })
    ])
    setTeam(t.data || [])
    setAttendance(a.data || [])
    setLeaves(l.data || [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const markAttendance = async (memberId: string, status: string) => {
    const existing = attendance.find(a => a.member_id === memberId)
    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({ member_id: memberId, date: today, status, check_in: new Date().toTimeString().slice(0,5) })
    }
    load()
  }

  const saveLeave = async () => {
    setSaving(true)
    await supabase.from('leaves').insert(leaveForm)
    setSaving(false); setLeaveModal(false); setLeaveForm({ member_id: '', type: 'casual', from_date: '', to_date: '', reason: '' }); load()
  }

  const updateLeaveStatus = async (id: string, status: string, approved_by: string) => {
    await supabase.from('leaves').update({ status, approved_by }).eq('id', id)
    load()
  }

  const statusColor: Record<string,string> = { present: 'var(--accent-green)', absent: 'var(--accent-red)', half_day: 'var(--accent-orange)', wfh: 'var(--accent-blue)', leave: 'var(--accent-purple)' }
  const present = attendance.filter(a => a.status === 'present').length

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>👥 Attendance & Leave</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Today: {present}/{team.length} present · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 7, overflow: 'hidden' }}>
            {(['attendance','leaves'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '0.4rem 0.875rem', background: tab===t?'rgba(249,115,22,0.15)':'transparent', color: tab===t?'var(--accent-orange)':'var(--text-muted)', border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, fontFamily: 'inherit', textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
          <button className="btn-primary" onClick={() => setLeaveModal(true)}>+ Leave Request</button>
        </div>
      </div>

      <div className="page">
        {tab === 'attendance' && (
          <div>
            <div className="grid-4" style={{ marginBottom: '1.25rem' }}>
              {[
                { label: 'Present', value: attendance.filter(a=>a.status==='present').length, color: 'var(--accent-green)' },
                { label: 'Absent', value: team.length - attendance.length, color: 'var(--accent-red)' },
                { label: 'WFH', value: attendance.filter(a=>a.status==='wfh').length, color: 'var(--accent-blue)' },
                { label: 'On Leave', value: attendance.filter(a=>a.status==='leave').length, color: 'var(--accent-purple)' },
              ].map((s,i) => (
                <div key={i} className="stat-card">
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>{s.label}</div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>📋 Today's Attendance — {new Date().toLocaleDateString('en-IN')}</div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {loading ? <div className="skeleton" style={{ height: 80 }}></div>
                : team.map(member => {
                  const att = attendance.find(a => a.member_id === member.id)
                  const status = att?.status || 'not_marked'
                  return (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 10, border: '1px solid var(--border)' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-orange), var(--accent-blue))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.875rem', flexShrink: 0 }}>
                        {member.name?.charAt(0)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{member.name}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{member.role} {att?.check_in ? `· In: ${att.check_in}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        {['present','absent','wfh','half_day','leave'].map(s => (
                          <button key={s} onClick={() => markAttendance(member.id, s)}
                            style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: `1px solid ${status===s?statusColor[s]:'var(--border)'}`, background: status===s?`${statusColor[s]}15`:'transparent', color: status===s?statusColor[s]:'var(--text-muted)', cursor: 'pointer', fontSize: '0.68rem', fontWeight: status===s?700:400, fontFamily: 'inherit', textTransform: 'capitalize' }}>
                            {s.replace('_',' ')}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'leaves' && (
          <div className="card">
            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', marginBottom: '1rem' }}>🌴 Leave Requests</div>
            {leaves.length === 0 ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No leave requests yet</div>
            : <div className="table-container"><table>
              <thead><tr><th>Member</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {leaves.map(l => {
                  const days = l.from_date && l.to_date ? Math.ceil((new Date(l.to_date).getTime() - new Date(l.from_date).getTime()) / (1000*60*60*24)) + 1 : 1
                  return (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{l.team_members?.name}</td>
                      <td><span className="badge badge-blue" style={{ textTransform: 'capitalize' }}>{l.type}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.from_date ? new Date(l.from_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{l.to_date ? new Date(l.to_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{days}d</td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{l.reason || '—'}</td>
                      <td><span className={`badge badge-${l.status==='approved'?'green':l.status==='rejected'?'red':'orange'}`}>{l.status}</span></td>
                      <td>
                        {l.status === 'pending' && (
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            <button onClick={() => updateLeaveStatus(l.id, 'approved', 'Dipesh Parmar')} style={{ fontSize: '0.68rem', padding: '0.25rem 0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 4, cursor: 'pointer', color: '#10b981', fontFamily: 'inherit' }}>✅ Approve</button>
                            <button onClick={() => updateLeaveStatus(l.id, 'rejected', 'Dipesh Parmar')} style={{ fontSize: '0.68rem', padding: '0.25rem 0.4rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 4, cursor: 'pointer', color: 'var(--accent-red)', fontFamily: 'inherit' }}>❌ Reject</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table></div>}
          </div>
        )}
      </div>

      {leaveModal && (
        <div className="modal-overlay" onClick={e => e.target===e.currentTarget && setLeaveModal(false)}>
          <div className="modal">
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <h2 style={{ fontSize:'0.95rem', fontWeight:700 }}>🌴 Leave Request</h2>
              <button onClick={() => setLeaveModal(false)} style={{ background:'none', border:'none', color:'var(--text-muted)', cursor:'pointer', fontSize:'1.5rem', lineHeight:1 }}>×</button>
            </div>
            <div style={{ display:'grid', gap:'0.875rem' }}>
              <div><label>Team Member *</label>
                <select className="input" value={leaveForm.member_id} onChange={e => setLeaveForm(f => ({...f, member_id: e.target.value}))}>
                  <option value="">Select member</option>
                  {team.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div><label>Leave Type</label>
                <select className="input" value={leaveForm.type} onChange={e => setLeaveForm(f => ({...f, type: e.target.value}))}>
                  <option value="casual">Casual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="earned">Earned Leave</option>
                  <option value="emergency">Emergency</option>
                  <option value="wfh">Work From Home</option>
                </select>
              </div>
              <div className="grid-2">
                <div><label>From Date</label><input className="input" type="date" value={leaveForm.from_date} onChange={e => setLeaveForm(f => ({...f, from_date: e.target.value}))} /></div>
                <div><label>To Date</label><input className="input" type="date" value={leaveForm.to_date} onChange={e => setLeaveForm(f => ({...f, to_date: e.target.value}))} /></div>
              </div>
              <div><label>Reason</label><textarea className="input" value={leaveForm.reason} onChange={e => setLeaveForm(f => ({...f, reason: e.target.value}))} /></div>
            </div>
            <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem', justifyContent:'flex-end' }}>
              <button className="btn-secondary" onClick={() => setLeaveModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveLeave} disabled={saving||!leaveForm.member_id||!leaveForm.from_date}>{saving?'Saving...':'Submit Request'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

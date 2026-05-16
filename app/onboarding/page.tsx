'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const DEFAULT_CHECKLIST = [
  { item: 'Kickoff call scheduled', category: 'kickoff' },
  { item: 'Contract signed', category: 'legal' },
  { item: 'Invoice / advance payment received', category: 'finance' },
  { item: 'Google Analytics 4 access received', category: 'access' },
  { item: 'Google Search Console access received', category: 'access' },
  { item: 'Google Ads account access received', category: 'access' },
  { item: 'Meta Business Suite access received', category: 'access' },
  { item: 'Website login credentials received', category: 'access' },
  { item: 'Brand logo & assets received', category: 'brand' },
  { item: 'Brand guidelines document received', category: 'brand' },
  { item: 'Target audience brief received', category: 'brief' },
  { item: 'Competitor list received', category: 'brief' },
  { item: 'Monthly goals agreed upon', category: 'brief' },
  { item: 'Reporting format agreed', category: 'reporting' },
  { item: 'WhatsApp group created', category: 'communication' },
]

const PLATFORMS = ['Google Ads', 'Meta Business', 'Google Analytics', 'Search Console', 'Website CMS', 'Hosting', 'Domain Registrar', 'Instagram', 'Facebook', 'LinkedIn', 'YouTube', 'Other']

export default function Onboarding() {
  const [clients, setClients] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState('')
  const [checklist, setChecklist] = useState<any[]>([])
  const [credentials, setCredentials] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState<'checklist' | 'credentials'>('checklist')
  const [credModal, setCredModal] = useState(false)
  const [credForm, setCredForm] = useState({ platform: 'Google Ads', label: '', username: '', password: '', url: '', notes: '' })
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.from('clients').select('id, name, company').then(({ data }) => setClients(data || []))
  }, [])

  useEffect(() => {
    if (!selectedClient) return
    setLoading(true)
    Promise.all([
      supabase.from('onboarding_checklists').select('*').eq('client_id', selectedClient).order('created_at'),
      supabase.from('credentials').select('*').eq('client_id', selectedClient).order('platform')
    ]).then(([cl, cr]) => {
      setChecklist(cl.data || [])
      setCredentials(cr.data || [])
      setLoading(false)
    })
  }, [selectedClient])

  const initChecklist = async () => {
    const items = DEFAULT_CHECKLIST.map(item => ({ ...item, client_id: selectedClient, completed: false }))
    await supabase.from('onboarding_checklists').insert(items)
    const { data } = await supabase.from('onboarding_checklists').select('*').eq('client_id', selectedClient)
    setChecklist(data || [])
  }

  const toggleItem = async (id: string, completed: boolean) => {
    await supabase.from('onboarding_checklists').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', id)
    setChecklist(c => c.map(item => item.id === id ? { ...item, completed, completed_at: completed ? new Date().toISOString() : null } : item))
  }

  const saveCred = async () => {
    setSaving(true)
    await supabase.from('credentials').insert({ ...credForm, client_id: selectedClient })
    setSaving(false); setCredModal(false); setCredForm({ platform: 'Google Ads', label: '', username: '', password: '', url: '', notes: '' })
    const { data } = await supabase.from('credentials').select('*').eq('client_id', selectedClient)
    setCredentials(data || [])
  }

  const delCred = async (id: string) => {
    if (!confirm('Delete credential?')) return
    await supabase.from('credentials').delete().eq('id', id)
    setCredentials(c => c.filter(cr => cr.id !== id))
  }

  const completed = checklist.filter(i => i.completed).length
  const pct = checklist.length ? Math.round((completed / checklist.length) * 100) : 0
  const categories = [...new Set(checklist.map(i => i.category))]

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🚀 Client Onboarding</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Checklists & credential vault</div>
        </div>
      </div>

      <div className="page">
        {/* Client Selector */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label>Select Client to Onboard</label>
              <select className="input" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}>
                <option value="">Choose client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `— ${c.company}` : ''}</option>)}
              </select>
            </div>
            {selectedClient && checklist.length === 0 && (
              <button className="btn-primary" onClick={initChecklist} style={{ marginTop: '1.25rem' }}>🚀 Start Onboarding</button>
            )}
            {selectedClient && checklist.length > 0 && (
              <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: pct === 100 ? 'var(--accent-green)' : 'var(--accent-orange)' }}>{pct}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{completed}/{checklist.length} done</div>
              </div>
            )}
          </div>
          {selectedClient && checklist.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <div className="progress-bar" style={{ height: 8 }}>
                <div className="progress-fill" style={{ width: `${pct}%`, background: pct === 100 ? 'var(--accent-green)' : 'var(--accent-orange)' }}></div>
              </div>
            </div>
          )}
        </div>

        {selectedClient && (
          <>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.25rem', width: 'fit-content' }}>
              {(['checklist', 'credentials'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding: '0.45rem 1.25rem', borderRadius: 6, border: 'none', background: tab === t ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(37,99,235,0.1))' : 'transparent', color: tab === t ? 'var(--accent-orange)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, fontFamily: 'inherit' }}>
                  {t === 'checklist' ? `✅ Checklist (${completed}/${checklist.length})` : `🔑 Credentials (${credentials.length})`}
                </button>
              ))}
            </div>

            {tab === 'checklist' && checklist.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🚀</div>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>No checklist yet</div>
                <button className="btn-primary" onClick={initChecklist}>Start Onboarding →</button>
              </div>
            )}

            {tab === 'checklist' && checklist.length > 0 && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {categories.map(cat => {
                  const catItems = checklist.filter(i => i.category === cat)
                  const catDone = catItems.filter(i => i.completed).length
                  return (
                    <div key={cat} className="card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>{cat}</div>
                        <span className={`badge badge-${catDone === catItems.length ? 'green' : 'orange'}`}>{catDone}/{catItems.length}</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {catItems.map(item => (
                          <div key={item.id} onClick={() => toggleItem(item.id, !item.completed)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.625rem 0.875rem', background: item.completed ? 'rgba(16,185,129,0.06)' : 'var(--bg-secondary)', border: `1px solid ${item.completed ? 'rgba(16,185,129,0.2)' : 'var(--border)'}`, borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s' }}>
                            <div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${item.completed ? 'var(--accent-green)' : 'var(--border)'}`, background: item.completed ? 'var(--accent-green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                              {item.completed && <span style={{ color: 'white', fontSize: '0.75rem', fontWeight: 700 }}>✓</span>}
                            </div>
                            <span style={{ fontSize: '0.82rem', color: item.completed ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: item.completed ? 'line-through' : 'none', flex: 1 }}>{item.item}</span>
                            {item.completed && item.completed_at && <span style={{ fontSize: '0.68rem', color: 'var(--accent-green)' }}>{new Date(item.completed_at).toLocaleDateString('en-IN')}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {tab === 'credentials' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', borderRadius: 8, padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-secondary)', flex: 1, marginRight: '1rem' }}>
                    🔒 Credentials are stored securely in your private Supabase database. Only you and your team can access them.
                  </div>
                  <button className="btn-primary" onClick={() => setCredModal(true)}>+ Add Credential</button>
                </div>
                {credentials.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔑</div>
                    No credentials stored yet
                  </div>
                ) : (
                  <div className="grid-2">
                    {credentials.map(cred => (
                      <div key={cred.id} className="card" style={{ position: 'relative' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>{cred.platform}</div>
                            {cred.label && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{cred.label}</div>}
                          </div>
                          <button onClick={() => delCred(cred.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}>🗑</button>
                        </div>
                        {cred.url && <div style={{ fontSize: '0.72rem', marginBottom: '0.5rem' }}><a href={cred.url} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-blue)' }}>{cred.url}</a></div>}
                        {cred.username && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Username:</span>
                            <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{cred.username}</span>
                          </div>
                        )}
                        {cred.password && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', alignItems: 'center' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Password:</span>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'monospace' }}>{showPasswords[cred.id] ? cred.password : '••••••••'}</span>
                              <button onClick={() => setShowPasswords(p => ({ ...p, [cred.id]: !p[cred.id] }))} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.75rem' }}>{showPasswords[cred.id] ? '🙈' : '👁'}</button>
                              <button onClick={() => navigator.clipboard.writeText(cred.password)} style={{ background: 'none', border: 'none', color: 'var(--accent-orange)', cursor: 'pointer', fontSize: '0.72rem' }}>📋</button>
                            </div>
                          </div>
                        )}
                        {cred.notes && <div style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.4rem 0.6rem', borderRadius: 6 }}>{cred.notes}</div>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {credModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setCredModal(false)}>
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 700 }}>🔑 Add Credential</h2>
              <button onClick={() => setCredModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              <div className="grid-2">
                <div><label>Platform *</label>
                  <select className="input" value={credForm.platform} onChange={e => setCredForm(f => ({ ...f, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div><label>Label</label><input className="input" value={credForm.label} onChange={e => setCredForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. Main account" /></div>
              </div>
              <div><label>URL</label><input className="input" value={credForm.url} onChange={e => setCredForm(f => ({ ...f, url: e.target.value }))} placeholder="https://..." /></div>
              <div className="grid-2">
                <div><label>Username / Email</label><input className="input" value={credForm.username} onChange={e => setCredForm(f => ({ ...f, username: e.target.value }))} /></div>
                <div><label>Password</label><input className="input" type="password" value={credForm.password} onChange={e => setCredForm(f => ({ ...f, password: e.target.value }))} /></div>
              </div>
              <div><label>Notes</label><textarea className="input" value={credForm.notes} onChange={e => setCredForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes..." /></div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setCredModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveCred} disabled={saving}>{saving ? 'Saving...' : 'Save Credential'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

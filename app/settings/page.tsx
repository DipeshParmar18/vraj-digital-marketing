'use client'
import { useState } from 'react'

export default function Settings() {
  const [agency, setAgency] = useState({ name: 'Vraj Digital Marketing', email: 'vraj@example.com', phone: '+91 98765 43210', address: 'Rajkot, Gujarat, India', website: 'https://vrajdigital.com', gst: '', currency: 'INR' })
  const [saved, setSaved] = useState(false)

  const save = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>⚙️ Settings</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure your agency profile</div>
        </div>
      </div>
      <div className="page">
        <div style={{ maxWidth: 600 }}>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>🏢 Agency Profile</div>
            <div style={{ display: 'grid', gap: '0.875rem' }}>
              {[['Agency Name', 'name'], ['Email', 'email'], ['Phone', 'phone'], ['Website', 'website'], ['GST Number', 'gst'], ['Address', 'address']].map(([lbl, key]) => (
                <div key={key}>
                  <label>{lbl}</label>
                  <input className="input" value={(agency as any)[key]} onChange={e => setAgency(a => ({ ...a, [key]: e.target.value }))} />
                </div>
              ))}
              <div><label>Currency</label>
                <select className="input" value={agency.currency} onChange={e => setAgency(a => ({ ...a, currency: e.target.value }))}>
                  <option value="INR">INR (₹) - Indian Rupee</option>
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                </select>
              </div>
            </div>
            <button className="btn-primary" onClick={save} style={{ marginTop: '1.25rem' }}>
              {saved ? '✅ Saved!' : '💾 Save Settings'}
            </button>
          </div>

          <div className="card">
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>🔑 Environment Variables</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.7, background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, fontFamily: 'monospace' }}>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}># Add these to your .env.local or Vercel environment</div>
              <div>NEXT_PUBLIC_SUPABASE_URL=your_url</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key</div>
              <div>ANTHROPIC_API_KEY=sk-ant-...</div>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
              💡 Go to <strong style={{ color: 'var(--accent-blue)' }}>Integrations</strong> page to connect Google Ads, Meta Ads, and other platforms.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

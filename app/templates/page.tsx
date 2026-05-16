'use client'
export default function Page() {
  return (
    <div>
      <div className="topbar"><div style={{ fontWeight:700, color:'var(--text-primary)' }}>🚧 Coming Soon</div></div>
      <div className="page">
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚧</div>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)', marginBottom:'0.5rem' }}>Module Coming Soon</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>This module is being built and will be available in the next update.</div>
        </div>
      </div>
    </div>
  )
}

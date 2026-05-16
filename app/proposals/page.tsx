'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const titles: Record<string,string> = {
  proposals: '📄 Proposals',
  contracts: '📝 Contracts',
  templates: '📋 Task Templates',
  workload: '⚖️ Workload View',
  forecast: '🔮 Revenue Forecast',
}

export default function Page() {
  const path = typeof window !== 'undefined' ? window.location.pathname.replace('/','') : 'proposals'
  return (
    <div>
      <div className="topbar">
        <div style={{ fontWeight:700, color:'var(--text-primary)' }}>{titles[path] || 'proposals'}</div>
      </div>
      <div className="page">
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚧</div>
          <div style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)', marginBottom:'0.5rem' }}>Coming Very Soon</div>
          <div style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>This module is being built. Check back after the next deployment.</div>
        </div>
      </div>
    </div>
  )
}

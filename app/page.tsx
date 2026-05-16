'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [stats, setStats] = useState({ clients: 0, campaigns: 0, leads: 0, revenue: 0, tasks: 0, invoices: 0 })
  const [clients, setClients] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [c, camp, l, inv, t] = await Promise.all([
        supabase.from('clients').select('*'),
        supabase.from('campaigns').select('*'),
        supabase.from('leads').select('*'),
        supabase.from('invoices').select('*'),
        supabase.from('tasks').select('*').eq('status', 'todo').limit(5),
      ])
      const revenue = (inv.data || []).filter(i => i.status === 'paid').reduce((s: number, i: any) => s + i.amount, 0)
      setStats({
        clients: c.data?.length || 0,
        campaigns: camp.data?.length || 0,
        leads: l.data?.length || 0,
        revenue,
        tasks: t.data?.length || 0,
        invoices: (inv.data || []).filter(i => i.status === 'pending').length
      })
      setClients(c.data?.slice(0, 5) || [])
      setTasks(t.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const statCards = [
    { label: 'Total Clients', value: stats.clients, color: '#3b82f6', icon: '👥', href: '/clients' },
    { label: 'Active Campaigns', value: stats.campaigns, color: '#8b5cf6', icon: '📢', href: '/google-ads' },
    { label: 'Total Leads', value: stats.leads, color: '#06b6d4', icon: '⚡', href: '/leads' },
    { label: 'Revenue (Paid)', value: `₹${stats.revenue.toLocaleString()}`, color: '#10b981', icon: '💰', href: '/invoices' },
    { label: 'Pending Tasks', value: stats.tasks, color: '#f59e0b', icon: '📁', href: '/projects' },
    { label: 'Pending Invoices', value: stats.invoices, color: '#ef4444', icon: '🧾', href: '/invoices' },
  ]

  const quickActions = [
    { label: 'Add Client', href: '/clients', icon: '👥', color: '#3b82f6' },
    { label: 'New Campaign', href: '/google-ads', icon: '🎯', color: '#8b5cf6' },
    { label: 'Create Invoice', href: '/invoices', icon: '🧾', color: '#10b981' },
    { label: 'AI Content', href: '/ai-content', icon: '🤖', color: '#06b6d4' },
    { label: 'Add Lead', href: '/leads', icon: '⚡', color: '#f59e0b' },
    { label: 'SEO Report', href: '/seo', icon: '🔍', color: '#ef4444' },
  ]

  return (
    <div>
      {/* Topbar */}
      <div className="topbar">
        <div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Dashboard</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Welcome back, Vraj 👋</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
      </div>

      <div className="page">
        {/* Hero Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              <span className="gradient-text">Vraj Digital Marketing</span>
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Complete marketing operations platform — all in one place</div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link href="/integrations" className="btn-primary">🔌 Connect APIs</Link>
            <Link href="/ai-content" className="btn-secondary">🤖 AI Content</Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
          {statCards.map((s, i) => (
            <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{s.label}</div>
                    <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{loading ? '—' : s.value}</div>
                  </div>
                  <div style={{ fontSize: '1.75rem' }}>{s.icon}</div>
                </div>
                <div style={{ marginTop: '0.75rem', height: 3, background: 'var(--border)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: '60%', background: s.color, borderRadius: 999, opacity: 0.7 }}></div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
          {/* Quick Actions */}
          <div className="card">
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>⚡ Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              {quickActions.map((a, i) => (
                <Link key={i} href={a.href} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.875rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = a.color; (e.currentTarget as HTMLElement).style.background = `${a.color}15` }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.background = 'var(--bg-secondary)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>{a.icon}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{a.label}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Clients */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>👥 Recent Clients</div>
              <Link href="/clients" style={{ fontSize: '0.75rem', color: 'var(--accent-blue)', textDecoration: 'none' }}>View all →</Link>
            </div>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, marginBottom: 8 }}></div>)
            ) : clients.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>No clients yet. <Link href="/clients" style={{ color: 'var(--accent-blue)' }}>Add one →</Link></div>
            ) : clients.map(c => (
              <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.company}</div>
                </div>
                <span className={`badge badge-${c.status === 'active' ? 'green' : 'gray'}`}>{c.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Modules Grid */}
        <div className="card">
          <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>🚀 All Modules</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '0.75rem' }}>
            {[
              { label: 'Google Ads', icon: '🎯', href: '/google-ads', color: '#ea4335' },
              { label: 'Meta Ads', icon: '📘', href: '/meta-ads', color: '#1877f2' },
              { label: 'SEO Manager', icon: '🔍', href: '/seo', color: '#34a853' },
              { label: 'Email Marketing', icon: '✉️', href: '/email', color: '#06b6d4' },
              { label: 'Social Scheduler', icon: '📅', href: '/social', color: '#e1306c' },
              { label: 'WhatsApp', icon: '💬', href: '/whatsapp', color: '#25d366' },
              { label: 'AI Content', icon: '🤖', href: '/ai-content', color: '#8b5cf6' },
              { label: 'Leads & CRM', icon: '⚡', href: '/leads', color: '#f59e0b' },
              { label: 'Competitors', icon: '🌐', href: '/competitors', color: '#ef4444' },
              { label: 'Invoices', icon: '🧾', href: '/invoices', color: '#10b981' },
              { label: 'Proposals', icon: '📄', href: '/proposals', color: '#3b82f6' },
              { label: 'Budget', icon: '💰', href: '/budget', color: '#f97316' },
              { label: 'ROI Calc', icon: '📈', href: '/roi', color: '#06b6d4' },
              { label: 'Integrations', icon: '🔌', href: '/integrations', color: '#6366f1' },
              { label: 'Reports', icon: '📊', href: '/reports', color: '#14b8a6' },
            ].map((m, i) => (
              <Link key={i} href={m.href} style={{ textDecoration: 'none' }}>
                <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '1rem', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = m.color; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}>
                  <span style={{ fontSize: '1.25rem' }}>{m.icon}</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

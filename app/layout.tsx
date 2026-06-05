'use client'
import './globals.css'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navGroups = [
  { label: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: '▦' },
    { href: '/reports', label: 'Reports & P&L', icon: '📊' },
    { href: '/goals', label: 'Goal Tracking', icon: '🎯' },
    { href: '/flags', label: 'Flags & Alerts', icon: '🚩' },
  ]},
  { label: 'Sales', items: [
    { href: '/pipeline', label: 'Lead Pipeline', icon: '⚡' },
    { href: '/proposals', label: 'Proposals', icon: '📄' },
    { href: '/contracts', label: 'Contracts', icon: '📝' },
  ]},
  { label: 'Clients', items: [
    { href: '/clients', label: 'All Clients', icon: '👥' },
    { href: '/onboarding', label: 'Onboarding', icon: '🚀' },
  ]},
  { label: 'Delivery', items: [
    { href: '/projects', label: 'Projects', icon: '📁' },
    { href: '/tasks', label: 'Tasks', icon: '✅' },
    { href: '/templates', label: 'Task Templates', icon: '📋' },
  ]},
  { label: 'Marketing', items: [
    { href: '/google-ads', label: 'Google Ads', icon: '🎯' },
    { href: '/meta-ads', label: 'Meta Ads', icon: '📘' },
    { href: '/seo', label: 'SEO Manager', icon: '🔍' },
    { href: '/social', label: 'Social Scheduler', icon: '📅' },
    { href: '/email', label: 'Email Marketing', icon: '✉️' },
    { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  ]},
  { label: 'AI', items: [
    { href: '/ai-content', label: 'AI Content', icon: '🤖' },
    { href: '/seo-writer', label: 'SEO Article Writer', icon: '✍️' },
    { href: '/competitors', label: 'Competitors', icon: '🌐' },
  ]},
  { label: 'Team', items: [
    { href: '/settings', label: 'Team & Roles', icon: '👤' },
    { href: '/attendance', label: 'Attendance & Leave', icon: '📆' },
    { href: '/workload', label: 'Workload View', icon: '⚖️' },
  ]},
  { label: 'Finance', items: [
    { href: '/invoices', label: 'Invoices', icon: '🧾' },
    { href: '/expenses', label: 'Expenses', icon: '💸' },
    { href: '/budget', label: 'Budget Tracker', icon: '💰' },
    { href: '/roi', label: 'ROI Calculator', icon: '📈' },
    { href: '/forecast', label: 'Revenue Forecast', icon: '🔮' },
  ]},
  { label: 'System', items: [
    { href: '/integrations', label: 'Integrations', icon: '🔌' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
  ]},
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <head>
        <title>Vraj Digital Marketing Suite</title>
        <meta name="build" content="v1.2-seo-writer" />
      </head>
      <body>
        <aside className="sidebar">
          {/* Logo */}
          <div style={{ padding: '1rem 0.875rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem' }}>V</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Vraj Digital</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--accent-orange)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Marketing Suite</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '0.5rem 0.625rem', flex: 1, overflowY: 'auto' }}>
            {navGroups.map(group => (
              <div key={group.label} style={{ marginBottom: '0.75rem' }}>
                <div style={{ fontSize: '0.58rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.25rem', marginBottom: '0.15rem' }}>
                  {group.label}
                </div>
                {group.items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                      <span style={{ fontSize: '0.875rem', lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Owner badge */}
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 8, background: 'linear-gradient(135deg, rgba(249,115,22,0.1), rgba(37,99,235,0.08))', border: '1px solid rgba(249,115,22,0.2)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>DP</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dipesh Parmar</div>
                <div style={{ fontSize: '0.58rem', color: 'var(--accent-orange)', fontWeight: 700 }}>👑 OWNER</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}

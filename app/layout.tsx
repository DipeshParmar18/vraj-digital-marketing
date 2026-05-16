'use client'
import './globals.css'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navGroups = [
  { label: 'Core', items: [
    { href: '/', label: 'Dashboard', icon: '⊞' },
    { href: '/clients', label: 'Clients', icon: '👥' },
    { href: '/projects', label: 'Projects & Tasks', icon: '📁' },
    { href: '/reports', label: 'Reports', icon: '📊' },
  ]},
  { label: 'Marketing', items: [
    { href: '/google-ads', label: 'Google Ads', icon: '🎯' },
    { href: '/meta-ads', label: 'Meta Ads', icon: '📢' },
    { href: '/seo', label: 'SEO Manager', icon: '🔍' },
    { href: '/email', label: 'Email Marketing', icon: '✉️' },
    { href: '/social', label: 'Social Scheduler', icon: '📅' },
    { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  ]},
  { label: 'AI & Automation', items: [
    { href: '/ai-content', label: 'AI Content', icon: '🤖' },
    { href: '/leads', label: 'Leads & CRM', icon: '⚡' },
    { href: '/competitors', label: 'Competitor Tracker', icon: '🌐' },
  ]},
  { label: 'Business', items: [
    { href: '/invoices', label: 'Invoices', icon: '🧾' },
    { href: '/proposals', label: 'Proposals', icon: '📄' },
    { href: '/budget', label: 'Budget Tracker', icon: '💰' },
    { href: '/roi', label: 'ROI Calculator', icon: '📈' },
  ]},
  { label: 'System', items: [
    { href: '/integrations', label: 'Integrations', icon: '🔌' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ]},
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body>
        <aside className="sidebar">
          <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid var(--border)', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1rem' }}>V</span>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.2 }}>Vraj Digital</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Marketing Suite</div>
              </div>
            </div>
          </div>
          <nav style={{ padding: '0 0.75rem' }}>
            {navGroups.map(group => (
              <div key={group.label} style={{ marginBottom: '1rem' }}>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0.25rem', marginBottom: '0.25rem' }}>{group.label}</div>
                {group.items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                      <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>
          <div style={{ padding: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: 'white', fontWeight: 700, fontSize: '0.8rem' }}>V</span>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>Vraj Agency</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Admin</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}

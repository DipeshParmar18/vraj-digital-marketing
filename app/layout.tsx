'use client'
import './globals.css'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navGroups = [
  { label: 'Overview', items: [
    { href: '/', label: 'Dashboard', icon: '▦' },
    { href: '/clients', label: 'Clients', icon: '👥' },
    { href: '/projects', label: 'Projects & Tasks', icon: '📁' },
    { href: '/flags', label: 'Flags & Alerts', icon: '🚩' },
    { href: '/reports', label: 'Reports', icon: '📊' },
  ]},
  { label: 'Marketing', items: [
    { href: '/google-ads', label: 'Google Ads', icon: '🎯' },
    { href: '/meta-ads', label: 'Meta Ads', icon: '📘' },
    { href: '/seo', label: 'SEO Manager', icon: '🔍' },
    { href: '/email', label: 'Email Marketing', icon: '✉️' },
    { href: '/social', label: 'Social Scheduler', icon: '📅' },
    { href: '/whatsapp', label: 'WhatsApp', icon: '💬' },
  ]},
  { label: 'AI & Leads', items: [
    { href: '/ai-content', label: 'AI Content', icon: '🤖' },
    { href: '/leads', label: 'Leads & CRM', icon: '⚡' },
    { href: '/competitors', label: 'Competitors', icon: '🌐' },
  ]},
  { label: 'Finance', items: [
    { href: '/invoices', label: 'Invoices', icon: '🧾' },
    { href: '/proposals', label: 'Proposals', icon: '📄' },
    { href: '/budget', label: 'Budget Tracker', icon: '💰' },
    { href: '/roi', label: 'ROI Calculator', icon: '📈' },
  ]},
  { label: 'Admin', items: [
    { href: '/integrations', label: 'Integrations', icon: '🔌' },
    { href: '/notifications', label: 'Notifications', icon: '🔔' },
    { href: '/settings', label: 'Team & Settings', icon: '⚙️' },
  ]},
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <html lang="en">
      <body>
        <aside className="sidebar">
          {/* Logo */}
          <div style={{ padding: '1rem 0.875rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                <span style={{ color: 'white', fontWeight: 900, fontSize: '1rem', fontFamily: 'Inter' }}>V</span>
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>Vraj Digital</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--accent-orange)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Marketing Suite</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ padding: '0.625rem 0.625rem', flex: 1 }}>
            {navGroups.map(group => (
              <div key={group.label} style={{ marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 0.25rem', marginBottom: '0.2rem' }}>
                  {group.label}
                </div>
                {group.items.map(item => {
                  const active = pathname === item.href
                  return (
                    <Link key={item.href} href={item.href} className={`nav-item ${active ? 'active' : ''}`}>
                      <span style={{ fontSize: '0.875rem', lineHeight: 1 }}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </div>
            ))}
          </nav>

          {/* Bottom user */}
          <div style={{ padding: '0.875rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', padding: '0.5rem 0.625rem', borderRadius: 8, background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '0.7rem' }}>DP</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Dipesh Parmar</div>
                <div style={{ fontSize: '0.6rem', color: 'var(--accent-orange)', fontWeight: 600 }}>👑 Owner</div>
              </div>
            </div>
          </div>
        </aside>
        <main className="main-content">{children}</main>
      </body>
    </html>
  )
}

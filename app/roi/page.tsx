'use client'
import { useState } from 'react'

export default function ROICalculator() {
  const [spend, setSpend] = useState('')
  const [revenue, setRevenue] = useState('')
  const [leads, setLeads] = useState('')
  const [conversions, setConversions] = useState('')
  const [clicks, setClicks] = useState('')
  const [impressions, setImpressions] = useState('')

  const s = Number(spend) || 0
  const r = Number(revenue) || 0
  const l = Number(leads) || 0
  const c = Number(conversions) || 0
  const cl = Number(clicks) || 0
  const imp = Number(impressions) || 0

  const roi = s > 0 ? (((r - s) / s) * 100).toFixed(2) : '0'
  const roas = s > 0 ? (r / s).toFixed(2) : '0'
  const cpl = l > 0 ? (s / l).toFixed(2) : '0'
  const cpa = c > 0 ? (s / c).toFixed(2) : '0'
  const ctr = imp > 0 ? ((cl / imp) * 100).toFixed(2) : '0'
  const convRate = l > 0 ? ((c / l) * 100).toFixed(2) : '0'
  const cpc = cl > 0 ? (s / cl).toFixed(2) : '0'
  const profit = r - s

  const metrics = [
    { label: 'ROI', value: `${roi}%`, desc: 'Return on Investment', color: Number(roi) >= 0 ? '#10b981' : '#ef4444', icon: '📈' },
    { label: 'ROAS', value: `${roas}x`, desc: 'Return on Ad Spend', color: Number(roas) >= 2 ? '#10b981' : '#f59e0b', icon: '💰' },
    { label: 'CPL', value: `₹${Number(cpl).toLocaleString()}`, desc: 'Cost Per Lead', color: '#3b82f6', icon: '⚡' },
    { label: 'CPA', value: `₹${Number(cpa).toLocaleString()}`, desc: 'Cost Per Acquisition', color: '#8b5cf6', icon: '✅' },
    { label: 'CTR', value: `${ctr}%`, desc: 'Click-Through Rate', color: '#06b6d4', icon: '🖱️' },
    { label: 'Conv. Rate', value: `${convRate}%`, desc: 'Lead Conversion Rate', color: '#f59e0b', icon: '🎯' },
    { label: 'CPC', value: `₹${Number(cpc).toLocaleString()}`, desc: 'Cost Per Click', color: '#ef4444', icon: '👆' },
    { label: 'Net Profit', value: `₹${profit.toLocaleString()}`, desc: 'Revenue minus Ad Spend', color: profit >= 0 ? '#10b981' : '#ef4444', icon: '💵' },
  ]

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>📈 ROI Calculator</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculate all key marketing metrics instantly</div>
        </div>
      </div>
      <div className="page">
        <div className="grid-2">
          {/* Inputs */}
          <div className="card">
            <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>📥 Enter Your Numbers</div>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                ['Total Ad Spend (₹)', spend, setSpend, '50000'],
                ['Total Revenue Generated (₹)', revenue, setRevenue, '150000'],
                ['Total Leads Generated', leads, setLeads, '200'],
                ['Total Conversions / Sales', conversions, setConversions, '20'],
                ['Total Clicks', clicks, setClicks, '5000'],
                ['Total Impressions', impressions, setImpressions, '100000'],
              ].map(([lbl, val, setter, ph]) => (
                <div key={lbl as string}>
                  <label>{lbl as string}</label>
                  <input
                    className="input"
                    type="number"
                    placeholder={`e.g. ${ph}`}
                    value={val as string}
                    onChange={e => (setter as Function)(e.target.value)}
                  />
                </div>
              ))}
            </div>
            <button className="btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '1rem' }}
              onClick={() => { setSpend(''); setRevenue(''); setLeads(''); setConversions(''); setClicks(''); setImpressions('') }}>
              🔄 Clear All
            </button>
          </div>

          {/* Results */}
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.875rem' }}>
              {metrics.map((m, i) => (
                <div key={i} className="card" style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{m.icon}</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color, marginBottom: '0.25rem' }}>{m.value}</div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{m.label}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{m.desc}</div>
                </div>
              ))}
            </div>

            {/* Performance gauge */}
            {s > 0 && r > 0 && (
              <div className="card" style={{ marginTop: '0.875rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>📊 Campaign Performance Grade</div>
                {(() => {
                  const roasNum = Number(roas)
                  const grade = roasNum >= 4 ? { label: 'Excellent 🏆', color: '#10b981', pct: 95 }
                    : roasNum >= 3 ? { label: 'Good ✅', color: '#3b82f6', pct: 75 }
                    : roasNum >= 2 ? { label: 'Average ⚠️', color: '#f59e0b', pct: 50 }
                    : { label: 'Needs Improvement ❌', color: '#ef4444', pct: 25 }
                  return (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ROAS: {roas}x</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: grade.color }}>{grade.label}</span>
                      </div>
                      <div className="progress-bar" style={{ height: 10 }}>
                        <div className="progress-fill" style={{ width: `${grade.pct}%`, background: grade.color }}></div>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                        {roasNum < 2 ? '💡 Tip: Optimize ad targeting and landing pages to improve ROAS'
                        : roasNum < 3 ? '💡 Tip: A/B test creatives to push ROAS above 3x'
                        : '🎉 Great performance! Scale this campaign for more results'}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

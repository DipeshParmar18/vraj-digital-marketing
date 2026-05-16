'use client'
import { useState } from 'react'

const contentTypes = [
  { id: 'google_ad', label: 'Google Ad Copy', icon: '🎯', prompt: 'Write a high-converting Google Ads copy with headline (max 30 chars), description 1 and description 2 (max 90 chars each)' },
  { id: 'meta_ad', label: 'Meta Ad Copy', icon: '📘', prompt: 'Write a compelling Facebook/Instagram ad copy with hook, body, and CTA' },
  { id: 'email_subject', label: 'Email Subject Lines', icon: '✉️', prompt: 'Write 10 high-open-rate email subject lines' },
  { id: 'seo_meta', label: 'SEO Meta Tags', icon: '🔍', prompt: 'Write an SEO-optimized meta title (60 chars) and meta description (155 chars)' },
  { id: 'instagram_caption', label: 'Instagram Caption', icon: '📸', prompt: 'Write an engaging Instagram caption with relevant hashtags' },
  { id: 'whatsapp_message', label: 'WhatsApp Message', icon: '💬', prompt: 'Write a professional WhatsApp marketing message for bulk sending' },
  { id: 'blog_outline', label: 'Blog Outline', icon: '📝', prompt: 'Create a detailed SEO-optimized blog outline with H1, H2s and key points' },
  { id: 'landing_page', label: 'Landing Page Copy', icon: '🚀', prompt: 'Write complete landing page copy: hero headline, subheadline, benefits, CTA' },
]

export default function AIContent() {
  const [contentType, setContentType] = useState(contentTypes[0])
  const [business, setBusiness] = useState('')
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('professional')
  const [language, setLanguage] = useState('English')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<{ type: string; output: string; ts: string }[]>([])

  const generate = async () => {
    if (!business || !product) return
    setLoading(true)
    setOutput('')
    try {
      const systemPrompt = `You are an expert digital marketing copywriter specializing in Indian markets. Write compelling, conversion-focused content. Always respond in ${language}.`
      const userPrompt = `${contentType.prompt} for:
Business: ${business}
Product/Service: ${product}
Target Audience: ${audience || 'General audience'}
Tone: ${tone}
Market: India

Be specific, compelling, and use persuasive language that converts.`

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system: systemPrompt, message: userPrompt })
      })
      const data = await res.json()
      const text = data.content?.[0]?.text || 'Failed to generate content.'
      setOutput(text)
      setHistory(h => [{ type: contentType.label, output: text, ts: new Date().toLocaleTimeString() }, ...h.slice(0, 9)])
    } catch (e) {
      setOutput('Error: Could not connect to AI. Please check your Anthropic API key in settings.')
    }
    setLoading(false)
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🤖 AI Content Generator</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Powered by Claude AI — Generate marketing content instantly</div>
        </div>
      </div>
      <div className="page">
        <div className="grid-2">
          {/* Left: Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Content Type */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>Select Content Type</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {contentTypes.map(ct => (
                  <button key={ct.id}
                    onClick={() => setContentType(ct)}
                    style={{ background: contentType.id === ct.id ? 'rgba(59,130,246,0.15)' : 'var(--bg-secondary)', border: `1px solid ${contentType.id === ct.id ? 'var(--accent-blue)' : 'var(--border)'}`, borderRadius: 8, padding: '0.6rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', color: contentType.id === ct.id ? 'var(--accent-blue)' : 'var(--text-secondary)', fontSize: '0.78rem', fontWeight: 600, textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    <span>{ct.icon}</span> {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>Campaign Details</div>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div>
                  <label>Business / Brand Name *</label>
                  <input className="input" placeholder="e.g. Vraj Digital Marketing" value={business} onChange={e => setBusiness(e.target.value)} />
                </div>
                <div>
                  <label>Product / Service *</label>
                  <input className="input" placeholder="e.g. SEO services, Google Ads management" value={product} onChange={e => setProduct(e.target.value)} />
                </div>
                <div>
                  <label>Target Audience</label>
                  <input className="input" placeholder="e.g. Small business owners in Rajkot" value={audience} onChange={e => setAudience(e.target.value)} />
                </div>
                <div className="grid-2">
                  <div>
                    <label>Tone</label>
                    <select className="input" value={tone} onChange={e => setTone(e.target.value)}>
                      <option value="professional">Professional</option>
                      <option value="casual">Casual & Friendly</option>
                      <option value="urgent">Urgent</option>
                      <option value="luxury">Luxury</option>
                      <option value="funny">Humorous</option>
                      <option value="emotional">Emotional</option>
                    </select>
                  </div>
                  <div>
                    <label>Language</label>
                    <select className="input" value={language} onChange={e => setLanguage(e.target.value)}>
                      <option>English</option>
                      <option>Hindi</option>
                      <option>Hinglish</option>
                      <option>Gujarati</option>
                    </select>
                  </div>
                </div>
                <button className="btn-primary" onClick={generate} disabled={loading || !business || !product} style={{ width: '100%', justifyContent: 'center', padding: '0.75rem' }}>
                  {loading ? '⏳ Generating...' : `✨ Generate ${contentType.label}`}
                </button>
              </div>
            </div>
          </div>

          {/* Right: Output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.875rem' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Generated Content</div>
                {output && <button className="btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }} onClick={() => { navigator.clipboard.writeText(output); alert('Copied!') }}>📋 Copy</button>}
              </div>
              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 16, width: `${60+i*8}%` }}></div>)}
                  <div style={{ marginTop: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>AI is crafting your content...</div>
                </div>
              ) : output ? (
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 8, border: '1px solid var(--border)', minHeight: 200 }}>
                  {output}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                  <div style={{ fontSize: '0.875rem' }}>Fill in the details and click Generate to create AI-powered marketing content</div>
                </div>
              )}
            </div>

            {/* History */}
            {history.length > 0 && (
              <div className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>📜 Recent Generations</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 200, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <div key={i} onClick={() => setOutput(h.output)} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                      <span>{h.type}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{h.ts}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

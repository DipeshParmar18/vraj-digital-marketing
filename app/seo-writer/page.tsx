'use client'
import { useState, useRef } from 'react'

const articleTemplates = [
  { id: 'blog', label: 'Blog Article', icon: '📝', desc: 'Informational, value-driven content for organic traffic' },
  { id: 'service', label: 'Service Page', icon: '🏢', desc: 'Convert visitors into leads with authority content' },
  { id: 'guide', label: 'How-To Guide', icon: '🗺️', desc: 'Step-by-step expert guide for answer-based SEO' },
  { id: 'listicle', label: 'Listicle / Top-N', icon: '🔢', desc: 'Ranked lists that dominate featured snippets' },
  { id: 'comparison', label: 'X vs Y Comparison', icon: '⚖️', desc: 'Comparison articles with clear verdict' },
  { id: 'local', label: 'Local SEO', icon: '📍', desc: 'Location-targeted content for city/region ranking' },
  { id: 'casestudy', label: 'Case Study', icon: '📊', desc: 'Real results with data — highest EEAT signal' },
  { id: 'faq', label: 'FAQ / Pillar', icon: '❓', desc: 'Question-based content for People Also Ask ranking' },
]

const tmplMap: Record<string, string> = {
  blog: 'blog article',
  service: 'service page',
  guide: 'step-by-step how-to guide',
  listicle: 'listicle / Top-N ranked list',
  comparison: 'X vs Y comparison article',
  local: 'local SEO article',
  casestudy: 'case study article',
  faq: 'FAQ / pillar content page',
}

const toneMap: Record<string, string> = {
  professional: 'professional and authoritative',
  authoritative: 'authoritative, expert-level and confident',
  conversational: 'conversational and engaging like a knowledgeable colleague',
  friendly: 'friendly, approachable and warm',
  direct: 'direct, no-nonsense and action-oriented',
}

type Tab = 'write' | 'guide' | 'output'
type ArticleTab = 'article' | 'meta' | 'schema'

interface HistoryItem {
  title: string
  primary: string
  location: string
  length: string
  template: string
  tone: string
  ts: string
  output: string
}

export default function SEOWriter() {
  const [activeTab, setActiveTab] = useState<Tab>('write')
  const [selectedTmpl, setSelectedTmpl] = useState('blog')

  // Form fields
  const [title, setTitle] = useState('')
  const [primaryKw, setPrimaryKw] = useState('')
  const [location, setLocation] = useState('')
  const [industry, setIndustry] = useState('')
  const [author, setAuthor] = useState('')
  const [extra, setExtra] = useState('')
  const [length, setLength] = useState('1000')
  const [tone, setTone] = useState('professional')
  const [audience, setAudience] = useState('business owners')
  const [kwInput, setKwInput] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])

  // Toggles
  const [incFaq, setIncFaq] = useState(true)
  const [incCta, setIncCta] = useState(true)
  const [incTldr, setIncTldr] = useState(true)
  const [incStats, setIncStats] = useState(true)
  const [incMeta, setIncMeta] = useState(true)
  const [incSchema, setIncSchema] = useState(false)
  const [incInternal, setIncInternal] = useState(false)
  const [incCase, setIncCase] = useState(false)

  // Output
  const [loading, setLoading] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')
  const [progress, setProgress] = useState(0)
  const [articleOutput, setArticleOutput] = useState('')
  const [metaOutput, setMetaOutput] = useState('')
  const [schemaOutput, setSchemaOutput] = useState('')
  const [articleTab, setArticleTab] = useState<ArticleTab>('article')
  const [error, setError] = useState('')
  const [history, setHistory] = useState<HistoryItem[]>([])

  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const addKeyword = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter' && e.key !== ',') return
    e.preventDefault()
    const v = kwInput.replace(/,/g, '').trim()
    if (v && keywords.length < 15 && !keywords.includes(v)) {
      setKeywords(prev => [...prev, v])
    }
    setKwInput('')
  }

  const removeKeyword = (i: number) => {
    setKeywords(prev => prev.filter((_, idx) => idx !== i))
  }

  const buildPrompt = () => {
    const sections: string[] = []
    if (incTldr) sections.push('Key Takeaways / TL;DR box at the top (3–5 bullet points)')
    if (incStats) sections.push('relevant stats and data points with named sources (WordStream, Google, HubSpot, SEMrush, Statista etc.)')
    if (incCase) sections.push('a real-world example or mini case study')
    if (incFaq) sections.push('a FAQ section with 4–6 questions mirroring Google People Also Ask results for this topic — each with a 2–4 sentence answer')
    if (incCta) sections.push('2 strong CTAs — one mid-article and one at the end')
    if (incMeta) sections.push('SEO meta output: title tag (max 60 chars), meta description (max 155 chars), URL slug, 5 LSI keywords')
    if (incSchema) sections.push('complete JSON-LD Article schema markup ready to paste in <script type="application/ld+json">')
    if (incInternal) sections.push('3 internal linking suggestions (related article topics to link to)')

    const kwStr = keywords.length > 0 ? keywords.join(', ') : 'none specified'
    const locStr = location || 'worldwide / not location specific'

    return `Generate a complete, publish-ready SEO article for Vraj Digital Marketing. This article MUST pass ZeroGPT and Originality.ai as 100% human-written. Write exactly like a real expert — not like AI.

═══ ARTICLE BRIEF ═══
Title: ${title}
Content Type: ${tmplMap[selectedTmpl]}
Primary Keyword: "${primaryKw}"
Secondary Keywords: ${kwStr}
Target Location: ${locStr}
Industry: ${industry || 'digital marketing'}
Tone: ${toneMap[tone]}
Target Length: ~${length} words
Target Audience: ${audience}
${author ? `Author / EEAT Context: ${author}` : ''}
${extra ? `Extra Instructions: ${extra}` : ''}

═══ MANDATORY WRITING RULES ═══

HUMAN WRITING — CRITICAL:
• Write like Search Engine Land — answer-first, honest, direct, expert
• Vary sentence lengths constantly: mix short punchy sentences (5–8 words) with longer explanatory ones (20–30 words)
• Use contractions naturally throughout: you're, it's, don't, here's, that's, I've, we've, that'll
• Add first-person opinions after facts: "This is where most businesses go wrong." / "In my experience, this matters more than most realise."
• Use rhetorical questions to engage the reader: "So why do so many businesses still get this wrong?"
• Acknowledge industry nuance and disagreement — show you know the debate
• ZERO AI transition words. NEVER use: "Furthermore," "Additionally," "In conclusion," "It is worth noting," "In today's digital landscape," "In summary," "It's important to note"
• Use natural connectors instead: "Here's the thing," "That said," "And that's exactly why," "The real issue is," "But here's what nobody tells you"
• ZERO passive voice — every sentence uses active voice. Never "it is believed," "results were found," "this can be done"

ANSWER-BASED SEO STRUCTURE (for AI Overviews & PAA):
• Answer the H1 question completely in the FIRST 2 sentences — no warm-up, no preamble
• Every H2 must be a question someone would type into Google or ask ChatGPT/Gemini
• Place a direct 1–2 sentence answer immediately below each H2 BEFORE expanding
• Define every key term in one plain-English sentence when first introduced
• Short paragraphs: maximum 3–4 sentences each
• Primary keyword "${primaryKw}" must appear naturally in: H1, first paragraph, at least 2 H2s, and conclusion
• Weave secondary keywords naturally — NEVER stuffed

EEAT SIGNALS (Google Quality Framework):
• Experience: include real-world scenarios, what you've seen happen in practice, client situations
• Expertise: precise industry terminology, nuanced positions, not surface-level generic claims
• Authority: cite specific credible sources by name — never say "studies show," say "according to WordStream's 2024 PPC report"
• Trust: balanced perspective, honest caveats ("this doesn't work if..."), no exaggerated promises
${author ? `• Author EEAT: weave in "${author}" naturally to establish credibility` : ''}
${location ? `\nLOCAL SEO: Mention "${location}" naturally in the intro, at least one H2, and the conclusion. Reference local market context where relevant.` : ''}

SECTIONS TO INCLUDE:
${sections.map((s, i) => `${i + 1}. ${s}`).join('\n')}

OUTPUT FORMAT:
• Start directly with the article — H1 as # Title
• Use ## for H2 subheadings, ### for H3
• After the article body, add exactly this separator on its own line: ---META---
• Then write the SEO meta data
• After meta, add exactly this separator: ---SCHEMA---
• Then write the JSON-LD schema (if requested, otherwise write "N/A")
• Write ONLY the content — NO preamble like "here is your article" or "I hope this helps"`
  }

  const generate = () => {
    setError('')
    if (!title.trim()) { setError('Article title is required.'); return }
    if (!primaryKw.trim()) { setError('Primary keyword is required.'); return }

    const prompt = buildPrompt()

    // Save to history
    const entry: HistoryItem = {
      title: title.trim(),
      primary: primaryKw.trim(),
      location: location.trim(),
      length,
      template: selectedTmpl,
      tone,
      ts: new Date().toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
      output: '',
    }
    setHistory(prev => [entry, ...prev.slice(0, 19)])

    // Copy prompt to clipboard
    navigator.clipboard.writeText(prompt).catch(() => {})

    // Open Claude.ai in new tab with prompt pre-filled
    const encoded = encodeURIComponent(prompt)
    const claudeUrl = `https://claude.ai/new?q=${encoded}`
    window.open(claudeUrl, '_blank')

    // Show confirmation screen
    setActiveTab('output')
    setArticleOutput('__SENT__')
  }

  const copyOutput = (text: string) => {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'))
  }

  const wordCount = articleOutput ? articleOutput.trim().split(/\s+/).filter(Boolean).length : 0
  const readTime = Math.max(1, Math.round(wordCount / 200))
  const headings = (articleOutput.match(/^#{1,3} /gm) || []).length
  const paras = articleOutput.split(/\n\n+/).filter(p => p.trim().length > 30).length

  return (
    <div>
      {/* TOPBAR */}
      <div className="topbar" style={{ justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✍️ SEO Article Writer
            <span className="badge badge-orange">AI Powered</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Answer-based · EEAT optimised · Human-written · Zero AI detection
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {history.length > 0 && (
            <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setActiveTab('output')}>
              📂 Last Article
            </button>
          )}
          <button className="btn-secondary" style={{ fontSize: '0.75rem' }} onClick={() => setActiveTab('guide')}>
            📖 Writing Guide
          </button>
        </div>
      </div>

      <div className="page">

        {/* TAB BAR */}
        <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.25rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 10, border: '1px solid var(--border)', width: 'fit-content' }}>
          {(['write', 'output', 'guide'] as Tab[]).map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ padding: '0.4rem 1rem', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.15s',
                background: activeTab === t ? 'linear-gradient(135deg, var(--accent-orange), #ea580c)' : 'transparent',
                color: activeTab === t ? '#fff' : 'var(--text-secondary)',
              }}>
              {t === 'write' ? '✍️ Write Article' : t === 'output' ? `📄 Output${articleOutput ? ` (${wordCount}w)` : ''}` : '📖 Guide'}
            </button>
          ))}
        </div>

        {/* ═══ WRITE TAB ═══ */}
        {activeTab === 'write' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* TIP */}
            <div style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 9, padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--accent-orange)', display: 'flex', gap: '0.625rem' }}>
              <span style={{ flexShrink: 0 }}>💡</span>
              <span>Writes like Search Engine Land — answer-first structure, EEAT signals, active voice, and optimised for Google AI Overviews & People Also Ask. Fill the brief and click Generate.</span>
            </div>

            {/* TEMPLATE SELECTOR */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>Article Template</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                {articleTemplates.map(t => (
                  <button key={t.id} onClick={() => setSelectedTmpl(t.id)}
                    style={{ background: selectedTmpl === t.id ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(37,99,235,0.1))' : 'var(--bg-secondary)',
                      border: `1px solid ${selectedTmpl === t.id ? 'var(--accent-orange)' : 'var(--border)'}`,
                      borderRadius: 8, padding: '0.75rem 0.625rem', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s', fontFamily: 'inherit' }}>
                    <div style={{ fontSize: '1.25rem', marginBottom: '0.35rem' }}>{t.icon}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: selectedTmpl === t.id ? 'var(--accent-orange)' : 'var(--text-primary)', marginBottom: '0.2rem' }}>{t.label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* MAIN FORM */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>Content Brief</div>

              {/* Title */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Article Title / Topic *</label>
                <input className="input" placeholder="e.g. 10 Reasons to Hire a PPC Agency in the USA (Beyond ROAS)" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <label>Primary Keyword *</label>
                  <input className="input" placeholder="e.g. PPC agency USA" value={primaryKw} onChange={e => setPrimaryKw(e.target.value)} />
                </div>
                <div>
                  <label>Target Location</label>
                  <input className="input" placeholder="e.g. Rajkot, Gujarat, India" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
              </div>

              {/* Secondary Keywords */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label>Secondary / LSI Keywords <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: '0.68rem' }}>(press Enter or comma to add)</span></label>
                <input className="input" placeholder="Type a keyword and press Enter..." value={kwInput}
                  onChange={e => setKwInput(e.target.value)} onKeyDown={addKeyword} />
                {keywords.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {keywords.map((k, i) => (
                      <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: 20, padding: '0.2rem 0.625rem 0.2rem 0.75rem', fontSize: '0.72rem', fontWeight: 600, color: 'var(--accent-orange)' }}>
                        {k}
                        <button onClick={() => removeKeyword(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(249,115,22,0.6)', fontSize: '0.875rem', lineHeight: 1, padding: 0, fontFamily: 'inherit' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div>
                  <label>Article Length</label>
                  <select className="input" value={length} onChange={e => setLength(e.target.value)}>
                    <option value="600">Short (~600 words)</option>
                    <option value="1000">Medium (~1000 words)</option>
                    <option value="1500">Long (~1500 words)</option>
                    <option value="2500">Deep Dive (~2500 words)</option>
                  </select>
                </div>
                <div>
                  <label>Tone of Voice</label>
                  <select className="input" value={tone} onChange={e => setTone(e.target.value)}>
                    <option value="professional">Professional</option>
                    <option value="authoritative">Authoritative</option>
                    <option value="conversational">Conversational</option>
                    <option value="friendly">Friendly</option>
                    <option value="direct">Direct & Bold</option>
                  </select>
                </div>
                <div>
                  <label>Target Audience</label>
                  <select className="input" value={audience} onChange={e => setAudience(e.target.value)}>
                    <option value="business owners">Business Owners</option>
                    <option value="marketing managers">Marketing Managers</option>
                    <option value="industry experts">Industry Experts</option>
                    <option value="beginners">Beginners</option>
                    <option value="decision makers">C-Suite / Decision Makers</option>
                  </select>
                </div>
              </div>

              <div className="grid-2" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <label>Industry / Niche</label>
                  <input className="input" placeholder="e.g. Digital Marketing, Real Estate, SaaS" value={industry} onChange={e => setIndustry(e.target.value)} />
                </div>
                <div>
                  <label>Author / Business Context <span style={{ color: 'var(--accent-orange)', fontWeight: 400, textTransform: 'none', fontSize: '0.68rem' }}>— Powers EEAT</span></label>
                  <input className="input" placeholder="e.g. Dipesh, PPC specialist, 4+ years, $100K+ managed spend" value={author} onChange={e => setAuthor(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom: '0.875rem' }}>
                <label>Extra Instructions <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', fontSize: '0.68rem' }}>(optional)</span></label>
                <textarea className="input" placeholder="e.g. Include a comparison table, add free audit CTA, target readers who tried DIY Google Ads and failed..." value={extra} onChange={e => setExtra(e.target.value)} style={{ minHeight: 70 }} />
              </div>

              {/* SECTIONS TO INCLUDE */}
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.625rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)' }}></div>
                Sections to Include
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                {[
                  { label: '❓ FAQ Section', val: incFaq, set: setIncFaq },
                  { label: '📢 CTA', val: incCta, set: setIncCta },
                  { label: '⚡ Key Takeaways', val: incTldr, set: setIncTldr },
                  { label: '📊 Stats & Data', val: incStats, set: setIncStats },
                  { label: '🔍 SEO Meta Tags', val: incMeta, set: setIncMeta },
                  { label: '🧩 JSON-LD Schema', val: incSchema, set: setIncSchema },
                  { label: '🔗 Internal Links', val: incInternal, set: setIncInternal },
                  { label: '📈 Case Study', val: incCase, set: setIncCase },
                ].map(item => (
                  <button key={item.label} onClick={() => item.set(!item.val)}
                    style={{ background: item.val ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(37,99,235,0.1))' : 'var(--bg-secondary)',
                      border: `1px solid ${item.val ? 'var(--accent-orange)' : 'var(--border)'}`,
                      borderRadius: 7, padding: '0.5rem 0.625rem', cursor: 'pointer', textAlign: 'left',
                      fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s', fontFamily: 'inherit',
                      color: item.val ? 'var(--accent-orange)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${item.val ? 'var(--accent-orange)' : 'var(--text-muted)'}`, background: item.val ? 'var(--accent-orange)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.6rem', color: '#fff' }}>
                      {item.val ? '✓' : ''}
                    </span>
                    {item.label}
                  </button>
                ))}
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '0.625rem 0.875rem', fontSize: '0.78rem', color: 'var(--accent-red)', marginBottom: '0.875rem' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button className="btn-secondary" onClick={() => { setTitle(''); setPrimaryKw(''); setLocation(''); setIndustry(''); setAuthor(''); setExtra(''); setKeywords([]); setError('') }}>
                  🔄 Reset
                </button>
                <button className="btn-primary" onClick={generate} disabled={loading} style={{ padding: '0.625rem 1.5rem', fontSize: '0.875rem' }}>
                  {loading ? '⏳ Generating...' : '✨ Generate SEO Article →'}
                </button>
              </div>
            </div>

            {/* EEAT INFO */}
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>What This Writer Optimises For</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.625rem' }}>
                {[
                  { color: 'var(--accent-green)', title: 'Experience (E)', desc: 'Real-world scenarios, first-person insight, client examples baked in.' },
                  { color: 'var(--accent-blue)', title: 'Expertise (E)', desc: 'Industry-correct terminology, nuanced positions, data-backed claims.' },
                  { color: 'var(--accent-purple)', title: 'Authoritativeness (A)', desc: 'Named source citations, specific statistics, industry consensus.' },
                  { color: 'var(--accent-yellow)', title: 'Trustworthiness (T)', desc: 'Balanced view, honest caveats, transparent author background.' },
                  { color: 'var(--accent-red)', title: 'Answer-Based SEO', desc: 'Question H2s, direct answers below each heading — AI Overview & PAA ready.' },
                  { color: 'var(--accent-orange)', title: 'Human Writing', desc: 'Varied rhythm, contractions, opinions — passes ZeroGPT & Originality.ai.' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.875rem', display: 'flex', gap: '0.625rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, flexShrink: 0, marginTop: 4 }}></div>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 3 }}>{item.title}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ═══ OUTPUT TAB ═══ */}
        {activeTab === 'output' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* SENT TO CLAUDE CONFIRMATION */}
            {articleOutput === '__SENT__' && (
              <>
                <div className="card" style={{ textAlign: 'center', padding: '2.5rem 2rem' }}>
                  <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🚀</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    Brief sent to Claude!
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                    Claude has opened in a new tab with your full SEO brief pre-filled.<br />
                    Your article is being written — 100% free, 100% Claude quality.
                  </div>

                  {/* Steps */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1.75rem', textAlign: 'left', maxWidth: 420, margin: '0 auto 1.75rem' }}>
                    {[
                      { step: '1', icon: '✅', text: 'Brief sent — Claude tab opened with your article details' },
                      { step: '2', icon: '⏳', text: 'Claude is writing your full SEO article right now' },
                      { step: '3', icon: '📋', text: 'Copy the article from Claude and paste it in your CMS' },
                      { step: '4', icon: '🔍', text: 'Check with ZeroGPT — it should show 0% AI content' },
                    ].map(s => (
                      <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.75rem', fontWeight: 800, color: '#fff' }}>{s.step}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{s.icon} {s.text}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="btn-primary" onClick={() => {
                      const encoded = encodeURIComponent(buildPrompt())
                      window.open(`https://claude.ai/new?q=${encoded}`, '_blank')
                    }}>
                      🔄 Re-open Claude Tab
                    </button>
                    <button className="btn-secondary" onClick={() => { setArticleOutput(''); setActiveTab('write') }}>
                      ✍️ Write Another Article
                    </button>
                  </div>
                </div>

                {/* HOW IT WORKS INFO */}
                <div className="card">
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>💡 Why Claude Chat Instead of In-App?</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.625rem' }}>
                    {[
                      { icon: "🆓", title: "Completely Free", desc: "No API costs. Claude.ai free plan gives you full article generation at zero cost." },
                      { icon: "✍️", title: "Best Writing Quality", desc: "Claude writes your articles using full reasoning — same quality as paid tools." },
                      { icon: "🛡️", title: "Passes AI Detection", desc: "Articles written this way pass ZeroGPT and Originality.ai consistently." },
                      { icon: "⚡", title: "Full Brief Auto-Filled", desc: "Your keywords, tone, EEAT context, location — everything is pre-loaded for Claude." },
                    ].map(item => (
                      <div key={item.title} style={{ padding: '0.875rem', background: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: '1.25rem', marginBottom: '0.375rem' }}>{item.icon}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{item.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* EMPTY STATE */}
            {!articleOutput && (
              <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✍️</div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Fill in your article brief and click Generate — Claude will write your full SEO article for free.
                </div>
                <button className="btn-primary" onClick={() => setActiveTab('write')}>Go to Write Tab →</button>
              </div>
            )}

            {/* HISTORY */}
            {history.length > 0 && (
              <div className="card">
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>📂 Article History</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 220, overflowY: 'auto' }}>
                  {history.map((h, i) => (
                    <div key={i}
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bg-secondary)', borderRadius: 7, border: '1px solid var(--border)' }}>
                      <div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{h.title}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                          <span>🔑 {h.primary}</span>
                          {h.location && <span>📍 {h.location}</span>}
                          <span>📏 ~{h.length}w</span>
                          <span>🕐 {h.ts}</span>
                        </div>
                      </div>
                      <span className="badge badge-orange">{h.template}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ GUIDE TAB ═══ */}
        {activeTab === 'guide' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>Search Engine Land Writing Pattern — What Makes It Work</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { title: '1. Answer First, Context Second', body: 'The very first sentence answers the title question — completely. No dramatic build-up, no "in today\'s digital world." Google and AI systems reward pages that deliver the answer in the first 100 words.' },
                  { title: '2. One Idea Per Paragraph — Always', body: 'Every paragraph serves a single point. If you use the word "also" inside a paragraph, you\'ve started a second idea. Stop. New paragraph. Short paragraphs are easier to scan and easier for AI to extract quotes from.' },
                  { title: '3. Question-Based H2 Subheadings', body: 'Instead of "Benefits of PPC" write "What Are the Real Benefits of PPC for Small Businesses?" Every H2 should mirror what someone types into Google or asks a voice assistant. This is how you win People Also Ask boxes.' },
                  { title: '4. Name the Disagreement — Be Honest', body: 'SEL writes things like "this term is actually debated in the industry." That kind of intellectual honesty is a massive human signal. AI never admits uncertainty. You should.' },
                  { title: '5. Add Your Opinion After Every Factual Block', body: 'After explaining something factual, add one line of your personal take. "This distinction matters more than most advertisers realise." — that sentence could only come from a real practitioner. AI doesn\'t do this naturally. You must.' },
                  { title: '6. Specific Numbers Beat Vague Claims', body: 'Never write "PPC can improve conversions significantly." Write "Businesses running Google Search campaigns see an average 3.75% conversion rate, compared to 0.77% on display — according to WordStream\'s 2024 benchmark report."' },
                  { title: '7. Zero AI Transition Words', body: 'NEVER use: "Furthermore," "Additionally," "In conclusion," "It is worth noting," "In summary." These are ZeroGPT red flags. Use: "Here\'s the thing," "That said," "And that\'s exactly why," "The real question is."' },
                ].map(item => (
                  <div key={item.title} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 8, padding: '0.875rem' }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-orange)', marginBottom: '0.375rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.body}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.875rem', color: 'var(--text-primary)' }}>AI SEO Checklist — Every Article Must Have These</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                {[
                  'Primary keyword in first 100 words', 'H1 contains primary keyword',
                  'At least 2 H2s reference primary keyword', 'Every H2 is a question format',
                  'Direct answer immediately below each H2', 'Key terms defined in plain English',
                  'Specific stats with named sources', 'FAQ from People Also Ask',
                  'Author credibility stated clearly', 'Location mentioned naturally 2–3 times',
                  'Strong CTA with clear next step', 'Zero passive voice throughout',
                  'Varied sentence lengths (short + long)', 'Contractions used naturally',
                  'Meta title tag (max 60 chars)', 'Meta description (max 155 chars)',
                ].map(item => (
                  <div key={item} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 7, fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 800, flexShrink: 0 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

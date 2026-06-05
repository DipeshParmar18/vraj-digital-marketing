import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { system, message } = await req.json()
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return NextResponse.json({ content: [{ text: '⚠️ Anthropic API key not configured. Please add your ANTHROPIC_API_KEY to environment variables.' }] })
  }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 4000, system: system || 'You are an expert digital marketing assistant.', messages: [{ role: 'user', content: message }] })
    })
    const data = await res.json()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ content: [{ text: 'AI service error. Please try again.' }] })
  }
}

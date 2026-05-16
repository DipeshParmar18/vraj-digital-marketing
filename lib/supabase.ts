import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lxbhictwtdntyqfgcntv.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4YmhpY3R3dGRudHlxZmdjbnR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MTk4MDEsImV4cCI6MjA5NDQ5NTgwMX0.Zhy26Z-9v5lqYqL0FmhrAsiMa8ZKlQpQjOljZx-q3vc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Client = {
  id: string
  name: string
  email: string
  phone: string
  company: string
  website: string
  status: string
  industry: string
  monthly_budget: number
  notes: string
  created_at: string
}

export type Campaign = {
  id: string
  client_id: string
  name: string
  platform: string
  status: string
  budget: number
  spent: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
  start_date: string
  end_date: string
  created_at: string
}

export type Task = {
  id: string
  project_id: string
  client_id: string
  title: string
  description: string
  status: string
  priority: string
  due_date: string
  assigned_to: string
  created_at: string
}

export type Lead = {
  id: string
  client_id: string
  name: string
  email: string
  phone: string
  source: string
  status: string
  value: number
  notes: string
  created_at: string
}

export type Invoice = {
  id: string
  client_id: string
  invoice_number: string
  amount: number
  tax: number
  status: string
  due_date: string
  paid_at: string
  items: any[]
  created_at: string
}

export type Integration = {
  id: string
  name: string
  platform: string
  api_key: string
  api_secret: string
  access_token: string
  account_id: string
  status: string
  config: any
  created_at: string
}

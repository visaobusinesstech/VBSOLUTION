import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nrbsocawokmihvxfcpso.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NzQwNTMsImV4cCI6MjA3MjA1MDUzM30.3SxEVRNNBHhAXgJ7S2BMHm1QWq9kxJamuLjvZm0_OU0'

export const supabase = createClient(supabaseUrl, supabaseKey)

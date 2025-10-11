import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://nrbsocawokmihvxfcpso.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yYnNvY2F3b2ttaWh2eGZjcHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjQ3NDA1MywiZXhwIjoyMDcyMDUwMDUzfQ.w6EJDzQj1fffHJ4lYzOVDLydqhbhGOW5KtGBDjaHfPA';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Feature flag check
export const isWhatsAppV2Enabled = () => {
  return process.env.FEATURE_WHATSAPP_V2 === 'true';
};

// Default owner and company IDs for testing
export const DEFAULT_OWNER_ID = '00000000-0000-0000-0000-000000000001';
export const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000002';

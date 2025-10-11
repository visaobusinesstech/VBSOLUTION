-- Fix owner_id issue in whatsapp_sessions table
-- This allows NULL temporarily while we implement proper user management

-- 1. First, make owner_id nullable temporarily
ALTER TABLE public.whatsapp_sessions 
ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Add a comment explaining this is temporary
COMMENT ON COLUMN public.whatsapp_sessions.owner_id IS 'Temporarily nullable - will be fixed when proper user management is implemented';

-- 3. Create a default system user for WhatsApp sessions
-- This will be used as a fallback when no specific user is available
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  phone,
  phone_confirmed_at,
  confirmation_token,
  email_change,
  email_change_token,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'system@vbsolution.com',
  crypt('system_password', gen_salt('bf')),
  now(),
  null,
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Sistema WhatsApp", "avatar_url": null}',
  false,
  now(),
  now(),
  null,
  null,
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- 4. Update existing sessions to use the system user
UPDATE public.whatsapp_sessions 
SET owner_id = '00000000-0000-0000-0000-000000000000'::uuid 
WHERE owner_id IS NULL;

-- 5. Make owner_id NOT NULL again
ALTER TABLE public.whatsapp_sessions 
ALTER COLUMN owner_id SET NOT NULL;

-- 6. Add the foreign key constraint back
ALTER TABLE public.whatsapp_sessions 
ADD CONSTRAINT whatsapp_sessions_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;

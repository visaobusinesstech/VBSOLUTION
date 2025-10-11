-- Simple fix for owner_id issue
-- Make owner_id nullable temporarily and update existing records

-- 1. Make owner_id nullable
ALTER TABLE public.whatsapp_sessions 
ALTER COLUMN owner_id DROP NOT NULL;

-- 2. Create a simple system user ID (we'll use a fixed UUID)
-- This is a temporary solution until proper user management is implemented
DO $$
DECLARE
    system_user_id UUID := '00000000-0000-0000-0000-000000000000';
BEGIN
    -- Insert system user if it doesn't exist
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data
    ) VALUES (
        system_user_id,
        '00000000-0000-0000-0000-000000000000'::uuid,
        'authenticated',
        'authenticated',
        'system@vbsolution.com',
        '$2a$10$dummy.hash.for.system.user',
        now(),
        now(),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Sistema WhatsApp"}'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Update existing sessions to use system user
    UPDATE public.whatsapp_sessions 
    SET owner_id = system_user_id 
    WHERE owner_id IS NULL;
END $$;

-- 3. Make owner_id NOT NULL again
ALTER TABLE public.whatsapp_sessions 
ALTER COLUMN owner_id SET NOT NULL;

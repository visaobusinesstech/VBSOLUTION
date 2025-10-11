-- =====================================================
-- CORREÇÃO DO SISTEMA DE CONTATOS E COMPANY_ID
-- =====================================================

-- 1. REMOVER TABELA CONTATOS DESNECESSÁRIA
-- =====================================================

-- Primeiro, verificar se existem dados na tabela contatos que precisam ser migrados
DO $$
DECLARE
    contatos_count INTEGER;
    contacts_count INTEGER;
BEGIN
    -- Verificar se a tabela contatos existe e tem dados
    SELECT COUNT(*) INTO contatos_count 
    FROM information_schema.tables 
    WHERE table_name = 'contatos' AND table_schema = 'public';
    
    IF contatos_count > 0 THEN
        -- Verificar quantos registros existem
        EXECUTE 'SELECT COUNT(*) FROM public.contatos' INTO contatos_count;
        RAISE NOTICE 'Tabela contatos encontrada com % registros', contatos_count;
        
        -- Se houver dados, migrar para a tabela contacts
        IF contatos_count > 0 THEN
            -- Migrar dados da tabela contatos para contacts
            INSERT INTO public.contacts (
                owner_id, name, phone, name_wpp, whatsapp_name, 
                whatsapp_jid, whatsapp_connection_id, whatsapp_registered_at,
                whatsapp_message_count, whatsapp_last_message_at,
                whatsapp_last_message_content, whatsapp_last_message_type,
                whatsapp_opted, ai_enabled, created_at, updated_at, last_contact_at
            )
            SELECT 
                owner_id, name, phone, name_wpp, whatsapp_name,
                whatsapp_jid, whatsapp_connection_id, whatsapp_registered_at,
                whatsapp_message_count, whatsapp_last_message_at,
                whatsapp_last_message_content, whatsapp_last_message_type,
                whatsapp_opted, ai_enabled, created_at, updated_at, last_contact_at
            FROM public.contatos
            WHERE NOT EXISTS (
                SELECT 1 FROM public.contacts c 
                WHERE c.phone = contatos.phone 
                AND c.owner_id = contatos.owner_id
            );
            
            RAISE NOTICE 'Dados migrados da tabela contatos para contacts';
        END IF;
        
        -- Remover a tabela contatos
        DROP TABLE IF EXISTS public.contatos CASCADE;
        RAISE NOTICE 'Tabela contatos removida com sucesso';
    ELSE
        RAISE NOTICE 'Tabela contatos não encontrada';
    END IF;
END $$;

-- 2. GARANTIR QUE COMPANY_ID SEJA GERADO CORRETAMENTE
-- =====================================================

-- Verificar se a função de criação de empresa existe
CREATE OR REPLACE FUNCTION public.create_company_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_name TEXT;
  new_company_id UUID;
BEGIN
  -- Obter nome da empresa dos metadados do usuário
  company_name := COALESCE(NEW.raw_user_meta_data->>'company', 'Empresa ' || NEW.email);
  
  -- Criar empresa automaticamente
  INSERT INTO public.companies (
    id,
    owner_id,
    fantasy_name,
    company_name,
    email,
    status,
    created_at,
    updated_at
  ) VALUES (
    gen_random_uuid(), -- Gerar UUID único para company_id
    NEW.id,
    company_name,
    company_name,
    NEW.email,
    'active',
    NOW(),
    NOW()
  ) RETURNING id INTO new_company_id;
  
  -- Atualizar o perfil com o company_id
  UPDATE public.profiles 
  SET company_id = new_company_id
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar o trigger para garantir que funcione
DROP TRIGGER IF EXISTS create_company_on_user_signup ON auth.users;
CREATE TRIGGER create_company_on_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_company_for_new_user();

-- 3. GARANTIR QUE TODAS AS TABELAS TENHAM COMPANY_ID CORRETO
-- =====================================================

-- Atualizar company_id em todas as tabelas que o possuem
UPDATE public.contacts 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.contacts.owner_id = p.id 
AND public.contacts.company_id IS NULL;

UPDATE public.whatsapp_mensagens 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.whatsapp_mensagens.owner_id = p.id 
AND public.whatsapp_mensagens.company_id IS NULL;

UPDATE public.activities 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.activities.owner_id = p.id 
AND public.activities.company_id IS NULL;

UPDATE public.leads 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.leads.owner_id = p.id 
AND public.leads.company_id IS NULL;

UPDATE public.deals 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.deals.owner_id = p.id 
AND public.deals.company_id IS NULL;

UPDATE public.company_settings 
SET company_id = p.company_id 
FROM public.profiles p 
WHERE public.company_settings.owner_id = p.id 
AND public.company_settings.company_id IS NULL;

-- 4. VERIFICAR E CORRIGIR SINCRONIZAÇÃO DE NOMES
-- =====================================================

-- Garantir que name_wpp seja igual a whatsapp_name na tabela contacts
UPDATE public.contacts 
SET name_wpp = whatsapp_name 
WHERE name_wpp IS DISTINCT FROM whatsapp_name;

-- Garantir que wpp_name seja igual a name_wpp na tabela whatsapp_mensagens
-- (isso será feito pelo código, mas podemos verificar)
UPDATE public.whatsapp_mensagens 
SET wpp_name = c.name_wpp
FROM public.contacts c
WHERE public.whatsapp_mensagens.phone = c.phone 
AND public.whatsapp_mensagens.owner_id = c.owner_id
AND public.whatsapp_mensagens.wpp_name IS DISTINCT FROM c.name_wpp;

-- 5. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_contacts_name_wpp ON public.contacts(name_wpp);
CREATE INDEX IF NOT EXISTS idx_contacts_whatsapp_name ON public.contacts(whatsapp_name);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_owner ON public.contacts(phone, owner_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_wpp_name ON public.whatsapp_mensagens(wpp_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_group_contact_name ON public.whatsapp_mensagens(group_contact_name);
CREATE INDEX IF NOT EXISTS idx_whatsapp_mensagens_phone_owner ON public.whatsapp_mensagens(phone, owner_id);

-- 6. VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se as correções foram aplicadas
DO $$
DECLARE
    contacts_count INTEGER;
    whatsapp_mensagens_count INTEGER;
    companies_count INTEGER;
    profiles_with_company INTEGER;
BEGIN
    -- Contar registros nas tabelas principais
    SELECT COUNT(*) INTO contacts_count FROM public.contacts;
    SELECT COUNT(*) INTO whatsapp_mensagens_count FROM public.whatsapp_mensagens;
    SELECT COUNT(*) INTO companies_count FROM public.companies;
    SELECT COUNT(*) INTO profiles_with_company FROM public.profiles WHERE company_id IS NOT NULL;
    
    RAISE NOTICE '=== VERIFICAÇÃO FINAL ===';
    RAISE NOTICE 'Contatos: %', contacts_count;
    RAISE NOTICE 'Mensagens WhatsApp: %', whatsapp_mensagens_count;
    RAISE NOTICE 'Empresas: %', companies_count;
    RAISE NOTICE 'Perfis com company_id: %', profiles_with_company;
    
    -- Verificar se há inconsistências de nomes
    SELECT COUNT(*) INTO contacts_count 
    FROM public.contacts 
    WHERE name_wpp IS DISTINCT FROM whatsapp_name;
    
    IF contacts_count > 0 THEN
        RAISE WARNING 'Ainda existem % contatos com name_wpp diferente de whatsapp_name', contacts_count;
    ELSE
        RAISE NOTICE '✅ Todos os contatos têm name_wpp igual a whatsapp_name';
    END IF;
    
    RAISE NOTICE '=== CORREÇÕES APLICADAS COM SUCESSO ===';
END $$;

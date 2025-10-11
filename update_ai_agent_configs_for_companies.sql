-- Atualizar tabela ai_agent_configs para suportar relacionamento com empresas
-- Adicionar campo company_id e configurar RLS adequadamente

-- Adicionar campo company_id
ALTER TABLE public.ai_agent_configs 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;

-- Adicionar campo para indicar se é configuração pessoal ou da empresa
ALTER TABLE public.ai_agent_configs 
ADD COLUMN IF NOT EXISTS is_company_wide BOOLEAN DEFAULT FALSE;

-- Adicionar campo para indicar se é ativa (para empresas pode ter múltiplas configurações)
ALTER TABLE public.ai_agent_configs 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_company_id ON public.ai_agent_configs(company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_owner_company ON public.ai_agent_configs(owner_id, company_id);
CREATE INDEX IF NOT EXISTS idx_ai_agent_configs_company_active ON public.ai_agent_configs(company_id, is_active);

-- Atualizar RLS para permitir acesso baseado em empresa
DROP POLICY IF EXISTS "Allow owners to view and manage their AI agent configs" ON public.ai_agent_configs;

-- Política para configurações pessoais (owner_id)
CREATE POLICY "Users can view and manage their personal AI configs"
ON public.ai_agent_configs FOR ALL
USING (
  owner_id = auth.uid() AND 
  (company_id IS NULL OR is_company_wide = FALSE)
)
WITH CHECK (
  owner_id = auth.uid() AND 
  (company_id IS NULL OR is_company_wide = FALSE)
);

-- Política para configurações da empresa (company_id)
CREATE POLICY "Company users can view and manage company AI configs"
ON public.ai_agent_configs FOR ALL
USING (
  company_id IN (
    SELECT cu.company_id 
    FROM public.company_users cu 
    WHERE cu.id = auth.uid()
  ) AND is_company_wide = TRUE
)
WITH CHECK (
  company_id IN (
    SELECT cu.company_id 
    FROM public.company_users cu 
    WHERE cu.id = auth.uid()
  ) AND is_company_wide = TRUE
);

-- Comentários para documentação
COMMENT ON COLUMN public.ai_agent_configs.company_id IS 'ID da empresa (para configurações compartilhadas)';
COMMENT ON COLUMN public.ai_agent_configs.is_company_wide IS 'Se true, configuração é compartilhada por toda a empresa';
COMMENT ON COLUMN public.ai_agent_configs.is_active IS 'Se true, configuração está ativa e sendo usada';

-- Atualizar configurações existentes para serem pessoais
UPDATE public.ai_agent_configs 
SET 
  company_id = NULL,
  is_company_wide = FALSE,
  is_active = TRUE
WHERE company_id IS NULL;


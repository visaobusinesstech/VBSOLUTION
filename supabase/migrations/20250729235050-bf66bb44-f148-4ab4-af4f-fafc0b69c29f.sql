
-- Criar tabela para armazenar a estrutura organizacional
CREATE TABLE public.organizational_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sector', 'position', 'person')),
  parent_id UUID REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  responsible_id UUID,
  description TEXT,
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para melhor performance
CREATE INDEX idx_organizational_structure_parent ON public.organizational_structure(parent_id);
CREATE INDEX idx_organizational_structure_type ON public.organizational_structure(type);
CREATE INDEX idx_organizational_structure_responsible ON public.organizational_structure(responsible_id);

-- Habilitar RLS
ALTER TABLE public.organizational_structure ENABLE ROW LEVEL SECURITY;

-- Política para permitir acesso completo (ajustar conforme necessário)
CREATE POLICY "Allow all access to organizational_structure" 
  ON public.organizational_structure 
  FOR ALL 
  USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organizational_structure_updated_at
  BEFORE UPDATE ON public.organizational_structure
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Atualizar tabela de funcionários existente para referenciar a estrutura organizacional
ALTER TABLE public.team_members 
ADD COLUMN IF NOT EXISTS organizational_structure_id UUID REFERENCES public.organizational_structure(id);

-- Criar índice para a nova coluna
CREATE INDEX IF NOT EXISTS idx_team_members_org_structure ON public.team_members(organizational_structure_id);

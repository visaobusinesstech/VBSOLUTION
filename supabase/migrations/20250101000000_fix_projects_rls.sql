-- Corrigir políticas RLS para a tabela projects
-- Permitir que usuários autenticados criem, leiam, atualizem e excluam seus próprios projetos

-- Remover política existente
DROP POLICY IF EXISTS "Allow all access to projects" ON public.projects;

-- Criar políticas específicas para projetos
CREATE POLICY "Users can view their own projects" ON public.projects
  FOR SELECT USING (auth.uid() = manager_id);

CREATE POLICY "Users can create their own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = manager_id);

CREATE POLICY "Users can update their own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = manager_id);

CREATE POLICY "Users can delete their own projects" ON public.projects
  FOR DELETE USING (auth.uid() = manager_id);

-- Permitir que usuários vejam projetos de sua empresa (se houver company_id)
CREATE POLICY "Users can view company projects" ON public.projects
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() 
      AND company_id = projects.client_id
    )
  );

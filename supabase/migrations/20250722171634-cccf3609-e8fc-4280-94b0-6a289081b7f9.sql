
-- Criar tabela para empresas/companhias
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fantasy_name TEXT NOT NULL,
  company_name TEXT,
  cnpj TEXT,
  reference TEXT,
  cep TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  email TEXT,
  phone TEXT,
  responsible_id UUID,
  logo_url TEXT,
  description TEXT,
  sector TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para produtos
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'product', -- 'product' ou 'service'
  sku TEXT,
  description TEXT,
  category TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'unidade',
  stock INTEGER,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para etapas do funil
CREATE TABLE public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para negócios/oportunidades
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL,
  product_id UUID,
  stage_id UUID NOT NULL,
  responsible_id UUID,
  title TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL DEFAULT 0,
  probability INTEGER DEFAULT 50,
  expected_close_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'won', 'lost'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para arquivos anexados
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL, -- 'company', 'deal'
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir etapas padrão do funil
INSERT INTO public.funnel_stages (name, order_position, color) VALUES
('Em Desenvolvimento', 1, '#3b82f6'),
('Criar documentos', 2, '#8b5cf6'),
('Fatura', 3, '#f59e0b'),
('Em andamento', 4, '#10b981'),
('Fatura final', 5, '#ef4444');

-- Inserir alguns produtos de exemplo
INSERT INTO public.products (name, type, description, category, base_price, unit) VALUES
('Consultoria Estratégica', 'service', 'Consultoria em estratégia empresarial', 'Consultoria', 5000.00, 'hora'),
('Sistema ERP', 'product', 'Sistema integrado de gestão empresarial', 'Software', 15000.00, 'licença'),
('Treinamento Corporativo', 'service', 'Treinamento para equipes', 'Educação', 2500.00, 'curso');

-- Habilitar RLS nas tabelas
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir acesso total por enquanto)
CREATE POLICY "Allow all access to companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true);
CREATE POLICY "Allow all access to funnel_stages" ON public.funnel_stages FOR ALL USING (true);
CREATE POLICY "Allow all access to deals" ON public.deals FOR ALL USING (true);
CREATE POLICY "Allow all access to attachments" ON public.attachments FOR ALL USING (true);

-- Criar foreign keys
ALTER TABLE public.deals ADD CONSTRAINT deals_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD CONSTRAINT deals_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE public.deals ADD CONSTRAINT deals_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES public.funnel_stages(id) ON DELETE RESTRICT;

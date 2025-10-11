
-- Create funnel_stages table
CREATE TABLE public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create deals table
CREATE TABLE public.deals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id),
  product_id UUID REFERENCES public.products(id),
  stage_id UUID REFERENCES public.funnel_stages(id) NOT NULL,
  responsible_id UUID REFERENCES public.team_members(id),
  title TEXT NOT NULL,
  value NUMERIC DEFAULT 0,
  probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'won', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for funnel_stages
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on funnel_stages" 
  ON public.funnel_stages 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Add RLS policies for deals
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on deals" 
  ON public.deals 
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- Insert default funnel stages
INSERT INTO public.funnel_stages (name, color, order_position) VALUES
  ('Contato Inicial', '#3b82f6', 1),
  ('Qualificação', '#8b5cf6', 2),
  ('Proposta', '#f59e0b', 3),
  ('Fechamento', '#10b981', 4);

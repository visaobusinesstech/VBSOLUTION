
-- Create the commercial_activities table
CREATE TABLE public.commercial_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'whatsapp', 'task', 'presentation')),
  description TEXT,
  datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  responsible_id UUID REFERENCES public.team_members(id),
  lead_id UUID,
  company_id UUID REFERENCES public.companies(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create the leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  value NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL' CHECK (currency IN ('BRL', 'USD', 'EUR')),
  stage_id UUID NOT NULL REFERENCES public.funnel_stages(id),
  responsible_id UUID REFERENCES public.team_members(id),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  source TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'frozen')),
  expected_close_date DATE,
  last_contact_date DATE,
  conversion_rate INTEGER NOT NULL DEFAULT 50,
  notes TEXT,
  custom_fields JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for lead_id in commercial_activities (now that leads table exists)
ALTER TABLE public.commercial_activities 
ADD CONSTRAINT fk_commercial_activities_lead 
FOREIGN KEY (lead_id) REFERENCES public.leads(id);

-- Enable RLS on both tables
ALTER TABLE public.commercial_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for commercial_activities
CREATE POLICY "Allow all access to commercial_activities" 
  ON public.commercial_activities 
  FOR ALL 
  USING (true);

-- Create RLS policies for leads
CREATE POLICY "Allow all access to leads" 
  ON public.leads 
  FOR ALL 
  USING (true);

-- Add triggers for updated_at
CREATE TRIGGER update_commercial_activities_updated_at
  BEFORE UPDATE ON public.commercial_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

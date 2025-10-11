
-- Create events table
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting',
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  responsible TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT DEFAULT '📅',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  image_url TEXT,
  type TEXT DEFAULT 'product',
  category TEXT,
  unit TEXT DEFAULT 'unidade',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create organizational_structure table
CREATE TABLE public.organizational_structure (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('sector', 'position', 'person')),
  parent_id UUID REFERENCES public.organizational_structure(id) ON DELETE CASCADE,
  responsible_id UUID,
  description TEXT,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) for events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policy for events (allowing all operations for now)
CREATE POLICY "Allow all operations on events" 
  ON public.events 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Add Row Level Security (RLS) for products table  
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create policy for products (allowing all operations for now)
CREATE POLICY "Allow all operations on products" 
  ON public.products 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Add Row Level Security (RLS) for organizational_structure table
ALTER TABLE public.organizational_structure ENABLE ROW LEVEL SECURITY;

-- Create policy for organizational_structure (allowing all operations for now)
CREATE POLICY "Allow all operations on organizational_structure" 
  ON public.organizational_structure 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Create storage bucket for message-attachments if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for message-attachments bucket
CREATE POLICY "Allow all operations on message-attachments"
  ON storage.objects FOR ALL
  USING (bucket_id = 'message-attachments')
  WITH CHECK (bucket_id = 'message-attachments');

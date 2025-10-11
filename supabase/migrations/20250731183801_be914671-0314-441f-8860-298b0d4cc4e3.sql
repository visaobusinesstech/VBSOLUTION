
-- Fix RLS policy for inventory-images bucket to allow inserts
CREATE POLICY "Allow authenticated users to insert inventory images" ON storage.objects 
FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'inventory-images');

-- Also ensure users can select their uploaded images
CREATE POLICY "Allow authenticated users to select inventory images" ON storage.objects 
FOR SELECT 
TO authenticated 
USING (bucket_id = 'inventory-images');

-- Allow users to delete their uploaded images
CREATE POLICY "Allow authenticated users to delete inventory images" ON storage.objects 
FOR DELETE 
TO authenticated 
USING (bucket_id = 'inventory-images');

-- Create writeoffs table for the second part of the plan
CREATE TABLE public.writeoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responsible_id UUID,
  total DECIMAL(10,2) DEFAULT 0,
  warehouse TEXT,
  reason TEXT,
  notes TEXT,
  items_count INTEGER DEFAULT 0
);

-- Enable RLS on writeoffs table
ALTER TABLE public.writeoffs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for writeoffs
CREATE POLICY "Allow all access to writeoffs" 
ON public.writeoffs 
FOR ALL 
USING (true);

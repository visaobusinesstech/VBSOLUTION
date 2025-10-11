
-- Create the inventory-images bucket for storing product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true);

-- Create RLS policies for the inventory-images bucket
CREATE POLICY "Allow authenticated users to upload inventory images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'inventory-images');

CREATE POLICY "Allow public access to view inventory images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'inventory-images');

CREATE POLICY "Allow authenticated users to update inventory images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'inventory-images');

CREATE POLICY "Allow authenticated users to delete inventory images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'inventory-images');

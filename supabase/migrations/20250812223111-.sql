-- Create storage bucket for aircraft photos
INSERT INTO storage.buckets (id, name, public) VALUES ('aircraft-photos', 'aircraft-photos', true);

-- Create policies for aircraft photo uploads
CREATE POLICY "Users can view all aircraft photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'aircraft-photos');

CREATE POLICY "Users can upload their own aircraft photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'aircraft-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own aircraft photos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'aircraft-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own aircraft photos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'aircraft-photos' AND auth.uid()::text = (storage.foldername(name))[1]);
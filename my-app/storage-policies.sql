-- Storage Bucket Policies for report-photos bucket
-- Run this SQL in your Supabase SQL Editor after creating the bucket

-- First, drop any existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload report photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view report photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own report photos" ON storage.objects;

-- Policy 1: Allow authenticated users to upload photos
-- This allows any authenticated user to upload to the report-photos bucket
CREATE POLICY "Authenticated users can upload report photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'report-photos');

-- Policy 2: Allow anyone to view photos (since bucket is public)
-- This makes all photos publicly viewable
CREATE POLICY "Anyone can view report photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'report-photos');

-- Policy 3: Allow users to delete their own photos
-- Users can only delete photos in their own user folder (reports/userId/...)
CREATE POLICY "Users can delete their own report photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'report-photos' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Alternative simpler policies if the above don't work:
-- If you get errors, try these instead (less secure but works):

-- Simple INSERT policy (allows all authenticated users to upload)
-- DROP POLICY IF EXISTS "Authenticated users can upload report photos" ON storage.objects;
-- CREATE POLICY "Authenticated users can upload report photos"
-- ON storage.objects
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (bucket_id = 'report-photos');

-- Simple SELECT policy (allows everyone to view)
-- DROP POLICY IF EXISTS "Anyone can view report photos" ON storage.objects;
-- CREATE POLICY "Anyone can view report photos"
-- ON storage.objects
-- FOR SELECT
-- TO public
-- USING (bucket_id = 'report-photos');

-- Simple DELETE policy (allows users to delete their own files)
-- DROP POLICY IF EXISTS "Users can delete their own report photos" ON storage.objects;
-- CREATE POLICY "Users can delete their own report photos"
-- ON storage.objects
-- FOR DELETE
-- TO authenticated
-- USING (
--   bucket_id = 'report-photos' AND
--   (storage.foldername(name))[2] = auth.uid()::text
-- );


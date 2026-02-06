-- Add 'hydrant' as a valid report type
-- Run this if you already created the reports table without 'hydrant'

-- Drop the existing constraint
ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_type_check;

-- Add the new constraint with 'hydrant' included
ALTER TABLE reports ADD CONSTRAINT reports_type_check 
  CHECK (type IN ('streetlight', 'hydrant', 'pothole', 'sidewalk', 'graffiti', 'trash', 'other'));


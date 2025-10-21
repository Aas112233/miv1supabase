-- Add missing columns to members table
ALTER TABLE members ADD COLUMN IF NOT EXISTS contact TEXT;
ALTER TABLE members ADD COLUMN IF NOT EXISTS share_amount NUMERIC(10,2);
ALTER TABLE members ADD COLUMN IF NOT EXISTS join_date DATE;
ALTER TABLE members ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to have default values for new columns
UPDATE members 
SET 
  contact = COALESCE(email, phone, ''),
  share_amount = 0,
  join_date = COALESCE(join_date, created_at::date),
  is_active = true
WHERE contact IS NULL OR share_amount IS NULL OR join_date IS NULL OR is_active IS NULL;
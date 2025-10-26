-- Add category column to existing expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Other';

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

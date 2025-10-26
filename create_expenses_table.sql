-- Create expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id BIGSERIAL PRIMARY KEY,
  reason TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  category TEXT NOT NULL,
  expense_by TEXT NOT NULL,
  deduct_from TEXT NOT NULL DEFAULT 'main_savings',
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create index on expense_date for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON public.expenses(expense_date);

-- Create index on category for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);

-- Create index on deduct_from for faster queries
CREATE INDEX IF NOT EXISTS idx_expenses_deduct_from ON public.expenses(deduct_from);

-- Enable Row Level Security
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read expenses
CREATE POLICY "Allow authenticated users to read expenses"
  ON public.expenses
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert expenses
CREATE POLICY "Allow authenticated users to insert expenses"
  ON public.expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to update expenses
CREATE POLICY "Allow authenticated users to update expenses"
  ON public.expenses
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete expenses
CREATE POLICY "Allow authenticated users to delete expenses"
  ON public.expenses
  FOR DELETE
  TO authenticated
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Phase 1: Monthly Revenue/Loss Tracking
-- Create project_monthly_financials table to track monthly financial data

CREATE TABLE IF NOT EXISTS public.project_monthly_financials (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2000),
  revenue DECIMAL(12, 2) DEFAULT 0,
  expenses DECIMAL(12, 2) DEFAULT 0,
  net_profit_loss DECIMAL(12, 2) GENERATED ALWAYS AS (revenue - expenses) STORED,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT unique_project_month_year UNIQUE(project_id, month, year)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_monthly_financials_project ON public.project_monthly_financials(project_id);
CREATE INDEX IF NOT EXISTS idx_monthly_financials_year_month ON public.project_monthly_financials(year, month);

-- Enable Row Level Security
ALTER TABLE public.project_monthly_financials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read monthly financials"
  ON public.project_monthly_financials FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert monthly financials"
  ON public.project_monthly_financials FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update monthly financials"
  ON public.project_monthly_financials FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete monthly financials"
  ON public.project_monthly_financials FOR DELETE TO authenticated USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_monthly_financials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER monthly_financials_updated_at
  BEFORE UPDATE ON public.project_monthly_financials
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_financials_updated_at();

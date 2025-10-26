-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'Planning',
  assigned_member_id BIGINT REFERENCES public.members(id),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_investments table
CREATE TABLE IF NOT EXISTS public.project_investments (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  member_id BIGINT REFERENCES public.members(id),
  amount DECIMAL(10, 2) NOT NULL,
  investment_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_revenues table
CREATE TABLE IF NOT EXISTS public.project_revenues (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  revenue_date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create project_milestones table
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending',
  completed_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Add project_id to expenses table
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES public.projects(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_assigned_member ON public.projects(assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_project_investments_project ON public.project_investments(project_id);
CREATE INDEX IF NOT EXISTS idx_project_investments_member ON public.project_investments(member_id);
CREATE INDEX IF NOT EXISTS idx_project_revenues_project ON public.project_revenues(project_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_expenses_project ON public.expenses(project_id);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Allow authenticated users to read projects"
  ON public.projects FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert projects"
  ON public.projects FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update projects"
  ON public.projects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete projects"
  ON public.projects FOR DELETE TO authenticated USING (true);

-- RLS Policies for project_investments
CREATE POLICY "Allow authenticated users to read project_investments"
  ON public.project_investments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert project_investments"
  ON public.project_investments FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_investments"
  ON public.project_investments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_investments"
  ON public.project_investments FOR DELETE TO authenticated USING (true);

-- RLS Policies for project_revenues
CREATE POLICY "Allow authenticated users to read project_revenues"
  ON public.project_revenues FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert project_revenues"
  ON public.project_revenues FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_revenues"
  ON public.project_revenues FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_revenues"
  ON public.project_revenues FOR DELETE TO authenticated USING (true);

-- RLS Policies for project_milestones
CREATE POLICY "Allow authenticated users to read project_milestones"
  ON public.project_milestones FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert project_milestones"
  ON public.project_milestones FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update project_milestones"
  ON public.project_milestones FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete project_milestones"
  ON public.project_milestones FOR DELETE TO authenticated USING (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION update_projects_updated_at();

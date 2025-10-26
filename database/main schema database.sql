-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.audit_logs (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id text,
  old_values jsonb,
  new_values jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.dividends (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  member_id bigint NOT NULL,
  amount numeric NOT NULL,
  dividend_date date NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT dividends_pkey PRIMARY KEY (id),
  CONSTRAINT dividends_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.expenses (
  id bigint NOT NULL DEFAULT nextval('expenses_id_seq'::regclass),
  reason text NOT NULL,
  amount numeric NOT NULL,
  expense_by text NOT NULL,
  deduct_from text NOT NULL DEFAULT 'main_savings'::text,
  expense_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  category text NOT NULL DEFAULT 'Other'::text,
  project_id bigint,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.goals (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text NOT NULL,
  description text,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  target_date date,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT goals_pkey PRIMARY KEY (id)
);
CREATE TABLE public.master_data (
  id bigint NOT NULL DEFAULT nextval('master_data_id_seq'::regclass),
  category character varying NOT NULL,
  value character varying NOT NULL,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT master_data_pkey PRIMARY KEY (id)
);
CREATE TABLE public.members (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  address text,
  join_date date,
  status text DEFAULT 'active'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  contact text,
  share_amount numeric,
  is_active boolean DEFAULT true,
  user_id uuid,
  CONSTRAINT members_pkey PRIMARY KEY (id),
  CONSTRAINT members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.payments (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  member_id bigint NOT NULL,
  amount numeric NOT NULL,
  payment_date date NOT NULL,
  payment_method text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  cashier_name text,
  status text,
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.permissions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  permission text NOT NULL,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT permissions_pkey PRIMARY KEY (id),
  CONSTRAINT permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.project_investments (
  id bigint NOT NULL DEFAULT nextval('project_investments_id_seq'::regclass),
  project_id bigint,
  member_id bigint,
  amount numeric NOT NULL,
  investment_date date NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT project_investments_pkey PRIMARY KEY (id),
  CONSTRAINT project_investments_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_investments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.project_members (
  id bigint NOT NULL DEFAULT nextval('project_members_id_seq'::regclass),
  project_id bigint NOT NULL,
  member_id bigint NOT NULL,
  role character varying,
  joined_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT project_members_pkey PRIMARY KEY (id),
  CONSTRAINT project_members_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_members_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.project_milestones (
  id bigint NOT NULL DEFAULT nextval('project_milestones_id_seq'::regclass),
  project_id bigint,
  title text NOT NULL,
  description text,
  target_date date,
  status text NOT NULL DEFAULT 'Pending'::text,
  completed_date date,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT project_milestones_pkey PRIMARY KEY (id),
  CONSTRAINT project_milestones_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.project_revenues (
  id bigint NOT NULL DEFAULT nextval('project_revenues_id_seq'::regclass),
  project_id bigint,
  amount numeric NOT NULL,
  revenue_date date NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT project_revenues_pkey PRIMARY KEY (id),
  CONSTRAINT project_revenues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.projects (
  id bigint NOT NULL DEFAULT nextval('projects_id_seq'::regclass),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  start_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'Planning'::text,
  assigned_member_id bigint,
  progress_percentage integer DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  initial_investment numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  monthly_revenue numeric DEFAULT 0,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_assigned_member_id_fkey FOREIGN KEY (assigned_member_id) REFERENCES public.members(id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  key text NOT NULL UNIQUE,
  value text,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transaction_requests (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  member_id bigint NOT NULL,
  amount numeric NOT NULL,
  request_date date NOT NULL,
  description text,
  status text DEFAULT 'pending'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  payment_method text,
  cashier_name text,
  CONSTRAINT transaction_requests_pkey PRIMARY KEY (id),
  CONSTRAINT transaction_requests_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id)
);
CREATE TABLE public.user_permissions (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id uuid NOT NULL,
  screen_name text NOT NULL,
  can_read boolean DEFAULT false,
  can_write boolean DEFAULT false,
  can_manage boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  role text DEFAULT 'member'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_login timestamp with time zone,
  CONSTRAINT user_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT user_profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  role text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
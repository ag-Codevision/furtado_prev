-- MASTER RESTORATION SCRIPT - FURTADO PREV
-- Este script restaura toda a estrutura do banco de dados (Clientes, Tarefas, CRM, Financeiro, etc.)

-- 1. EXTENSÕES (Caso não estejam habilitadas)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TIPO DE ROLE (Para Perfis)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('comum', 'intermediario', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA: PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'comum'::user_role,
  avatar_url TEXT,
  cover_url TEXT,
  bio TEXT,
  phone TEXT,
  office_name TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Perfis são visíveis para usuários autenticados" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger Handle New User
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', ''), new.email, 'comum');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. TABELA: CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpf_cnpj TEXT,
    status TEXT DEFAULT 'Ativo',
    role TEXT,
    location TEXT,
    company_type TEXT,
    avatar_url TEXT,
    is_favorite BOOLEAN DEFAULT false,
    registration_date TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.clients FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Trigger Updated At
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. TABELA: TEAM_MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    avatar TEXT,
    status TEXT DEFAULT 'Ativo',
    oab TEXT,
    admission_date DATE,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view team_members" ON public.team_members FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 6. TABELA: COURT_LOCATIONS
CREATE TABLE IF NOT EXISTS public.court_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.court_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.court_locations FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 7. TABELA: TASK_COLUMNS & TASKS
CREATE TABLE IF NOT EXISTS public.task_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT DEFAULT 'bg-slate-400',
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.task_columns FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_id UUID REFERENCES public.task_columns(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    process_number TEXT,
    client_name TEXT,
    location TEXT,
    fatal_deadline TEXT,
    internal_deadline TEXT,
    responsible_name TEXT,
    responsible_avatar TEXT,
    dialogue JSONB DEFAULT '[]'::jsonb,
    position INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.tasks FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 8. TABELA: CRM_COLUMNS & CRM_LEADS
CREATE TABLE IF NOT EXISTS public.crm_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT DEFAULT 'blue',
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.crm_columns FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    column_id UUID REFERENCES public.crm_columns(id) ON DELETE CASCADE,
    lead_name TEXT,
    lead_avatar TEXT,
    lead_phone TEXT,
    source TEXT,
    service_type TEXT,
    temperature TEXT DEFAULT 'warm',
    position INTEGER DEFAULT 0,
    last_interaction TEXT DEFAULT 'Agora',
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.crm_leads FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 9. TABELA: AGENDA_CATEGORIES & AGENDA_EVENTS
CREATE TABLE IF NOT EXISTS public.agenda_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.agenda_categories ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.agenda_categories FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.agenda_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    type TEXT NOT NULL,
    description TEXT,
    location TEXT,
    nb TEXT,
    responsible_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.agenda_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.agenda_events FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 10. TABELA: DECISIONS
CREATE TABLE IF NOT EXISTS public.decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    process_number TEXT NOT NULL,
    judgment_date DATE NOT NULL,
    location TEXT NOT NULL,
    decision_type TEXT NOT NULL,
    opponent TEXT,
    fundamentals TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.decisions FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 11. TABELA: FINANCIAL_TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('in', 'out')),
    title TEXT NOT NULL,
    value NUMERIC(15, 2) NOT NULL,
    category TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT NOT NULL DEFAULT 'confirmado' CHECK (status IN ('confirmado', 'pendente')),
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    installment_number INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
    CREATE POLICY "Enable all access for authenticated users" ON public.financial_transactions FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

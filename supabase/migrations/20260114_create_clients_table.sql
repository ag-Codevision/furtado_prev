-- Create the clients table
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

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable all access for authenticated users" ON public.clients
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a trigger to update 'updated_at'
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

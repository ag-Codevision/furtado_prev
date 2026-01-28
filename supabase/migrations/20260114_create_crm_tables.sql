-- Create crm_columns table
CREATE TABLE IF NOT EXISTS public.crm_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT DEFAULT 'blue',
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for crm_columns
ALTER TABLE public.crm_columns ENABLE ROW LEVEL SECURITY;

-- Policies for crm_columns
CREATE POLICY "Enable all access for authenticated users" 
    ON public.crm_columns FOR ALL
    USING (auth.role() = 'authenticated');

-- Create crm_leads table
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

-- Enable RLS for crm_leads
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Policies for crm_leads
CREATE POLICY "Enable all access for authenticated users" 
    ON public.crm_leads FOR ALL
    USING (auth.role() = 'authenticated');

-- Add positioning function for atomic updates (optional but good for future)
-- For now we'll handle positioning in the app logic.

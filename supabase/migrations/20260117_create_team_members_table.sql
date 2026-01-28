-- Create the team_members table
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

-- Enable Row Level Security
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view team_members" ON public.team_members
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert team_members" ON public.team_members
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update team_members" ON public.team_members
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete team_members" ON public.team_members
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create court_locations table
CREATE TABLE IF NOT EXISTS public.court_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.court_locations ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all users" ON public.court_locations
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for all authenticated users" ON public.court_locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Clear existing and insert clean default values
TRUNCATE TABLE public.court_locations;

INSERT INTO public.court_locations (name) VALUES 
('1 vara civel de gravatai'),
('2 vara civel de gravatai'),
('1 vara civel de cachoeirinha'),
('2 vara civel de cachoeirinha'),
('3 vara civel de cachoeirinha');

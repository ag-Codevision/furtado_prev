-- Create the decisions table
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

-- Enable Row Level Security
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Users can view decisions" ON public.decisions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert decisions" ON public.decisions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update decisions" ON public.decisions
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete decisions" ON public.decisions
    FOR DELETE USING (auth.role() = 'authenticated');

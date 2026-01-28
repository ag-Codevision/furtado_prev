-- Create task_columns table
CREATE TABLE IF NOT EXISTS public.task_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    color TEXT DEFAULT 'bg-slate-400',
    position INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for task_columns
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;

-- Policies for task_columns
CREATE POLICY "Enable all access for authenticated users" 
    ON public.task_columns FOR ALL
    USING (auth.role() = 'authenticated');

-- Create tasks table
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

-- Enable RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
CREATE POLICY "Enable all access for authenticated users" 
    ON public.tasks FOR ALL
    USING (auth.role() = 'authenticated');

-- Insert default columns if NONE exist for a user (this can be done in the app or via trigger)
-- For now, let's just create the tables.

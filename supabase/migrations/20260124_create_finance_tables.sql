-- Create financial_transactions table
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

-- Enable RLS
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable all access for authenticated users" ON public.financial_transactions
    FOR ALL USING (auth.role() = 'authenticated');

-- Create a trigger to update 'updated_at' if we decide to add it later, but for now transaction date is what matters.

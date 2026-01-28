-- Migration: Create Agenda Tables
-- Date: 2026-01-20

-- 1. Agenda Categories Table
CREATE TABLE IF NOT EXISTS agenda_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL,
    color TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE agenda_categories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agenda_categories
CREATE POLICY "Enable read access for all users" ON agenda_categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON agenda_categories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON agenda_categories FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON agenda_categories FOR DELETE USING (auth.role() = 'authenticated');

-- 2. Agenda Events Table
CREATE TABLE IF NOT EXISTS agenda_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT,
    type TEXT NOT NULL, -- Corresponds to category label
    description TEXT,
    location TEXT,
    nb TEXT, -- INSS Benefit Number
    responsible_id UUID REFERENCES team_members(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE agenda_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agenda_events
CREATE POLICY "Enable read access for all users" ON agenda_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON agenda_events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON agenda_events FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON agenda_events FOR DELETE USING (auth.role() = 'authenticated');

-- Indexes
CREATE INDEX IF NOT EXISTS idx_agenda_events_date ON agenda_events(date);
CREATE INDEX IF NOT EXISTS idx_agenda_events_type ON agenda_events(type);

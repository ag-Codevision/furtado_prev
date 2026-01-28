-- Adicionar novos campos à tabela de perfis
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS office_name TEXT;

-- Garantir que as permissões de RLS permitam a atualização desses novos campos
-- (As políticas anteriores já cobriam o UPDATE para o próprio usuário, então deve estar OK)

-- Opcional: Criar bucket para storage se o usuário tiver permissão (geralmente via interface, mas registrando no SQL)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;

-- 1. Criar o tipo enumerado para os níveis de acesso (Roles)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('comum', 'intermediario', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Criar a tabela de perfis (profiles) que estende os dados do auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE,
  role user_role DEFAULT 'comum'::user_role,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar o Row Level Security (RLS) para segurança
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Definir políticas de acesso
-- Qualquer um pode ver perfis (ajustar se necessário)
CREATE POLICY "Perfis são visíveis para usuários autenticados" ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- O próprio usuário pode atualizar seu perfil
CREATE POLICY "Usuários podem atualizar seus próprios perfis" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Função para criar o perfil automaticamente quando um novo usuário se cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    new.email, 
    'comum'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Trigger para executar a função de criação de perfil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- COMENTÁRIO DE USO:
-- Este script deve ser executado no SQL Editor do Dashboard do Supabase.
-- Ele garante que todo usuário criado via Supabase Auth terá um registro correspondente
-- na tabela profiles com o nível de acesso 'comum' por padrão.

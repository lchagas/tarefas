-- ==========================================
-- SCRIPT DE BANCO DE DADOS: LISTA DE TAREFAS
-- ==========================================
-- Execute este script no painel SQL Editor do seu projeto Supabase.
-- Ele criará a tabela de tarefas e definirá as políticas de segurança RLS.

-- DICA: Se a sua tabela "tasks" já foi criada anteriormente no Supabase,
-- execute apenas este comando abaixo no SQL Editor para atualizá-la:
-- ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo'::text NOT NULL;

-- 1. Criação da tabela de tarefas (tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Pessoal'::text NOT NULL,
    priority TEXT DEFAULT 'Média'::text NOT NULL,
    due_date DATE,
    completed BOOLEAN DEFAULT false NOT NULL,
    status TEXT DEFAULT 'todo'::text NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid() NOT NULL
);

-- 2. Habilita o Row Level Security (RLS) para garantir a segurança dos dados
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança (Policies)

-- Política para permitir que usuários leiam apenas suas próprias tarefas
CREATE POLICY "Usuários podem ver suas próprias tarefas" 
ON public.tasks 
FOR SELECT 
USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias tarefas
CREATE POLICY "Usuários podem criar suas próprias tarefas" 
ON public.tasks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias tarefas
CREATE POLICY "Usuários podem atualizar suas próprias tarefas" 
ON public.tasks 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias tarefas
CREATE POLICY "Usuários podem deletar suas próprias tarefas" 
ON public.tasks 
FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Criando índices para otimização de buscas por usuário
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);

# Configuração do Supabase para Leads e Vendas

## Problema Atual
A aplicação está apresentando erro "Erro ao carregar dados do servidor" porque as credenciais do Supabase não estão configuradas.

## Solução

### 1. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-aqui
```

### 2. Obter Credenciais do Supabase

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Selecione seu projeto
4. Vá em **Settings** > **API**
5. Copie:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### 3. Criar Tabelas no Supabase

Execute o seguinte SQL no **SQL Editor** do Supabase:

```sql
-- Criar tabela funnel_stages
CREATE TABLE IF NOT EXISTS public.funnel_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  order_position INTEGER NOT NULL,
  color TEXT NOT NULL,
  probability INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Inserir dados padrão
INSERT INTO public.funnel_stages (name, order_position, color, probability) VALUES
('Qualified', 1, '#10b981', 10),
('Contact Made', 2, '#3b82f6', 25),
('Demo Scheduled', 3, '#8b5cf6', 50),
('Proposal Made', 4, '#f59e0b', 75),
('Negotiations Started', 5, '#ef4444', 90);

-- Criar tabela leads (se não existir)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  value DECIMAL(10,2) DEFAULT 0,
  stage_id UUID REFERENCES public.funnel_stages(id),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela templates (se não existir)
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'whatsapp', 'proposal', 'contract', 'presentation')),
  subject TEXT,
  content TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela lead_events (se não existir)
CREATE TABLE IF NOT EXISTS public.lead_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  company_id UUID REFERENCES public.companies(id),
  lead_id UUID REFERENCES public.leads(id),
  deal_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  event_type TEXT DEFAULT 'meeting' CHECK (event_type IN ('meeting', 'call', 'email', 'task', 'deadline')),
  is_all_day BOOLEAN DEFAULT false,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
```

### 4. Configurar RLS (Row Level Security)

```sql
-- Habilitar RLS
ALTER TABLE public.funnel_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_events ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajuste conforme necessário)
CREATE POLICY "Users can view their own data" ON public.funnel_stages
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own leads" ON public.leads
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own templates" ON public.templates
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can view their own events" ON public.lead_events
  FOR SELECT USING (auth.uid() = owner_id);
```

### 5. Testar a Aplicação

Após configurar as credenciais e criar as tabelas:

1. Reinicie o servidor de desenvolvimento
2. Acesse a página de Leads e Vendas
3. Verifique se os dados são carregados corretamente

## Funcionalidades Implementadas

✅ **Pipeline Kanban**: Visualização em colunas com drag & drop
✅ **Visualização Lista**: Tabela estilo ClickUp
✅ **Seletor de Pipeline**: Dropdown para escolher diferentes pipelines
✅ **Botões de Visualização**: Alternar entre Quadros e Lista
✅ **Integração Supabase**: Carregamento e salvamento de dados
✅ **Tratamento de Erros**: Fallbacks para quando Supabase não está disponível

## Próximos Passos

1. Configure as credenciais do Supabase
2. Execute o SQL para criar as tabelas
3. Teste a criação de leads
4. Teste o drag & drop entre estágios
5. Teste a alternância entre visualizações

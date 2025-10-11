-- Ensure columns used by the function exist
alter table public.whatsapp_atendimentos
  add column if not exists connection_id text,
  add column if not exists numero_cliente text,
  add column if not exists nome_cliente text,
  add column if not exists status text default 'active',
  add column if not exists ultima_mensagem_preview text,
  add column if not exists ultima_mensagem_em timestamptz,
  add column if not exists nao_lidas int default 0;

alter table public.whatsapp_mensagens
  add column if not exists conteudo text,
  add column if not exists tipo text,
  add column if not exists remetente text,
  add column if not exists "timestamp" timestamptz,
  add column if not exists lida boolean default false,
  add column if not exists midia_url text,
  add column if not exists midia_tipo text,
  add column if not exists midia_nome text,
  add column if not exists midia_tamanho integer,
  add column if not exists created_at timestamptz default now();

-- Drop any previous expression-based unique index; recreate a clean column-based one
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='uq_wa_atendimentos_conn_num') then
    drop index public.uq_wa_atendimentos_conn_num;
  end if;
end $$;

create unique index if not exists uq_wa_atendimentos_conn_num
  on public.whatsapp_atendimentos (connection_id, numero_cliente);

create index if not exists idx_wa_conv_last
  on public.whatsapp_atendimentos (ultima_mensagem_em desc);

create index if not exists idx_wa_msg_conv_time
  on public.whatsapp_mensagens (atendimento_id, created_at);

-- Helper RPC (idempotent)
create or replace function public.increment_unread_or_zero(p_atendimento_id uuid)
returns void language plpgsql as $$
begin
  update public.whatsapp_atendimentos
     set nao_lidas = coalesce(nao_lidas,0) + 1
   where id = p_atendimento_id;
end $$;

-- Make sure both tables are in the realtime publication
alter publication supabase_realtime add table public.whatsapp_mensagens;
alter publication supabase_realtime add table public.whatsapp_atendimentos;


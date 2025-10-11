-- Replace the old unique index (connection_id, numero_cliente)
do $$
begin
  if exists (select 1 from pg_indexes where schemaname='public' and indexname='uq_wa_atendimentos_conn_num') then
    drop index public.uq_wa_atendimentos_conn_num;
  end if;
end $$;

-- Conversations are unique per owner + connection + phone
create unique index if not exists uq_wa_atend_owner_conn_num
  on public.whatsapp_atendimentos (owner_id, connection_id, numero_cliente);

-- Helpful indexes
create index if not exists idx_wa_conv_owner_last
  on public.whatsapp_atendimentos (owner_id, ultima_mensagem_em desc);

-- Ensure messages table has owner_id (add if you don't already)
alter table public.whatsapp_mensagens
  add column if not exists owner_id uuid;

create index if not exists idx_wa_msg_owner_time
  on public.whatsapp_mensagens (owner_id, atendimento_id, created_at);

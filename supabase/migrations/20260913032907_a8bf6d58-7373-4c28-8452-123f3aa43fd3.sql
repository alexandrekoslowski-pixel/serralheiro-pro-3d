create table public.orcamento_links (
  codigo text primary key,
  projeto_id text not null,
  signed_url text not null,
  criado_em timestamptz not null default now()
);

grant select, insert on public.orcamento_links to authenticated;
grant all on public.orcamento_links to service_role;

alter table public.orcamento_links enable row level security;
create policy "equipe insere links de orcamento" on public.orcamento_links
  for insert to authenticated with check (true);

create or replace function public.link_orcamento(_codigo text)
returns text
language sql
stable
security definer
set search_path to public
as $$
  select signed_url from public.orcamento_links where codigo = _codigo;
$$;
grant execute on function public.link_orcamento(text) to anon, authenticated;
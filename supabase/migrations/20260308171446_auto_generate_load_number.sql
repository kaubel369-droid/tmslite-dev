create sequence if not exists public.load_number_seq start 1000;

alter table public.loads alter column load_number set default nextval('public.load_number_seq')::text;

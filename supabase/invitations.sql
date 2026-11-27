-- Persistent invitation checks; no user answers or raw invitation codes are stored.
begin;
create extension if not exists pgcrypto with schema extensions;
create schema if not exists coach_invite_private;
revoke all on schema coach_invite_private from public, anon, authenticated;
create table if not exists coach_invite_private.config (
 singleton boolean primary key default true check(singleton),
 gateway_hash text not null check(gateway_hash ~ '^[0-9a-f]{64}$'),
 daily_limit integer not null default 100 check(daily_limit between 1 and 10000),
 budget_day date not null default (now() at time zone 'UTC')::date,
 daily_used integer not null default 0 check(daily_used>=0)
);
create table if not exists coach_invite_private.codes (
 id text primary key,
 code_hash text unique not null check(code_hash ~ '^[0-9a-f]{64}$'),
 enabled boolean not null default true,
 call_limit integer not null default 30 check(call_limit between 1 and 1000),
 used integer not null default 0 check(used>=0 and used<=call_limit),
 valid_days integer not null default 14 check(valid_days between 1 and 90),
 activate_by timestamptz not null default now()+interval '30 days',
 activated_at timestamptz,
 expires_at timestamptz
);
alter table coach_invite_private.config enable row level security;
alter table coach_invite_private.codes enable row level security;
revoke all on all tables in schema coach_invite_private from public, anon, authenticated;
create or replace function public.coach_invite_check(p_code_hash text,p_gateway text,p_consume boolean default false)
returns jsonb language plpgsql security definer set search_path='' as $$
declare cfg coach_invite_private.config%rowtype; c coach_invite_private.codes%rowtype; t timestamptz:=pg_catalog.clock_timestamp(); d date:=(t at time zone 'UTC')::date;
begin
 if p_code_hash is null or p_code_hash !~ '^[0-9a-f]{64}$' or p_gateway is null or length(p_gateway)>256 or p_consume is null then return jsonb_build_object('status','forbidden'); end if;
 -- Global lock first, then code lock: one order for all consumers across processes.
 select * into cfg from coach_invite_private.config where singleton=true for update;
 if not found or cfg.gateway_hash<>pg_catalog.encode(extensions.digest(p_gateway,'sha256'),'hex') then return jsonb_build_object('status','forbidden'); end if;
 select * into c from coach_invite_private.codes where code_hash=p_code_hash for update;
 if not found then return jsonb_build_object('status','invalid'); end if;
 if not c.enabled then return jsonb_build_object('status','disabled'); end if;
 if c.activated_at is null then
  if t>=c.activate_by then return jsonb_build_object('status','expired'); end if;
  update coach_invite_private.codes set activated_at=t,expires_at=t+make_interval(days=>c.valid_days) where id=c.id returning * into c;
 end if;
 if c.expires_at is null or t>=c.expires_at then return jsonb_build_object('status','expired'); end if;
 if c.used>=c.call_limit then return jsonb_build_object('status','exhausted'); end if;
 if p_consume then
  if cfg.budget_day<>d then update coach_invite_private.config set budget_day=d,daily_used=0 where singleton=true returning * into cfg; end if;
  if cfg.daily_used>=cfg.daily_limit then return jsonb_build_object('status','daily_limit'); end if;
  update coach_invite_private.codes set used=used+1 where id=c.id returning * into c;
  update coach_invite_private.config set daily_used=daily_used+1 where singleton=true;
 end if;
 return jsonb_build_object('status','ok','id',c.id,'remaining',c.call_limit-c.used,'expires_at',c.expires_at);
end;
$$;
revoke all on function public.coach_invite_check(text,text,boolean) from public, anon, authenticated;
-- A 256-bit server-only gateway secret is checked before any invite is read.
grant execute on function public.coach_invite_check(text,text,boolean) to anon;
commit;

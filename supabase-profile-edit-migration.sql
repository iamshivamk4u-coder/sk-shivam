-- Run once in Supabase SQL Editor to allow safe self-service profile edits.
-- It deliberately does not allow users to change role, account status, packages, sales, or commissions.

alter table public.profiles add column if not exists avatar_url text;

create or replace function public.update_my_profile(
  p_full_name text,
  p_mobile text,
  p_state text,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_profile public.profiles;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to update your profile.';
  end if;

  update public.profiles
  set
    full_name = trim(p_full_name),
    mobile = nullif(trim(p_mobile), ''),
    state = nullif(trim(p_state), ''),
    avatar_url = nullif(trim(p_avatar_url), '')
  where user_id = auth.uid()
  returning * into updated_profile;

  return updated_profile;
end;
$$;

grant execute on function public.update_my_profile(text, text, text, text) to authenticated;

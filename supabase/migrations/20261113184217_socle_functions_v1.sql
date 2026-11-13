create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function private.shares_box(other uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.box_members a join public.box_members b on a.box_id = b.box_id
                where a.user_id = (select auth.uid()) and b.user_id = other);
$$;
grant execute on function private.shares_box(uuid) to authenticated;

create or replace function private.guard_coach_update() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if private.is_owner(new.box_id) then return new; end if;
  if (to_jsonb(old) - tg_argv) <> (to_jsonb(new) - tg_argv) then
    raise exception 'Modification non autorisée pour un coach';
  end if;
  return new;
end $$;

create trigger guard_event_tasks before update on public.event_tasks for each row execute function private.guard_coach_update('done','done_at');
create trigger guard_actions before update on public.actions for each row execute function private.guard_coach_update('done','done_at');
create trigger guard_onboarding before update on public.onboarding for each row execute function private.guard_coach_update('steps');
create trigger guard_trials before update on public.trials for each row execute function private.guard_coach_update('result','prospect');

create or replace function public.create_box(box_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare b uuid;
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  insert into public.boxes(name, created_by) values (box_name, (select auth.uid())) returning id into b;
  insert into public.box_members(box_id, user_id, role) values (b, (select auth.uid()), 'owner');
  insert into public.box_private(box_id) values (b);
  return b;
end $$;
revoke execute on function public.create_box(text) from public, anon;
grant execute on function public.create_box(text) to authenticated;

create or replace function public.accept_invitation(invite_token uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare inv public.invitations;
begin
  if (select auth.uid()) is null then raise exception 'Connexion requise'; end if;
  select * into inv from public.invitations where token = invite_token and accepted_at is null;
  if inv.id is null then raise exception 'Invitation introuvable ou déjà utilisée'; end if;
  if lower(inv.email) <> lower(coalesce((select auth.jwt()->>'email'),'')) then raise exception 'Cette invitation est destinée à une autre adresse e-mail'; end if;
  insert into public.box_members(box_id, user_id, role, coach_id) values (inv.box_id, (select auth.uid()), inv.role, inv.coach_id)
  on conflict (box_id, user_id) do update set role = excluded.role, coach_id = excluded.coach_id;
  update public.invitations set accepted_at = now() where id = inv.id;
  return inv.box_id;
end $$;
revoke execute on function public.accept_invitation(uuid) from public, anon;
grant execute on function public.accept_invitation(uuid) to authenticated;

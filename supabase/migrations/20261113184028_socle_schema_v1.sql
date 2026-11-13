-- ============ Schéma privé pour les fonctions d'aide ============
create schema if not exists private;
grant usage on schema private to authenticated;

-- ============ Profils ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

-- ============ Salles et membres ============
create table public.boxes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  settings jsonb not null default '{}'::jsonb,   -- réglages visibles par l'équipe (suivi planning, etc.)
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.coaches (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  name text not null,
  role_label text not null default 'Coach' check (role_label in ('Head coach','Coach','Stagiaire')),
  last_review date,
  path text check (path in ('prime','formation')),
  path_since date,
  form_obs date,
  created_at timestamptz not null default now()
);
create index on public.coaches(box_id);

create table public.box_members (
  box_id uuid not null references public.boxes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','coach')),
  coach_id uuid references public.coaches(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (box_id, user_id)
);
create index on public.box_members(user_id);
create index on public.box_members(coach_id);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  email text not null,
  role text not null check (role in ('owner','coach')),
  coach_id uuid references public.coaches(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  accepted_at timestamptz,
  created_by uuid references auth.users(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.invitations(box_id);

-- Réglages réservés à l'owner (simulateur, primes, document d'onboarding…)
create table public.box_private (
  box_id uuid primary key references public.boxes(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- ============ Fonctions d'aide (security definer, hors API) ============
create or replace function private.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

create or replace function private.is_member(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.box_members where box_id = b and user_id = (select auth.uid()))
         or private.is_platform_admin();
$$;

create or replace function private.is_owner(b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.box_members where box_id = b and user_id = (select auth.uid()) and role = 'owner')
         or private.is_platform_admin();
$$;

create or replace function private.my_coach(b uuid) returns uuid
language sql stable security definer set search_path = '' as $$
  select coach_id from public.box_members where box_id = b and user_id = (select auth.uid()) limit 1;
$$;

grant execute on function private.is_platform_admin(), private.is_member(uuid), private.is_owner(uuid), private.my_coach(uuid) to authenticated;

-- ============ Planning et fréquentation ============
create table public.course_types (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  name text not null,
  color_index int not null default 0,
  unique (box_id, name)
);

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),   -- 0 = lundi
  start_time time not null,
  type_name text not null,
  capacity int not null check (capacity > 0),
  test_since date,
  unique (box_id, weekday, start_time)
);
create index on public.courses(box_id);

create table public.attendance (
  course_id uuid not null references public.courses(id) on delete cascade,
  box_id uuid not null references public.boxes(id) on delete cascade,
  day date not null,
  present int not null check (present >= 0),
  primary key (course_id, day)
);
create index on public.attendance(box_id, day);

-- ============ Séances d'essai ============
create table public.trials (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  day date not null default current_date,
  prospect text,
  coach_id uuid references public.coaches(id) on delete set null,
  result text not null default 'att' check (result in ('att','oui','non')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.trials(box_id, day);
create index on public.trials(coach_id);

-- ============ Équipe : observations, réunions ============
create table public.observations (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  coach_id uuid not null references public.coaches(id) on delete cascade,
  observer text,
  day date not null default current_date,
  scores jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);
create index on public.observations(box_id);
create index on public.observations(coach_id);

create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  day date not null,
  notes text,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.meetings(box_id);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  meeting_id uuid references public.meetings(id) on delete set null,
  title text not null,
  assignee text not null default 'owner',   -- 'owner', 'equipe' ou id de coach
  due date not null,
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.actions(box_id);
create index on public.actions(meeting_id);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  title text not null,
  due date not null,
  done boolean not null default false,
  created_at timestamptz not null default now()
);
create index on public.reminders(box_id);

-- ============ Événements ============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  type text not null check (type in ('porte','compet','semi','autre')),
  name text not null,
  day date not null,
  responsible text not null default 'owner',
  goal_participants int default 0,
  goal_trials int default 0,
  created_at timestamptz not null default now()
);
create index on public.events(box_id);

-- Partie financière et bilan : réservée à l'owner
create table public.event_finance (
  event_id uuid primary key references public.events(id) on delete cascade,
  box_id uuid not null references public.boxes(id) on delete cascade,
  budget numeric default 0,
  goal_revenue numeric default 0,
  review jsonb not null default '{}'::jsonb
);
create index on public.event_finance(box_id);

create table public.event_tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  box_id uuid not null references public.boxes(id) on delete cascade,
  title text not null,
  due date not null,
  assignee text not null default 'owner',
  done boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.event_tasks(event_id);
create index on public.event_tasks(box_id);

-- ============ Adhérents, suivi 60 jours, ventes ============
create table public.members (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  name text not null,
  joined date,
  left_on date,
  last_visit date,
  relaunched date,
  created_at timestamptz not null default now()
);
create index on public.members(box_id);

create table public.onboarding (
  id uuid primary key default gen_random_uuid(),
  box_id uuid not null references public.boxes(id) on delete cascade,
  member_name text not null,
  start_day date not null,
  coach_id uuid references public.coaches(id) on delete set null,
  steps jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.onboarding(box_id);
create index on public.onboarding(coach_id);

create table public.sales (
  box_id uuid not null references public.boxes(id) on delete cascade,
  month text not null check (month ~ '^\d{4}-\d{2}$'),
  revenue numeric not null default 0,
  primary key (box_id, month)
);

-- ============ Journal ============
create table public.journal (
  id bigint generated always as identity primary key,
  box_id uuid not null references public.boxes(id) on delete cascade,
  day date not null default current_date,
  text text not null,
  actor uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.journal(box_id, day);

-- ============ Activer RLS partout ============
alter table public.profiles enable row level security;
alter table public.platform_admins enable row level security;
alter table public.boxes enable row level security;
alter table public.coaches enable row level security;
alter table public.box_members enable row level security;
alter table public.invitations enable row level security;
alter table public.box_private enable row level security;
alter table public.course_types enable row level security;
alter table public.courses enable row level security;
alter table public.attendance enable row level security;
alter table public.trials enable row level security;
alter table public.observations enable row level security;
alter table public.meetings enable row level security;
alter table public.actions enable row level security;
alter table public.reminders enable row level security;
alter table public.events enable row level security;
alter table public.event_finance enable row level security;
alter table public.event_tasks enable row level security;
alter table public.members enable row level security;
alter table public.onboarding enable row level security;
alter table public.sales enable row level security;
alter table public.journal enable row level security;

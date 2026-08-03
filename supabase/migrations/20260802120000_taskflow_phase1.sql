-- TaskFlow Phase 1 schema
-- Apply in Supabase SQL editor or via CLI: supabase db push
-- Requires auth.users (Supabase Auth)

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Workspaces
-- ---------------------------------------------------------------------------
create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists workspaces_created_by_idx on public.workspaces (created_by);
create index if not exists workspaces_archived_at_idx on public.workspaces (archived_at);

-- ---------------------------------------------------------------------------
-- Workspace members
-- ---------------------------------------------------------------------------
create type public.workspace_role as enum ('owner', 'admin', 'member', 'viewer');

create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id_idx on public.workspace_members (user_id);
create index if not exists workspace_members_workspace_id_idx on public.workspace_members (workspace_id);

-- ---------------------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------------------
create type public.project_status as enum ('active', 'planning', 'paused', 'done');

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(trim(name)) > 0),
  description text not null default '',
  status public.project_status not null default 'planning',
  color text not null default '#60A5FA',
  due_date date,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists projects_workspace_id_idx on public.projects (workspace_id);
create index if not exists projects_archived_at_idx on public.projects (archived_at);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------
create type public.task_status as enum ('backlog', 'todo', 'in-progress', 'review', 'done');
create type public.task_priority as enum ('low', 'medium', 'high', 'urgent');

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  description text not null default '',
  status public.task_status not null default 'backlog',
  priority public.task_priority not null default 'medium',
  assignee_id uuid references public.profiles (id) on delete set null,
  due_date date,
  labels text[] not null default '{}',
  estimate numeric(8, 2),
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists tasks_workspace_id_idx on public.tasks (workspace_id);
create index if not exists tasks_project_id_idx on public.tasks (project_id);
create index if not exists tasks_assignee_id_idx on public.tasks (assignee_id);
create index if not exists tasks_status_idx on public.tasks (status);
create index if not exists tasks_due_date_idx on public.tasks (due_date);
create index if not exists tasks_archived_at_idx on public.tasks (archived_at);

-- ---------------------------------------------------------------------------
-- Activity events
-- ---------------------------------------------------------------------------
create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_title text,
  old_value text,
  new_value text,
  summary text not null,
  created_at timestamptz not null default now()
);

create index if not exists activity_events_workspace_id_idx on public.activity_events (workspace_id);
create index if not exists activity_events_created_at_idx on public.activity_events (created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists workspaces_set_updated_at on public.workspaces;
create trigger workspaces_set_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on signup
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1), 'User'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(nullif(excluded.display_name, ''), profiles.display_name),
        avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer to avoid RLS recursion)
-- ---------------------------------------------------------------------------
create or replace function public.is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
  );
$$;

create or replace function public.workspace_role_for(p_workspace_id uuid)
returns public.workspace_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.has_workspace_role(
  p_workspace_id uuid,
  p_roles public.workspace_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = auth.uid()
      and m.role = any (p_roles)
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.activity_events enable row level security;

-- Profiles
drop policy if exists profiles_select_authenticated on public.profiles;
create policy profiles_select_authenticated
on public.profiles for select
to authenticated
using (true);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Workspaces
drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member
on public.workspaces for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists workspaces_insert_authenticated on public.workspaces;
create policy workspaces_insert_authenticated
on public.workspaces for insert
to authenticated
with check (created_by = auth.uid());

drop policy if exists workspaces_update_owner_admin on public.workspaces;
create policy workspaces_update_owner_admin
on public.workspaces for update
to authenticated
using (public.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(id, array['owner', 'admin']::public.workspace_role[]));

drop policy if exists workspaces_delete_owner on public.workspaces;
create policy workspaces_delete_owner
on public.workspaces for delete
to authenticated
using (public.has_workspace_role(id, array['owner']::public.workspace_role[]));

-- Workspace members
drop policy if exists workspace_members_select_member on public.workspace_members;
create policy workspace_members_select_member
on public.workspace_members for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists workspace_members_insert_owner_admin on public.workspace_members;
create policy workspace_members_insert_owner_admin
on public.workspace_members for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  or (user_id = auth.uid() and role = 'owner')
);

drop policy if exists workspace_members_update_owner_admin on public.workspace_members;
create policy workspace_members_update_owner_admin
on public.workspace_members for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

drop policy if exists workspace_members_delete_owner_admin on public.workspace_members;
create policy workspace_members_delete_owner_admin
on public.workspace_members for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

-- Projects
drop policy if exists projects_select_member on public.projects;
create policy projects_select_member
on public.projects for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists projects_insert_admin on public.projects;
create policy projects_insert_admin
on public.projects for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[])
  and created_by = auth.uid()
);

drop policy if exists projects_update_admin on public.projects;
create policy projects_update_admin
on public.projects for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

drop policy if exists projects_delete_admin on public.projects;
create policy projects_delete_admin
on public.projects for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin']::public.workspace_role[]));

-- Tasks
drop policy if exists tasks_select_member on public.tasks;
create policy tasks_select_member
on public.tasks for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists tasks_insert_member on public.tasks;
create policy tasks_insert_member
on public.tasks for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']::public.workspace_role[])
  and created_by = auth.uid()
);

drop policy if exists tasks_update_member on public.tasks;
create policy tasks_update_member
on public.tasks for update
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']::public.workspace_role[]))
with check (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']::public.workspace_role[]));

drop policy if exists tasks_delete_member on public.tasks;
create policy tasks_delete_member
on public.tasks for delete
to authenticated
using (public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']::public.workspace_role[]));

-- Activity
drop policy if exists activity_select_member on public.activity_events;
create policy activity_select_member
on public.activity_events for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists activity_insert_member on public.activity_events;
create policy activity_insert_member
on public.activity_events for insert
to authenticated
with check (
  public.has_workspace_role(workspace_id, array['owner', 'admin', 'member']::public.workspace_role[])
);

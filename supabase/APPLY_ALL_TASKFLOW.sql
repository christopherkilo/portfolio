-- TaskFlow APPLY ALL — paste into Supabase Dashboard → SQL → New query
-- Order: Phase 1 → Phase 2 → Phase 2 stabilization → Phase 3 → Phase 3 stabilization
-- Safe to re-run where migrations use IF NOT EXISTS / DROP IF EXISTS.


-- =============================================================================
-- BEGIN supabase/migrations/20260802120000_taskflow_phase1.sql
-- =============================================================================

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

-- =============================================================================
-- END supabase/migrations/20260802120000_taskflow_phase1.sql
-- =============================================================================

-- =============================================================================
-- BEGIN supabase/migrations/20260802160000_taskflow_phase2.sql
-- =============================================================================

-- TaskFlow Phase 2 collaboration schema
-- Apply after Phase 1 migration. Do not rewrite Phase 1.

-- ---------------------------------------------------------------------------
-- Activity enrichment
-- ---------------------------------------------------------------------------
alter table public.activity_events
  add column if not exists metadata jsonb not null default '{}'::jsonb;

create index if not exists activity_events_metadata_gin
  on public.activity_events using gin (metadata);

-- ---------------------------------------------------------------------------
-- Task assignees (multi-assignee)
-- ---------------------------------------------------------------------------
create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  primary key (task_id, user_id)
);

create index if not exists task_assignees_task_id_idx on public.task_assignees (task_id);
create index if not exists task_assignees_user_id_idx on public.task_assignees (user_id);

-- Backfill from legacy tasks.assignee_id
insert into public.task_assignees (task_id, user_id, assigned_by, assigned_at)
select t.id, t.assignee_id, t.created_by, coalesce(t.updated_at, t.created_at)
from public.tasks t
where t.assignee_id is not null
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Comments
-- ---------------------------------------------------------------------------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  body text not null check (char_length(trim(body)) > 0 and char_length(body) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists comments_task_id_idx on public.comments (task_id);
create index if not exists comments_workspace_id_idx on public.comments (workspace_id);
create index if not exists comments_created_at_idx on public.comments (created_at desc);
create index if not exists comments_deleted_at_idx on public.comments (deleted_at);

drop trigger if exists comments_set_updated_at on public.comments;
create trigger comments_set_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Workspace invitations
-- ---------------------------------------------------------------------------
create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  email text not null check (char_length(trim(email)) > 0),
  role public.workspace_role not null default 'member'
    check (role in ('admin', 'member', 'viewer')),
  token_hash text not null unique,
  invited_by uuid not null references public.profiles (id) on delete restrict,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists workspace_invitations_workspace_id_idx
  on public.workspace_invitations (workspace_id);
create index if not exists workspace_invitations_email_idx
  on public.workspace_invitations (lower(email));
create index if not exists workspace_invitations_expires_at_idx
  on public.workspace_invitations (expires_at);

-- One active invitation per workspace+email
create unique index if not exists workspace_invitations_active_unique
  on public.workspace_invitations (workspace_id, lower(email))
  where accepted_at is null and revoked_at is null;

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------
create type public.notification_type as enum (
  'task_assigned',
  'comment_added',
  'invitation_received',
  'project_due_soon',
  'task_due_soon',
  'task_completed',
  'role_changed',
  'member_removed'
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type public.notification_type not null,
  entity_type text not null,
  entity_id uuid,
  actor_id uuid references public.profiles (id) on delete set null,
  title text not null,
  message text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx on public.notifications (user_id);
create index if not exists notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;
create index if not exists notifications_created_at_idx
  on public.notifications (created_at desc);
create index if not exists notifications_workspace_id_idx
  on public.notifications (workspace_id);

-- Soft dedupe helper: same user/type/entity within short window (app-level);
-- unique optional key for idempotent inserts when client supplies dedupe_key
alter table public.notifications
  add column if not exists dedupe_key text;

create unique index if not exists notifications_dedupe_unique
  on public.notifications (user_id, dedupe_key)
  where dedupe_key is not null;

-- ---------------------------------------------------------------------------
-- Accept invitation (trusted workflow; caller need not be a member yet)
-- ---------------------------------------------------------------------------
create or replace function public.accept_workspace_invitation(p_token_hash text)
returns table (
  invitation_id uuid,
  workspace_id uuid,
  role public.workspace_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.workspace_invitations%rowtype;
  uid uuid := auth.uid();
  user_email text;
begin
  if uid is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select lower(coalesce(email, '')) into user_email from public.profiles where id = uid;
  if user_email is null or user_email = '' then
    select lower(coalesce(email, '')) into user_email from auth.users where id = uid;
  end if;

  select * into inv
  from public.workspace_invitations wi
  where wi.token_hash = p_token_hash
  for update;

  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if inv.revoked_at is not null then
    raise exception 'INVITATION_REVOKED' using errcode = 'P0003';
  end if;

  if inv.accepted_at is not null then
    raise exception 'INVITATION_ALREADY_ACCEPTED' using errcode = 'P0004';
  end if;

  if inv.expires_at <= now() then
    raise exception 'INVITATION_EXPIRED' using errcode = 'P0005';
  end if;

  if user_email is null or lower(inv.email) <> user_email then
    raise exception 'INVITATION_EMAIL_MISMATCH' using errcode = 'P0006';
  end if;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (inv.workspace_id, uid, inv.role)
  on conflict (workspace_id, user_id) do nothing;

  update public.workspace_invitations
  set accepted_at = now()
  where id = inv.id;

  invitation_id := inv.id;
  workspace_id := inv.workspace_id;
  role := inv.role;
  return next;
end;
$$;

revoke all on function public.accept_workspace_invitation(text) from public;
grant execute on function public.accept_workspace_invitation(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Assignee must belong to task workspace (trigger)
-- ---------------------------------------------------------------------------
create or replace function public.enforce_task_assignee_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid;
begin
  select t.workspace_id into ws from public.tasks t where t.id = new.task_id;
  if ws is null then
    raise exception 'TASK_NOT_FOUND';
  end if;
  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = new.user_id
  ) then
    raise exception 'ASSIGNEE_NOT_MEMBER';
  end if;
  return new;
end;
$$;

drop trigger if exists task_assignees_enforce_membership on public.task_assignees;
create trigger task_assignees_enforce_membership
before insert or update on public.task_assignees
for each row execute function public.enforce_task_assignee_membership();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.task_assignees enable row level security;
alter table public.comments enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.notifications enable row level security;

-- task_assignees
drop policy if exists task_assignees_select on public.task_assignees;
create policy task_assignees_select
on public.task_assignees for select
to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id and public.is_workspace_member(t.workspace_id)
  )
);

drop policy if exists task_assignees_insert on public.task_assignees;
create policy task_assignees_insert
on public.task_assignees for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.has_workspace_role(
        t.workspace_id,
        array['owner', 'admin', 'member']::public.workspace_role[]
      )
  )
);

drop policy if exists task_assignees_delete on public.task_assignees;
create policy task_assignees_delete
on public.task_assignees for delete
to authenticated
using (
  exists (
    select 1 from public.tasks t
    where t.id = task_id
      and public.has_workspace_role(
        t.workspace_id,
        array['owner', 'admin', 'member']::public.workspace_role[]
      )
  )
);

-- comments
drop policy if exists comments_select on public.comments;
create policy comments_select
on public.comments for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists comments_insert on public.comments;
create policy comments_insert
on public.comments for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
  and author_id = auth.uid()
);

drop policy if exists comments_update on public.comments;
create policy comments_update
on public.comments for update
to authenticated
using (
  author_id = auth.uid()
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
)
with check (
  author_id = auth.uid()
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
);

-- invitations: owners/admins only; no public token lookup via select
drop policy if exists invitations_select on public.workspace_invitations;
create policy invitations_select
on public.workspace_invitations for select
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
);

drop policy if exists invitations_insert on public.workspace_invitations;
create policy invitations_insert
on public.workspace_invitations for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
  and invited_by = auth.uid()
  and role in ('admin', 'member', 'viewer')
);

drop policy if exists invitations_update on public.workspace_invitations;
create policy invitations_update
on public.workspace_invitations for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
);

-- notifications
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own
on public.notifications for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own
on public.notifications for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists notifications_insert_actor on public.notifications;
create policy notifications_insert_actor
on public.notifications for insert
to authenticated
with check (
  actor_id = auth.uid()
  and public.is_workspace_member(workspace_id)
);

-- Realtime publication (ignore if already added)
do $$
begin
  begin
    alter publication supabase_realtime add table public.tasks;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.task_assignees;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.comments;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.activity_events;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.workspace_members;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.notifications;
  exception when duplicate_object then null;
  end;
end $$;

-- =============================================================================
-- END supabase/migrations/20260802160000_taskflow_phase2.sql
-- =============================================================================

-- =============================================================================
-- BEGIN supabase/migrations/20260802180000_taskflow_stabilization.sql
-- =============================================================================

-- TaskFlow Phase 2 stabilization
-- Apply after 20260802160000_taskflow_phase2.sql. Do not rewrite prior migrations.

-- ---------------------------------------------------------------------------
-- 1. Notifications: remove broad INSERT; controlled SECURITY DEFINER RPC
-- ---------------------------------------------------------------------------
drop policy if exists notifications_insert_actor on public.notifications;

create or replace function public.create_taskflow_notification(
  p_user_id uuid,
  p_workspace_id uuid,
  p_type public.notification_type,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_message text default '',
  p_metadata jsonb default '{}'::jsonb,
  p_dedupe_key text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  row public.notifications;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if p_user_id is null or p_workspace_id is null or p_type is null
     or p_entity_type is null or char_length(trim(p_title)) = 0 then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0002';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = p_user_id
  ) then
    raise exception 'RECIPIENT_NOT_MEMBER' using errcode = 'P0004';
  end if;

  if p_entity_type = 'task' and p_entity_id is not null then
    if not exists (
      select 1 from public.tasks t
      where t.id = p_entity_id and t.workspace_id = p_workspace_id
    ) then
      raise exception 'INVALID_ENTITY' using errcode = 'P0005';
    end if;
  elsif p_entity_type = 'project' and p_entity_id is not null then
    if not exists (
      select 1 from public.projects p
      where p.id = p_entity_id and p.workspace_id = p_workspace_id
    ) then
      raise exception 'INVALID_ENTITY' using errcode = 'P0005';
    end if;
  elsif p_entity_type = 'member' and p_entity_id is not null then
    if not exists (
      select 1 from public.workspace_members m
      where m.workspace_id = p_workspace_id and m.user_id = p_entity_id
    ) then
      raise exception 'INVALID_ENTITY' using errcode = 'P0005';
    end if;
  end if;

  begin
    insert into public.notifications (
      user_id, workspace_id, type, entity_type, entity_id,
      actor_id, title, message, metadata, dedupe_key
    )
    values (
      p_user_id, p_workspace_id, p_type, p_entity_type, p_entity_id,
      actor, p_title, coalesce(p_message, ''), coalesce(p_metadata, '{}'::jsonb), p_dedupe_key
    )
    returning * into row;
    return row;
  exception
    when unique_violation then
      select * into row
      from public.notifications n
      where n.user_id = p_user_id and n.dedupe_key = p_dedupe_key
      limit 1;
      return row;
  end;
end;
$$;

revoke all on function public.create_taskflow_notification(
  uuid, uuid, public.notification_type, text, uuid, text, text, jsonb, text
) from public;
grant execute on function public.create_taskflow_notification(
  uuid, uuid, public.notification_type, text, uuid, text, text, jsonb, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Immutable column triggers
-- ---------------------------------------------------------------------------
create or replace function public.reject_immutable_comment_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.workspace_id is distinct from old.workspace_id
     or new.task_id is distinct from old.task_id
     or new.author_id is distinct from old.author_id
     or new.created_at is distinct from old.created_at then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  return new;
end;
$$;

drop trigger if exists comments_reject_immutable on public.comments;
create trigger comments_reject_immutable
before update on public.comments
for each row execute function public.reject_immutable_comment_columns();

create or replace function public.reject_immutable_invitation_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.workspace_id is distinct from old.workspace_id
     or new.email is distinct from old.email
     or new.token_hash is distinct from old.token_hash
     or new.invited_by is distinct from old.invited_by
     or new.created_at is distinct from old.created_at
     or new.role is distinct from old.role then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  -- only accepted_at / revoked_at / expires_at may change via intended ops
  return new;
end;
$$;

drop trigger if exists invitations_reject_immutable on public.workspace_invitations;
create trigger invitations_reject_immutable
before update on public.workspace_invitations
for each row execute function public.reject_immutable_invitation_columns();

create or replace function public.reject_immutable_assignee_columns()
returns trigger
language plpgsql
as $$
begin
  if new.task_id is distinct from old.task_id
     or new.user_id is distinct from old.user_id
     or new.assigned_by is distinct from old.assigned_by
     or new.assigned_at is distinct from old.assigned_at
     or new.workspace_id is distinct from old.workspace_id then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  return new;
end;
$$;

create or replace function public.reject_immutable_notification_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.workspace_id is distinct from old.workspace_id
     or new.actor_id is distinct from old.actor_id
     or new.type is distinct from old.type
     or new.entity_type is distinct from old.entity_type
     or new.entity_id is distinct from old.entity_id
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.metadata is distinct from old.metadata
     or new.dedupe_key is distinct from old.dedupe_key
     or new.created_at is distinct from old.created_at then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  -- only read_at may change
  return new;
end;
$$;

drop trigger if exists notifications_reject_immutable on public.notifications;
create trigger notifications_reject_immutable
before update on public.notifications
for each row execute function public.reject_immutable_notification_columns();

-- ---------------------------------------------------------------------------
-- 3. task_assignees.workspace_id + authoritative assignment sync
-- ---------------------------------------------------------------------------
alter table public.task_assignees
  add column if not exists workspace_id uuid references public.workspaces (id) on delete cascade;

update public.task_assignees ta
set workspace_id = t.workspace_id
from public.tasks t
where ta.task_id = t.id
  and ta.workspace_id is null;

delete from public.task_assignees where workspace_id is null;

alter table public.task_assignees
  alter column workspace_id set not null;

create index if not exists task_assignees_workspace_id_idx
  on public.task_assignees (workspace_id);
create index if not exists task_assignees_workspace_task_idx
  on public.task_assignees (workspace_id, task_id);

create or replace function public.set_task_assignee_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid;
begin
  select t.workspace_id into ws from public.tasks t where t.id = new.task_id;
  if ws is null then
    raise exception 'TASK_NOT_FOUND';
  end if;
  new.workspace_id := ws;

  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = ws and m.user_id = new.user_id
  ) then
    raise exception 'ASSIGNEE_NOT_MEMBER';
  end if;

  return new;
end;
$$;

drop trigger if exists task_assignees_enforce_membership on public.task_assignees;
drop trigger if exists task_assignees_set_workspace on public.task_assignees;
create trigger task_assignees_set_workspace
before insert or update on public.task_assignees
for each row execute function public.set_task_assignee_workspace();

drop trigger if exists task_assignees_reject_immutable on public.task_assignees;
create trigger task_assignees_reject_immutable
before update on public.task_assignees
for each row execute function public.reject_immutable_assignee_columns();

-- Keep tasks.assignee_id as denormalized primary (first assignee) for compat — NOT authoritative
create or replace function public.sync_task_primary_assignee()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid;
  primary_user uuid;
begin
  tid := coalesce(new.task_id, old.task_id);
  select ta.user_id into primary_user
  from public.task_assignees ta
  where ta.task_id = tid
  order by ta.assigned_at asc
  limit 1;

  update public.tasks
  set assignee_id = primary_user
  where id = tid
    and assignee_id is distinct from primary_user;

  return coalesce(new, old);
end;
$$;

drop trigger if exists task_assignees_sync_primary on public.task_assignees;
create trigger task_assignees_sync_primary
after insert or delete on public.task_assignees
for each row execute function public.sync_task_primary_assignee();

-- RLS: prefer workspace_id
drop policy if exists task_assignees_select on public.task_assignees;
create policy task_assignees_select
on public.task_assignees for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists task_assignees_insert on public.task_assignees;
create policy task_assignees_insert
on public.task_assignees for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
);

drop policy if exists task_assignees_delete on public.task_assignees;
create policy task_assignees_delete
on public.task_assignees for delete
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
);

-- ---------------------------------------------------------------------------
-- 4. Atomic task create with assignees
-- ---------------------------------------------------------------------------
create or replace function public.create_task_with_assignees(
  p_workspace_id uuid,
  p_project_id uuid,
  p_title text,
  p_description text default '',
  p_status public.task_status default 'backlog',
  p_priority public.task_priority default 'medium',
  p_due_date date default null,
  p_labels text[] default '{}',
  p_estimate numeric default null,
  p_assignee_ids uuid[] default '{}'
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  task_row public.tasks;
  uid uuid;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if not public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if not exists (
    select 1 from public.projects p
    where p.id = p_project_id
      and p.workspace_id = p_workspace_id
      and p.archived_at is null
  ) then
    raise exception 'INVALID_PROJECT' using errcode = 'P0006';
  end if;

  foreach uid in array coalesce(p_assignee_ids, '{}') loop
    if not exists (
      select 1 from public.workspace_members m
      where m.workspace_id = p_workspace_id and m.user_id = uid
    ) then
      raise exception 'ASSIGNEE_NOT_MEMBER' using errcode = 'P0004';
    end if;
  end loop;

  insert into public.tasks (
    workspace_id, project_id, title, description, status, priority,
    due_date, labels, estimate, created_by, assignee_id
  )
  values (
    p_workspace_id, p_project_id, p_title, coalesce(p_description, ''),
    coalesce(p_status, 'backlog'), coalesce(p_priority, 'medium'),
    p_due_date, coalesce(p_labels, '{}'), p_estimate, actor, null
  )
  returning * into task_row;

  foreach uid in array coalesce(p_assignee_ids, '{}') loop
    insert into public.task_assignees (task_id, user_id, assigned_by, workspace_id)
    values (task_row.id, uid, actor, p_workspace_id)
    on conflict do nothing;
  end loop;

  select * into task_row from public.tasks where id = task_row.id;
  return task_row;
end;
$$;

revoke all on function public.create_task_with_assignees(
  uuid, uuid, text, text, public.task_status, public.task_priority, date, text[], numeric, uuid[]
) from public;
grant execute on function public.create_task_with_assignees(
  uuid, uuid, text, text, public.task_status, public.task_priority, date, text[], numeric, uuid[]
) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Invitation create with expired-row replacement
-- ---------------------------------------------------------------------------
create or replace function public.create_workspace_invitation(
  p_workspace_id uuid,
  p_email text,
  p_role public.workspace_role,
  p_token_hash text,
  p_expires_at timestamptz
)
returns public.workspace_invitations
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  normalized text := lower(trim(p_email));
  inv public.workspace_invitations;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if not public.has_workspace_role(
    p_workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if p_role not in ('admin', 'member', 'viewer') then
    raise exception 'VALIDATION_ERROR' using errcode = 'P0002';
  end if;

  -- Revoke expired unaccepted invitations for this email
  update public.workspace_invitations
  set revoked_at = now()
  where workspace_id = p_workspace_id
    and lower(email) = normalized
    and accepted_at is null
    and revoked_at is null
    and expires_at <= now();

  if exists (
    select 1 from public.workspace_invitations wi
    where wi.workspace_id = p_workspace_id
      and lower(wi.email) = normalized
      and wi.accepted_at is null
      and wi.revoked_at is null
      and wi.expires_at > now()
  ) then
    raise exception 'ACTIVE_INVITATION_EXISTS' using errcode = 'P0008';
  end if;

  if exists (
    select 1
    from public.workspace_members m
    join public.profiles p on p.id = m.user_id
    where m.workspace_id = p_workspace_id
      and lower(coalesce(p.email, '')) = normalized
  ) then
    raise exception 'ALREADY_MEMBER' using errcode = 'P0009';
  end if;

  insert into public.workspace_invitations (
    workspace_id, email, role, token_hash, invited_by, expires_at
  )
  values (
    p_workspace_id, normalized, p_role, p_token_hash, actor, p_expires_at
  )
  returning * into inv;

  return inv;
end;
$$;

revoke all on function public.create_workspace_invitation(
  uuid, text, public.workspace_role, text, timestamptz
) from public;
grant execute on function public.create_workspace_invitation(
  uuid, text, public.workspace_role, text, timestamptz
) to authenticated;

-- Comment: only body and deleted_at (+ updated_at via trigger) should change via app.
-- Invitation role immutability above prevents role edits after create.

-- =============================================================================
-- END supabase/migrations/20260802180000_taskflow_stabilization.sql
-- =============================================================================

-- =============================================================================
-- BEGIN supabase/migrations/20260802190000_taskflow_phase3.sql
-- =============================================================================

-- TaskFlow Phase 3 — resilience & advanced collaboration
-- Apply after Phase 2 + stabilization. Do not rewrite prior migrations.

-- ---------------------------------------------------------------------------
-- B1. Versioning
-- ---------------------------------------------------------------------------
alter table public.tasks
  add column if not exists version bigint not null default 1;

alter table public.projects
  add column if not exists version bigint not null default 1;

-- ---------------------------------------------------------------------------
-- B2. Enrich activity_events for durable audit
-- ---------------------------------------------------------------------------
alter table public.activity_events
  add column if not exists changes jsonb not null default '{}'::jsonb;

alter table public.activity_events
  add column if not exists request_id text;

alter table public.activity_events
  add column if not exists source text not null default 'api';

create index if not exists activity_events_entity_idx
  on public.activity_events (workspace_id, entity_type, entity_id, created_at desc);

create index if not exists activity_events_actor_idx
  on public.activity_events (workspace_id, actor_id, created_at desc);

-- Ordinary users cannot update/delete activity (append-only)
drop policy if exists activity_update_deny on public.activity_events;
create policy activity_update_deny
on public.activity_events for update
to authenticated
using (false);

drop policy if exists activity_delete_deny on public.activity_events;
create policy activity_delete_deny
on public.activity_events for delete
to authenticated
using (false);

-- ---------------------------------------------------------------------------
-- B3. Attachments metadata
-- ---------------------------------------------------------------------------
create table if not exists public.task_attachments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  storage_path text not null,
  file_name text not null check (char_length(trim(file_name)) > 0 and char_length(file_name) <= 255),
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 10485760),
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (storage_path)
);

create index if not exists task_attachments_task_id_idx
  on public.task_attachments (task_id) where deleted_at is null;
create index if not exists task_attachments_workspace_id_idx
  on public.task_attachments (workspace_id);

alter table public.task_attachments enable row level security;

drop policy if exists task_attachments_select on public.task_attachments;
create policy task_attachments_select
on public.task_attachments for select
to authenticated
using (public.is_workspace_member(workspace_id) and deleted_at is null);

drop policy if exists task_attachments_insert on public.task_attachments;
create policy task_attachments_insert
on public.task_attachments for insert
to authenticated
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
  and uploaded_by = auth.uid()
);

drop policy if exists task_attachments_update on public.task_attachments;
create policy task_attachments_update
on public.task_attachments for update
to authenticated
using (
  uploaded_by = auth.uid()
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
)
with check (
  uploaded_by = auth.uid()
  or public.has_workspace_role(
    workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  )
);

-- ---------------------------------------------------------------------------
-- B4. Notification grouping + preferences
-- ---------------------------------------------------------------------------
alter table public.notifications
  add column if not exists group_key text;

alter table public.notifications
  add column if not exists occurrence_count int not null default 1;

alter table public.notifications
  add column if not exists last_occurred_at timestamptz not null default now();

create unique index if not exists notifications_group_unread_unique
  on public.notifications (user_id, group_key)
  where group_key is not null and read_at is null;

create table if not exists public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  assignments boolean not null default true,
  comments boolean not null default true,
  mentions boolean not null default true,
  due_dates boolean not null default true,
  project_changes boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.notification_preferences enable row level security;

drop policy if exists notification_prefs_select on public.notification_preferences;
create policy notification_prefs_select
on public.notification_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists notification_prefs_upsert on public.notification_preferences;
create policy notification_prefs_insert
on public.notification_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists notification_prefs_update on public.notification_preferences;
create policy notification_prefs_update
on public.notification_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Versioned task update RPC
-- ---------------------------------------------------------------------------
create or replace function public.update_task_versioned(
  p_task_id uuid,
  p_expected_version bigint,
  p_title text default null,
  p_description text default null,
  p_status public.task_status default null,
  p_priority public.task_priority default null,
  p_project_id uuid default null,
  p_due_date date default null,
  p_labels text[] default null,
  p_estimate numeric default null,
  p_archived boolean default null
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current public.tasks;
  updated public.tasks;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select * into current from public.tasks where id = p_task_id for update;
  if not found or current.archived_at is not null then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.has_workspace_role(
    current.workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if current.version is distinct from p_expected_version then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  if p_project_id is not null then
    if not exists (
      select 1 from public.projects p
      where p.id = p_project_id
        and p.workspace_id = current.workspace_id
        and p.archived_at is null
    ) then
      raise exception 'INVALID_PROJECT' using errcode = 'P0006';
    end if;
  end if;

  update public.tasks t
  set
    title = coalesce(p_title, t.title),
    description = coalesce(p_description, t.description),
    status = coalesce(p_status, t.status),
    priority = coalesce(p_priority, t.priority),
    project_id = coalesce(p_project_id, t.project_id),
    due_date = case when p_due_date is null and p_title is null and p_description is null
                      and p_status is null and p_priority is null and p_project_id is null
                      and p_labels is null and p_estimate is null and p_archived is null
                    then t.due_date
                    when p_due_date is null then t.due_date
                    else p_due_date end,
    labels = coalesce(p_labels, t.labels),
    estimate = coalesce(p_estimate, t.estimate),
    archived_at = case
      when p_archived is true then coalesce(t.archived_at, now())
      when p_archived is false then null
      else t.archived_at
    end,
    version = t.version + 1,
    updated_at = now()
  where t.id = p_task_id
    and t.version = p_expected_version
  returning * into updated;

  if not found then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  return updated;
end;
$$;

revoke all on function public.update_task_versioned(
  uuid, bigint, text, text, public.task_status, public.task_priority, uuid, date, text[], numeric, boolean
) from public;
grant execute on function public.update_task_versioned(
  uuid, bigint, text, text, public.task_status, public.task_priority, uuid, date, text[], numeric, boolean
) to authenticated;

-- Versioned project update
create or replace function public.update_project_versioned(
  p_project_id uuid,
  p_expected_version bigint,
  p_name text default null,
  p_description text default null,
  p_status public.project_status default null,
  p_color text default null,
  p_due_date date default null,
  p_archived boolean default null
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current public.projects;
  updated public.projects;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  select * into current from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.has_workspace_role(
    current.workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if current.version is distinct from p_expected_version then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  update public.projects p
  set
    name = coalesce(p_name, p.name),
    description = coalesce(p_description, p.description),
    status = coalesce(p_status, p.status),
    color = coalesce(p_color, p.color),
    due_date = coalesce(p_due_date, p.due_date),
    archived_at = case
      when p_archived is true then coalesce(p.archived_at, now())
      when p_archived is false then null
      else p.archived_at
    end,
    version = p.version + 1,
    updated_at = now()
  where p.id = p_project_id
    and p.version = p_expected_version
  returning * into updated;

  if not found then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  return updated;
end;
$$;

revoke all on function public.update_project_versioned(
  uuid, bigint, text, text, public.project_status, text, date, boolean
) from public;
grant execute on function public.update_project_versioned(
  uuid, bigint, text, text, public.project_status, text, date, boolean
) to authenticated;

-- Grouped notification helper (updates existing unread group or inserts)
create or replace function public.create_or_group_notification(
  p_user_id uuid,
  p_workspace_id uuid,
  p_type public.notification_type,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_message text default '',
  p_metadata jsonb default '{}'::jsonb,
  p_group_key text default null,
  p_dedupe_key text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  row public.notifications;
  prefs public.notification_preferences%rowtype;
  allowed boolean := true;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = p_user_id
  ) then
    raise exception 'RECIPIENT_NOT_MEMBER' using errcode = 'P0004';
  end if;

  select * into prefs from public.notification_preferences where user_id = p_user_id;
  if found then
    if p_type = 'task_assigned' and not prefs.assignments then allowed := false; end if;
    if p_type = 'comment_added' and not prefs.comments then allowed := false; end if;
    if p_type in ('task_due_soon', 'project_due_soon') and not prefs.due_dates then allowed := false; end if;
    if p_type in ('role_changed', 'member_removed') and not prefs.project_changes then allowed := false; end if;
  end if;

  if not allowed then
    return null;
  end if;

  if p_group_key is not null then
    update public.notifications n
    set
      occurrence_count = n.occurrence_count + 1,
      last_occurred_at = now(),
      title = p_title,
      message = p_message,
      metadata = coalesce(p_metadata, '{}'::jsonb)
    where n.user_id = p_user_id
      and n.group_key = p_group_key
      and n.read_at is null
    returning * into row;

    if found then
      return row;
    end if;
  end if;

  insert into public.notifications (
    user_id, workspace_id, type, entity_type, entity_id,
    actor_id, title, message, metadata, dedupe_key,
    group_key, occurrence_count, last_occurred_at
  )
  values (
    p_user_id, p_workspace_id, p_type, p_entity_type, p_entity_id,
    actor, p_title, coalesce(p_message, ''), coalesce(p_metadata, '{}'::jsonb), p_dedupe_key,
    p_group_key, 1, now()
  )
  returning * into row;

  return row;
exception
  when unique_violation then
    if p_group_key is not null then
      update public.notifications n
      set
        occurrence_count = n.occurrence_count + 1,
        last_occurred_at = now(),
        title = p_title,
        message = p_message
      where n.user_id = p_user_id and n.group_key = p_group_key and n.read_at is null
      returning * into row;
      return row;
    end if;
    return null;
end;
$$;

revoke all on function public.create_or_group_notification(
  uuid, uuid, public.notification_type, text, uuid, text, text, jsonb, text, text
) from public;
grant execute on function public.create_or_group_notification(
  uuid, uuid, public.notification_type, text, uuid, text, text, jsonb, text, text
) to authenticated;

-- Storage bucket note: create privately in dashboard / CLI:
-- insert into storage.buckets (id, name, public) values ('taskflow-attachments', 'taskflow-attachments', false);
--
-- Preferred storage policies (run after bucket exists):
-- create policy taskflow_attachments_select on storage.objects for select to authenticated
--   using (bucket_id = 'taskflow-attachments' and public.is_workspace_member((storage.foldername(name))[1]::uuid));
-- create policy taskflow_attachments_insert on storage.objects for insert to authenticated
--   with check (bucket_id = 'taskflow-attachments' and public.has_workspace_role((storage.foldername(name))[1]::uuid, 'member'));
-- create policy taskflow_attachments_update on storage.objects for update to authenticated
--   using (bucket_id = 'taskflow-attachments' and public.has_workspace_role((storage.foldername(name))[1]::uuid, 'member'));
-- create policy taskflow_attachments_delete on storage.objects for delete to authenticated
--   using (bucket_id = 'taskflow-attachments' and public.has_workspace_role((storage.foldername(name))[1]::uuid, 'member'));
--
-- Ordinary browser uploads use short-lived signed upload URLs from Route Handlers.
-- Downloads use short-lived signed download URLs after membership checks.
-- Never mark this bucket public.

-- =============================================================================
-- END supabase/migrations/20260802190000_taskflow_phase3.sql
-- =============================================================================

-- =============================================================================
-- BEGIN supabase/migrations/20260802200000_taskflow_phase3_stabilization.sql
-- =============================================================================

-- TaskFlow Phase 3 final stabilization
-- Apply after 20260802190000_taskflow_phase3.sql. Do not rewrite prior migrations.

-- ---------------------------------------------------------------------------
-- 1. Attachment lifecycle
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.attachment_status as enum ('pending', 'ready', 'failed', 'deleted');
exception when duplicate_object then null;
end $$;

alter table public.task_attachments
  add column if not exists status public.attachment_status;

alter table public.task_attachments
  add column if not exists completed_at timestamptz;

alter table public.task_attachments
  add column if not exists failed_at timestamptz;

alter table public.task_attachments
  add column if not exists activity_recorded_at timestamptz;

-- Backfill: existing non-deleted rows treated as ready (Phase 3 demo data)
update public.task_attachments
set status = 'ready',
    completed_at = coalesce(completed_at, created_at)
where status is null and deleted_at is null;

update public.task_attachments
set status = 'deleted'
where status is null and deleted_at is not null;

alter table public.task_attachments
  alter column status set default 'pending';

alter table public.task_attachments
  alter column status set not null;

create index if not exists task_attachments_task_ready_idx
  on public.task_attachments (task_id)
  where status = 'ready' and deleted_at is null;

create index if not exists task_attachments_pending_created_idx
  on public.task_attachments (created_at)
  where status = 'pending';

-- Select: members see ready (and own pending for completion UX)
drop policy if exists task_attachments_select on public.task_attachments;
create policy task_attachments_select
on public.task_attachments for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  and (
    status = 'ready'
    or uploaded_by = auth.uid()
    or public.has_workspace_role(
      workspace_id,
      array['owner', 'admin']::public.workspace_role[]
    )
  )
);

drop policy if exists task_attachments_update on public.task_attachments;
create policy task_attachments_update
on public.task_attachments for update
to authenticated
using (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
)
with check (
  public.has_workspace_role(
    workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  )
);

-- Immutable identity fields
create or replace function public.reject_immutable_attachment_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.workspace_id is distinct from old.workspace_id
     or new.task_id is distinct from old.task_id
     or new.uploaded_by is distinct from old.uploaded_by
     or new.storage_path is distinct from old.storage_path
     or new.file_name is distinct from old.file_name
     or new.mime_type is distinct from old.mime_type
     or new.size_bytes is distinct from old.size_bytes
     or new.created_at is distinct from old.created_at then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  return new;
end;
$$;

drop trigger if exists task_attachments_reject_immutable on public.task_attachments;
create trigger task_attachments_reject_immutable
before update on public.task_attachments
for each row execute function public.reject_immutable_attachment_columns();

-- Stale pending cleanup (idempotent maintenance RPC)
create or replace function public.cleanup_stale_pending_attachments(
  p_older_than interval default interval '24 hours'
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  n integer := 0;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  update public.task_attachments a
  set
    status = 'failed',
    failed_at = now(),
    deleted_at = coalesce(a.deleted_at, now())
  where a.status = 'pending'
    and a.created_at < now() - p_older_than
    and (
      a.uploaded_by = actor
      or public.has_workspace_role(
        a.workspace_id,
        array['owner', 'admin']::public.workspace_role[]
      )
    );

  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.cleanup_stale_pending_attachments(interval) from public;
grant execute on function public.cleanup_stale_pending_attachments(interval) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Notification grouping scoped by workspace
-- ---------------------------------------------------------------------------
drop index if exists public.notifications_group_unread_unique;

create unique index if not exists notifications_group_unread_workspace_unique
  on public.notifications (user_id, workspace_id, group_key)
  where group_key is not null and read_at is null;

-- Allow grouping fields to mutate; block identity fields
create or replace function public.reject_immutable_notification_columns()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
     or new.user_id is distinct from old.user_id
     or new.workspace_id is distinct from old.workspace_id
     or new.actor_id is distinct from old.actor_id
     or new.type is distinct from old.type
     or new.entity_type is distinct from old.entity_type
     or new.entity_id is distinct from old.entity_id
     or new.dedupe_key is distinct from old.dedupe_key
     or new.group_key is distinct from old.group_key
     or new.created_at is distinct from old.created_at then
    raise exception 'IMMUTABLE_FIELD_CHANGE' using errcode = 'P0007';
  end if;
  return new;
end;
$$;

create or replace function public.create_or_group_notification(
  p_user_id uuid,
  p_workspace_id uuid,
  p_type public.notification_type,
  p_entity_type text,
  p_entity_id uuid,
  p_title text,
  p_message text default '',
  p_metadata jsonb default '{}'::jsonb,
  p_group_key text default null,
  p_dedupe_key text default null
)
returns public.notifications
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  prefs public.notification_preferences;
  allowed boolean := true;
  row public.notifications;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if not public.is_workspace_member(p_workspace_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if not exists (
    select 1 from public.workspace_members m
    where m.workspace_id = p_workspace_id and m.user_id = p_user_id
  ) then
    raise exception 'RECIPIENT_NOT_MEMBER' using errcode = 'P0004';
  end if;

  select * into prefs from public.notification_preferences where user_id = p_user_id;
  if found then
    if p_type = 'task_assigned' and not prefs.assignments then allowed := false; end if;
    if p_type = 'comment_added' and not prefs.comments then allowed := false; end if;
    if p_type in ('task_due_soon', 'project_due_soon') and not prefs.due_dates then allowed := false; end if;
    if p_type in ('role_changed', 'member_removed') and not prefs.project_changes then allowed := false; end if;
  end if;

  if not allowed then
    return null;
  end if;

  if p_group_key is not null then
    update public.notifications n
    set
      occurrence_count = n.occurrence_count + 1,
      last_occurred_at = now(),
      title = p_title,
      message = p_message,
      metadata = coalesce(p_metadata, '{}'::jsonb)
    where n.user_id = p_user_id
      and n.workspace_id = p_workspace_id
      and n.group_key = p_group_key
      and n.read_at is null
    returning * into row;

    if found then
      return row;
    end if;
  end if;

  insert into public.notifications (
    user_id, workspace_id, type, entity_type, entity_id,
    actor_id, title, message, metadata, dedupe_key,
    group_key, occurrence_count, last_occurred_at
  )
  values (
    p_user_id, p_workspace_id, p_type, p_entity_type, p_entity_id,
    actor, p_title, coalesce(p_message, ''), coalesce(p_metadata, '{}'::jsonb), p_dedupe_key,
    p_group_key, 1, now()
  )
  returning * into row;

  return row;
exception
  when unique_violation then
    if p_group_key is not null then
      update public.notifications n
      set
        occurrence_count = n.occurrence_count + 1,
        last_occurred_at = now(),
        title = p_title,
        message = p_message
      where n.user_id = p_user_id
        and n.workspace_id = p_workspace_id
        and n.group_key = p_group_key
        and n.read_at is null
      returning * into row;
      return row;
    end if;
    return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Atomic versioned task update with JSONB patch + audit
-- ---------------------------------------------------------------------------
drop function if exists public.update_task_versioned(
  uuid, bigint, text, text, public.task_status, public.task_priority, uuid, date, text[], numeric, boolean
);

create or replace function public.update_task_versioned(
  p_task_id uuid,
  p_expected_version bigint,
  p_patch jsonb default '{}'::jsonb
)
returns public.tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current public.tasks;
  updated public.tasks;
  patch jsonb := coalesce(p_patch, '{}'::jsonb);
  changes jsonb := '{}'::jsonb;
  next_title text;
  next_description text;
  next_status public.task_status;
  next_priority public.task_priority;
  next_project_id uuid;
  next_due_date date;
  next_labels text[];
  next_estimate numeric;
  next_archived_at timestamptz;
  meaningful boolean := false;
  action_name text;
  summary_text text;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if patch = '{}'::jsonb then
    raise exception 'EMPTY_PATCH' using errcode = 'P0009';
  end if;

  select * into current from public.tasks where id = p_task_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.has_workspace_role(
    current.workspace_id,
    array['owner', 'admin', 'member']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if current.version is distinct from p_expected_version then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  next_title := current.title;
  next_description := current.description;
  next_status := current.status;
  next_priority := current.priority;
  next_project_id := current.project_id;
  next_due_date := current.due_date;
  next_labels := current.labels;
  next_estimate := current.estimate;
  next_archived_at := current.archived_at;

  if patch ? 'title' then
    next_title := nullif(btrim(patch->>'title'), '');
    if next_title is null then
      raise exception 'INVALID_PATCH' using errcode = 'P0010';
    end if;
  end if;
  if patch ? 'description' then
    next_description := coalesce(patch->>'description', '');
  end if;
  if patch ? 'status' then
    next_status := (patch->>'status')::public.task_status;
  end if;
  if patch ? 'priority' then
    next_priority := (patch->>'priority')::public.task_priority;
  end if;
  if patch ? 'projectId' then
    next_project_id := (patch->>'projectId')::uuid;
  end if;
  if patch ? 'dueDate' then
    if patch->'dueDate' is null or jsonb_typeof(patch->'dueDate') = 'null' then
      next_due_date := null;
    else
      next_due_date := (patch->>'dueDate')::date;
    end if;
  end if;
  if patch ? 'labels' then
    select coalesce(array_agg(value), '{}') into next_labels
    from jsonb_array_elements_text(coalesce(patch->'labels', '[]'::jsonb)) as value;
  end if;
  if patch ? 'estimate' then
    if patch->'estimate' is null or jsonb_typeof(patch->'estimate') = 'null' then
      next_estimate := null;
    else
      next_estimate := (patch->>'estimate')::numeric;
    end if;
  end if;
  if patch ? 'archived' then
    if (patch->>'archived')::boolean is true then
      next_archived_at := coalesce(current.archived_at, now());
    else
      next_archived_at := null;
    end if;
  end if;

  if next_project_id is distinct from current.project_id then
    if not exists (
      select 1 from public.projects p
      where p.id = next_project_id
        and p.workspace_id = current.workspace_id
        and p.archived_at is null
    ) then
      raise exception 'INVALID_PROJECT' using errcode = 'P0006';
    end if;
  end if;

  if next_title is distinct from current.title then
    changes := changes || jsonb_build_object('title', jsonb_build_object('from', current.title, 'to', next_title));
    meaningful := true;
  end if;
  if next_description is distinct from current.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('from', current.description, 'to', next_description));
    meaningful := true;
  end if;
  if next_status is distinct from current.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', current.status, 'to', next_status));
    meaningful := true;
  end if;
  if next_priority is distinct from current.priority then
    changes := changes || jsonb_build_object('priority', jsonb_build_object('from', current.priority, 'to', next_priority));
    meaningful := true;
  end if;
  if next_project_id is distinct from current.project_id then
    changes := changes || jsonb_build_object('projectId', jsonb_build_object('from', current.project_id, 'to', next_project_id));
    meaningful := true;
  end if;
  if next_due_date is distinct from current.due_date then
    changes := changes || jsonb_build_object('dueDate', jsonb_build_object('from', current.due_date, 'to', next_due_date));
    meaningful := true;
  end if;
  if next_labels is distinct from current.labels then
    changes := changes || jsonb_build_object('labels', jsonb_build_object('from', to_jsonb(current.labels), 'to', to_jsonb(next_labels)));
    meaningful := true;
  end if;
  if next_estimate is distinct from current.estimate then
    changes := changes || jsonb_build_object('estimate', jsonb_build_object('from', current.estimate, 'to', next_estimate));
    meaningful := true;
  end if;
  if next_archived_at is distinct from current.archived_at then
    changes := changes || jsonb_build_object('archived', jsonb_build_object('from', current.archived_at, 'to', next_archived_at));
    meaningful := true;
  end if;

  if not meaningful then
    return current;
  end if;

  update public.tasks t
  set
    title = next_title,
    description = next_description,
    status = next_status,
    priority = next_priority,
    project_id = next_project_id,
    due_date = next_due_date,
    labels = next_labels,
    estimate = next_estimate,
    archived_at = next_archived_at,
    version = t.version + 1,
    updated_at = now()
  where t.id = p_task_id
    and t.version = p_expected_version
  returning * into updated;

  if not found then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  if next_status is distinct from current.status then
    action_name := case when next_status = 'done' then 'completed' else 'moved' end;
  elsif next_archived_at is not null and current.archived_at is null then
    action_name := 'archived';
  elsif next_archived_at is null and current.archived_at is not null then
    action_name := 'restored';
  else
    action_name := 'updated';
  end if;

  summary_text := action_name || ' ' || updated.title;

  insert into public.activity_events (
    workspace_id, actor_id, action, entity_type, entity_id, entity_title,
    summary, metadata, changes, source
  ) values (
    updated.workspace_id, actor, action_name, 'task', updated.id, updated.title,
    summary_text, '{}'::jsonb, changes, 'api'
  );

  return updated;
end;
$$;

revoke all on function public.update_task_versioned(uuid, bigint, jsonb) from public;
grant execute on function public.update_task_versioned(uuid, bigint, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Atomic versioned project update with JSONB patch + audit
-- ---------------------------------------------------------------------------
drop function if exists public.update_project_versioned(
  uuid, bigint, text, text, public.project_status, text, date, boolean
);

create or replace function public.update_project_versioned(
  p_project_id uuid,
  p_expected_version bigint,
  p_patch jsonb default '{}'::jsonb
)
returns public.projects
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current public.projects;
  updated public.projects;
  patch jsonb := coalesce(p_patch, '{}'::jsonb);
  changes jsonb := '{}'::jsonb;
  next_name text;
  next_description text;
  next_status public.project_status;
  next_color text;
  next_due_date date;
  next_archived_at timestamptz;
  meaningful boolean := false;
  action_name text;
begin
  if actor is null then
    raise exception 'UNAUTHORIZED' using errcode = 'P0001';
  end if;

  if patch = '{}'::jsonb then
    raise exception 'EMPTY_PATCH' using errcode = 'P0009';
  end if;

  select * into current from public.projects where id = p_project_id for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0002';
  end if;

  if not public.has_workspace_role(
    current.workspace_id,
    array['owner', 'admin']::public.workspace_role[]
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0003';
  end if;

  if current.version is distinct from p_expected_version then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  next_name := current.name;
  next_description := current.description;
  next_status := current.status;
  next_color := current.color;
  next_due_date := current.due_date;
  next_archived_at := current.archived_at;

  if patch ? 'name' then
    next_name := nullif(btrim(patch->>'name'), '');
    if next_name is null then
      raise exception 'INVALID_PATCH' using errcode = 'P0010';
    end if;
  end if;
  if patch ? 'description' then
    next_description := coalesce(patch->>'description', '');
  end if;
  if patch ? 'status' then
    next_status := (patch->>'status')::public.project_status;
  end if;
  if patch ? 'color' then
    next_color := patch->>'color';
  end if;
  if patch ? 'dueDate' then
    if patch->'dueDate' is null or jsonb_typeof(patch->'dueDate') = 'null' then
      next_due_date := null;
    else
      next_due_date := (patch->>'dueDate')::date;
    end if;
  end if;
  if patch ? 'archived' then
    if (patch->>'archived')::boolean is true then
      next_archived_at := coalesce(current.archived_at, now());
    else
      next_archived_at := null;
    end if;
  end if;

  if next_name is distinct from current.name then
    changes := changes || jsonb_build_object('name', jsonb_build_object('from', current.name, 'to', next_name));
    meaningful := true;
  end if;
  if next_description is distinct from current.description then
    changes := changes || jsonb_build_object('description', jsonb_build_object('from', current.description, 'to', next_description));
    meaningful := true;
  end if;
  if next_status is distinct from current.status then
    changes := changes || jsonb_build_object('status', jsonb_build_object('from', current.status, 'to', next_status));
    meaningful := true;
  end if;
  if next_color is distinct from current.color then
    changes := changes || jsonb_build_object('color', jsonb_build_object('from', current.color, 'to', next_color));
    meaningful := true;
  end if;
  if next_due_date is distinct from current.due_date then
    changes := changes || jsonb_build_object('dueDate', jsonb_build_object('from', current.due_date, 'to', next_due_date));
    meaningful := true;
  end if;
  if next_archived_at is distinct from current.archived_at then
    changes := changes || jsonb_build_object('archived', jsonb_build_object('from', current.archived_at, 'to', next_archived_at));
    meaningful := true;
  end if;

  if not meaningful then
    return current;
  end if;

  update public.projects p
  set
    name = next_name,
    description = next_description,
    status = next_status,
    color = next_color,
    due_date = next_due_date,
    archived_at = next_archived_at,
    version = p.version + 1,
    updated_at = now()
  where p.id = p_project_id
    and p.version = p_expected_version
  returning * into updated;

  if not found then
    raise exception 'STALE_VERSION' using errcode = 'P0008';
  end if;

  if next_archived_at is not null and current.archived_at is null then
    action_name := 'archived';
  elsif next_archived_at is null and current.archived_at is not null then
    action_name := 'restored';
  else
    action_name := 'updated';
  end if;

  insert into public.activity_events (
    workspace_id, actor_id, action, entity_type, entity_id, entity_title,
    summary, metadata, changes, source
  ) values (
    updated.workspace_id, actor, action_name, 'project', updated.id, updated.name,
    action_name || ' project ' || updated.name, '{}'::jsonb, changes, 'api'
  );

  return updated;
end;
$$;

revoke all on function public.update_project_versioned(uuid, bigint, jsonb) from public;
grant execute on function public.update_project_versioned(uuid, bigint, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Private storage bucket + policies
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'taskflow-attachments',
  'taskflow-attachments',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain']
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists taskflow_attachments_storage_select on storage.objects;
create policy taskflow_attachments_storage_select
on storage.objects for select
to authenticated
using (
  bucket_id = 'taskflow-attachments'
  and exists (
    select 1
    from public.task_attachments a
    where a.storage_path = name
      and a.status = 'ready'
      and a.deleted_at is null
      and public.is_workspace_member(a.workspace_id)
  )
);

drop policy if exists taskflow_attachments_storage_insert on storage.objects;
create policy taskflow_attachments_storage_insert
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'taskflow-attachments'
  and exists (
    select 1
    from public.task_attachments a
    where a.storage_path = name
      and a.uploaded_by = auth.uid()
      and a.status = 'pending'
      and a.deleted_at is null
      and public.has_workspace_role(
        a.workspace_id,
        array['owner', 'admin', 'member']::public.workspace_role[]
      )
  )
);

drop policy if exists taskflow_attachments_storage_update on storage.objects;
create policy taskflow_attachments_storage_update
on storage.objects for update
to authenticated
using (
  bucket_id = 'taskflow-attachments'
  and exists (
    select 1
    from public.task_attachments a
    where a.storage_path = name
      and a.uploaded_by = auth.uid()
      and a.status = 'pending'
  )
);

drop policy if exists taskflow_attachments_storage_delete on storage.objects;
create policy taskflow_attachments_storage_delete
on storage.objects for delete
to authenticated
using (
  bucket_id = 'taskflow-attachments'
  and exists (
    select 1
    from public.task_attachments a
    where a.storage_path = name
      and (
        a.uploaded_by = auth.uid()
        or public.has_workspace_role(
          a.workspace_id,
          array['owner', 'admin']::public.workspace_role[]
        )
      )
  )
);

-- =============================================================================
-- END supabase/migrations/20260802200000_taskflow_phase3_stabilization.sql
-- =============================================================================

-- =============================================================================
-- BEGIN supabase/migrations/20260802210000_taskflow_workspace_bootstrap_rls.sql
-- =============================================================================

drop policy if exists workspaces_select_member on public.workspaces;
create policy workspaces_select_member
on public.workspaces for select
to authenticated
using (
  public.is_workspace_member(id)
  or created_by = auth.uid()
);

drop policy if exists workspace_members_select_member on public.workspace_members;
create policy workspace_members_select_member
on public.workspace_members for select
to authenticated
using (
  public.is_workspace_member(workspace_id)
  or user_id = auth.uid()
);

-- =============================================================================
-- END supabase/migrations/20260802210000_taskflow_workspace_bootstrap_rls.sql
-- =============================================================================

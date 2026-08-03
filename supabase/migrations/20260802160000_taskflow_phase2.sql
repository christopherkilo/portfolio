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

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

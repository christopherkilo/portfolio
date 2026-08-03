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

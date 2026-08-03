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

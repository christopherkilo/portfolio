-- Paste into Supabase SQL Editor and Run (one-time fix after APPLY_ALL_TASKFLOW.sql)
-- Fixes: "Could not create workspace" caused by INSERT ... RETURNING RLS

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

-- Fix workspace bootstrap: INSERT ... RETURNING requires SELECT policies
-- to allow the creator to see the new row before membership exists.
-- Without this, createWorkspace fails with:
--   new row violates row-level security policy for table "workspaces"

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

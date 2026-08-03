# TaskFlow Frontend Architecture

Phase 2 keeps the existing visual language and shell.

## Data loading

- TanStack Query owns server entities (workspaces, projects, tasks, members, comments, invitations, notifications)
- Hooks live in `lib/demos/taskflow/api/hooks.ts` and `lib/demos/taskflow/queries/`
- Realtime bridge invalidates Query keys (`TaskflowRealtimeBridge`)

## Collaboration UI

- Task detail: `TaskComments`
- Task editor: multi-assignee chips
- Team: roles, remove, invite modal, pending invitations
- TopNav: live notification panel
- `/demos/taskflow/invite` accept flow

## Zustand

Still UI-only (density, week start, preferences). No server entity copies.

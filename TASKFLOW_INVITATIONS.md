# TaskFlow Invitations

## Create / replace

Controlled RPC `create_workspace_invitation`:

1. Normalize email
2. Revoke expired unaccepted invitations for that workspace/email
3. Reject if an unexpired active invitation remains
4. Reject if already a member
5. Insert hashed token invitation

## Accept

`accept_workspace_invitation` creates membership atomically.

## Security

Raw tokens never stored. No public SELECT by token. Development may return `acceptUrl`; production email is deferred.

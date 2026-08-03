/**
 * Seeds TaskFlow demo data into Supabase (Auth + Postgres).
 *
 * Usage:
 *   npm run taskflow:seed
 *
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SECRET_KEY
 *
 * Optional:
 *   TASKFLOW_SEED_OWNER_EMAIL — Auth email for Christopher (owner).
 *     Defaults to the first matching known owner email, else first Auth user.
 *
 * Idempotent: fixed UUIDs + upserts; safe to re-run.
 * Does NOT seed presence or offline queue.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import {
  ACTIVITY,
  ATTACHMENTS,
  COMMENTS,
  DEMO_MEMBERS,
  IDS,
  NOTIFICATIONS,
  PREFERENCE_DEFAULTS,
  PROJECTS,
  TASKS,
  WORKSPACE,
  avatarUrl,
  daysAgo,
  type SeedMemberKey,
} from "./seed-demo-data";

config({ path: resolve(process.cwd(), ".env.local") });
config();

const OWNER_EMAIL_CANDIDATES = [
  process.env.TASKFLOW_SEED_OWNER_EMAIL?.trim(),
  "christopherkilo.pro@gmail.com",
  "christopher@taskflow.demo",
].filter(Boolean) as string[];

const DEMO_PASSWORD = "TaskFlow-Demo-2026!";

type Admin = SupabaseClient;

function requireEnv(name: string): string {
  const value = (process.env[name] ?? "").trim();
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local before seeding.`);
  }
  return value;
}

function normalizeUrl(raw: string): string {
  return raw.replace(/\/$/, "").replace(/\/rest\/v1$/i, "");
}

function assertOk<T>(
  label: string,
  result: { data: T; error: { message: string } | null },
): T {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function listAllUsers(admin: Admin): Promise<User[]> {
  const users: User[] = [];
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers: ${error.message}`);
    users.push(...(data.users ?? []));
    if (!data.users?.length || data.users.length < 200) break;
    page += 1;
  }
  return users;
}

async function ensureAuthUser(
  admin: Admin,
  existing: User[],
  input: {
    email: string;
    displayName: string;
    avatarUrl: string;
    preferExistingIds?: string[];
  },
): Promise<User> {
  const byEmail = existing.find(
    (u) => (u.email ?? "").toLowerCase() === input.email.toLowerCase(),
  );
  if (byEmail) {
    await admin.auth.admin.updateUserById(byEmail.id, {
      user_metadata: {
        ...byEmail.user_metadata,
        full_name: input.displayName,
        name: input.displayName,
        avatar_url: input.avatarUrl,
        title: undefined,
      },
    });
    return byEmail;
  }

  for (const id of input.preferExistingIds ?? []) {
    const hit = existing.find((u) => u.id === id);
    if (hit) return hit;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: {
      full_name: input.displayName,
      name: input.displayName,
      avatar_url: input.avatarUrl,
    },
  });
  if (error || !data.user) {
    throw new Error(`createUser(${input.email}): ${error?.message ?? "unknown"}`);
  }
  existing.push(data.user);
  return data.user;
}

async function resolveOwner(admin: Admin, existing: User[]): Promise<User> {
  for (const email of OWNER_EMAIL_CANDIDATES) {
    const hit = existing.find(
      (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
    );
    if (hit) return hit;
  }
  if (existing[0]) return existing[0];

  const demoChristopher = DEMO_MEMBERS.find((m) => m.key === "christopher")!;
  return ensureAuthUser(admin, existing, {
    email: demoChristopher.email,
    displayName: demoChristopher.displayName,
    avatarUrl: avatarUrl(demoChristopher.avatarSeed),
  });
}

async function upsertProfile(
  admin: Admin,
  userId: string,
  email: string,
  displayName: string,
  avatar: string,
) {
  assertOk(
    "profiles upsert",
    await admin.from("profiles").upsert(
      {
        id: userId,
        email,
        display_name: displayName,
        avatar_url: avatar,
      },
      { onConflict: "id" },
    ),
  );
}

async function main() {
  const url = normalizeUrl(requireEnv("NEXT_PUBLIC_SUPABASE_URL"));
  const secretKey = requireEnv("SUPABASE_SECRET_KEY");
  const admin = createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  console.log("TaskFlow demo seed starting…");
  console.log(`  Supabase: ${url}`);

  const existingUsers = await listAllUsers(admin);
  const owner = await resolveOwner(admin, existingUsers);
  console.log(`  Owner: ${owner.email} (${owner.id})`);

  const memberIds = {} as Record<SeedMemberKey, string>;

  for (const member of DEMO_MEMBERS) {
    if (member.key === "christopher") {
      memberIds.christopher = owner.id;
      await upsertProfile(
        admin,
        owner.id,
        owner.email ?? member.email,
        member.displayName,
        avatarUrl(member.avatarSeed),
      );
      continue;
    }

    const user = await ensureAuthUser(admin, existingUsers, {
      email: member.email,
      displayName: member.displayName,
      avatarUrl: avatarUrl(member.avatarSeed),
    });
    memberIds[member.key] = user.id;
    await upsertProfile(
      admin,
      user.id,
      member.email,
      member.displayName,
      avatarUrl(member.avatarSeed),
    );
  }

  // Workspace
  assertOk(
    "workspace upsert",
    await admin.from("workspaces").upsert(
      {
        id: WORKSPACE.id,
        name: WORKSPACE.name,
        description: WORKSPACE.description,
        created_by: memberIds.christopher,
        // Keep demo workspace newest so list order prefers it over empty defaults.
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    ),
  );

  // Members
  for (const member of DEMO_MEMBERS) {
    assertOk(
      `member ${member.key}`,
      await admin.from("workspace_members").upsert(
        {
          workspace_id: WORKSPACE.id,
          user_id: memberIds[member.key],
          role: member.role,
          created_at: daysAgo(17, 11, 0),
        },
        { onConflict: "workspace_id,user_id" },
      ),
    );
  }

  // Notification preferences
  for (const member of DEMO_MEMBERS) {
    const prefs = PREFERENCE_DEFAULTS[member.key];
    assertOk(
      `prefs ${member.key}`,
      await admin.from("notification_preferences").upsert(
        {
          user_id: memberIds[member.key],
          ...prefs,
        },
        { onConflict: "user_id" },
      ),
    );
  }

  // Accepted invitation (Sarah → Maya) for history
  const tokenHash = createHash("sha256")
    .update(`seed-invite-maya-${IDS.invitationMaya}`)
    .digest("hex");
  assertOk(
    "invitation",
    await admin.from("workspace_invitations").upsert(
      {
        id: IDS.invitationMaya,
        workspace_id: WORKSPACE.id,
        email: "maya.rodriguez@taskflow.demo",
        role: "admin",
        token_hash: tokenHash,
        invited_by: memberIds.sarah,
        expires_at: daysAgo(-30, 10, 0),
        accepted_at: daysAgo(17, 10, 45),
        revoked_at: null,
        created_at: daysAgo(17, 10, 0),
      },
      { onConflict: "id" },
    ),
  );

  // Projects
  for (const project of PROJECTS) {
    assertOk(
      `project ${project.name}`,
      await admin.from("projects").upsert(
        {
          id: project.id,
          workspace_id: WORKSPACE.id,
          name: project.name,
          description: project.description,
          status: project.status,
          color: project.color,
          version: project.version,
          created_by: memberIds[project.createdBy],
          created_at: project.createdAt,
          updated_at: project.updatedAt,
          archived_at: null,
        },
        { onConflict: "id" },
      ),
    );
  }

  const projectIdByKey = {
    eventHorizon: IDS.projects.eventHorizon,
    novaTech: IDS.projects.novaTech,
  };

  // Tasks
  for (const task of TASKS) {
    const primaryAssignee = task.assignees[0]
      ? memberIds[task.assignees[0]]
      : null;
    assertOk(
      `task ${task.title}`,
      await admin.from("tasks").upsert(
        {
          id: task.id,
          workspace_id: WORKSPACE.id,
          project_id: projectIdByKey[task.project],
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assignee_id: primaryAssignee,
          due_date: task.dueDate,
          labels: task.labels ?? [],
          version: task.version,
          created_by: memberIds[task.createdBy],
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          archived_at: null,
        },
        { onConflict: "id" },
      ),
    );
  }

  // Assignees — replace seed-task assignees for clean idempotency
  const seedTaskIds = TASKS.map((t) => t.id);
  assertOk(
    "clear assignees",
    await admin.from("task_assignees").delete().in("task_id", seedTaskIds),
  );
  for (const task of TASKS) {
    for (const key of task.assignees) {
      assertOk(
        `assignee ${task.title}/${key}`,
        await admin.from("task_assignees").upsert(
          {
            task_id: task.id,
            user_id: memberIds[key],
            workspace_id: WORKSPACE.id,
            assigned_by: memberIds[task.createdBy],
            assigned_at: task.createdAt,
          },
          { onConflict: "task_id,user_id" },
        ),
      );
    }
  }

  // Comments
  for (const comment of COMMENTS) {
    assertOk(
      `comment ${comment.id}`,
      await admin.from("comments").upsert(
        {
          id: comment.id,
          workspace_id: WORKSPACE.id,
          task_id: comment.taskId,
          author_id: memberIds[comment.author],
          body: comment.body,
          created_at: comment.createdAt,
          updated_at: comment.createdAt,
          deleted_at: null,
        },
        { onConflict: "id" },
      ),
    );
  }

  // Attachment metadata (placeholder — not backed by Storage objects)
  for (const att of ATTACHMENTS) {
    const storagePath = `seed-placeholder/${WORKSPACE.id}/${att.taskId}/${att.fileName}`;
    assertOk(
      `attachment ${att.fileName}`,
      await admin.from("task_attachments").upsert(
        {
          id: att.id,
          workspace_id: WORKSPACE.id,
          task_id: att.taskId,
          uploaded_by: memberIds[att.uploadedBy],
          storage_path: storagePath,
          file_name: att.fileName,
          mime_type: att.mimeType,
          size_bytes: att.sizeBytes,
          status: "failed",
          completed_at: null,
          failed_at: att.createdAt,
          activity_recorded_at: att.createdAt,
          created_at: att.createdAt,
          deleted_at: null,
        },
        { onConflict: "id" },
      ),
    );
  }

  // Activity + audit history
  for (const event of ACTIVITY) {
    assertOk(
      `activity ${event.id}`,
      await admin.from("activity_events").upsert(
        {
          id: event.id,
          workspace_id: WORKSPACE.id,
          actor_id: memberIds[event.actor],
          action: event.action,
          entity_type: event.entityType,
          entity_id: event.entityId,
          entity_title: event.entityTitle,
          old_value: event.oldValue ?? null,
          new_value: event.newValue ?? null,
          summary: event.summary,
          metadata: { seed: true },
          changes: event.changes ?? {},
          request_id: `seed-${event.id.slice(-4)}`,
          source: event.source ?? "seed",
          created_at: event.createdAt,
        },
        { onConflict: "id" },
      ),
    );
  }

  // Notifications
  for (const note of NOTIFICATIONS) {
    assertOk(
      `notification ${note.id}`,
      await admin.from("notifications").upsert(
        {
          id: note.id,
          user_id: memberIds[note.user],
          workspace_id: WORKSPACE.id,
          type: note.type,
          entity_type: note.entityType,
          entity_id: note.entityId,
          actor_id: memberIds[note.actor],
          title: note.title,
          message: note.message,
          metadata: { seed: true },
          dedupe_key: note.dedupeKey,
          group_key: note.groupKey ?? null,
          occurrence_count: 1,
          last_occurred_at: note.createdAt,
          read_at: note.readAt,
          created_at: note.createdAt,
        },
        { onConflict: "id" },
      ),
    );
  }

  const auditEvents = ACTIVITY.filter(
    (e) => e.changes && Object.keys(e.changes).length > 0,
  );

  console.log("\nSeed complete (idempotent upsert).");
  console.log("─────────────────────────────────");
  console.log(`  Workspaces:              1`);
  console.log(`  Users / members:         ${DEMO_MEMBERS.length}`);
  console.log(`  Projects:                ${PROJECTS.length}`);
  console.log(`  Tasks:                   ${TASKS.length}`);
  console.log(`  Comments:                ${COMMENTS.length}`);
  console.log(`  Notifications:           ${NOTIFICATIONS.length}`);
  console.log(`  Activity events:         ${ACTIVITY.length}`);
  console.log(`  Audit-style events:      ${auditEvents.length}`);
  console.log(`  Attachment metadata:     ${ATTACHMENTS.length}`);
  console.log(`  Notification prefs:      ${DEMO_MEMBERS.length}`);
  console.log("─────────────────────────────────");
  console.log("  Presence:                skipped (ephemeral)");
  console.log("  Offline queue:           skipped");
  console.log(
    `  Demo teammate password:  ${DEMO_PASSWORD} (email/password Auth must be enabled to sign in as them)`,
  );
  console.log(
    "  Attachments are metadata placeholders (status=failed, seed-placeholder/ paths).",
  );
}

main().catch((err) => {
  console.error("\nSeed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});

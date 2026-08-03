import { describe, expect, it } from "vitest";
import {
  assertCanChangeMemberRole,
  assertCanRemoveMember,
  canComment,
  canEditTask,
  canInvite,
  canManageMembers,
} from "@/server/taskflow/auth/permissions";
import {
  ForbiddenError,
  OwnerRemovalForbiddenError,
  RoleEscalationForbiddenError,
} from "@/server/taskflow/errors";
import { createHash } from "node:crypto";
import {
  createCommentSchema,
  createInvitationSchema,
  updateMemberRoleSchema,
} from "@/server/taskflow/schemas";

function hashInvitationToken(raw: string) {
  return createHash("sha256").update(raw).digest("hex");
}

describe("TaskFlow authorization helpers", () => {
  it("encodes Phase 2 permission matrix", () => {
    expect(canManageMembers("owner")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canManageMembers("member")).toBe(false);
    expect(canEditTask("member")).toBe(true);
    expect(canEditTask("viewer")).toBe(false);
    expect(canComment("member")).toBe(true);
    expect(canComment("viewer")).toBe(false);
    expect(canInvite("admin")).toBe(true);
    expect(canInvite("member")).toBe(false);
  });

  it("prevents removing the owner", () => {
    expect(() =>
      assertCanRemoveMember({
        actorRole: "admin",
        targetRole: "owner",
        actorId: "a",
        targetId: "o",
      }),
    ).toThrow(OwnerRemovalForbiddenError);
  });

  it("rejects owner role changes and ownership transfer", () => {
    expect(() =>
      assertCanChangeMemberRole({
        actorRole: "owner",
        targetRole: "owner",
        nextRole: "admin",
      }),
    ).toThrow(ForbiddenError);

    expect(() =>
      assertCanChangeMemberRole({
        actorRole: "owner",
        targetRole: "member",
        nextRole: "owner",
      }),
    ).toThrow(RoleEscalationForbiddenError);
  });

  it("blocks admins from changing other admins", () => {
    expect(() =>
      assertCanChangeMemberRole({
        actorRole: "admin",
        targetRole: "admin",
        nextRole: "member",
      }),
    ).toThrow(RoleEscalationForbiddenError);
  });
});

describe("TaskFlow Phase 2 validation", () => {
  it("validates comments and invitations", () => {
    expect(createCommentSchema.parse({ body: "Hello team" }).body).toBe(
      "Hello team",
    );
    expect(
      createInvitationSchema.parse({
        email: "dev@example.com",
        role: "member",
      }).email,
    ).toBe("dev@example.com");
    expect(updateMemberRoleSchema.parse({ role: "viewer" }).role).toBe(
      "viewer",
    );
  });

  it("rejects empty comments", () => {
    expect(createCommentSchema.safeParse({ body: "   " }).success).toBe(false);
  });
});

describe("Invitation token hashing", () => {
  it("hashes tokens without returning the raw value", () => {
    const raw = "test-invitation-token-value-123456";
    const hash = hashInvitationToken(raw);
    expect(hash).not.toBe(raw);
    expect(hash).toHaveLength(64);
    expect(hashInvitationToken(raw)).toBe(hash);
  });
});

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { WorkspacePermissionsService } from "./permissions";
import { AuthService } from "../auth/auth";
import { WorkspaceReadsService } from "./workspace-reads";
import { sampleMember, stubWorkspaceReads } from "../../testing/data-stubs";
import type { TeamMember, WorkspaceRole } from "../api/models";

const owner: TeamMember = { ...sampleMember, role: "owner" };
const admin: TeamMember = {
  id: "admin-1",
  name: "Avery Admin",
  role: "admin",
  email: "avery@example.com",
  avatar: "AA",
};
const member: TeamMember = {
  id: "member-1",
  name: "Morgan Member",
  role: "member",
  email: "morgan@example.com",
  avatar: "MM",
};
const viewer: TeamMember = {
  id: "viewer-1",
  name: "Val Viewer",
  role: "viewer",
  email: "val@example.com",
  avatar: "VV",
};

async function permissionsFor(
  role: WorkspaceRole,
  userId: string,
): Promise<WorkspacePermissionsService> {
  TestBed.resetTestingModule();
  const self: TeamMember = {
    id: userId,
    name: "Self",
    role,
    email: "self@example.com",
    avatar: "SE",
  };
  const reads = stubWorkspaceReads({
    members: [owner, admin, member, viewer, self].filter(
      (row, index, all) => all.findIndex((item) => item.id === row.id) === index,
    ),
  });
  await TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      WorkspacePermissionsService,
      { provide: AuthService, useValue: { currentUser: signal({ id: userId }) } },
      { provide: WorkspaceReadsService, useValue: reads },
    ],
  }).compileComponents();
  return TestBed.inject(WorkspacePermissionsService);
}

describe("WorkspacePermissionsService", () => {
  it("treats member+ as canEditTask and admin+ as canManageProjects", async () => {
    const service = await permissionsFor("member", "member-1");
    expect(service.canEditTask()).toBe(true);
    expect(service.canManageProjects()).toBe(false);
    expect(service.canInviteMembers()).toBe(false);
  });

  it("viewer capabilities match TeamView", async () => {
    const service = await permissionsFor("viewer", "viewer-1");
    expect(service.canInviteMembers()).toBe(false);
    expect(service.canChangeMemberRole(member)).toBe(false);
    expect(service.canRemoveMember(member)).toBe(false);
    expect(service.canViewAudit()).toBe(false);
    expect(service.canComment()).toBe(false);
    expect(service.canUploadAttachment()).toBe(false);
  });

  it("member capabilities match TeamView", async () => {
    const service = await permissionsFor("member", "member-1");
    expect(service.canInviteMembers()).toBe(false);
    expect(service.canChangeMemberRole(viewer)).toBe(false);
    expect(service.canRemoveMember(viewer)).toBe(false);
    expect(service.canEditTask()).toBe(true);
    expect(service.canComment()).toBe(true);
    expect(service.canUploadAttachment()).toBe(true);
    expect(service.canViewAudit()).toBe(false);
  });

  it("admin capabilities match permissions.ts", async () => {
    const service = await permissionsFor("admin", "admin-1");
    expect(service.canInviteMembers()).toBe(true);
    expect(service.canChangeMemberRole(member)).toBe(true);
    expect(service.canChangeMemberRole(admin)).toBe(false);
    expect(service.canChangeMemberRole(owner)).toBe(false);
    expect(service.canRemoveMember(member)).toBe(true);
    expect(service.canRemoveMember({ ...admin, id: "admin-2" })).toBe(false);
    expect(service.canRemoveMember(admin)).toBe(false);
    expect(service.canRemoveMember(owner)).toBe(false);
    expect(service.roleSelectOptions()).toEqual(["member", "viewer"]);
  });

  it("owner capabilities match permissions.ts", async () => {
    const service = await permissionsFor("owner", "user-1");
    expect(service.canInviteMembers()).toBe(true);
    expect(service.canChangeMemberRole(admin)).toBe(true);
    expect(service.canChangeMemberRole(owner)).toBe(false);
    expect(service.canRemoveMember(admin)).toBe(true);
    expect(service.canRemoveMember(owner)).toBe(false);
    expect(service.roleSelectOptions()).toEqual(["admin", "member", "viewer"]);
  });
});

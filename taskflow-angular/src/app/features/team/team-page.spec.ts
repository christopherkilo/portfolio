import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { TeamPage } from "./team-page";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { InvitationsDataService } from "../../core/data/invitations-data";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { MemberMutationsService } from "../../core/data/member-mutations";
import { TaskflowApiError } from "../../core/api/envelope";
import {
  sampleMember,
  stubInvitations,
  stubInvitationMutations,
  stubMemberMutations,
  stubPermissions,
  stubWorkspaceReads,
} from "../../testing/data-stubs";
import type { TeamMember } from "../../core/api/models";

const teammate: TeamMember = {
  id: "member-1",
  name: "Morgan Member",
  role: "member",
  email: "morgan@example.com",
  avatar: "MM",
};

describe("TeamPage", () => {
  async function render(
    options: {
      reads?: ReturnType<typeof stubWorkspaceReads>;
      permissions?: ReturnType<typeof stubPermissions>;
      invitations?: ReturnType<typeof stubInvitations>;
      members?: ReturnType<typeof stubMemberMutations>;
    } = {},
  ) {
    const reads =
      options.reads ??
      stubWorkspaceReads({ members: [sampleMember, teammate] });
    const permissions = options.permissions ?? stubPermissions({ role: "owner" });
    const invitations = options.invitations ?? stubInvitations();
    const members = options.members ?? stubMemberMutations();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TeamPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: reads },
        { provide: WorkspacePermissionsService, useValue: permissions },
        { provide: InvitationsDataService, useValue: invitations },
        { provide: InvitationMutationsService, useValue: stubInvitationMutations() },
        { provide: MemberMutationsService, useValue: members },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TeamPage);
    fixture.detectChanges();
    return { fixture, reads, permissions, invitations, members };
  }

  it("renders real members and product role labels", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("Maya Chen");
    expect(fixture.nativeElement.textContent).toContain("Morgan Member");
    expect(fixture.nativeElement.textContent).toContain("owner");
    expect(fixture.nativeElement.textContent).toContain("member");
    expect(fixture.nativeElement.textContent).not.toContain("Jordan Blake");
  });

  it("shows a loading state", async () => {
    const reads = stubWorkspaceReads({ loading: true });
    reads.isLoading.set(true);
    const { fixture } = await render({ reads });
    expect(fixture.nativeElement.textContent).toContain("Loading team");
  });

  it("shows an empty state when there are no members", async () => {
    const { fixture } = await render({
      reads: stubWorkspaceReads({ members: [] }),
    });
    expect(fixture.nativeElement.textContent).toContain("No members yet");
  });

  it("shows an accessible error with retry", async () => {
    const reads = stubWorkspaceReads({
      error: new HttpErrorResponse({ status: 500, statusText: "Server Error" }),
    });
    const { fixture } = await render({ reads });
    const alert = fixture.nativeElement.querySelector("[role='alert']");
    expect(alert).toBeTruthy();
    fixture.nativeElement.querySelector("button")?.click();
    expect(reads.reloadAll).toHaveBeenCalled();
  });

  it("hides invite and role controls for a viewer", async () => {
    const { fixture } = await render({
      permissions: stubPermissions({ role: "viewer", userId: "viewer-1" }),
    });
    expect(fixture.nativeElement.textContent).not.toContain("Invite member");
    expect(fixture.nativeElement.querySelector("select.role")).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain("Remove");
  });

  it("hides invite controls for a member", async () => {
    const { fixture } = await render({
      permissions: stubPermissions({ role: "member", userId: "member-1" }),
    });
    expect(fixture.nativeElement.textContent).not.toContain("Invite member");
  });

  it("shows authorized role controls for an owner", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("Invite member");
    expect(fixture.nativeElement.querySelector("select.role")).toBeTruthy();
  });

  it("requires confirmation before removing a member", async () => {
    const members = stubMemberMutations();
    const { fixture } = await render({ members });
    const remove = Array.from(
      fixture.nativeElement.querySelectorAll("button.danger") as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes("Remove"));
    expect(remove).toBeTruthy();
    remove?.click();
    fixture.detectChanges();
    expect(members.remove).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain("Remove member?");
    const confirm = Array.from(
      fixture.nativeElement.querySelectorAll("button.danger") as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes("Remove member"));
    confirm?.click();
    await fixture.whenStable();
    expect(members.remove).toHaveBeenCalledWith("ws-1", "member-1");
  });

  it("sends the existing role PATCH contract", async () => {
    const members = stubMemberMutations();
    const { fixture } = await render({ members });
    const select = fixture.nativeElement.querySelector(
      "select.role",
    ) as HTMLSelectElement;
    select.value = "viewer";
    select.dispatchEvent(new Event("change"));
    await fixture.whenStable();
    expect(members.updateRole).toHaveBeenCalledWith("ws-1", "member-1", "viewer");
  });

  it("does not change visible roles when the backend returns 403", async () => {
    const members = stubMemberMutations();
    members.updateRole.mockRejectedValue(
      new TaskflowApiError("Admins cannot promote members to admin.", {
        status: 403,
        code: "ROLE_ESCALATION_FORBIDDEN",
      }),
    );
    const { fixture } = await render({ members });
    const select = fixture.nativeElement.querySelector(
      "select.role",
    ) as HTMLSelectElement;
    select.value = "viewer";
    select.dispatchEvent(new Event("change"));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Morgan Member");
    expect(fixture.nativeElement.textContent).toContain("Admins cannot promote");
  });
});

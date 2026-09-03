import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { InviteMemberForm } from "./invite-member-form";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { InvitationsDataService } from "../../core/data/invitations-data";
import { MembersDataService } from "../../core/data/members-data";
import { ActivityDataService } from "../../core/data/activity-data";
import { WorkspaceContextService } from "../../core/data/workspace-context";

const invitation = {
  id: "inv-1",
  workspace_id: "ws-1",
  email: "teammate@company.com",
  role: "member" as const,
  expires_at: "2026-09-08T00:00:00.000Z",
  created_at: "2026-09-01T00:00:00.000Z",
};

describe("InviteMemberForm", () => {
  let http: HttpTestingController;
  const invitationsReload = vi.fn();
  const membersReload = vi.fn();
  const activityReload = vi.fn();

  async function render() {
    invitationsReload.mockReset();
    membersReload.mockReset();
    activityReload.mockReset();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [InviteMemberForm],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        InvitationMutationsService,
        { provide: InvitationsDataService, useValue: { reload: invitationsReload } },
        { provide: MembersDataService, useValue: { reload: membersReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: WorkspaceContextService, useValue: { reload: vi.fn() } },
      ],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(InviteMemberForm);
    fixture.componentRef.setInput("workspaceId", "ws-1");
    fixture.detectChanges();
    return fixture;
  }

  afterEach(() => {
    http.verify();
  });

  it("initializes with member role and an empty email", async () => {
    const fixture = await render();
    const cmp = fixture.componentInstance;
    expect(cmp.form.controls.email.value).toBe("");
    expect(cmp.form.controls.role.value).toBe("member");
  });

  it("blocks an invalid email and does not call the API", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("not-an-email");
    await fixture.componentInstance.onSubmit();
    http.expectNone("/api/taskflow/workspaces/ws-1/invitations");
  });

  it("blocks an invalid role", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("teammate@company.com");
    fixture.componentInstance.form.controls.role.setValue("owner" as never);
    await fixture.componentInstance.onSubmit();
    http.expectNone("/api/taskflow/workspaces/ws-1/invitations");
  });

  it("sends the existing invitation payload", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue(" teammate@company.com ");
    fixture.componentInstance.form.controls.role.setValue("admin");
    const pending = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/taskflow/workspaces/ws-1/invitations");
    expect(req.request.body).toEqual({
      email: "teammate@company.com",
      role: "admin",
    });
    req.flush({ success: true, data: { invitation } });
    await pending;
  });

  it("prevents duplicate submit", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("teammate@company.com");
    const first = fixture.componentInstance.onSubmit();
    const second = fixture.componentInstance.onSubmit();
    const req = http.expectOne("/api/taskflow/workspaces/ws-1/invitations");
    req.flush({ success: true, data: { invitation } });
    await Promise.all([first, second]);
    http.verify();
  });

  it("displays a permission error on 403", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("teammate@company.com");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/taskflow/workspaces/ws-1/invitations").flush(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You cannot invite members.",
          fieldErrors: {},
        },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await pending;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("You cannot invite members.");
  });

  it("displays a pending-invitation conflict", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("teammate@company.com");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/taskflow/workspaces/ws-1/invitations").flush(
      {
        success: false,
        error: {
          code: "ACTIVE_INVITATION_EXISTS",
          message: "An active invitation already exists for that email.",
          fieldErrors: {},
        },
      },
      { status: 409, statusText: "Conflict" },
    );
    await pending;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "An active invitation already exists for that email.",
    );
  });

  it("reloads invitations on success and does not fabricate a member", async () => {
    const fixture = await render();
    fixture.componentInstance.form.controls.email.setValue("teammate@company.com");
    const pending = fixture.componentInstance.onSubmit();
    http.expectOne("/api/taskflow/workspaces/ws-1/invitations").flush({
      success: true,
      data: { invitation },
    });
    await pending;
    expect(invitationsReload).toHaveBeenCalled();
    expect(membersReload).not.toHaveBeenCalled();
  });
});

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { InvitationMutationsService } from "./invitation-mutations";
import { InvitationsDataService } from "./invitations-data";
import { MembersDataService } from "./members-data";
import { ActivityDataService } from "./activity-data";
import { WorkspaceContextService } from "./workspace-context";

const invitation = {
  id: "inv-1",
  workspace_id: "ws-1",
  email: "new@example.com",
  role: "member" as const,
  expires_at: "2026-09-08T00:00:00.000Z",
  created_at: "2026-09-01T00:00:00.000Z",
};

describe("InvitationMutationsService", () => {
  let http: HttpTestingController;
  let service: InvitationMutationsService;
  const invitationsReload = vi.fn();
  const membersReload = vi.fn();
  const activityReload = vi.fn();
  const workspaceReload = vi.fn();

  beforeEach(() => {
    invitationsReload.mockReset();
    membersReload.mockReset();
    activityReload.mockReset();
    workspaceReload.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        InvitationMutationsService,
        { provide: InvitationsDataService, useValue: { reload: invitationsReload } },
        { provide: MembersDataService, useValue: { reload: membersReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
        { provide: WorkspaceContextService, useValue: { reload: workspaceReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(InvitationMutationsService);
  });

  afterEach(() => {
    http.verify();
  });

  it("POSTs invite with the existing contract and reloads invitations", async () => {
    const pending = service.invite("ws-1", {
      email: "new@example.com",
      role: "member",
    });
    const req = http.expectOne("/api/taskflow/workspaces/ws-1/invitations");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      email: "new@example.com",
      role: "member",
    });
    req.flush({ success: true, data: { invitation } });
    await pending;
    expect(invitationsReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
    expect(membersReload).not.toHaveBeenCalled();
  });

  it("POSTs accept with the token body and reloads workspace membership", async () => {
    const token = "a".repeat(20);
    const pending = service.accept(token);
    const req = http.expectOne("/api/taskflow/invitations/accept");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({ token });
    req.flush({
      success: true,
      data: { invitation_id: "inv-1", workspace_id: "ws-1", role: "member" },
    });
    await pending;
    expect(workspaceReload).toHaveBeenCalledTimes(1);
    expect(membersReload).toHaveBeenCalledTimes(1);
    expect(invitationsReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
  });

  it("does not reload members when invite fails", async () => {
    const pending = service.invite("ws-1", {
      email: "new@example.com",
      role: "member",
    });
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
    await expect(pending).rejects.toMatchObject({ status: 403 });
    expect(membersReload).not.toHaveBeenCalled();
    expect(invitationsReload).not.toHaveBeenCalled();
  });
});

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { MemberMutationsService } from "./member-mutations";
import { MembersDataService } from "./members-data";
import { ActivityDataService } from "./activity-data";

describe("MemberMutationsService", () => {
  let http: HttpTestingController;
  let service: MemberMutationsService;
  const membersReload = vi.fn();
  const activityReload = vi.fn();

  beforeEach(() => {
    membersReload.mockReset();
    activityReload.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        MemberMutationsService,
        { provide: MembersDataService, useValue: { reload: membersReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(MemberMutationsService);
  });

  afterEach(() => {
    http.verify();
  });

  it("PATCHes role with the existing contract and reloads members", async () => {
    const pending = service.updateRole("ws-1", "member-1", "viewer");
    const req = http.expectOne(
      "/api/taskflow/workspaces/ws-1/members/member-1",
    );
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ role: "viewer" });
    req.flush({ success: true, data: { ok: true } });
    await pending;
    expect(membersReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
  });

  it("does not mutate client state on 403 role change", async () => {
    const pending = service.updateRole("ws-1", "member-1", "admin");
    http.expectOne("/api/taskflow/workspaces/ws-1/members/member-1").flush(
      {
        success: false,
        error: {
          code: "ROLE_ESCALATION_FORBIDDEN",
          message: "Admins cannot promote members to admin.",
          fieldErrors: {},
        },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await expect(pending).rejects.toMatchObject({ status: 403 });
    expect(membersReload).not.toHaveBeenCalled();
  });

  it("DELETEs a member and reloads members after success", async () => {
    const pending = service.remove("ws-1", "member-1");
    const req = http.expectOne(
      "/api/taskflow/workspaces/ws-1/members/member-1",
    );
    expect(req.request.method).toBe("DELETE");
    req.flush({ success: true, data: { workspaceId: "ws-1", userId: "member-1" } });
    await pending;
    expect(membersReload).toHaveBeenCalledTimes(1);
  });

  it("preserves members when removal fails", async () => {
    const pending = service.remove("ws-1", "member-1");
    http.expectOne("/api/taskflow/workspaces/ws-1/members/member-1").flush(
      {
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "You cannot remove members.",
          fieldErrors: {},
        },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await expect(pending).rejects.toMatchObject({ status: 403 });
    expect(membersReload).not.toHaveBeenCalled();
  });
});

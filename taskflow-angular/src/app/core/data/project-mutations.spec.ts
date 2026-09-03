import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ProjectMutationsService } from "./project-mutations";
import { ProjectsDataService } from "./projects-data";
import { ActivityDataService } from "./activity-data";
import type { ProjectRow } from "../api/models";

const row: ProjectRow = {
  id: "p1",
  workspace_id: "ws-1",
  name: "Atlas Launch",
  description: "Ship the portfolio demo",
  status: "planning",
  color: "#60A5FA",
  due_date: "2026-12-01",
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
  version: 1,
};

describe("ProjectMutationsService", () => {
  let http: HttpTestingController;
  let service: ProjectMutationsService;
  const projectsReload = vi.fn();
  const activityReload = vi.fn();

  beforeEach(() => {
    projectsReload.mockReset();
    activityReload.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProjectMutationsService,
        { provide: ProjectsDataService, useValue: { reload: projectsReload } },
        { provide: ActivityDataService, useValue: { reload: activityReload } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(ProjectMutationsService);
  });

  afterEach(() => {
    http.verify();
  });

  it("POSTs create with planning status and no invented fields", async () => {
    const pending = service.create({
      workspaceId: "ws-1",
      name: "Atlas Launch",
      description: "Ship the portfolio demo",
      dueDate: "2026-12-01",
      color: "#60A5FA",
      status: "planning",
    });
    const req = http.expectOne("/api/projects");
    expect(req.request.method).toBe("POST");
    expect(req.request.body).toEqual({
      workspaceId: "ws-1",
      name: "Atlas Launch",
      description: "Ship the portfolio demo",
      dueDate: "2026-12-01",
      color: "#60A5FA",
      status: "planning",
    });
    req.flush({ success: true, data: row });
    await pending;
    expect(projectsReload).toHaveBeenCalledTimes(1);
    expect(activityReload).toHaveBeenCalledTimes(1);
  });

  it("PATCHes rename with expectedVersion", async () => {
    const pending = service.rename("p1", 4, "Atlas");
    const req = http.expectOne("/api/projects/p1");
    expect(req.request.method).toBe("PATCH");
    expect(req.request.body).toEqual({ name: "Atlas", expectedVersion: 4 });
    req.flush({ success: true, data: { ...row, name: "Atlas", version: 5 } });
    await pending;
    expect(projectsReload).toHaveBeenCalledTimes(1);
  });

  it("does not auto-retry project 409", async () => {
    const pending = service.rename("p1", 1, "Atlas");
    http.expectOne("/api/projects/p1").flush(
      {
        success: false,
        error: {
          code: "STALE_VERSION",
          message: "This item changed while you were editing it.",
          fieldErrors: {},
        },
        data: { latest: { ...row, version: 2, name: "Server name" } },
      },
      { status: 409, statusText: "Conflict" },
    );
    await expect(pending).rejects.toMatchObject({ code: "STALE_VERSION" });
    http.verify();
    expect(projectsReload).not.toHaveBeenCalled();
  });
});

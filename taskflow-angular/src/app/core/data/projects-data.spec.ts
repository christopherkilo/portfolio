import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { credentialsInterceptor } from "../api/credentials.interceptor";
import { authErrorInterceptor } from "../api/auth-error.interceptor";
import { AuthService } from "../auth/auth";
import { ProjectsDataService } from "./projects-data";
import { WorkspaceContextService } from "./workspace-context";
import type { ProjectRow } from "../api/models";
import { sampleProject } from "../../testing/data-stubs";

const row: ProjectRow = {
  id: sampleProject.id,
  workspace_id: "ws-1",
  name: sampleProject.name,
  description: sampleProject.description,
  status: "active",
  color: sampleProject.color,
  due_date: sampleProject.dueDate,
  created_by: "user-1",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  archived_at: null,
  version: 1,
};

describe("ProjectsDataService", () => {
  let http: HttpTestingController;
  const workspaceId = signal<string | null>("ws-1");
  const handleUnauthorized = vi.fn();

  beforeEach(() => {
    workspaceId.set("ws-1");
    handleUnauthorized.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(
          withInterceptors([credentialsInterceptor, authErrorInterceptor]),
        ),
        provideHttpClientTesting(),
        provideRouter([]),
        ProjectsDataService,
        {
          provide: WorkspaceContextService,
          useValue: { currentWorkspaceId: workspaceId },
        },
        {
          provide: AuthService,
          useValue: { handleUnauthorized },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("parses a successful project list", async () => {
    const service = TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush({
      success: true,
      data: [row],
    });
    await Promise.resolve();
    expect(service.projects()[0]?.name).toBe("Atlas Launch");
    expect(service.projects()[0]?.dueDate).toBe("2026-12-01");
  });

  it("treats an empty list as empty", async () => {
    const service = TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush({
      success: true,
      data: [],
    });
    await Promise.resolve();
    expect(service.projects()).toEqual([]);
    expect(service.error()).toBeUndefined();
  });

  it("surfaces an error", async () => {
    const service = TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush(
      {
        success: false,
        error: { code: "FORBIDDEN", message: "No", fieldErrors: {} },
      },
      { status: 403, statusText: "Forbidden" },
    );
    await Promise.resolve();
    expect(service.error()).toBeTruthy();
    expect(handleUnauthorized).not.toHaveBeenCalled();
  });

  it("reloads when the workspace id changes and not otherwise", async () => {
    const service = TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush({
      success: true,
      data: [row],
    });
    await Promise.resolve();
    http.verify();
    workspaceId.set("ws-2");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-2").flush({
      success: true,
      data: [],
    });
    expect(service.projects()).toEqual([]);
  });

  it("does not request until a workspace is selected", () => {
    workspaceId.set(null);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ProjectsDataService,
        {
          provide: WorkspaceContextService,
          useValue: { currentWorkspaceId: workspaceId },
        },
      ],
    });
    const nested = TestBed.inject(HttpTestingController);
    TestBed.inject(ProjectsDataService);
    nested.expectNone(() => true);
  });

  it("reload repeats the current workspace request", async () => {
    const service = TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush({
      success: true,
      data: [row],
    });
    await Promise.resolve();
    service.reload();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush({
      success: true,
      data: [row],
    });
  });

  it("clears auth state on 401 via the shared interceptor", async () => {
    TestBed.inject(ProjectsDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/projects?workspaceId=ws-1").flush(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Please sign in.", fieldErrors: {} },
      },
      { status: 401, statusText: "Unauthorized" },
    );
    await Promise.resolve();
    expect(handleUnauthorized).toHaveBeenCalled();
  });
});

import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection, signal } from "@angular/core";
import { HttpErrorResponse, provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { provideRouter } from "@angular/router";
import { AuditDataService } from "../../core/data/audit-data";
import { WorkspaceContextService } from "../../core/data/workspace-context";
import { WorkspacePermissionsService } from "../../core/data/permissions";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { AuditPage } from "./audit-page";
import {
  stubPermissions,
  stubWorkspaceContext,
  stubWorkspaceReads,
} from "../../testing/data-stubs";
import type { ActivityEventRow } from "../../core/api/models";

const event: ActivityEventRow = {
  id: "e1",
  workspace_id: "ws-1",
  actor_id: "user-1",
  action: "moved",
  entity_type: "task",
  entity_id: "t1",
  entity_title: "Write launch checklist",
  old_value: null,
  new_value: null,
  summary: "moved Write launch checklist",
  created_at: "2026-09-01T12:00:00.000Z",
  changes: { status: { from: "todo", to: "done" } },
};

describe("AuditDataService", () => {
  let http: HttpTestingController;
  const workspaceId = signal<string | null>("ws-1");

  beforeEach(() => {
    workspaceId.set("ws-1");
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        AuditDataService,
        {
          provide: WorkspaceContextService,
          useValue: { currentWorkspaceId: workspaceId },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("loads workspace audit without inventing events", async () => {
    const service = TestBed.inject(AuditDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/workspaces/ws-1/audit").flush({
      success: true,
      data: [event],
    });
    await Promise.resolve();
    expect(service.events()).toHaveLength(1);
    expect(service.events()[0]?.action).toBe("moved");
  });

  it("sends React-matching filters", async () => {
    const service = TestBed.inject(AuditDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/workspaces/ws-1/audit").flush({
      success: true,
      data: [],
    });
    service.setFilters({ entityType: "task", action: "updated" });
    TestBed.inject(ApplicationRef).tick();
    const req = http.expectOne(
      "/api/taskflow/workspaces/ws-1/audit?entityType=task&action=updated",
    );
    req.flush({ success: true, data: [] });
  });

  it("retries after an error", async () => {
    const service = TestBed.inject(AuditDataService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/workspaces/ws-1/audit").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "nope", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await Promise.resolve();
    expect(service.error()).toBeTruthy();
    service.reload();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/workspaces/ws-1/audit").flush({
      success: true,
      data: [],
    });
  });
});

describe("AuditPage", () => {
  it("shows a 403 permission state", async () => {
    const audit = {
      entityType: signal(""),
      action: signal(""),
      events: signal([] as ActivityEventRow[]),
      isLoading: signal(false),
      error: signal(
        new HttpErrorResponse({
          status: 403,
          statusText: "Forbidden",
          error: {
            success: false,
            error: {
              code: "AUDIT_ACCESS_DENIED",
              message: "nope",
              fieldErrors: {},
            },
          },
        }),
      ),
      hasValue: signal(false),
      setFilters: vi.fn(),
      reload: vi.fn(),
    };
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuditPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuditDataService, useValue: audit },
        { provide: WorkspacePermissionsService, useValue: stubPermissions({ role: "viewer" }) },
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Audit history is limited to workspace admins and owners.",
    );
  });

  it("renders formatted server events", async () => {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [AuditPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AuditDataService,
          useValue: {
            entityType: signal(""),
            action: signal(""),
            events: signal([event]),
            isLoading: signal(false),
            error: signal(null),
            hasValue: signal(true),
            setFilters: vi.fn(),
            reload: vi.fn(),
          },
        },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Moved");
    expect(fixture.nativeElement.textContent).toContain("Write launch checklist");
    expect(fixture.nativeElement.textContent).not.toContain('"from"');
  });
});

import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "../auth/auth";
import { credentialsInterceptor } from "../api/credentials.interceptor";
import { authErrorInterceptor } from "../api/auth-error.interceptor";
import { WorkspaceContextService, pickActiveWorkspace } from "./workspace-context";
import { sampleWorkspace } from "../../testing/data-stubs";
import { provideRouter } from "@angular/router";

function memoryStorage() {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
    removeItem: (key: string) => store.delete(key),
  };
}

describe("pickActiveWorkspace", () => {
  it("prefers the stored id, then the demo workspace, then the first row", () => {
    const demo = { ...sampleWorkspace, id: "demo", name: "Portfolio Demo Workspace" };
    const other = { ...sampleWorkspace, id: "other", name: "Other" };
    expect(pickActiveWorkspace([other, demo], null)?.id).toBe("demo");
    expect(pickActiveWorkspace([other, demo], "other")?.id).toBe("other");
    expect(pickActiveWorkspace([], null)).toBeNull();
  });
});

describe("WorkspaceContextService", () => {
  let http: HttpTestingController;
  const authenticated = signal(true);

  beforeEach(() => {
    authenticated.set(true);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(
          withInterceptors([credentialsInterceptor, authErrorInterceptor]),
        ),
        provideHttpClientTesting(),
        provideRouter([]),
        WorkspaceContextService,
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: authenticated,
            handleUnauthorized: vi.fn(),
          },
        },
        {
          provide: DOCUMENT,
          useValue: {
            defaultView: { localStorage: memoryStorage() },
            getElementById: () => null,
            querySelector: () => null,
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("loads workspaces from the real contract", async () => {
    const service = TestBed.inject(WorkspaceContextService);
    TestBed.inject(ApplicationRef).tick();
    expect(service.isLoading()).toBe(true);
    const req = http.expectOne("/api/workspaces");
    expect(req.request.withCredentials).toBe(true);
    req.flush({ success: true, data: [sampleWorkspace] });
    await Promise.resolve();
    expect(service.workspaces()).toEqual([sampleWorkspace]);
    expect(service.currentWorkspaceId()).toBe(sampleWorkspace.id);
    expect(service.error()).toBeUndefined();
  });

  it("treats an empty list as empty, not an error", async () => {
    const service = TestBed.inject(WorkspaceContextService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/workspaces").flush({ success: true, data: [] });
    await Promise.resolve();
    expect(service.workspaces()).toEqual([]);
    expect(service.currentWorkspace()).toBeNull();
    expect(service.error()).toBeUndefined();
  });

  it("surfaces a load error", async () => {
    const service = TestBed.inject(WorkspaceContextService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/workspaces").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "boom", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await Promise.resolve();
    expect(service.error()).toBeTruthy();
  });

  it("reload issues another GET", async () => {
    const service = TestBed.inject(WorkspaceContextService);
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/workspaces").flush({ success: true, data: [sampleWorkspace] });
    await Promise.resolve();
    service.reload();
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/workspaces").flush({ success: true, data: [sampleWorkspace] });
  });
});

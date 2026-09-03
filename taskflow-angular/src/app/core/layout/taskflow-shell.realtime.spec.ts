import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { TaskflowShell } from "./taskflow-shell";
import { AuthService } from "../auth/auth";
import { WorkspaceContextService } from "../data/workspace-context";
import { RealtimeService } from "../realtime/realtime";
import { RealtimeCoordinatorService } from "../realtime/realtime-coordinator";
import { OfflineReplayService } from "../offline/replay";
import { stubAuth, stubOfflineReplay, stubRealtime, stubWorkspaceContext, stubConflictResolution, productSurfaceProviders } from "../../testing/data-stubs";
import { ConflictResolutionService } from "../conflict/conflict-resolution";

describe("TaskflowShell realtime lifecycle", () => {
  async function render(options?: {
    authenticated?: boolean;
    workspaceId?: string | null;
  }) {
    const auth = stubAuth({
      status: options?.authenticated === false ? "unauthenticated" : "authenticated",
      user:
        options?.authenticated === false
          ? null
          : {
              id: "user-1",
              email: "maya@example.com",
              profile: { display_name: "Maya Chen", avatar_url: null },
            },
    });
    const workspace = stubWorkspaceContext(
      options?.workspaceId === null ? { workspaces: [] } : undefined,
    );
    const realtime = stubRealtime();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TaskflowShell],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "**", component: TaskflowShell }]),
        { provide: AuthService, useValue: auth },
        { provide: WorkspaceContextService, useValue: workspace },
        { provide: RealtimeService, useValue: realtime },
        { provide: RealtimeCoordinatorService, useValue: {} },
        { provide: OfflineReplayService, useValue: stubOfflineReplay() },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
        ...productSurfaceProviders(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TaskflowShell);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, auth, workspace, realtime };
  }

  it("does not start a channel while unauthenticated", async () => {
    const { realtime } = await render({ authenticated: false });
    expect(realtime.start).not.toHaveBeenCalled();
  });

  it("starts one workspace channel when authenticated", async () => {
    const { realtime } = await render();
    expect(realtime.start).toHaveBeenCalledTimes(1);
    expect(realtime.start).toHaveBeenCalledWith(
      "ws-1",
      "user-1",
      expect.objectContaining({
        userId: "user-1",
        workspaceId: "ws-1",
      }),
    );
  });

  it("does not restart the channel when start() writes connectionStatus", async () => {
    const auth = stubAuth();
    const workspace = stubWorkspaceContext();
    const realtime = stubRealtime();
    realtime.start.mockImplementation(async () => {
      realtime.connectionStatus();
      realtime.connectionStatus.set("connecting");
      realtime.connectionStatus.set("online");
    });
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [TaskflowShell],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "**", component: TaskflowShell }]),
        { provide: AuthService, useValue: auth },
        { provide: WorkspaceContextService, useValue: workspace },
        { provide: RealtimeService, useValue: realtime },
        { provide: RealtimeCoordinatorService, useValue: {} },
        { provide: OfflineReplayService, useValue: stubOfflineReplay() },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
        ...productSurfaceProviders(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TaskflowShell);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(realtime.start).toHaveBeenCalledTimes(1);
  });

  it("stops the channel on logout", async () => {
    const { auth, realtime, fixture } = await render();
    realtime.stop.mockClear();
    auth.status.set("unauthenticated");
    auth.currentUser.set(null);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(realtime.stop).toHaveBeenCalled();
  });
});

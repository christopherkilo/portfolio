import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { Router, provideRouter } from "@angular/router";
import { App } from "./app";
import { routes } from "./app.routes";
import { UiStateService } from "./core/state/ui-state";
import { AuthService } from "./core/auth/auth";
import type { TaskflowMe } from "./core/api/taskflow-api";
import type { AuthStatus } from "./core/auth/auth";
import { WorkspaceContextService } from "./core/data/workspace-context";
import { WorkspaceReadsService } from "./core/data/workspace-reads";
import { WorkspacePermissionsService } from "./core/data/permissions";
import { TaskMutationsService } from "./core/data/task-mutations";
import { InvitationsDataService } from "./core/data/invitations-data";
import { InvitationMutationsService } from "./core/data/invitation-mutations";
import { MemberMutationsService } from "./core/data/member-mutations";
import { RealtimeService } from "./core/realtime/realtime";
import { RealtimeCoordinatorService } from "./core/realtime/realtime-coordinator";
import { OfflineReplayService } from "./core/offline/replay";
import { ConflictResolutionService } from "./core/conflict/conflict-resolution";
import {
  stubInvitations,
  stubInvitationMutations,
  stubMemberMutations,
  stubOfflineReplay,
  stubPermissions,
  stubRealtime,
  stubRealtimeCoordinator,
  stubTaskMutations,
  stubWorkspaceContext,
  stubWorkspaceReads,
  stubConflictResolution,
  productSurfaceProviders,
} from "./testing/data-stubs";

const me: TaskflowMe = {
  id: "user-1",
  email: "maya@example.com",
  profile: { display_name: "Maya Chen", avatar_url: null },
};

function stubAuth(status: AuthStatus) {
  const currentUser = signal(status === "authenticated" ? me : null);
  const statusSig = signal(status);
  return {
    status: statusSig,
    currentUser,
    isAuthenticated: () => statusSig() === "authenticated",
    logoutError: signal<string | null>(null),
    initialize: () => Promise.resolve(),
    ensureInitialized: () => Promise.resolve(),
    refreshUser: () => Promise.resolve(),
    signInWithGoogle: () => undefined,
    signOut: () => Promise.resolve(),
    handleUnauthorized: () => undefined,
  };
}

async function renderAt(url: string, status: AuthStatus = "authenticated") {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [App],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter(routes),
      { provide: AuthService, useValue: stubAuth(status) },
      { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
      { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
      { provide: WorkspacePermissionsService, useValue: stubPermissions() },
      { provide: TaskMutationsService, useValue: stubTaskMutations() },
      { provide: InvitationsDataService, useValue: stubInvitations() },
      { provide: InvitationMutationsService, useValue: stubInvitationMutations() },
      { provide: MemberMutationsService, useValue: stubMemberMutations() },
      { provide: RealtimeService, useValue: stubRealtime() },
      { provide: RealtimeCoordinatorService, useValue: stubRealtimeCoordinator() },
      { provide: OfflineReplayService, useValue: stubOfflineReplay() },
      { provide: ConflictResolutionService, useValue: stubConflictResolution() },
      ...productSurfaceProviders(),
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(App);
  const router = TestBed.inject(Router);
  await router.navigateByUrl(url);
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, router, ui: TestBed.inject(UiStateService) };
}

describe("TaskFlow Angular foundation routes", () => {
  it("redirects the root path to Dashboard", async () => {
    const { router, fixture } = await renderAt("/");
    expect(router.url).toBe("/dashboard");
    expect(fixture.nativeElement.textContent).toContain("Completed today");
  });

  it("renders the Dashboard route", async () => {
    const { fixture } = await renderAt("/dashboard");
    expect(fixture.nativeElement.textContent).toContain("Completed today");
  });

  it("renders the Projects route", async () => {
    const { fixture } = await renderAt("/projects");
    expect(fixture.nativeElement.textContent).toContain("Atlas Launch");
  });

  it("renders the Tasks route", async () => {
    const { fixture } = await renderAt("/tasks");
    expect(fixture.nativeElement.textContent).toContain("Write launch checklist");
  });

  it("renders the Calendar route", async () => {
    const { fixture } = await renderAt("/calendar");
    expect(fixture.nativeElement.textContent).toContain("Upcoming deadlines");
  });

  it("renders the Team route", async () => {
    const { fixture } = await renderAt("/team");
    expect(fixture.nativeElement.textContent).toContain("Team members");
  });

  it("renders the Audit route", async () => {
    const { fixture } = await renderAt("/audit");
    expect(fixture.nativeElement.textContent).toContain("Workspace audit");
  });

  it("renders the Settings route", async () => {
    const { fixture } = await renderAt("/settings");
    expect(fixture.nativeElement.textContent).toContain("Appearance");
    expect(fixture.nativeElement.textContent).toContain("Density");
  });

  it("renders sign-in without the TaskFlow shell", async () => {
    const { fixture } = await renderAt("/signin", "unauthenticated");
    expect(fixture.nativeElement.querySelector("tf-sidebar")).toBeNull();
    expect(fixture.nativeElement.querySelector("tf-top-nav")).toBeNull();
    expect(fixture.nativeElement.querySelector("tf-sign-in-page")).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain("Welcome to TaskFlow");
  });

  it("renders invite without the TaskFlow shell", async () => {
    const { fixture } = await renderAt("/invite", "unauthenticated");
    expect(fixture.nativeElement.querySelector("tf-sidebar")).toBeNull();
    expect(fixture.nativeElement.querySelector("tf-top-nav")).toBeNull();
    expect(fixture.nativeElement.querySelector("tf-invite-page")).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain("Invalid invite");
  });

  it("renders the Angular not-found page for unknown routes", async () => {
    const { fixture } = await renderAt("/this-route-does-not-exist");
    expect(fixture.nativeElement.textContent).toContain("Page not found");
    const home = fixture.nativeElement.querySelector(
      'a[href="/dashboard"]',
    ) as HTMLAnchorElement | null;
    expect(home).toBeTruthy();
  });

  it("uses sidebar routerLinks for every shell destination", async () => {
    const { fixture } = await renderAt("/dashboard");
    const hrefs = Array.from(
      fixture.nativeElement.querySelectorAll("tf-sidebar nav a"),
    ).map((el) => (el as HTMLAnchorElement).getAttribute("href"));
    expect(hrefs).toEqual([
      "/dashboard",
      "/projects",
      "/tasks",
      "/calendar",
      "/team",
      "/audit",
      "/settings",
    ]);
  });

  it("marks the active sidebar route", async () => {
    const { fixture } = await renderAt("/projects");
    const active = fixture.nativeElement.querySelector(
      "tf-sidebar nav a.is-active",
    ) as HTMLAnchorElement | null;
    expect(active?.textContent).toContain("Projects");
    expect(active?.getAttribute("aria-current")).toBe("page");
  });

  it("derives the shell page title from route data", async () => {
    const { fixture, router } = await renderAt("/calendar");
    const title = fixture.nativeElement.querySelector("h1");
    expect(title?.textContent?.trim()).toBe("Calendar");
    await router.navigateByUrl("/audit");
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector("h1")?.textContent?.trim(),
    ).toBe("Audit");
  });

  it("opens and closes mobile sidebar state", async () => {
    const { fixture, ui } = await renderAt("/dashboard");
    expect(fixture.nativeElement.querySelector("#tf-mobile-nav")).toBeNull();
    ui.openMobileSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("#tf-mobile-nav")).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector("#tf-mobile-nav")?.getAttribute(
        "role",
      ),
    ).toBe("dialog");
    ui.closeMobileSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("#tf-mobile-nav")).toBeNull();
  });

  it("closes mobile navigation on Escape", async () => {
    const { fixture, ui } = await renderAt("/dashboard");
    ui.openMobileSidebar();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector("#tf-mobile-nav")).toBeTruthy();

    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ui.mobileSidebarOpen()).toBe(false);
    expect(fixture.nativeElement.querySelector("#tf-mobile-nav")).toBeNull();
  });

  it("renders authenticated identity from /api/me fields only", async () => {
    const { fixture } = await renderAt("/dashboard");
    expect(fixture.nativeElement.textContent).toContain("MC");
    expect(fixture.nativeElement.textContent).not.toContain("Jordan Blake");
    expect(fixture.nativeElement.querySelector("select")).toBeNull();
  });

  it("sends unauthenticated users from a protected route to signin", async () => {
    const { router } = await renderAt("/projects", "unauthenticated");
    expect(router.url).toBe("/signin?next=%2Fprojects");
  });
});

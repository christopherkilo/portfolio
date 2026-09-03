import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { of } from "rxjs";
import { expectNoSeriousA11yViolations } from "./testing/a11y";
import { SignInPage } from "./features/auth/sign-in-page";
import { DashboardPage } from "./features/dashboard/dashboard-page";
import { ProjectsPage } from "./features/projects/projects-page";
import { TasksPage } from "./features/tasks/tasks-page";
import { CalendarPage } from "./features/calendar/calendar-page";
import { TeamPage } from "./features/team/team-page";
import { AuditPage } from "./features/audit/audit-page";
import { SettingsPage } from "./features/settings/settings-page";
import { InvitePage } from "./features/invitations/invite-page";
import { ConflictDialog } from "./shared/ui/conflict-dialog";
import { NotificationMenu } from "./shared/ui/notification-menu";
import { WorkspaceReadsService } from "./core/data/workspace-reads";
import { WorkspacePermissionsService } from "./core/data/permissions";
import { TaskMutationsService } from "./core/data/task-mutations";
import { ProjectMutationsService } from "./core/data/project-mutations";
import { AuthService } from "./core/auth/auth";
import { RealtimeService } from "./core/realtime/realtime";
import { ConflictResolutionService } from "./core/conflict/conflict-resolution";
import { MutationQueueService } from "./core/offline/mutation-queue";
import { TasksDataService } from "./core/data/tasks-data";
import { ActivityDataService } from "./core/data/activity-data";
import { WorkspaceContextService } from "./core/data/workspace-context";
import { InvitationsDataService } from "./core/data/invitations-data";
import { InvitationMutationsService } from "./core/data/invitation-mutations";
import { MemberMutationsService } from "./core/data/member-mutations";
import { AuditDataService } from "./core/data/audit-data";
import { NotificationsDataService } from "./core/data/notifications-data";
import { NotificationMutationsService } from "./core/data/notification-mutations";
import { NotificationPreferencesDataService } from "./core/data/notification-preferences-data";
import { NotificationPreferenceMutationsService } from "./core/data/notification-preference-mutations";
import { NetworkStatusService } from "./core/realtime/network-status";
import { UiStateService } from "./core/state/ui-state";
import { taskToDraft } from "./core/conflict/normalize";
import type { Task } from "./core/api/models";
import {
  conflictResolutionDeps,
  productSurfaceProviders,
  sampleMember,
  sampleTask,
  stubAudit,
  stubAuth,
  stubConflictResolution,
  stubInvitations,
  stubInvitationMutations,
  stubMemberMutations,
  stubNotificationMutations,
  stubNotificationPreferenceMutations,
  stubNotificationPreferences,
  stubNotifications,
  stubPermissions,
  stubProjectMutations,
  stubRealtime,
  stubTaskMutations,
  stubWorkspaceContext,
  stubWorkspaceReads,
} from "./testing/data-stubs";

const teammate = {
  ...sampleMember,
  id: "member-1",
  name: "Morgan Member",
  role: "member" as const,
  email: "morgan@example.com",
  avatar: "MM",
};

describe("Phase 10 accessibility surfaces", () => {
  afterEach(() => TestBed.resetTestingModule());

  it("signin has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: stubAuth({ status: "unauthenticated" }) },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: of(convertToParamMap({})) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("dashboard has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("projects has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [ProjectsPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: ProjectMutationsService, useValue: stubProjectMutations() },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProjectsPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("tasks and task detail have no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [TasksPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "", component: TasksPage }]),
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: TaskMutationsService, useValue: stubTaskMutations() },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: RealtimeService, useValue: stubRealtime() },
        ...productSurfaceProviders(),
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TasksPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("conflict dialog has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [ConflictDialog],
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        ConflictResolutionService,
        TaskMutationsService,
        MutationQueueService,
        ...conflictResolutionDeps(),
        { provide: ProjectMutationsService, useValue: stubProjectMutations() },
        { provide: AuthService, useValue: stubAuth() },
        { provide: WorkspaceContextService, useValue: stubWorkspaceContext() },
        { provide: TasksDataService, useValue: { reload: vi.fn() } },
        { provide: ActivityDataService, useValue: { reload: vi.fn() } },
      ],
    }).compileComponents();
    const conflicts = TestBed.inject(ConflictResolutionService);
    const base: Task = { ...sampleTask, labels: [...sampleTask.labels] };
    conflicts.openFromTaskConflict(
      {
        entityType: "task",
        entityId: "t1",
        expectedVersion: 3,
        latest: { ...base, title: "Server title", version: 9, labels: [...base.labels] },
        draft: { ...taskToDraft(base), title: "Local draft" },
        message: "changed",
      },
      base,
    );
    const fixture = TestBed.createComponent(ConflictDialog);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("team has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [TeamPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: WorkspaceReadsService,
          useValue: stubWorkspaceReads({ members: [sampleMember, teammate] }),
        },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: InvitationsDataService, useValue: stubInvitations() },
        { provide: InvitationMutationsService, useValue: stubInvitationMutations() },
        { provide: MemberMutationsService, useValue: stubMemberMutations() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(TeamPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("notifications panel has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationMenu],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "tasks", children: [] }]),
        {
          provide: NotificationsDataService,
          useValue: stubNotifications({
            notifications: [
              {
                id: "n1",
                type: "task_assigned",
                entityType: "task",
                entityId: "11111111-1111-4111-8111-111111111111",
                title: "You were assigned a task",
                message: "Write launch checklist",
                occurrenceCount: 1,
                lastOccurredAt: "2026-09-01T12:00:00.000Z",
                createdAt: "2026-09-01T12:00:00.000Z",
                readAt: null,
              },
            ],
          }),
        },
        { provide: NotificationMutationsService, useValue: stubNotificationMutations() },
        { provide: NetworkStatusService, useValue: { online: signal(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotificationMenu);
    fixture.componentInstance.open.set(true);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("audit has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [AuditPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
        { provide: WorkspacePermissionsService, useValue: stubPermissions() },
        { provide: AuditDataService, useValue: stubAudit() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(AuditPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("settings has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsPage],
      providers: [
        provideZonelessChangeDetection(),
        UiStateService,
        { provide: AuthService, useValue: stubAuth() },
        {
          provide: NotificationPreferencesDataService,
          useValue: stubNotificationPreferences(),
        },
        {
          provide: NotificationPreferenceMutationsService,
          useValue: stubNotificationPreferenceMutations(),
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SettingsPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("invite has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [InvitePage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: AuthService, useValue: stubAuth({ status: "unauthenticated" }) },
        { provide: InvitationMutationsService, useValue: stubInvitationMutations() },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap({}) },
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvitePage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });

  it("calendar has no serious or critical axe violations", async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: stubWorkspaceReads() },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ month: "2026-12" })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(CalendarPage);
    fixture.detectChanges();
    await expectNoSeriousA11yViolations(fixture.nativeElement);
  });
});

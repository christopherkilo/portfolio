import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { EntityPresenceLine, PresenceAvatars } from "./presence-avatars";
import { RealtimeService } from "../../core/realtime/realtime";
import { AuthService } from "../../core/auth/auth";
import type { PresenceUser } from "../../core/realtime/presence";

const ada: PresenceUser = {
  userId: "user-1",
  displayName: "Ada Lovelace",
  workspaceId: "ws-1",
  lastActiveAt: "2026-09-01T00:00:00.000Z",
  currentView: "/tasks",
};
const grace: PresenceUser = {
  userId: "u2",
  displayName: "Grace Hopper",
  workspaceId: "ws-1",
  lastActiveAt: "2026-09-01T00:00:00.000Z",
  currentEntityId: "t1",
};

describe("PresenceAvatars", () => {
  const users = signal<PresenceUser[]>([]);

  beforeEach(async () => {
    users.set([ada, grace]);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [PresenceAvatars, EntityPresenceLine],
      providers: [
        provideZonelessChangeDetection(),
        { provide: RealtimeService, useValue: { presenceUsers: users } },
        {
          provide: AuthService,
          useValue: { currentUser: signal({ id: "user-1" }) },
        },
      ],
    }).compileComponents();
  });

  it("renders workspace presence and highlights self", async () => {
    const fixture = TestBed.createComponent(PresenceAvatars);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("AL");
    expect(fixture.nativeElement.textContent).toContain("GH");
    expect(fixture.nativeElement.querySelector(".self")).toBeTruthy();
  });

  it("clears avatars when presence is empty (sign-out / workspace switch)", async () => {
    const fixture = TestBed.createComponent(PresenceAvatars);
    fixture.detectChanges();
    users.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".avatar")).toBeNull();
  });

  it("describes other viewers on a task", async () => {
    const fixture = TestBed.createComponent(EntityPresenceLine);
    fixture.componentRef.setInput("entityId", "t1");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "Grace Hopper is viewing this task.",
    );
  });
});

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ConnectionIndicator } from "./connection-indicator";
import { RealtimeService } from "../../core/realtime/realtime";
import { NetworkStatusService } from "../../core/realtime/network-status";
import { MutationQueueService } from "../../core/offline/mutation-queue";
import type { ConnectionStatus } from "../../core/realtime/connection-status";
import { stubMutationQueue, stubConflictResolution } from "../../testing/data-stubs";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";

describe("ConnectionIndicator", () => {
  const status = signal<ConnectionStatus>("offline");
  const online = signal(true);

  async function render(
    next: ConnectionStatus,
    queue = stubMutationQueue(),
    networkOnline = true,
  ) {
    status.set(next);
    online.set(networkOnline);
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [ConnectionIndicator],
      providers: [
        provideZonelessChangeDetection(),
        {
          provide: RealtimeService,
          useValue: { connectionStatus: status },
        },
        {
          provide: NetworkStatusService,
          useValue: { online },
        },
        { provide: MutationQueueService, useValue: queue },
        { provide: ConflictResolutionService, useValue: stubConflictResolution() },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ConnectionIndicator);
    fixture.detectChanges();
    return fixture;
  }

  it("reflects RealtimeService connection state", async () => {
    const fixture = await render("online");
    expect(fixture.nativeElement.textContent).toContain("Online");
    expect(
      fixture.nativeElement.querySelector("[role='status']")?.getAttribute(
        "aria-live",
      ),
    ).toBe("polite");
    status.set("reconnecting");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Reconnecting");
    status.set("failed");
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Connection failed");
  });

  it("shows pending and conflicted queue counts", async () => {
    const fixture = await render(
      "online",
      stubMutationQueue({ pending: 2, conflicted: 1 }),
    );
    expect(fixture.nativeElement.textContent).toContain("2 pending");
    expect(fixture.nativeElement.textContent).toContain(
      "1 offline change needs conflict resolution.",
    );
  });

  it("uses browser offline independently of realtime", async () => {
    const fixture = await render("online", stubMutationQueue(), false);
    expect(fixture.nativeElement.textContent).toContain("Offline");
  });
});

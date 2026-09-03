import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { UiStateService } from "./ui-state";

describe("UiStateService", () => {
  let ui: UiStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), UiStateService],
    });
    ui = TestBed.inject(UiStateService);
  });

  it("does not store server entities", () => {
    const record = ui as unknown as Record<string, unknown>;
    for (const key of [
      "tasks",
      "projects",
      "users",
      "workspace",
      "workspaces",
      "notifications",
      "members",
      "comments",
    ]) {
      expect(record[key]).toBeUndefined();
    }
    expect(ui.mobileSidebarOpen).toBeDefined();
    expect(ui.theme).toBeDefined();
    expect(ui.density).toBeDefined();
    expect(ui.weekStart).toBeDefined();
  });

  it("persists density onto the document root", () => {
    expect(ui.density()).toBe("comfortable");
    ui.setDensity("compact");
    expect(ui.density()).toBe("compact");
    expect(document.documentElement.dataset["density"]).toBe("compact");
  });

  it("toggles the mobile sidebar with signals", () => {
    expect(ui.mobileSidebarOpen()).toBe(false);
    ui.openMobileSidebar();
    expect(ui.mobileSidebarOpen()).toBe(true);
    ui.closeMobileSidebar();
    expect(ui.mobileSidebarOpen()).toBe(false);
  });
});

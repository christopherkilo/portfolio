import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { DashboardPage } from "./dashboard-page";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { stubWorkspaceReads } from "../../testing/data-stubs";

describe("DashboardPage", () => {
  async function render(reads = stubWorkspaceReads()) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: WorkspaceReadsService, useValue: reads },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return { fixture, reads };
  }

  it("renders derived stats from real mapped data", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("Completed today");
    expect(fixture.nativeElement.textContent).toContain("Atlas Launch");
    expect(fixture.nativeElement.textContent).not.toContain("Jordan Blake");
  });

  it("shows a loading state", async () => {
    const reads = stubWorkspaceReads({ loading: true });
    reads.isLoading.set(true);
    const { fixture } = await render(reads);
    expect(fixture.nativeElement.textContent).toContain("Loading dashboard");
  });

  it("shows overdue empty when there are no overdue tasks", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("No overdue tasks");
  });

  it("shows an accessible error with retry", async () => {
    const reads = stubWorkspaceReads({
      error: new HttpErrorResponse({ status: 500, statusText: "Server Error" }),
    });
    const { fixture } = await render(reads);
    const alert = fixture.nativeElement.querySelector("[role='alert']");
    expect(alert).toBeTruthy();
    fixture.nativeElement.querySelector("button")?.click();
    expect(reads.reloadAll).toHaveBeenCalled();
  });
});

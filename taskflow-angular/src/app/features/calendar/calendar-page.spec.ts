import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { HttpErrorResponse } from "@angular/common/http";
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from "@angular/router";
import { of } from "rxjs";
import { CalendarPage } from "./calendar-page";
import { WorkspaceReadsService } from "../../core/data/workspace-reads";
import { stubWorkspaceReads } from "../../testing/data-stubs";

describe("CalendarPage", () => {
  async function render(reads = stubWorkspaceReads()) {
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([{ path: "tasks", children: [] }]),
        { provide: WorkspaceReadsService, useValue: reads },
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
    return { fixture, reads, router: TestBed.inject(Router) };
  }

  it("places due tasks on the month grid and upcoming list", async () => {
    const { fixture } = await render();
    expect(fixture.nativeElement.textContent).toContain("December 2026");
    expect(fixture.nativeElement.textContent).toContain("Write launch checklist");
    expect(fixture.nativeElement.textContent).toContain("Upcoming deadlines");
  });

  it("opens a due task on the task board", async () => {
    const { fixture, router } = await render();
    const chip = Array.from(
      fixture.nativeElement.querySelectorAll("button.chip") as NodeListOf<HTMLButtonElement>,
    ).find((button) => button.textContent?.includes("Write launch checklist"));
    chip?.click();
    fixture.detectChanges();
    fixture.nativeElement.querySelector("button.primary")?.click();
    await fixture.whenStable();
    expect(router.url).toContain("/tasks");
    expect(router.url).toContain("t1");
  });

  it("shows loading and error states", async () => {
    const loading = stubWorkspaceReads({ loading: true });
    loading.isLoading.set(true);
    const loaded = await render(loading);
    expect(loaded.fixture.nativeElement.textContent).toContain("Loading calendar");

    const failed = stubWorkspaceReads({
      error: new HttpErrorResponse({ status: 500, statusText: "Server Error" }),
    });
    const errored = await render(failed);
    expect(errored.fixture.nativeElement.querySelector("[role='alert']")).toBeTruthy();
  });
});

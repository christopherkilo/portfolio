import { TestBed } from "@angular/core/testing";
import { ApplicationRef, provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { TaskHistoryDataService } from "./task-history-data";
import type { ActivityEventRow } from "../api/models";

function event(id: string, createdAt: string): ActivityEventRow {
  return {
    id,
    workspace_id: "ws-1",
    actor_id: "user-1",
    action: "created",
    entity_type: "task",
    entity_id: "t1",
    entity_title: "Write launch checklist",
    old_value: null,
    new_value: null,
    summary: "created Write launch checklist",
    created_at: createdAt,
  };
}

describe("TaskHistoryDataService", () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskHistoryDataService,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it("loads newest-first history and caps at 12", async () => {
    const service = TestBed.inject(TaskHistoryDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    const rows = Array.from({ length: 15 }, (_, index) =>
      event(`e${index}`, `2026-09-01T${String(12 + index).padStart(2, "0")}:00:00.000Z`),
    );
    http.expectOne("/api/taskflow/tasks/t1/history").flush({
      success: true,
      data: rows,
    });
    await Promise.resolve();
    expect(service.events()).toHaveLength(12);
    expect(service.events()[0]?.id).toBe("e0");
  });

  it("shows empty without synthesizing events", async () => {
    const service = TestBed.inject(TaskHistoryDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/history").flush({
      success: true,
      data: [],
    });
    await Promise.resolve();
    expect(service.events()).toEqual([]);
  });

  it("retries after an error", async () => {
    const service = TestBed.inject(TaskHistoryDataService);
    service.setActiveTask("t1");
    TestBed.inject(ApplicationRef).tick();
    http.expectOne("/api/taskflow/tasks/t1/history").flush(
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
    http.expectOne("/api/taskflow/tasks/t1/history").flush({
      success: true,
      data: [],
    });
  });
});

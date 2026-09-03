import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { SKIP_AUTH_REDIRECT } from "../api/http-context";
import { TaskflowRealtimeClientFactory } from "./client-factory";

describe("TaskflowRealtimeClientFactory", () => {
  let http: HttpTestingController;
  let factory: TaskflowRealtimeClientFactory;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        TaskflowRealtimeClientFactory,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    factory = TestBed.inject(TaskflowRealtimeClientFactory);
  });

  afterEach(() => {
    http.verify();
  });

  it("loads only browser-safe public config and skips 401 redirect", async () => {
    const pending = factory.loadPublicConfig();
    const req = http.expectOne("/api/taskflow/public-config");
    expect(req.request.method).toBe("GET");
    expect(req.request.context.get(SKIP_AUTH_REDIRECT)).toBe(true);
    req.flush({
      success: true,
      data: {
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
      },
    });
    await expect(pending).resolves.toEqual({
      supabaseUrl: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("rejects a public-config payload that includes secrets", async () => {
    const pending = factory.loadPublicConfig();
    http.expectOne("/api/taskflow/public-config").flush({
      success: true,
      data: {
        supabaseUrl: "https://example.supabase.co",
        publishableKey: "sb_publishable_test",
        secretKey: "nope",
      },
    });
    await expect(pending).rejects.toThrow(/must not include secrets/);
  });
});

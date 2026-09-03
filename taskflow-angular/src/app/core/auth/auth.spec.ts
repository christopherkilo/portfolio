import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Component } from "@angular/core";
import { provideRouter } from "@angular/router";
import { DOCUMENT } from "@angular/common";
import { AuthService } from "./auth";
import { RealtimeService } from "../realtime/realtime";
import { credentialsInterceptor } from "../api/credentials.interceptor";
import { authErrorInterceptor } from "../api/auth-error.interceptor";
import { withInterceptors } from "@angular/common/http";

@Component({ selector: "tf-sign-in-stub", template: "" })
class SignInStub {}

const me = {
  id: "user-1",
  email: "maya@example.com",
  profile: { display_name: "Maya Chen", avatar_url: null },
};

describe("AuthService", () => {
  let auth: AuthService;
  let http: HttpTestingController;
  const assign = vi.fn();

  beforeEach(() => {
    assign.mockReset();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(
          withInterceptors([credentialsInterceptor, authErrorInterceptor]),
        ),
        provideHttpClientTesting(),
        provideRouter([{ path: "signin", component: SignInStub }]),
        {
          provide: DOCUMENT,
          useValue: { defaultView: { location: { assign } } },
        },
      ],
    });
    auth = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("initializes to checking/unknown state", () => {
    expect(auth.status()).toBe("checking");
    expect(auth.currentUser()).toBeNull();
    expect(auth.isAuthenticated()).toBe(false);
  });

  it("becomes authenticated after a successful /api/me", async () => {
    const pending = auth.initialize();
    http.expectOne("/api/me").flush({ success: true, data: me });
    await pending;
    expect(auth.status()).toBe("authenticated");
    expect(auth.currentUser()?.email).toBe("maya@example.com");
  });

  it("becomes unauthenticated after 401 /api/me", async () => {
    const pending = auth.initialize();
    http.expectOne("/api/me").flush(
      {
        success: false,
        error: { code: "UNAUTHORIZED", message: "Please sign in.", fieldErrors: {} },
      },
      { status: 401, statusText: "Unauthorized" },
    );
    await pending;
    expect(auth.status()).toBe("unauthenticated");
    expect(auth.currentUser()).toBeNull();
  });

  it("avoids duplicate /api/me during initialize", async () => {
    const first = auth.initialize();
    const second = auth.initialize();
    http.expectOne("/api/me").flush({ success: true, data: me });
    await Promise.all([first, second]);
    http.verify();
  });

  it("stops realtime before the signout request", async () => {
    const pending = auth.initialize();
    http.expectOne("/api/me").flush({ success: true, data: me });
    await pending;
    const stop = vi.spyOn(TestBed.inject(RealtimeService), "stop");
    const logout = auth.signOut();
    await Promise.resolve();
    expect(stop).toHaveBeenCalled();
    http.expectOne("/api/taskflow/auth/signout").flush({
      success: true,
      data: { signedOut: true },
    });
    await logout;
    expect(auth.status()).toBe("unauthenticated");
    expect(auth.currentUser()).toBeNull();
  });

  it("keeps the session when logout fails", async () => {
    const pending = auth.initialize();
    http.expectOne("/api/me").flush({ success: true, data: me });
    await pending;
    const logout = auth.signOut();
    await Promise.resolve();
    http.expectOne("/api/taskflow/auth/signout").flush(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "nope", fieldErrors: {} },
      },
      { status: 500, statusText: "Server Error" },
    );
    await logout;
    expect(auth.status()).toBe("authenticated");
    expect(auth.logoutError()).toContain("Could not sign out");
  });

  it("clears auth state on 401", () => {
    auth.handleUnauthorized("/projects");
    expect(auth.status()).toBe("unauthenticated");
    expect(auth.currentUser()).toBeNull();
  });

  it("keeps a safe invite return when handling 401", () => {
    const token = "a".repeat(20);
    auth.handleUnauthorized(`/invite?token=${token}`);
    expect(auth.status()).toBe("unauthenticated");
  });

  it("starts Google OAuth through the existing Next start route", () => {
    auth.signInWithGoogle("/projects");
    expect(assign).toHaveBeenCalledWith(
      "/api/taskflow/auth/google?next=%2Fprojects",
    );
  });

  it("preserves a safe invite return on Google OAuth start", () => {
    const token = "a".repeat(20);
    auth.signInWithGoogle(`/invite?token=${token}`);
    expect(assign).toHaveBeenCalledWith(
      `/api/taskflow/auth/google?next=${encodeURIComponent(`/invite?token=${token}`)}`,
    );
  });

  it("rejects an external invite redirect on Google OAuth start", () => {
    auth.signInWithGoogle(
      `https://evil.example/invite?token=${"a".repeat(20)}`,
    );
    expect(assign).toHaveBeenCalledWith(
      "/api/taskflow/auth/google?next=%2Fdashboard",
    );
  });

  it("rejects unsafe OAuth next values", () => {
    auth.signInWithGoogle("https://evil.example");
    expect(assign).toHaveBeenCalledWith(
      "/api/taskflow/auth/google?next=%2Fdashboard",
    );
  });
});

import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { Router, provideRouter } from "@angular/router";
import { authGuard } from "./auth.guard";
import { guestGuard } from "./guest.guard";
import { AuthService } from "./auth";
import { Component } from "@angular/core";

@Component({ selector: "tf-protected-stub", template: "<p>protected</p>" })
class ProtectedPage {}

@Component({ selector: "tf-signin-stub", template: "<p>signin</p>" })
class SignInStub {}

@Component({ selector: "tf-dash-stub", template: "<p>dash</p>" })
class DashboardStub {}

@Component({ selector: "tf-invite-stub", template: "<p>invite</p>" })
class InviteStub {}

function setup(status: "checking" | "authenticated" | "unauthenticated") {
  const currentUser = signal(
    status === "authenticated"
      ? {
          id: "u1",
          email: "maya@example.com",
          profile: { display_name: "Maya Chen", avatar_url: null },
        }
      : null,
  );
  const statusSig = signal(status);
  const auth = {
    status: statusSig,
    currentUser,
    isAuthenticated: () => statusSig() === "authenticated",
    ensureInitialized: () => {
      if (status === "checking") {
        return new Promise<void>(() => undefined);
      }
      return Promise.resolve();
    },
    initialize: () => Promise.resolve(),
  };

  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([
        { path: "projects", component: ProtectedPage, canActivate: [authGuard] },
        { path: "calendar", component: ProtectedPage, canActivate: [authGuard] },
        { path: "signin", component: SignInStub, canActivate: [guestGuard] },
        { path: "dashboard", component: DashboardStub },
        { path: "invite", component: InviteStub },
      ]),
      { provide: AuthService, useValue: auth },
    ],
  });
  return { router: TestBed.inject(Router), auth };
}

describe("authGuard", () => {
  it("allows an authenticated user onto a protected route", async () => {
    const { router } = setup("authenticated");
    await router.navigateByUrl("/projects");
    expect(router.url).toBe("/projects");
  });

  it("redirects an unauthenticated user to signin", async () => {
    const { router } = setup("unauthenticated");
    await router.navigateByUrl("/projects");
    expect(router.url).toBe("/signin?next=%2Fprojects");
  });

  it("preserves a safe next path", async () => {
    const { router } = setup("unauthenticated");
    await router.navigateByUrl("/calendar");
    expect(router.url).toContain("next=%2Fcalendar");
  });
});

describe("guestGuard", () => {
  it("redirects an authenticated user from signin to dashboard", async () => {
    const { router } = setup("authenticated");
    await router.navigateByUrl("/signin");
    expect(router.url).toBe("/dashboard");
  });

  it("preserves a safe invite return from signin", async () => {
    const { router } = setup("authenticated");
    const token = "a".repeat(20);
    await router.navigateByUrl(
      `/signin?next=${encodeURIComponent(`/invite?token=${token}`)}`,
    );
    expect(router.url).toBe(`/invite?token=${token}`);
  });

  it("rejects a malicious next from signin", async () => {
    const { router } = setup("authenticated");
    await router.navigateByUrl(
      `/signin?next=${encodeURIComponent("https://evil.example")}`,
    );
    expect(router.url).toBe("/dashboard");
  });
});

describe("auth checking", () => {
  it("does not redirect to signin while the session is still checking", async () => {
    const { router } = setup("checking");
    const navigation = router.navigateByUrl("/projects");
    await Promise.race([
      navigation,
      new Promise((resolve) => setTimeout(resolve, 40)),
    ]);
    expect(router.url).not.toContain("/signin");
  });
});

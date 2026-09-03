import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from "@angular/router";
import { of } from "rxjs";
import { InvitePage } from "./invite-page";
import { AuthService } from "../../core/auth/auth";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { stubInvitationMutations } from "../../testing/data-stubs";
import type { AuthStatus } from "../../core/auth/auth";
import { TaskflowApiError } from "../../core/api/envelope";

@Component({ selector: "tf-sign-in-stub", template: "<p>signin</p>" })
class SignInStub {}

@Component({ selector: "tf-dash-stub", template: "<p>dash</p>" })
class DashboardStub {}

const token = "a".repeat(20);

function authStub(status: AuthStatus) {
  return {
    status: signal(status),
    currentUser: signal(
      status === "authenticated"
        ? {
            id: "user-1",
            email: "maya@example.com",
            profile: { display_name: "Maya Chen", avatar_url: null },
          }
        : null,
    ),
    isAuthenticated: () => status === "authenticated",
    ensureInitialized: () => Promise.resolve(),
    signInWithGoogle: vi.fn(),
  };
}

describe("InvitePage", () => {
  async function render(
    options: {
      token?: string | null;
      status?: AuthStatus;
      mutations?: ReturnType<typeof stubInvitationMutations>;
    } = {},
  ) {
    const params =
      options.token === undefined
        ? {}
        : options.token === null
          ? {}
          : { token: options.token };
    const mutations = options.mutations ?? stubInvitationMutations();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [InvitePage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([
          { path: "signin", component: SignInStub },
          { path: "dashboard", component: DashboardStub },
        ]),
        {
          provide: AuthService,
          useValue: authStub(options.status ?? "unauthenticated"),
        },
        { provide: InvitationMutationsService, useValue: mutations },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(params) },
            queryParamMap: of(convertToParamMap(params)),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(InvitePage);
    fixture.detectChanges();
    return { fixture, mutations, router: TestBed.inject(Router) };
  }

  it("renders safely without a token", async () => {
    const { fixture } = await render({ token: null });
    expect(fixture.nativeElement.textContent).toContain("Invalid invite");
    expect(fixture.nativeElement.querySelector("button.primary")).toBeNull();
  });

  it("keeps invite context on the unauthenticated sign-in path", async () => {
    const { fixture } = await render({ token, status: "unauthenticated" });
    expect(fixture.nativeElement.textContent).toContain("Accept your invitation");
    fixture.nativeElement.querySelector("button.primary")?.click();
    await fixture.whenStable();
    const router = TestBed.inject(Router);
    expect(router.url).toContain("/signin");
    expect(router.url).toContain(encodeURIComponent(`/invite?token=${token}`));
  });

  it("loads an authenticated invitation without auto-accepting", async () => {
    const mutations = stubInvitationMutations();
    const { fixture } = await render({
      token,
      status: "authenticated",
      mutations,
    });
    expect(fixture.nativeElement.textContent).toContain("Join this workspace");
    expect(fixture.nativeElement.textContent).toContain("Maya Chen");
    expect(mutations.accept).not.toHaveBeenCalled();
  });

  it("accepts with the exact token contract and navigates after success", async () => {
    const mutations = stubInvitationMutations();
    const { fixture } = await render({
      token,
      status: "authenticated",
      mutations,
    });
    fixture.nativeElement.querySelector("button.primary")?.click();
    await fixture.whenStable();
    expect(mutations.accept).toHaveBeenCalledWith(token);
    expect(TestBed.inject(Router).url).toBe("/dashboard");
  });

  it("renders a useful invalid invitation state", async () => {
    const mutations = stubInvitationMutations();
    mutations.accept.mockRejectedValue(
      new TaskflowApiError("Invitation not found.", {
        status: 404,
        code: "NOT_FOUND",
      }),
    );
    const { fixture } = await render({
      token,
      status: "authenticated",
      mutations,
    });
    fixture.nativeElement.querySelector("button.primary")?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain("Invitation not found.");
  });

  it("handles an expired invitation distinctly", async () => {
    const mutations = stubInvitationMutations();
    mutations.accept.mockRejectedValue(
      new TaskflowApiError("This invitation has expired.", {
        status: 409,
        code: "INVITATION_EXPIRED",
      }),
    );
    const { fixture } = await render({
      token,
      status: "authenticated",
      mutations,
    });
    fixture.nativeElement.querySelector("button.primary")?.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      "This invitation has expired.",
    );
    expect(fixture.nativeElement.textContent).toContain("Back to TaskFlow");
  });
});

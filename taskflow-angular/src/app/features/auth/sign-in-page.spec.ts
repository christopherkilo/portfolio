import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideZonelessChangeDetection, signal } from "@angular/core";
import { ActivatedRoute, convertToParamMap, provideRouter } from "@angular/router";
import { of } from "rxjs";
import { SignInPage } from "./sign-in-page";
import { AuthService } from "../../core/auth/auth";

describe("SignInPage", () => {
  const signInWithGoogle = vi.fn();

  async function createPage(error = "") {
    signInWithGoogle.mockReset();
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            status: signal("unauthenticated"),
            signInWithGoogle,
            currentUser: signal(null),
            isAuthenticated: () => false,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ error })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    return fixture;
  }

  it("starts Google sign-in through AuthService", async () => {
    const fixture = await createPage();
    const button = fixture.nativeElement.querySelector(
      "button.google",
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    button.click();
    expect(signInWithGoogle).toHaveBeenCalled();
  });

  it("passes a safe invite next through to Google OAuth", async () => {
    signInWithGoogle.mockReset();
    const token = "a".repeat(20);
    const next = `/invite?token=${token}`;
    TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            status: signal("unauthenticated"),
            signInWithGoogle,
            currentUser: signal(null),
            isAuthenticated: () => false,
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ next })),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
    fixture.nativeElement.querySelector("button.google")?.click();
    expect(signInWithGoogle).toHaveBeenCalledWith(next);
  });

  it("disables the button while redirecting", async () => {
    const fixture = await createPage();
    fixture.componentInstance.busy.set(true);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      "button.google",
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain("Redirecting");
  });

  it("exposes sign-in errors to assistive tech", async () => {
    const fixture = await createPage("Access denied");
    const alert = fixture.nativeElement.querySelector("[role='alert']");
    expect(alert).toBeTruthy();
    expect(alert?.textContent).toContain("Access denied");
    expect(alert?.textContent).toContain("Sign-in failed");
  });
});

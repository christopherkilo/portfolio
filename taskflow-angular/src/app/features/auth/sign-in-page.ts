import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";
import { map } from "rxjs";
import { TaskflowMark } from "../../shared/brand/taskflow-mark";
import { AuthService } from "../../core/auth/auth";

@Component({
  selector: "tf-sign-in-page",
  imports: [TaskflowMark],
  template: `
    <div class="auth">
      <tf-mark size="lg" />
      <h1>Welcome to TaskFlow</h1>
      <p>
        Collaborative project management with live workspaces, tasks, and team
        views. Sign in with Google to continue.
      </p>

      <button
        type="button"
        class="google"
        [disabled]="busy() || auth.status() === 'checking'"
        (click)="onGoogle()"
      >
        {{ busy() ? "Redirecting…" : "Continue with Google" }}
      </button>

      <p class="muted">
        Google authentication required. After sign-in you return to TaskFlow on
        this Angular client.
      </p>

      @if (errorText()) {
        <div class="alert" role="alert">
          <p class="alert-title">Sign-in failed</p>
          <p>{{ errorText() }}</p>
          <p class="muted">Try again with Google. If this keeps happening, the demo may be temporarily unavailable.</p>
        </div>
      }

      @if (isLocalDev()) {
        <details class="setup">
          <summary>Local development setup</summary>
          <p>
            In Supabase → Authentication → URL Configuration, add this redirect
            for the Angular origin (proxied to Next.js
            <code>/auth/callback</code>):
          </p>
          <code class="callback">{{ callbackHint() }}</code>
        </details>
      }
    </div>
  `,
  styles: `
    .auth {
      display: flex;
      min-height: 60vh;
      max-width: 28rem;
      margin: 0 auto;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1.25rem;
      padding: 1rem;
      text-align: center;
    }
    h1 {
      margin: 0;
      font-family: var(--tf-font-display);
      font-size: 1.5rem;
      font-weight: 600;
    }
    p {
      margin: 0;
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--tf-muted);
    }
    .muted {
      font-size: 0.8125rem;
    }
    .google {
      min-height: 2.75rem;
      width: 100%;
      max-width: 20rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--tf-accent);
      color: #042f2e;
      font-weight: 600;
      cursor: pointer;
    }
    .google:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }
    .alert {
      width: 100%;
      border-radius: 0.5rem;
      border: 1px solid color-mix(in srgb, var(--tf-danger) 30%, transparent);
      background: color-mix(in srgb, var(--tf-danger) 10%, transparent);
      padding: 0.75rem;
      text-align: left;
      font-size: 0.75rem;
      color: var(--tf-danger);
    }
    .alert-title {
      font-weight: 600;
      color: var(--tf-danger);
    }
    .setup {
      width: 100%;
      border: 1px solid var(--tf-border);
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--tf-elevated) 40%, transparent);
      padding: 0.5rem 0.75rem;
      text-align: left;
      font-size: 0.6875rem;
      color: var(--tf-muted);
    }
    .callback {
      display: block;
      margin-top: 0.5rem;
      overflow-wrap: anywhere;
      border-radius: 0.25rem;
      background: var(--tf-bg);
      padding: 0.4rem 0.5rem;
      color: var(--tf-ink);
    }
  `,
})
export class SignInPage {
  readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  readonly busy = signal(false);

  private readonly query = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => ({
        error: params.get("error") ?? "",
        next: params.get("next"),
      })),
    ),
    { initialValue: { error: "", next: null as string | null } },
  );

  readonly errorText = computed(() => this.query().error);
  readonly isLocalDev = computed(() => {
    const host = globalThis.location?.hostname;
    return host === "localhost" || host === "127.0.0.1";
  });
  readonly callbackHint = computed(() =>
    this.isLocalDev() ? `${globalThis.location.origin}/auth/callback` : "",
  );

  onGoogle(): void {
    if (this.busy() || this.auth.status() === "checking") return;
    this.busy.set(true);
    this.auth.signInWithGoogle(this.query().next);
  }
}

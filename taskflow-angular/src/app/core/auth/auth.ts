import { DOCUMENT } from "@angular/common";
import { Injectable, computed, inject, signal } from "@angular/core";
import { Router } from "@angular/router";
import { firstValueFrom } from "rxjs";
import { TaskflowApi, type TaskflowMe } from "../api/taskflow-api";
import { TaskflowApiError } from "../api/envelope";
import { safeAngularNextPath } from "./safe-next-path";
import { RealtimeService } from "../realtime/realtime";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly api = inject(TaskflowApi);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly realtime = inject(RealtimeService);

  readonly status = signal<AuthStatus>("checking");
  readonly currentUser = signal<TaskflowMe | null>(null);
  readonly isAuthenticated = computed(() => this.status() === "authenticated");
  readonly logoutError = signal<string | null>(null);

  private initPromise: Promise<void> | null = null;

  initialize(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.refreshUser();
    }
    return this.initPromise;
  }

  ensureInitialized(): Promise<void> {
    return this.initialize();
  }

  async refreshUser(): Promise<void> {
    try {
      const user = await firstValueFrom(this.api.getMe());
      this.currentUser.set(user);
      this.status.set("authenticated");
    } catch (error) {
      this.currentUser.set(null);
      this.status.set("unauthenticated");
      if (!(error instanceof TaskflowApiError && error.status === 401)) {
        // Non-401 failures still cannot prove a session. Identity is cleared
        // without treating the error as a logout success.
      }
    }
  }

  signInWithGoogle(next?: string | null): void {
    const destination = safeAngularNextPath(next);
    this.document.defaultView?.location.assign(
      `/api/taskflow/auth/google?next=${encodeURIComponent(destination)}`,
    );
  }

  async signOut(): Promise<void> {
    this.logoutError.set(null);
    await this.realtime.stop();
    try {
      await firstValueFrom(this.api.signOut());
    } catch {
      this.logoutError.set("Could not sign out. Please try again.");
      return;
    }
    this.clearSession();
    await this.router.navigateByUrl("/signin");
  }

  handleUnauthorized(returnUrl: string): void {
    void this.realtime.stop();
    this.clearSession();
    const next = safeAngularNextPath(returnUrl);
    if (this.router.url.split("?")[0] === "/signin") {
      return;
    }
    void this.router.navigate(["/signin"], { queryParams: { next } });
  }

  private clearSession(): void {
    this.currentUser.set(null);
    this.status.set("unauthenticated");
    this.initPromise = Promise.resolve();
  }
}

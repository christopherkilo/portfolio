import { Component, computed, inject, signal } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { map } from "rxjs";
import { userFacingMutationError } from "../../core/api/mutation-error";
import {
  isInviteToken,
  safeAngularNextPath,
} from "../../core/auth/safe-next-path";
import { AuthService } from "../../core/auth/auth";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { isBrowserOffline } from "../../core/data/connection";
import { TaskflowMark } from "../../shared/brand/taskflow-mark";

@Component({
  selector: "tf-invite-page",
  imports: [RouterLink, TaskflowMark],
  templateUrl: "./invite-page.html",
  styleUrl: "./invite-page.scss",
})
export class InvitePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);
  private readonly mutations = inject(InvitationMutationsService);

  readonly accepting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly errorCode = signal<string | null>(null);

  private readonly tokenParam = toSignal(
    this.route.queryParamMap.pipe(map((params) => params.get("token")?.trim() ?? "")),
    { initialValue: this.route.snapshot.queryParamMap.get("token")?.trim() ?? "" },
  );

  readonly token = computed(() => this.tokenParam());
  readonly hasToken = computed(() => this.token().length > 0);
  readonly tokenValid = computed(() => isInviteToken(this.token()));

  readonly inviteReturnPath = computed(() => {
    if (!this.tokenValid()) return "/dashboard";
    return safeAngularNextPath(`/invite?token=${this.token()}`);
  });

  readonly signedInAs = computed(() => {
    const user = this.auth.currentUser();
    return user?.profile.display_name || user?.email || "your account";
  });

  readonly expired = computed(
    () => this.errorCode() === "INVITATION_EXPIRED",
  );
  readonly alreadyAccepted = computed(
    () => this.errorCode() === "INVITATION_ALREADY_ACCEPTED",
  );

  signIn(): void {
    void this.router.navigate(["/signin"], {
      queryParams: { next: this.inviteReturnPath() },
    });
  }

  async accept(): Promise<void> {
    if (!this.tokenValid() || this.accepting()) return;
    if (isBrowserOffline()) {
      this.errorMessage.set("This action needs an active connection.");
      this.errorCode.set("OFFLINE_UNSAFE_ACTION");
      return;
    }
    this.accepting.set(true);
    this.errorMessage.set(null);
    this.errorCode.set(null);
    try {
      await this.mutations.accept(this.token());
      await this.router.navigateByUrl("/dashboard");
    } catch (error) {
      const facing = userFacingMutationError(error);
      this.errorCode.set(facing.code);
      this.errorMessage.set(facing.message);
    } finally {
      this.accepting.set(false);
    }
  }
}

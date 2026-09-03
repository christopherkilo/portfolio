import { Component, computed, inject, input, output, signal } from "@angular/core";
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  type AbstractControl,
  type ValidationErrors,
  type ValidatorFn,
} from "@angular/forms";
import { userFacingMutationError } from "../../core/api/mutation-error";
import type { WorkspaceRole } from "../../core/api/models";
import { InvitationMutationsService } from "../../core/data/invitation-mutations";
import { INVITE_ROLES } from "../../core/data/permissions";
import { controlMessage, trimmedRequired } from "../../core/data/task-form";

function inviteRoleValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    return INVITE_ROLES.includes(control.value) ? null : { message: "Choose a role." };
  };
}

function trimmedEmail(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = String(control.value ?? "").trim();
    if (!value) return null;
    return Validators.email({ value } as AbstractControl);
  };
}

@Component({
  selector: "tf-invite-member-form",
  imports: [ReactiveFormsModule],
  templateUrl: "./invite-member-form.html",
  styleUrl: "./invite-member-form.scss",
})
export class InviteMemberForm {
  private readonly fb = inject(FormBuilder);
  private readonly mutations = inject(InvitationMutationsService);

  readonly workspaceId = input.required<string>();
  readonly cancelled = output<void>();
  readonly invited = output<void>();

  readonly roles = INVITE_ROLES;
  readonly submitted = signal(false);
  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly acceptUrl = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    email: [
      "",
      [
        trimmedRequired("Enter an email address."),
        trimmedEmail(),
        Validators.maxLength(320),
      ],
    ],
    role: this.fb.nonNullable.control<Exclude<WorkspaceRole, "owner">>(
      "member",
      { validators: [inviteRoleValidator()] },
    ),
  });

  readonly sending = computed(() => this.submitting());

  fieldError(name: "email" | "role"): string | null {
    const control = this.form.controls[name];
    if (!control.invalid) return null;
    if (!this.submitted() && !control.touched) return null;
    if (control.errors?.["email"]) return "Enter a valid email.";
    return controlMessage(control);
  }

  async onSubmit(): Promise<void> {
    if (this.submitting()) return;
    this.submitted.set(true);
    this.errorMessage.set(null);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const workspaceId = this.workspaceId();
    this.submitting.set(true);
    try {
      const result = await this.mutations.invite(workspaceId, {
        email: this.form.controls.email.value.trim(),
        role: this.form.controls.role.value,
      });
      this.invited.emit();
      if (result.acceptUrl) {
        this.acceptUrl.set(result.acceptUrl);
      } else {
        this.cancelled.emit();
      }
    } catch (error) {
      this.errorMessage.set(userFacingMutationError(error).message);
    } finally {
      this.submitting.set(false);
    }
  }

  async copyAcceptUrl(): Promise<void> {
    const url = this.acceptUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard may be unavailable; the URL remains visible.
    }
  }
}

import { Component, computed, input } from "@angular/core";

export type TaskflowMarkSize = "sm" | "md" | "lg";

/**
 * Structural reuse of components/demos/taskflow/brand/TaskflowMark.tsx.
 * Connected milestones on a rising flow path — not a new mark.
 */
@Component({
  selector: "tf-mark",
  template: `
    <svg
      viewBox="0 0 32 32"
      [attr.class]="sizeClass()"
      [attr.role]="decorative() ? 'presentation' : 'img'"
      [attr.aria-hidden]="decorative() ? 'true' : null"
      [attr.aria-label]="decorative() ? null : title()"
    >
      @if (!decorative()) {
        <title>{{ title() }}</title>
      }
      <defs>
        <linearGradient [attr.id]="fieldId" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#059669" />
          <stop offset="55%" stop-color="#10B981" />
          <stop offset="100%" stop-color="#34D399" />
        </linearGradient>
        <radialGradient [attr.id]="glowId" cx="70%" cy="30%" r="50%">
          <stop offset="0%" stop-color="#6EE7B7" stop-opacity="0.55" />
          <stop offset="100%" stop-color="#6EE7B7" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="8" [attr.fill]="'url(#' + fieldId + ')'" />
      <rect width="32" height="32" rx="8" [attr.fill]="'url(#' + glowId + ')'" />
      <rect
        x="1.25"
        y="1.25"
        width="29.5"
        height="29.5"
        rx="6.75"
        fill="none"
        stroke="rgba(255,255,255,0.18)"
        stroke-width="1"
      />
      <path
        d="M6.5 21.5 C11 21.5 12.2 15.8 16 15.8 C19.8 15.8 21 10.2 25.5 10.2"
        fill="none"
        stroke="#6EE7B7"
        stroke-width="1.35"
        stroke-linecap="round"
        opacity="0.72"
      />
      <path
        d="M6.5 23.5 C11.5 23.5 12 16 16 16 C20 16 20.5 8.5 25.5 8.5"
        fill="none"
        stroke="#FFFFFF"
        stroke-width="2.35"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
      <circle cx="6.5" cy="23.5" r="2.15" fill="#A7F3D0" />
      <circle cx="16" cy="16" r="2.85" fill="#FFFFFF" />
      <circle cx="16" cy="16" r="1.15" fill="#10B981" />
      <circle cx="25.5" cy="8.5" r="2.15" fill="#ECFDF5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex-shrink: 0;
    }
    svg {
      display: block;
    }
    .size-sm {
      width: 1.75rem;
      height: 1.75rem;
    }
    .size-md {
      width: 2.25rem;
      height: 2.25rem;
    }
    .size-lg {
      width: 3rem;
      height: 3rem;
    }
  `,
})
export class TaskflowMark {
  readonly title = input("TaskFlow");
  readonly size = input<TaskflowMarkSize>("md");
  readonly decorative = input(false);

  private static nextId = 0;
  private readonly uid = String(++TaskflowMark.nextId);
  readonly fieldId = `tf-field-${this.uid}`;
  readonly glowId = `tf-glow-${this.uid}`;

  readonly sizeClass = computed(() => `size-${this.size()}`);
}

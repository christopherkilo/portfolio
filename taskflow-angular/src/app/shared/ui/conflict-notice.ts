import { Component, input, output } from "@angular/core";

@Component({
  selector: "tf-conflict-notice",
  template: `
    <div class="notice" role="alert">
      <p>
        This {{ entityLabel() }} changed since you opened it. Your edits have been
        preserved. Review the differences to save a combined version.
      </p>
      <div class="actions">
        <button type="button" class="ghost" (click)="review.emit()">
          Review changes
        </button>
        <button type="button" class="ghost" (click)="keepEditing.emit()">
          Keep editing
        </button>
        <button type="button" class="ghost" (click)="cancelled.emit()">Cancel</button>
      </div>
    </div>
  `,
  styles: `
    .notice {
      border: 1px solid color-mix(in srgb, var(--tf-warning) 40%, var(--tf-border));
      border-radius: 0.5rem;
      background: color-mix(in srgb, var(--tf-warning) 12%, transparent);
      padding: 0.75rem;
      font-size: 0.8125rem;
    }
    p {
      margin: 0;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .ghost {
      height: 2.25rem;
      border: 1px solid var(--tf-border);
      border-radius: 0.5rem;
      background: var(--tf-surface);
      color: var(--tf-ink);
      padding: 0 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class ConflictNotice {
  readonly entityLabel = input("task");
  readonly review = output<void>();
  readonly keepEditing = output<void>();
  readonly cancelled = output<void>();
}

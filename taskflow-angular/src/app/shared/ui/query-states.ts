import { Component, input, output } from "@angular/core";

@Component({
  selector: "tf-query-loading",
  template: `
    <div class="wrap" role="status" aria-live="polite">
      <p class="label">{{ label() }}</p>
      <div class="skel" aria-hidden="true"></div>
      <div class="skel" aria-hidden="true"></div>
    </div>
  `,
  styles: `
    .wrap {
      display: grid;
      gap: 0.75rem;
    }
    .label {
      margin: 0;
      font-size: 0.875rem;
      color: var(--tf-muted);
    }
    .skel {
      height: 6rem;
      border-radius: 0.75rem;
      background: var(--tf-subtle);
    }
  `,
})
export class QueryLoading {
  readonly label = input("Loading workspace…");
}

@Component({
  selector: "tf-query-error",
  template: `
    <div class="empty" role="alert">
      <h2>{{ title() }}</h2>
      <p>{{ message() }}</p>
      @if (showRetry()) {
        <button type="button" (click)="retry.emit()">Retry</button>
      }
    </div>
  `,
  styles: `
    .empty {
      display: grid;
      gap: 0.75rem;
      justify-items: start;
      border: 1px solid var(--tf-border);
      border-radius: 0.75rem;
      background: var(--tf-surface);
      padding: 1.5rem;
    }
    h2 {
      margin: 0;
      font-family: var(--tf-font-display);
      font-size: 1.125rem;
    }
    p {
      margin: 0;
      color: var(--tf-muted);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    button {
      min-height: 2.5rem;
      border: 0;
      border-radius: 0.5rem;
      background: var(--tf-accent);
      color: #042f2e;
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class QueryError {
  readonly title = input("Couldn’t load workspace");
  readonly message = input("Check your connection and try again.");
  readonly showRetry = input(true);
  readonly retry = output<void>();
}

@Component({
  selector: "tf-empty-state",
  template: `
    <div class="empty">
      <h2>{{ title() }}</h2>
      <p>{{ description() }}</p>
      @if (actionLabel()) {
        <button type="button" (click)="action.emit()">{{ actionLabel() }}</button>
      }
    </div>
  `,
  styles: `
    .empty {
      display: grid;
      gap: 0.5rem;
      justify-items: start;
      border: 1px dashed var(--tf-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    h2 {
      margin: 0;
      font-size: 0.9375rem;
      font-weight: 600;
    }
    p {
      margin: 0;
      color: var(--tf-muted);
      font-size: 0.875rem;
      line-height: 1.5;
    }
    button {
      margin-top: 0.5rem;
      min-height: 2.25rem;
      border: 1px solid var(--tf-border);
      border-radius: 0.5rem;
      background: transparent;
      color: var(--tf-accent);
      font-weight: 600;
      cursor: pointer;
    }
  `,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input("");
  readonly actionLabel = input<string | undefined>(undefined);
  readonly action = output<void>();
}

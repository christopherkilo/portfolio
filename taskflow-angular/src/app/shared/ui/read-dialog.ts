import { CdkTrapFocus } from "@angular/cdk/a11y";
import {
  Component,
  HostListener,
  input,
  output,
} from "@angular/core";

@Component({
  selector: "tf-read-dialog",
  imports: [CdkTrapFocus],
  template: `
    @if (open()) {
      <div class="layer" role="presentation">
        <button
          type="button"
          class="backdrop"
          aria-label="Close"
          [disabled]="!dismissible()"
          (click)="onBackdrop()"
        ></button>
        <div
          class="panel"
          [class.wide]="wide()"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="titleId"
          [attr.aria-describedby]="descriptionId()"
          cdkTrapFocus
          [cdkTrapFocusAutoCapture]="true"
        >
          <div class="head">
            <h2 [id]="titleId">{{ title() }}</h2>
            <button
              type="button"
              class="close"
              aria-label="Close dialog"
              [disabled]="!dismissible()"
              (click)="onBackdrop()"
            >
              ×
            </button>
          </div>
          <div class="body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .layer {
      position: fixed;
      inset: 0;
      z-index: 40;
      display: grid;
      place-items: center;
      padding: 1rem;
    }
    .backdrop {
      position: absolute;
      inset: 0;
      border: 0;
      background: var(--tf-overlay-soft);
      cursor: pointer;
    }
    .backdrop:disabled {
      cursor: default;
    }
    .panel {
      position: relative;
      z-index: 1;
      width: min(32rem, 100%);
      max-height: min(40rem, 90vh);
      overflow: auto;
      border: 1px solid var(--tf-border);
      border-radius: 0.75rem;
      background: var(--tf-surface);
      padding: 1rem 1.25rem 1.25rem;
    }
    .panel.wide {
      width: min(40rem, 100%);
    }
    .head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 0.75rem;
    }
    h2 {
      margin: 0;
      font-family: var(--tf-font-display);
      font-size: 1.125rem;
    }
    .close {
      border: 0;
      background: transparent;
      color: var(--tf-muted);
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
    }
    .close:disabled {
      opacity: 0.5;
      cursor: default;
    }
    .body {
      margin-top: 1rem;
    }
  `,
})
export class ReadDialog {
  readonly open = input(false);
  readonly title = input("Details");
  readonly wide = input(false);
  readonly dismissible = input(true);
  readonly descriptionId = input<string | null>(null);
  readonly closed = output<void>();
  readonly titleId = `tf-dialog-${Math.random().toString(36).slice(2, 8)}`;

  onBackdrop(): void {
    if (this.dismissible()) this.closed.emit();
  }

  @HostListener("document:keydown.escape")
  onEscape(): void {
    if (this.open() && this.dismissible()) this.closed.emit();
  }
}

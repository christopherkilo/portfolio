import { Component, input } from "@angular/core";

@Component({
  selector: "tf-progress-bar",
  template: `
    <div
      class="track"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="value()"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div
        class="fill"
        [style.width.%]="clamped()"
        [style.background]="color()"
      ></div>
    </div>
  `,
  styles: `
    .track {
      height: 0.375rem;
      overflow: hidden;
      border-radius: 999px;
      background: var(--tf-subtle);
    }
    .fill {
      height: 100%;
      border-radius: inherit;
    }
  `,
})
export class ProgressBar {
  readonly value = input(0);
  readonly color = input("var(--tf-accent)");
  readonly label = input("Progress");

  clamped(): number {
    return Math.min(100, Math.max(0, this.value()));
  }
}

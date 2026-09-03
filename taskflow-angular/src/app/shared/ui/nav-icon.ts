import { Component, input } from "@angular/core";
import { ShellNavIcon } from "../../core/navigation";

@Component({
  selector: "tf-nav-icon",
  template: `
    @switch (name()) {
      @case ("dashboard") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
      }
      @case ("projects") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h16v12H4z" />
          <path d="M8 7V5h8v2" />
        </svg>
      }
      @case ("tasks") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="m8 12 2.5 2.5L16 9" />
        </svg>
      }
      @case ("calendar") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M8 3v4M16 3v4M3 11h18" />
        </svg>
      }
      @case ("team") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="9" cy="8" r="3" />
          <path d="M3 20c0-3 2.5-5 6-5s6 2 6 5" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M21 20c0-2.2-1.5-4-4-4" />
        </svg>
      }
      @case ("audit") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4h9l5 5v11H6z" />
          <path d="M15 4v5h5M8 13h8M8 17h5" />
        </svg>
      }
      @case ("settings") {
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path
            d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H8a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V8c.3.6.9 1 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"
          />
        </svg>
      }
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      width: 1rem;
      height: 1rem;
    }
    svg {
      width: 100%;
      height: 100%;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.75;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  `,
})
export class NavIcon {
  readonly name = input.required<ShellNavIcon>();
}

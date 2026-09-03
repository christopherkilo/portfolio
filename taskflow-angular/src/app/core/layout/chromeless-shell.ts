import { Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: "tf-chromeless-shell",
  imports: [RouterOutlet],
  template: `
    <a class="sr-only" href="#main">Skip to content</a>
    <main id="main" class="chromeless">
      <router-outlet />
    </main>
  `,
  styles: `
    :host {
      display: block;
      min-height: 100vh;
      background: var(--tf-bg);
    }
    .chromeless {
      min-height: 100vh;
    }
  `,
})
export class ChromelessShell {}

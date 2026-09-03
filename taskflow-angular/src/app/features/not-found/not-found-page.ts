import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

@Component({
  selector: "tf-not-found-page",
  imports: [RouterLink],
  template: `
    <div class="missing">
      <p class="kicker">TaskFlow</p>
      <h1>Page not found</h1>
      <p>That Angular route does not exist in the TaskFlow foundation app.</p>
      <a routerLink="/dashboard">Back to Dashboard</a>
    </div>
  `,
  styles: `
    .missing {
      max-width: 28rem;
      margin: 4rem auto;
      padding: 1rem;
    }
    .kicker {
      margin: 0;
      font-size: 0.6875rem;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--tf-muted);
    }
    h1 {
      margin: 0.35rem 0 0;
      font-family: var(--tf-font-display);
      font-size: 1.75rem;
      font-weight: 600;
    }
    p {
      margin: 0.75rem 0 0;
      color: var(--tf-muted);
    }
    a {
      display: inline-block;
      margin-top: 1.25rem;
      color: var(--tf-accent);
      font-weight: 600;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  `,
})
export class NotFoundPage {}

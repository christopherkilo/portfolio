import { ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";

export function deepestRouteTitle(snapshot: ActivatedRouteSnapshot): string {
  let current = snapshot;
  while (current.firstChild) {
    current = current.firstChild;
  }
  const title = current.data["title"];
  return typeof title === "string" && title.length > 0 ? title : "TaskFlow";
}

export function titleFromRouterState(state: RouterStateSnapshot): string {
  return deepestRouteTitle(state.root);
}

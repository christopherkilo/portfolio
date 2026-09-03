import { Injectable, inject } from "@angular/core";
import { DOCUMENT } from "@angular/common";
import { toSignal } from "@angular/core/rxjs-interop";
import { fromEvent, map, merge, of, startWith } from "rxjs";

/**
 * Browser network status only. Not proof that Realtime is connected.
 */
@Injectable({ providedIn: "root" })
export class NetworkStatusService {
  private readonly document = inject(DOCUMENT);

  readonly online = toSignal(
    (() => {
      const win = this.document.defaultView;
      if (!win) return of(true);
      return merge(
        fromEvent(win, "online").pipe(map(() => true)),
        fromEvent(win, "offline").pipe(map(() => false)),
      ).pipe(startWith(win.navigator.onLine !== false));
    })(),
    { initialValue: true },
  );
}

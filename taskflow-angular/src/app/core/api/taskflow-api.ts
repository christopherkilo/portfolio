import { HttpClient, HttpContext } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Observable, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "./envelope";
import { SKIP_AUTH_REDIRECT } from "./http-context";
import { catchTaskflowHttp } from "./http-rx";

export type TaskflowMe = {
  id: string;
  email: string | null;
  profile: { display_name: string; avatar_url: string | null };
};

@Injectable({ providedIn: "root" })
export class TaskflowApi {
  private readonly http = inject(HttpClient);

  getMe(): Observable<TaskflowMe> {
    return this.http
      .get<ApiSuccess<TaskflowMe> | ApiFailure>("/api/me", {
        context: new HttpContext().set(SKIP_AUTH_REDIRECT, true),
      })
      .pipe(
        map((body) => unwrapTaskflowEnvelope(body, 200)),
        catchTaskflowHttp(),
      );
  }

  signOut(): Observable<{ signedOut: true }> {
    return this.http
      .post<ApiSuccess<{ signedOut: true }> | ApiFailure>(
        "/api/taskflow/auth/signout",
        {},
      )
      .pipe(
        map((body) => unwrapTaskflowEnvelope(body, 200)),
        catchTaskflowHttp(),
      );
  }
}

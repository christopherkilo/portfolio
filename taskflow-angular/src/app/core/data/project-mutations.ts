import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { firstValueFrom, map } from "rxjs";
import {
  type ApiFailure,
  type ApiSuccess,
  unwrapTaskflowEnvelope,
} from "../api/envelope";
import { catchTaskflowHttp, isStaleVersionError } from "../api/http-rx";
import { mapProject } from "../api/mappers";
import type { Project, ProjectRow } from "../api/models";
import { ActivityDataService } from "./activity-data";
import type { CreateProjectBody } from "./project-form";
import { ProjectsDataService } from "./projects-data";
import { assertOnlineForUnsafeAction } from "../offline/offline-unsafe";
import { PROJECT_OFFLINE_MESSAGE } from "../offline/policy";

function latestProject(error: unknown): Project | null {
  if (!isStaleVersionError(error) || !error.data?.latest) return null;
  const latest = error.data.latest;
  if (typeof latest !== "object" || latest === null) return null;
  if ("workspace_id" in latest) return mapProject(latest as ProjectRow);
  return latest as Project;
}

@Injectable({ providedIn: "root" })
export class ProjectMutationsService {
  private readonly http = inject(HttpClient);
  private readonly projects = inject(ProjectsDataService);
  private readonly activity = inject(ActivityDataService);

  async create(body: CreateProjectBody): Promise<Project> {
    assertOnlineForUnsafeAction("project_create", PROJECT_OFFLINE_MESSAGE);
    const row = await firstValueFrom(
      this.http.post<ApiSuccess<ProjectRow> | ApiFailure>("/api/projects", body).pipe(
        map((payload) => unwrapTaskflowEnvelope(payload, 201)),
        catchTaskflowHttp(),
      ),
    );
    this.reloadAfterProjectWrite();
    return mapProject(row);
  }

  async rename(id: string, expectedVersion: number, name: string): Promise<Project> {
    return this.patch(id, { name, expectedVersion });
  }

  /**
   * Reviewed conflict resolution. Never retries 409. Still refuses offline.
   */
  async updateResolved(
    id: string,
    expectedVersion: number,
    fields: {
      name: string;
      description: string;
      dueDate: string | null;
      color: string;
      archived?: boolean;
    },
  ): Promise<Project> {
    const body: Record<string, unknown> = {
      name: fields.name,
      description: fields.description,
      dueDate: fields.dueDate,
      color: fields.color,
      expectedVersion,
    };
    if (fields.archived !== undefined) body["archived"] = fields.archived;
    return this.patch(id, body);
  }

  async setArchived(
    id: string,
    expectedVersion: number,
    archived: boolean,
  ): Promise<Project> {
    return this.patch(id, { archived, expectedVersion });
  }

  latestFromError(error: unknown): Project | null {
    return latestProject(error);
  }

  private async patch(
    id: string,
    body: Record<string, unknown>,
  ): Promise<Project> {
    assertOnlineForUnsafeAction("project_update", PROJECT_OFFLINE_MESSAGE);
    const row = await firstValueFrom(
      this.http
        .patch<ApiSuccess<ProjectRow> | ApiFailure>(`/api/projects/${id}`, body)
        .pipe(
          map((payload) => unwrapTaskflowEnvelope(payload, 200)),
          catchTaskflowHttp(),
        ),
    );
    this.reloadAfterProjectWrite();
    return mapProject(row);
  }

  private reloadAfterProjectWrite(): void {
    this.projects.reload();
    this.activity.reload();
  }
}

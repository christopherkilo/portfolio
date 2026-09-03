import { DOCUMENT } from "@angular/common";
import { httpResource } from "@angular/common/http";
import { Injectable, computed, effect, inject, signal } from "@angular/core";
import { parseTaskflowEnvelope } from "../api/envelope";
import { DEMO_WORKSPACE_NAME, type Workspace } from "../api/models";
import { AuthService } from "../auth/auth";

const STORAGE_KEY = "taskflow-angular-workspace";

function pickActiveWorkspace(
  list: Workspace[] | undefined,
  preferredId: string | null,
): Workspace | null {
  if (!list?.length) return null;
  if (preferredId) {
    const preferred = list.find((row) => row.id === preferredId);
    if (preferred) return preferred;
  }
  const demo = list.find((row) => row.name === DEMO_WORKSPACE_NAME);
  if (demo) return demo;
  return list[0] ?? null;
}

/**
 * Current workspace context. Root-scoped so sidebar, dashboard, and lists share
 * one GET /api/workspaces resource.
 *
 * Preferred id is persisted like React `activeWorkspaceId` (Zustand), but under
 * an Angular-only key so it does not collide with `taskflow-ui-v1`.
 */
@Injectable({ providedIn: "root" })
export class WorkspaceContextService {
  private readonly auth = inject(AuthService);
  private readonly document = inject(DOCUMENT);

  private readonly preferredId = signal<string | null>(this.readPreferred());

  readonly resource = httpResource(
    () => (this.auth.isAuthenticated() ? "/api/workspaces" : undefined),
    {
      defaultValue: [] as Workspace[],
      parse: (raw) => parseTaskflowEnvelope<Workspace[]>(raw),
    },
  );

  readonly workspaces = computed(() => this.resource.value());
  readonly isLoading = computed(() => this.resource.isLoading());
  readonly error = computed(() => this.resource.error());
  readonly hasValue = computed(() => this.resource.hasValue());

  readonly currentWorkspace = computed(() =>
    pickActiveWorkspace(this.workspaces(), this.preferredId()),
  );
  readonly currentWorkspaceId = computed(
    () => this.currentWorkspace()?.id ?? null,
  );

  constructor() {
    effect(() => {
      const current = this.currentWorkspace();
      if (!current) return;
      if (this.preferredId() !== current.id) {
        this.preferredId.set(current.id);
      }
      this.writePreferred(current.id);
    });
  }

  setWorkspaceId(id: string | null): void {
    this.preferredId.set(id);
    this.writePreferred(id);
  }

  reload(): void {
    this.resource.reload();
  }

  private readPreferred(): string | null {
    try {
      const raw = this.document.defaultView?.localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as { activeWorkspaceId?: unknown };
      return typeof parsed.activeWorkspaceId === "string"
        ? parsed.activeWorkspaceId
        : null;
    } catch {
      return null;
    }
  }

  private writePreferred(id: string | null): void {
    try {
      const win = this.document.defaultView;
      if (!win) return;
      if (!id) {
        win.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      win.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ activeWorkspaceId: id }),
      );
    } catch {
      // Session still works without persistence.
    }
  }
}

export { pickActiveWorkspace };

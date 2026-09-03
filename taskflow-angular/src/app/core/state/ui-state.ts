import { DOCUMENT } from "@angular/common";
import { Injectable, inject, signal } from "@angular/core";

export type TaskflowTheme = "light" | "dark";
export type TaskflowDensity = "comfortable" | "compact";
export type WeekStart = "monday" | "sunday";

const THEME_STORAGE_KEY = "taskflow-angular-theme";
const DENSITY_STORAGE_KEY = "taskflow-angular-density";
const WEEK_START_STORAGE_KEY = "taskflow-angular-week-start";

/**
 * Shell/chrome UI only.
 *
 * Do not store server entities here (projects, tasks, users, workspace records,
 * notifications). Those belong to domain data services.
 */
@Injectable({ providedIn: "root" })
export class UiStateService {
  private readonly document = inject(DOCUMENT);

  readonly mobileSidebarOpen = signal(false);
  readonly theme = signal<TaskflowTheme>(this.readInitialTheme());
  readonly density = signal<TaskflowDensity>(this.readInitialDensity());
  readonly weekStart = signal<WeekStart>(this.readInitialWeekStart());

  constructor() {
    this.applyTheme(this.theme());
    this.applyDensity(this.density());
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen.set(true);
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen.set(false);
  }

  toggleMobileSidebar(): void {
    this.mobileSidebarOpen.update((open) => !open);
  }

  toggleTheme(): void {
    const next: TaskflowTheme = this.theme() === "light" ? "dark" : "light";
    this.theme.set(next);
    this.applyTheme(next);
    this.writeKey(THEME_STORAGE_KEY, next);
  }

  setDensity(value: TaskflowDensity): void {
    this.density.set(value);
    this.applyDensity(value);
    this.writeKey(DENSITY_STORAGE_KEY, value);
  }

  setWeekStart(value: WeekStart): void {
    this.weekStart.set(value);
    this.writeKey(WEEK_START_STORAGE_KEY, value);
  }

  themeToggleLabel(): string {
    return this.theme() === "light" ? "Switch to dark mode" : "Switch to light mode";
  }

  private readInitialTheme(): TaskflowTheme {
    const stored = this.readKey(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
    const prefersDark = this.document.defaultView?.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches;
    return prefersDark === false ? "light" : "dark";
  }

  private readInitialDensity(): TaskflowDensity {
    const stored = this.readKey(DENSITY_STORAGE_KEY);
    return stored === "compact" ? "compact" : "comfortable";
  }

  private readInitialWeekStart(): WeekStart {
    const stored = this.readKey(WEEK_START_STORAGE_KEY);
    return stored === "sunday" ? "sunday" : "monday";
  }

  private applyTheme(theme: TaskflowTheme): void {
    const root = this.document.documentElement;
    root.dataset["theme"] = theme;
    root.style.colorScheme = theme;
  }

  private applyDensity(density: TaskflowDensity): void {
    this.document.documentElement.dataset["density"] = density;
  }

  private readKey(key: string): string | null {
    try {
      return this.document.defaultView?.localStorage.getItem(key) ?? null;
    } catch {
      return null;
    }
  }

  private writeKey(key: string, value: string): void {
    try {
      this.document.defaultView?.localStorage.setItem(key, value);
    } catch {
      // Session still applies when storage is unavailable.
    }
  }
}

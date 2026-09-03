import { Component, computed, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ConflictResolutionService } from "../../core/conflict/conflict-resolution";
import { formatDiffValue, kindLabel } from "../../core/conflict/format";
import type { FieldDiff } from "../../core/conflict/fields";
import { ReadDialog } from "./read-dialog";

@Component({
  selector: "tf-conflict-dialog",
  imports: [ReadDialog, FormsModule],
  templateUrl: "./conflict-dialog.html",
  styleUrl: "./conflict-dialog.scss",
})
export class ConflictDialog {
  readonly conflicts = inject(ConflictResolutionService);
  readonly descriptionId = "tf-conflict-dialog-copy";
  readonly formatDiffValue = formatDiffValue;
  readonly kindLabel = kindLabel;

  readonly title = computed(() => {
    const session = this.conflicts.session();
    if (session?.missing) return "This item was removed";
    return "Someone else changed this";
  });

  readonly headingName = computed(() => {
    const session = this.conflicts.session();
    if (!session?.latestServer) return "this item";
    if (session.entityType === "task") return session.latestServer.title || "this task";
    return session.latestServer.name || "this project";
  });

  readonly autoMerged = computed(() =>
    this.conflicts.visibleDiffs().filter((diff) => diff.kind !== "CONFLICTING"),
  );

  readonly conflicting = computed(() =>
    this.conflicts.visibleDiffs().filter((diff) => diff.kind === "CONFLICTING"),
  );

  readonly preview = computed(() =>
    this.conflicts.visibleDiffs().filter((diff) => diff.resolved !== undefined),
  );

  readonly summaryText = computed(() => {
    const summary = this.conflicts.summary();
    if (summary.changed === 0) return "No field differences to review.";
    const parts = [`${summary.changed} ${summary.changed === 1 ? "field" : "fields"} changed`];
    if (summary.needsDecision) {
      parts.push(
        `${summary.needsDecision} ${summary.needsDecision === 1 ? "needs" : "need"} your decision`,
      );
    }
    if (summary.autoMerged) {
      parts.push(
        `${summary.autoMerged} ${summary.autoMerged === 1 ? "was" : "were"} merged safely`,
      );
    }
    return parts.join(" · ");
  });

  names() {
    const session = this.conflicts.session();
    return {
      members: session?.memberNames ?? {},
      projects: session?.projectNames ?? {},
    };
  }

  display(diff: FieldDiff, side: "local" | "server" | "resolved"): string {
    return formatDiffValue(diff, side, this.names());
  }

  choicePressed(diff: FieldDiff, choice: "local" | "server"): boolean {
    if (diff.override !== undefined) return false;
    if (diff.choice === choice) return true;
    return false;
  }

  resolvedText(diff: FieldDiff): string {
    return diff.resolved == null ? "" : String(diff.resolved);
  }

  onOverride(diff: FieldDiff, event: Event): void {
    const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value;
    this.conflicts.setOverride(diff.key, value);
  }
}

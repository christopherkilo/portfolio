"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { cn } from "@/lib/demos/taskflow/utils";
import {
  useTaskflowUiStore,
  type UiSettings,
} from "@/lib/demos/taskflow/store";
import { taskflowFetch } from "@/lib/demos/taskflow/api/client";
import type { NotificationPreferenceRow } from "@/server/taskflow/types/database";

type Tab = "appearance" | "notifications" | "account" | "preferences";

const tabs: { id: Tab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
];

export function SettingsView() {
  const settings = useTaskflowUiStore((state) => state.settings);
  const updateSettings = useTaskflowUiStore((state) => state.updateSettings);
  const [tab, setTab] = useState<Tab>("appearance");
  const [draft, setDraft] = useState<UiSettings | null>(null);
  const [saved, setSaved] = useState("");
  const effective = draft ?? settings;

  function patchDraft(patch: Partial<UiSettings>) {
    setDraft({ ...effective, ...patch });
  }

  function saveSettings(message: string) {
    updateSettings(effective);
    setDraft(null);
    setSaved(message);
    window.setTimeout(() => setSaved(""), 2500);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[200px_1fr]">
      <nav aria-label="Settings sections" className="space-y-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "w-full rounded-lg px-3 py-2 text-left text-sm transition",
              tab === item.id
                ? "bg-accent/15 text-accent"
                : "text-muted hover:bg-subtle hover:text-ink",
            )}
            aria-current={tab === item.id}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="rounded-xl border border-border bg-surface p-5">
        {tab === "appearance" ? (
          <div className="space-y-5">
            <Header
              title="Appearance"
              description="Theme follows your system until you choose one in the top navigation. Density controls spacing in lists and boards."
            />
            <fieldset>
              <legend className="text-xs font-semibold uppercase tracking-wider text-muted">
                Density
              </legend>
              <div className="mt-2 flex gap-2">
                {(["compact", "comfortable"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => patchDraft({ density: value })}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm capitalize",
                      effective.density === value
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-border text-muted hover:text-ink",
                    )}
                    aria-pressed={effective.density === value}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </fieldset>
            <SaveFeedback
              saved={saved}
              onSave={() => saveSettings("Appearance saved on this device.")}
            />
          </div>
        ) : null}

        {tab === "notifications" ? <NotificationPreferencesPanel /> : null}

        {tab === "account" ? (
          <div className="space-y-4">
            <Header
              title="Account"
              description="Update the profile shown throughout this workspace."
            />
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Display name</span>
              <input
                value={effective.displayName}
                onChange={(event) =>
                  patchDraft({ displayName: event.target.value })
                }
                className="h-10 w-full max-w-md rounded-lg border border-border bg-elevated px-3 outline-none focus:border-accent/40"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Email</span>
              <input
                value={effective.email}
                onChange={(event) => patchDraft({ email: event.target.value })}
                className="h-10 w-full max-w-md rounded-lg border border-border bg-elevated px-3 outline-none focus:border-accent/40"
              />
            </label>
            <SaveFeedback
              saved={saved}
              onSave={() => saveSettings("Profile changes saved.")}
            />
          </div>
        ) : null}

        {tab === "preferences" ? (
          <div className="space-y-5">
            <Header
              title="Preferences"
              description="Workspace defaults for planning views."
            />
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Week starts on</span>
              <select
                value={effective.weekStart}
                onChange={(event) =>
                  patchDraft({
                    weekStart: event.target.value as "monday" | "sunday",
                  })
                }
                className="h-10 rounded-lg border border-border bg-elevated px-3 text-sm outline-none focus:border-accent/40"
              >
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
              </select>
            </label>
            <SaveFeedback
              saved={saved}
              onSave={() => saveSettings("Planning preferences saved.")}
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

function NotificationPreferencesPanel() {
  const qc = useQueryClient();
  const prefs = useQuery({
    queryKey: ["taskflow", "notification-preferences"],
    queryFn: () =>
      taskflowFetch<NotificationPreferenceRow>(
        "/api/taskflow/notification-preferences",
      ),
  });
  const [override, setOverride] = useState<Partial<NotificationPreferenceRow>>(
    {},
  );
  const [saved, setSaved] = useState("");

  const effective: NotificationPreferenceRow | null = prefs.data
    ? { ...prefs.data, ...override }
    : null;

  const save = useMutation({
    mutationFn: (body: {
      assignments: boolean;
      comments: boolean;
      mentions: boolean;
      dueDates: boolean;
      projectChanges: boolean;
    }) =>
      taskflowFetch<NotificationPreferenceRow>(
        "/api/taskflow/notification-preferences",
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    onSuccess: () => {
      setOverride({});
      void qc.invalidateQueries({
        queryKey: ["taskflow", "notification-preferences"],
      });
      setSaved("In-app notification preferences saved.");
      window.setTimeout(() => setSaved(""), 2500);
    },
  });

  return (
    <div className="space-y-5">
      <Header
        title="Notifications"
        description="In-app categories only — email and push delivery are not part of this phase."
      />
      {prefs.isLoading || !effective ? (
        <p className="text-sm text-muted">Loading preferences…</p>
      ) : (
        <>
          {(
            [
              ["assignments", "Task assignments"],
              ["comments", "Comments"],
              ["mentions", "Mentions"],
              ["due_dates", "Due dates"],
              ["project_changes", "Project & membership changes"],
            ] as const
          ).map(([rowKey, label]) => (
            <Toggle
              key={rowKey}
              label={label}
              checked={Boolean(effective[rowKey])}
              onChange={(value) =>
                setOverride((prev) => ({ ...prev, [rowKey]: value }))
              }
            />
          ))}
          <div className="flex items-center gap-3">
            <Button
              disabled={save.isPending}
              onClick={() =>
                void save.mutateAsync({
                  assignments: effective.assignments,
                  comments: effective.comments,
                  mentions: effective.mentions,
                  dueDates: effective.due_dates,
                  projectChanges: effective.project_changes,
                })
              }
            >
              Save preferences
            </Button>
            {saved ? (
              <p className="text-xs text-accent" role="status">
                {saved}
              </p>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Header({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted">{description}</p>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-3 py-2.5 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-accent" : "bg-subtle",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-bg transition",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}

function SaveFeedback({
  saved,
  onSave,
}: {
  saved: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <Button onClick={onSave}>Save</Button>
      {saved ? (
        <p className="text-xs text-accent" role="status">
          {saved}
        </p>
      ) : null}
    </div>
  );
}

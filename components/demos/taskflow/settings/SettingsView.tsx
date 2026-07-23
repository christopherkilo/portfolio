"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/demos/taskflow/ui/Button";
import { cn } from "@/lib/demos/taskflow/utils";

type Tab = "appearance" | "notifications" | "account" | "preferences";

const tabs: { id: Tab; label: string }[] = [
  { id: "appearance", label: "Appearance" },
  { id: "notifications", label: "Notifications" },
  { id: "account", label: "Account" },
  { id: "preferences", label: "Preferences" },
];

export function SettingsView() {
  const [tab, setTab] = useState<Tab>("appearance");
  const [density, setDensity] = useState("comfortable");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [weekStart, setWeekStart] = useState("monday");
  const [displayName, setDisplayName] = useState("Maya Chen");
  const [email, setEmail] = useState("maya@taskflow.app");
  const [saved, setSaved] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("taskflow-settings") ?? "{}");
      document.documentElement.dataset.density = stored.density ?? "comfortable";
      queueMicrotask(() => {
        setDensity(stored.density ?? "comfortable");
        setEmailNotifs(stored.emailNotifs ?? true);
        setPushNotifs(stored.pushNotifs ?? false);
        setWeekStart(stored.weekStart ?? "monday");
        setDisplayName(stored.displayName ?? "Maya Chen");
        setEmail(stored.email ?? "maya@taskflow.app");
      });
    } catch {
      // Keep safe defaults if local demo data is malformed.
    }
  }, []);

  function saveSettings(message: string) {
    const settings = {
      density,
      emailNotifs,
      pushNotifs,
      weekStart,
      displayName,
      email,
    };
    localStorage.setItem("taskflow-settings", JSON.stringify(settings));
    document.documentElement.dataset.density = density;
    window.dispatchEvent(new CustomEvent("taskflow-settings", { detail: settings }));
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
                {["compact", "comfortable"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setDensity(value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm capitalize",
                      density === value
                        ? "border-accent/40 bg-accent/15 text-accent"
                        : "border-border text-muted hover:text-ink",
                    )}
                    aria-pressed={density === value}
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

        {tab === "notifications" ? (
          <div className="space-y-5">
            <Header
              title="Notifications"
              description="Choose which product updates you want to see in this demo."
            />
            <Toggle
              label="Email updates"
              checked={emailNotifs}
              onChange={setEmailNotifs}
            />
            <Toggle
              label="Push notifications"
              checked={pushNotifs}
              onChange={setPushNotifs}
            />
            <SaveFeedback
              saved={saved}
              onSave={() => saveSettings("Notification preferences saved.")}
            />
          </div>
        ) : null}

        {tab === "account" ? (
          <div className="space-y-4">
            <Header
              title="Account"
              description="Update the profile shown throughout this workspace."
            />
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Display name</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="h-10 w-full max-w-md rounded-lg border border-border bg-elevated px-3 outline-none focus:border-accent/40"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted">Email</span>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
                value={weekStart}
                onChange={(e) => setWeekStart(e.target.value)}
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

function SaveFeedback({
  saved,
  onSave,
}: {
  saved: string;
  onSave: () => void;
}) {
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-3">
      <Button onClick={onSave}>Save changes</Button>
      <p role="status" aria-live="polite" className="text-sm text-success">
        {saved}
      </p>
    </div>
  );
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
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
    <label className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated/40 px-3 py-3 text-sm">
      <span>{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-accent" : "bg-control-track",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white transition",
            checked ? "left-5" : "left-0.5",
          )}
        />
      </button>
    </label>
  );
}

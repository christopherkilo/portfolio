"use client";

import { Modal } from "@/components/demos/taskflow/ui/Modal";
import { SHORTCUT_LIST } from "@/lib/demos/taskflow/shortcuts-catalog";

export function ShortcutHelpModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts">
      <ul className="space-y-2 text-sm">
        {SHORTCUT_LIST.map((item) => (
          <li
            key={item.keys}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-elevated/40 px-3 py-2"
          >
            <span className="text-muted">{item.description}</span>
            <kbd className="rounded border border-border bg-surface px-2 py-1 font-mono text-xs text-ink">
              {item.keys}
            </kbd>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-muted">
        Shortcuts are disabled while typing in inputs. Prefer reduced motion is
        respected for animated feedback.
      </p>
    </Modal>
  );
}

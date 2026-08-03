# TaskFlow Productivity Features

This pass turns the shared Zustand workspace into a convincing single-user productivity app—without a backend.

## Rich activity

Mutations write structured activity entries:

- actor
- action
- entity
- optional old/new values
- concise summary
- timestamp (shown relatively)

Examples:

- “moved Landing Page Redesign from Backlog to In Progress”
- “assigned Session revocation API to Jordan Blake”
- “archived project Atlas Redesign”

Dashboard and Team render the same feed. Task details show filtered history.

## Member workload

Team cards derive:

- assigned / completed / active / overdue
- completion %
- label: Light · Normal · Busy · Overloaded

Labels come from open-task counts (≤2 Light, ≤5 Normal, ≤8 Busy, else Overloaded). Nothing is hardcoded per member.

## Project health

Projects no longer rely on stored progress. Health selectors compute:

- completed / active / backlog / blocked / overdue
- completion %
- nearest open due date

Blocked = Review status or a `blocked` label.

## Task details

Task modals include labels, estimate, history, plus clearly labeled placeholders for subtasks, attachments, and comments. No fake uploads.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `T` | New task |
| `P` | Projects |
| `/` | Command palette |
| `G` then `D` / `C` / `T` / `P` | Jump pages |
| `?` | Shortcut help |
| `Esc` | Close dialogs |
| `⌘/Ctrl+K` | Palette toggle |

Ignored while typing in inputs. Animations respect `prefers-reduced-motion`.

## Command palette

Live search across navigation, projects, tasks, members, recent activity, plus actions: create task/project, open calendar, mark a task complete, archive a project.

## Smart filters

Tasks URL filters: `q`, `projectFilter`, `assignee`, `priority`, `status`, `due`, `label`, `overdue`, plus `view` and `task`. Invalid values normalize to safe defaults.

## Dashboard insights

Cards and pulse panels derive completed-today, overdue, due today, completion, most-active project, busiest teammate, and a simple completion trend—all from workspace state.

## ELI15

TaskFlow keeps one shared notebook (Zustand). Progress bars, “busy” labels, and activity sentences are counted from that notebook whenever you look. Shortcuts and the command menu are just faster ways to open the same notebook pages.

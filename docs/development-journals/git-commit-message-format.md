# Git commit message format

**Purpose:** Standard layout for commit messages in this project — especially when asking the AI assistant to draft one before you commit.

**How to use:** Copy the finished message from the chat **codeblock** into your commit (`git commit -m` or your Git client). The codeblock is plain text; formatting rules below are for readability in chat and in commit bodies.

---

## Structure (in this order)

Every commit message has **three parts**, in this exact order:

1. **Summary sentence** — one sentence describing the whole commit (the “why”)
2. **Files changed** — one block per file, with changes listed underneath
3. **Problems** (optional) — only if something went wrong during the work; each problem has a root cause or solution

```
<summary sentence>

### path/to/file.ext
- change one
- change two

### path/to/other-file.ext
- change one

<problem description>:
- ROOT CAUSE: ...
- SOLUTION: ...
```

---

## 1. Summary sentence

- Write **one complete sentence** at the top.
- Focus on **why** the change exists, not a bullet list of every file.
- Use verbs that match the work: `add`, `fix`, `ship`, `refactor`, `update`, `remove`.

**Good**

```text
Ship Phase 2 habits: real analytics on the backend, detail screen with heatmap and trend chart, and FIRE-style component layout.
```

**Weak**

```text
Updated habits files and fixed stuff.
```

---

## 2. Files changed

After the summary, list **every file** that meaningfully changed in the commit.

### File heading

- Start the filename with **`###`** (three hash marks).
- Use the path relative to the repo root, e.g. `frontend/dailyflo/store/slices/habits/habitsSlice.ts`.

### Change bullets

- Under each file, add one or more lines starting with **`-`** (dash + space).
- Describe **what changed in that file** — feature added, bug fixed, export removed, etc.
- Keep bullets short but specific enough that you could find the change in the diff.

**Example**

```text
### frontend/dailyflo/components/features/habits/index.ts
- restructure feature barrel to export tab, list, forms, and today subfolders directly
- stop re-exporting detail screen from root barrel to avoid eager Metro loading

### frontend/dailyflo/app/(tabs)/today/TodayScreenContent.tsx
- import TodayHabitsSection from habits/today instead of the full habits barrel
```

### Tips

- Group related moves: if you moved a file, list the **new** path and note “moved from …” in the bullet.
- Deleted files: still list them under `###` with a bullet like `- remove flat habits shell (replaced by tab/ subfolder)`.
- Skip noise: don’t list files that only changed line endings unless that was the point of the commit.

---

## 3. Problems (optional)

Add this section **only when** you hit real issues while implementing — build failures, wrong imports, migration errors, etc.

### Problem line

- Format: `<short problem description>:` (ends with a colon).
- One problem per block; add multiple blocks if there were several issues.

### Root cause / solution

Under each problem, use **exactly** one of these prefixes:

| Prefix | When to use |
| --- | --- |
| `- ROOT CAUSE:` | What actually caused the bug or failure |
| `- SOLUTION:` | What you did to fix it |

You can include both for the same problem (root cause first, then solution).

**Example**

```text
Metro bundling failed with "Unable to resolve ./HabitTrendChart" when opening the Today tab:
- ROOT CAUSE: the root habits barrel re-exported detail/index.ts, which exported HabitTrendChart; Metro eagerly resolved the full barrel chain even though Today only needed TodayHabitsSection
- SOLUTION: import TodayHabitsSection from habits/today directly, slim down detail/index.ts, and load chart code only on the detail screen
```

If the commit had **no problems**, omit section 3 entirely.

---

## Full example (medium-sized feature commit)

```text
Ship Phase 2 habits: real analytics on the backend, habit detail with heatmap and trend chart, edit/delete flows, and FIRE-style component layout.

### backend/dailyflo/apps/habits/services/habit_stats.py
- add habit_heatmap(), habit_trend(), and habit_full_stats() for per-habit analytics

### backend/dailyflo/apps/habits/views.py
- wire HabitStatsView to return full stats payload instead of placeholder data

### frontend/dailyflo/components/features/habits/detail/HabitDetailScreenContent.tsx
- new detail screen with streak summary, heatmap, trend chart, edit navigation, and delete action

### frontend/dailyflo/components/features/habits/detail/HabitTrendChart.tsx
- new svg line chart for 30-day rolling 7-day completion rate

### frontend/dailyflo/store/slices/habits/habitsSlice.ts
- add detailHabit, detailStats state and fetchHabit / fetchHabitStats thunks

Metro bundling failed with "Unable to resolve ./HabitTrendChart" when opening the Today tab:
- ROOT CAUSE: the habits barrel pulled in detail chart exports on every import
- SOLUTION: narrow Today import to habits/today and keep charts on the detail route only
```

---

## Small example (single fix)

```text
Fix habits tab summary padding typo so the header aligns with other grouped lists.

### frontend/dailyflo/components/features/habits/tab/HabitsTodayList.tsx
- replace Paddings.sectionLarge with Paddings.section on summary wrapper
```

No problems section — nothing blocked the fix.

---

## Quick checklist

Before you commit, confirm:

- [ ] One summary sentence at the top
- [ ] Every important changed file has a `###` heading
- [ ] Every change under a file starts with `- `
- [ ] Problems section only if something broke; each problem ends with `:`
- [ ] Under problems, lines use `- ROOT CAUSE:` and/or `- SOLUTION:`
- [ ] Message is inside a **codeblock** when copied from chat (fences keep line breaks intact)

---

## Related

- [`log-templates.md`](log-templates.md) — dev log and decisions log templates
- Project rule: the assistant drafts messages in this format when you ask for a commit message; you still run `git add` / `git commit` yourself unless you ask otherwise.

---

## Changelog

| Date | Change |
| --- | --- |
| 2026-06-07 | Initial git commit message format guide |

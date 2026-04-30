# UI Tokens Style Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create `libs/ui-tokens` as a centralized style library with design tokens (CSS custom properties) and shared utility classes, then migrate existing components to use them.

**Architecture:** A style-only NX library at `libs/ui-tokens/` exports `_tokens.scss` (CSS custom properties in `:root`) and `_utilities.scss` (shared `.card`, `.btn-*`, `.modal-button`, `.alert-*` classes) via a single `index.scss` entry point, registered as a global style in `apps/care-giver-site/project.json`. Components replace hardcoded values with `var(--token-name)` in their CSS and shared pattern classes in their templates, then remove the duplicate component-level rules.

**Tech Stack:** Angular 17+, NX monorepo, SCSS

---

## File Map

**Create:**
- `libs/ui-tokens/project.json` — NX lib config (styles only, no TS)
- `libs/ui-tokens/src/styles/_tokens.scss` — CSS custom properties `:root` block
- `libs/ui-tokens/src/styles/_utilities.scss` — shared utility classes
- `libs/ui-tokens/src/styles/index.scss` — `@forward` entry point
- `care-giver-site/CLAUDE.md` — AI guidance for using shared styles

**Modify:**
- `apps/care-giver-site/project.json` — add `libs/ui-tokens/src/styles/index.scss` to `styles` array
- `libs/care/src/lib/care/alert/alert.component.css` — replace hardcoded colors with token vars
- `libs/care/src/lib/care/calendar/calendar.component.css` — remove duplicated card styles
- `libs/care/src/lib/care/calendar/calendar.component.html` — add `card-lg` class
- `libs/care/src/lib/care/chart/chart.component.css` — remove duplicated card styles
- `libs/care/src/lib/care/chart/chart.component.html` — add `card-lg` class
- `libs/care/src/lib/care/event-table/event-table.component.css` — remove duplicated card + button styles
- `libs/care/src/lib/care/event-table/event-table.component.html` — add `card-lg` class, update button class names
- `libs/care/src/lib/care/status-monitor/status-monitor.component.css` — remove duplicated card styles
- `libs/care/src/lib/care/status-monitor/status-monitor.component.html` — add `card-lg` class
- `libs/care/src/lib/care/daily-timeline/daily-timeline.component.css` — remove duplicated card styles
- `libs/care/src/lib/care/daily-timeline/daily-timeline.component.html` — add `card` class
- `libs/care/src/lib/care/upcoming-events/upcoming-events.component.css` — remove duplicated card styles
- `libs/care/src/lib/care/upcoming-events/upcoming-events.component.html` — add `card` class
- `libs/care/src/lib/care/quick-log/quick-log.component.css` — remove duplicated card + button styles
- `libs/care/src/lib/care/quick-log/quick-log.component.html` — add `card` class, update button class names
- `libs/care/src/lib/care/modal/event-modal/event-modal.component.css` — remove `.modal-button`, `.secondary-button`, `.danger-button`
- `libs/care/src/lib/care/modal/event-modal/event-modal.component.html` — update button class names to `btn-secondary`, `btn-danger`
- `libs/care/src/lib/care/receiver-selection/receiver-selection.component.css` — remove `.modal-button`, `.secondary-button`
- `libs/care/src/lib/care/receiver-selection/receiver-selection.component.html` — update button class names
- `libs/auth/src/lib/auth/auth.component.css` — replace hardcoded colors with token vars
- `libs/care/src/lib/care/pages/feedback/feedback.component.css` — replace hardcoded colors with token vars
- `libs/care/src/lib/care/shell/shell.component.css` — replace hardcoded colors with token vars

---

### Task 1: Create the ui-tokens library files

**Files:**
- Create: `libs/ui-tokens/project.json`
- Create: `libs/ui-tokens/src/styles/_tokens.scss`
- Create: `libs/ui-tokens/src/styles/_utilities.scss`
- Create: `libs/ui-tokens/src/styles/index.scss`

- [ ] **Step 1: Create the project.json for the new lib**

Create `libs/ui-tokens/project.json`:

```json
{
  "name": "ui-tokens",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/ui-tokens/src",
  "projectType": "library",
  "tags": []
}
```

- [ ] **Step 2: Create _tokens.scss**

Create `libs/ui-tokens/src/styles/_tokens.scss`:

```scss
:root {
  /* Brand */
  --color-primary: #007bff;
  --color-primary-hover: #0056b3;
  --color-brand-purple: #7b68ee;

  /* Neutrals */
  --color-white: #ffffff;
  --color-bg-app: #f5f6fa;
  --color-bg-hover: #f5f5f5;
  --color-border: #e0e0e0;
  --color-border-input: #ccc;

  /* Text */
  --color-text-primary: #212121;
  --color-text-body: #333;
  --color-text-secondary: #757575;
  --color-text-muted: #9ca3af;

  /* Status */
  --color-success: #43a047;
  --color-success-text: #388e3c;
  --color-success-bg: #e8f5e9;
  --color-error: #e53935;
  --color-error-text: #b71c1c;
  --color-error-bg: #ffebee;
  --color-warning: #fbc02d;
  --color-warning-text: #f57f17;
  --color-warning-bg: #fff8e1;
  --color-info: #2196f3;
  --color-info-text: #1769aa;
  --color-info-bg: #e3f2fd;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 20px;
  --radius-circle: 50%;

  /* Shadows */
  --shadow-subtle: 0 1px 4px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-modal: 0 4px 6px rgba(0, 0, 0, 0.1);

  /* Typography */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.35rem;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

- [ ] **Step 3: Create _utilities.scss**

Create `libs/ui-tokens/src/styles/_utilities.scss`:

```scss
/* Card */
.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-md);
  box-sizing: border-box;
}

.card-lg {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.5rem;
  box-sizing: border-box;
}

/* Buttons */
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem var(--space-md);
  cursor: pointer;
  font-weight: var(--font-weight-medium);
}

.btn-primary:hover {
  background-color: var(--color-primary-hover);
}

.btn-secondary {
  background-color: #d3d3d3 !important;
  color: #000 !important;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem var(--space-md);
  cursor: pointer;
}

.btn-danger {
  background-color: var(--color-error) !important;
  color: var(--color-white) !important;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem var(--space-md);
  cursor: pointer;
}

/* Modal button spacing */
.modal-button {
  margin: var(--space-sm);
}

/* Alert / status messages */
.alert {
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
}

.alert-success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success);
}

.alert-error {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error);
}

.alert-warning {
  background: var(--color-warning-bg);
  color: var(--color-warning-text);
  border: 1px solid var(--color-warning);
}

.alert-info {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info);
}
```

Note: `!important` is kept on `.btn-secondary` and `.btn-danger` to ensure they override Angular Material's `matButton` filled styles, which was the reason the original component-scoped classes used it.

- [ ] **Step 4: Create index.scss**

Create `libs/ui-tokens/src/styles/index.scss`:

```scss
@use 'tokens';
@use 'utilities';
```

- [ ] **Step 5: Verify the files exist**

Run:
```bash
find libs/ui-tokens -type f | sort
```

Expected output:
```
libs/ui-tokens/project.json
libs/ui-tokens/src/styles/_tokens.scss
libs/ui-tokens/src/styles/_utilities.scss
libs/ui-tokens/src/styles/index.scss
```

- [ ] **Step 6: Commit**

```bash
git add libs/ui-tokens/
git commit -m "feat: create ui-tokens style library with design tokens and utility classes"
```

---

### Task 2: Wire ui-tokens into the app

**Files:**
- Modify: `apps/care-giver-site/project.json`

- [ ] **Step 1: Update the styles array in project.json**

In `apps/care-giver-site/project.json`, find the `"styles"` array under `targets.build.options` and update it:

```json
"styles": [
  "libs/ui-tokens/src/styles/index.scss",
  "apps/care-giver-site/src/styles.scss"
]
```

- [ ] **Step 2: Verify the build succeeds**

Run:
```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build completes with no errors. If you see `Can't find stylesheet to import` errors, double-check that the `_tokens.scss` and `_utilities.scss` filenames start with an underscore and `index.scss` uses `@forward 'tokens'` (no underscore, no extension).

- [ ] **Step 3: Verify tokens are available in the browser**

Run:
```bash
npx nx serve care-giver-site --configuration=development
```

Open `http://localhost:4200`, open DevTools → Elements → select `<html>` → Computed tab → search for `--color-primary`. It should resolve to `#007bff`. Stop the server when confirmed.

- [ ] **Step 4: Commit**

```bash
git add apps/care-giver-site/project.json
git commit -m "feat: register ui-tokens as global styles in app build"
```

---

### Task 3: Create CLAUDE.md

**Files:**
- Create: `care-giver-site/CLAUDE.md`

- [ ] **Step 1: Create the CLAUDE.md file**

Create `care-giver-site/CLAUDE.md`:

```markdown
# CareGiver Site — Claude Code Instructions

## Shared Styles

This project uses `libs/ui-tokens` as the centralized style library. All design tokens and shared utility classes live there.

### When writing component styles

- **Always use CSS custom properties from `_tokens.scss`** for colors, spacing, border-radius, and shadows. Never hardcode these values in component stylesheets. Example: use `var(--color-error)` not `#e53935`.
- **Before writing a new CSS class**, check `libs/ui-tokens/src/styles/_utilities.scss`. If a shared pattern exists (`.card`, `.card-lg`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.modal-button`, `.alert-*`), apply the class in the template instead of writing new styles.
- **If a new pattern appears in 2 or more components**, add it to `_utilities.scss` rather than duplicating it across component files.

### When updating styles

- To change a color, spacing value, radius, or shadow **globally**, update the token in `libs/ui-tokens/src/styles/_tokens.scss`.
- To update a shared pattern (card, button, alert, etc.), update it in `libs/ui-tokens/src/styles/_utilities.scss` — do not patch individual component files.
- Component-specific styles (layout, sizing, component-unique selectors) stay in the component's own CSS file.
```

- [ ] **Step 2: Commit**

```bash
git add care-giver-site/CLAUDE.md
git commit -m "docs: add CLAUDE.md with shared styles guidance"
```

---

### Task 4: Migrate alert component to token vars

**Files:**
- Modify: `libs/care/src/lib/care/alert/alert.component.css`

The alert component keeps its own `.alert-success`, `.alert-failure`, `.alert-info` classes (they're component-scoped and control the fixed-position overlay behavior). We only replace the hardcoded color values with token vars.

- [ ] **Step 1: Update alert.component.css**

Replace the three status classes in `libs/care/src/lib/care/alert/alert.component.css`:

```css
.alert-success {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success);
}

.alert-failure {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error);
}

.alert-info {
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info);
}
```

Also replace the hardcoded `rgba` in `.alert-box`:
```css
.alert-box {
  /* existing properties... */
  box-shadow: var(--shadow-card);
  border-radius: var(--radius-sm);
  font-weight: var(--font-weight-medium);
}
```

- [ ] **Step 2: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add libs/care/src/lib/care/alert/alert.component.css
git commit -m "refactor: replace hardcoded colors in alert component with token vars"
```

---

### Task 5: Migrate card-lg components (calendar, chart, event-table, status-monitor)

**Files:**
- Modify: `libs/care/src/lib/care/calendar/calendar.component.css`
- Modify: `libs/care/src/lib/care/calendar/calendar.component.html`
- Modify: `libs/care/src/lib/care/chart/chart.component.css`
- Modify: `libs/care/src/lib/care/chart/chart.component.html`
- Modify: `libs/care/src/lib/care/event-table/event-table.component.css`
- Modify: `libs/care/src/lib/care/event-table/event-table.component.html`
- Modify: `libs/care/src/lib/care/status-monitor/status-monitor.component.css`
- Modify: `libs/care/src/lib/care/status-monitor/status-monitor.component.html`

These four components all use the same `border-radius: 12px` / `box-shadow: 0 2px 8px` / `padding: 1.5rem` card pattern → use `.card-lg`.

- [ ] **Step 1: Update calendar**

In `libs/care/src/lib/care/calendar/calendar.component.html`, change the root div:
```html
<div class="calendar-container card-lg">
```

In `libs/care/src/lib/care/calendar/calendar.component.css`, remove these properties from `.calendar-container` (keep any layout-specific properties like `min-height`, `overflow`, etc.):
```css
/* Remove these from .calendar-container: */
/* background: #fff; */
/* border-radius: 12px; */
/* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); */
/* padding: 1.5rem; */
```

- [ ] **Step 2: Update chart**

In `libs/care/src/lib/care/chart/chart.component.html`, change the root div:
```html
<div class="chart-container card-lg">
```

In `libs/care/src/lib/care/chart/chart.component.css`, remove background/border-radius/box-shadow/padding from `.chart-container`.

- [ ] **Step 3: Update event-table**

In `libs/care/src/lib/care/event-table/event-table.component.html`, change the root div:
```html
<div class="event-table-card card-lg">
```

In `libs/care/src/lib/care/event-table/event-table.component.css`, remove background/border-radius/box-shadow/padding from `.event-table-card`.

- [ ] **Step 4: Update status-monitor**

In `libs/care/src/lib/care/status-monitor/status-monitor.component.html`, change the root div:
```html
<div class="status-monitor-card card-lg">
```

In `libs/care/src/lib/care/status-monitor/status-monitor.component.css`, remove background/border-radius/box-shadow/padding from `.status-monitor-card`. Note: status-monitor uses `padding: 16px` not `1.5rem` — after adding `.card-lg` it will get `1.5rem`. If this changes the visual, you can override with `.status-monitor-card { padding: var(--space-md); }` in the component CSS.

- [ ] **Step 5: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add libs/care/src/lib/care/calendar/ libs/care/src/lib/care/chart/ libs/care/src/lib/care/event-table/ libs/care/src/lib/care/status-monitor/
git commit -m "refactor: migrate card-lg components to use shared card utility class"
```

---

### Task 6: Migrate card components (daily-timeline, upcoming-events, quick-log)

**Files:**
- Modify: `libs/care/src/lib/care/daily-timeline/daily-timeline.component.css`
- Modify: `libs/care/src/lib/care/daily-timeline/daily-timeline.component.html`
- Modify: `libs/care/src/lib/care/upcoming-events/upcoming-events.component.css`
- Modify: `libs/care/src/lib/care/upcoming-events/upcoming-events.component.html`
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.css`
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.html`

These three use `border-radius: 8px` / smaller shadow / `padding: 16px` → use `.card`.

- [ ] **Step 1: Update daily-timeline**

In `libs/care/src/lib/care/daily-timeline/daily-timeline.component.html`, change the root div:
```html
<div class="timeline-card card">
```

In `libs/care/src/lib/care/daily-timeline/daily-timeline.component.css`, remove background/border-radius/box-shadow/padding from `.timeline-card`.

- [ ] **Step 2: Update upcoming-events**

In `libs/care/src/lib/care/upcoming-events/upcoming-events.component.html`, change the conditional root div:
```html
<div class="upcoming-card card">
```

In `libs/care/src/lib/care/upcoming-events/upcoming-events.component.css`, remove background/border-radius/box-shadow/padding from `.upcoming-card`.

- [ ] **Step 3: Update quick-log**

In `libs/care/src/lib/care/quick-log/quick-log.component.html`, change the root div:
```html
<div class="quick-log-card card">
```

In `libs/care/src/lib/care/quick-log/quick-log.component.css`, remove background/border-radius/box-shadow/padding from `.quick-log-card`.

- [ ] **Step 4: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add libs/care/src/lib/care/daily-timeline/ libs/care/src/lib/care/upcoming-events/ libs/care/src/lib/care/quick-log/
git commit -m "refactor: migrate card components to use shared card utility class"
```

---

### Task 7: Migrate modal button patterns

**Files:**
- Modify: `libs/care/src/lib/care/modal/event-modal/event-modal.component.css`
- Modify: `libs/care/src/lib/care/modal/event-modal/event-modal.component.html`
- Modify: `libs/care/src/lib/care/receiver-selection/receiver-selection.component.css`
- Modify: `libs/care/src/lib/care/receiver-selection/receiver-selection.component.html`
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.css`
- Modify: `libs/care/src/lib/care/quick-log/quick-log.component.html`
- Modify: `libs/care/src/lib/care/event-table/event-table.component.css`
- Modify: `libs/care/src/lib/care/event-table/event-table.component.html`

The global utility classes `.modal-button`, `.btn-secondary`, `.btn-danger` are now available. Remove the component-level duplicates and update template class names to match utility names.

- [ ] **Step 1: Update event-modal**

In `libs/care/src/lib/care/modal/event-modal/event-modal.component.css`, remove the following rules entirely:
```css
/* Delete these: */
.modal-button { ... }
.secondary-button { ... }
.danger-button { ... }
```

In `libs/care/src/lib/care/modal/event-modal/event-modal.component.html`, replace all occurrences:
- `secondary-button` → `btn-secondary`
- `danger-button` → `btn-danger`

(`.modal-button` stays the same since the utility class name matches.)

- [ ] **Step 2: Update receiver-selection**

In `libs/care/src/lib/care/receiver-selection/receiver-selection.component.css`, remove:
```css
/* Delete these: */
.modal-button { ... }
.secondary-button { ... }
```

In `libs/care/src/lib/care/receiver-selection/receiver-selection.component.html`, replace:
- `secondary-button` → `btn-secondary`

- [ ] **Step 3: Update quick-log**

In `libs/care/src/lib/care/quick-log/quick-log.component.css`, remove:
```css
/* Delete these: */
.modal-button { ... }
.secondary-button { ... }
```

In `libs/care/src/lib/care/quick-log/quick-log.component.html`, replace:
- `secondary-button` → `btn-secondary`

Note: The existing `.modal-button` in quick-log uses `margin-right: 8px` instead of `margin: 0.5rem`. After removing it, the global `.modal-button` (all-sides margin) will apply. This is an intentional consolidation to the consistent spacing.

- [ ] **Step 4: Update event-table**

In `libs/care/src/lib/care/event-table/event-table.component.css`, remove:
```css
/* Delete these: */
.modal-button { ... }
.secondary-button { ... }
```

In `libs/care/src/lib/care/event-table/event-table.component.html`, replace:
- `secondary-button` → `btn-secondary`

- [ ] **Step 5: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add libs/care/src/lib/care/modal/ libs/care/src/lib/care/receiver-selection/ libs/care/src/lib/care/quick-log/ libs/care/src/lib/care/event-table/
git commit -m "refactor: remove duplicate modal button styles, use global utility classes"
```

---

### Task 8: Migrate auth component to token vars

**Files:**
- Modify: `libs/auth/src/lib/auth/auth.component.css`

- [ ] **Step 1: Replace hardcoded values in auth.component.css**

Update the following rules (keep all selectors and non-token properties as-is, only swap the values listed):

```css
/* auth-box */
.auth-box {
  background-color: var(--color-white);
  box-shadow: var(--shadow-modal);
  border-radius: var(--radius-md);
}

/* tabs button */
.tabs button {
  color: var(--color-text-body);
}

.tabs button.active {
  background-color: var(--color-primary);
}

.tabs button:hover {
  background-color: var(--color-border);
}

/* input */
input {
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
}

/* button */
button {
  background-color: var(--color-primary);
  border-radius: var(--radius-sm);
}

button:hover {
  background-color: var(--color-primary-hover);
}

/* error-message */
.error-message {
  background-color: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error);
  border-radius: var(--radius-sm);
}

/* info-message */
.info-message {
  background-color: var(--color-info-bg);
  color: var(--color-info-text);
  border: 1px solid var(--color-info);
  border-radius: var(--radius-sm);
}
```

- [ ] **Step 2: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add libs/auth/src/lib/auth/auth.component.css
git commit -m "refactor: replace hardcoded colors in auth component with token vars"
```

---

### Task 9: Migrate feedback and shell components to token vars

**Files:**
- Modify: `libs/care/src/lib/care/pages/feedback/feedback.component.css`
- Modify: `libs/care/src/lib/care/shell/shell.component.css`

- [ ] **Step 1: Update feedback.component.css**

Replace hardcoded values:

```css
.feedback-title {
  color: var(--color-text-body);
}

.form-label {
  color: var(--color-text-secondary);
}

.form-textarea {
  border: 1px solid var(--color-border-input);
  border-radius: var(--radius-sm);
}

.form-textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.submit-button {
  background-color: var(--color-primary);
  border-radius: var(--radius-sm);
}

.submit-button:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.submit-button:disabled {
  background-color: var(--color-border-input);
}

.message.success {
  background-color: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success);
}

.message.error {
  background-color: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error);
}
```

- [ ] **Step 2: Update shell.component.css**

Replace the sidenav background color with the token:

```css
.shell-sidenav {
  background: var(--color-brand-purple);
}
```

All other shell styles (rgba overlays for nav items, white text at different opacities) are intentionally specific to the sidenav's white-on-purple treatment and do not map to tokens — leave them as-is.

- [ ] **Step 3: Verify build**

```bash
npx nx build care-giver-site --configuration=development
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add libs/care/src/lib/care/pages/feedback/ libs/care/src/lib/care/shell/
git commit -m "refactor: replace hardcoded colors in feedback and shell with token vars"
```

---

### Task 10: Final visual verification

- [ ] **Step 1: Serve the app**

```bash
npx nx serve care-giver-site --configuration=development
```

- [ ] **Step 2: Verify each major view**

Navigate to each view and confirm no visual regressions:
- Login / signup form (auth) — form inputs, buttons, error/info messages
- Dashboard — all cards (calendar, timeline, upcoming events, status monitor, quick log, chart) have consistent rounded corners, shadows, backgrounds
- Event table — card appearance, modal buttons (secondary gray, danger red)
- Stats page — chart card
- Feedback page — form, submit button, success/error messages
- Receiver selection modal — modal buttons

- [ ] **Step 3: Check DevTools**

Open DevTools → Elements panel. Select any `.card` element and confirm Computed styles show `border-radius: 8px` (not `var(--radius-md)`). Select `<html>` and confirm `--color-primary: #007bff` is listed under custom properties.

- [ ] **Step 4: Final commit if any cleanup needed**

```bash
git add -p
git commit -m "refactor: final cleanup from ui-tokens migration"
```

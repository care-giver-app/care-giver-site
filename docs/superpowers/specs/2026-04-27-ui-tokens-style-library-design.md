# UI Tokens Style Library Design

**Date:** 2026-04-27  
**Status:** Approved  

---

## Problem

The `care-giver-site` codebase has 21 component CSS files with no centralized theme, no CSS variables, and significant duplication:

- Colors hardcoded in 15+ files (no tokens)
- Card shell pattern repeated in 8+ components
- `.modal-button` margin rule copied 5 times
- `.secondary-button` style copied 3 times
- Status/alert colors defined inconsistently in `alert/` and `auth/`
- No shared spacing, border-radius, or shadow scale

---

## Solution

Create a new NX library `libs/ui-tokens` that exports:
1. **Design tokens** — CSS custom properties for all shared values (colors, spacing, radius, shadows, typography)
2. **Utility classes** — pre-built shared patterns (`.card`, `.btn-*`, `.alert-*`, `.modal-button`)

Register both as global styles in `angular.json` so they are available to all components without per-component imports.

---

## Library Structure

```
libs/ui-tokens/
├── src/
│   └── styles/
│       ├── _tokens.scss       ← CSS custom properties (:root block)
│       ├── _utilities.scss    ← shared utility classes
│       └── index.scss         ← @forward of both files
└── project.json
```

No TypeScript, no Angular components — pure styles only.

---

## Tokens (`_tokens.scss`)

```scss
:root {
  /* Brand */
  --color-primary: #007bff;
  --color-primary-hover: #0056b3;
  --color-brand-purple: #7B68EE;

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

// No SCSS variables needed — all hover/derived values are defined explicitly above as CSS custom properties
```

---

## Utility Classes (`_utilities.scss`)

### Card

```scss
.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  padding: var(--space-md);
  box-sizing: border-box;
}

.card-lg {
  border-radius: var(--radius-lg);
  padding: 1.5rem;
}
```

Replaces identical card shell pattern in: calendar, daily-timeline, upcoming-events, status-monitor, quick-log, event-table, chart.

### Buttons

```scss
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
  background-color: #d3d3d3;
  color: #000;
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem var(--space-md);
  cursor: pointer;
}

.btn-danger {
  background-color: var(--color-error);
  color: var(--color-white);
  border: none;
  border-radius: var(--radius-sm);
  padding: 0.5rem var(--space-md);
  cursor: pointer;
}
```

### Modal button spacing

```scss
.modal-button {
  margin: var(--space-sm);
}
```

Replaces 5 identical `.modal-button` rules across: event-modal, receiver-selection, quick-log, event-table.

### Alert / status messages

```scss
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

Unifies inconsistent status color definitions in `alert/` and `auth/`.

---

## Integration

Register the lib's styles as global styles in the app's `angular.json` so tokens and utility classes are available to all components without per-component imports:

```json
// angular.json (apps/care-giver-site)
"styles": [
  "libs/ui-tokens/src/styles/index.scss",
  "apps/care-giver-site/src/styles.scss"
]
```

Components then:
- Use `var(--token-name)` in their own component SCSS for token values
- Apply shared class names (`.card`, `.btn-primary`, etc.) in templates for pre-built patterns

---

## Scope Boundaries

**Moves to `ui-tokens`:**
- All shared color, spacing, radius, shadow, typography values
- Card shell, button, modal-button, and alert patterns

**Stays in component stylesheets:**
- Internal layout (calendar grid, chart dimensions, timeline spine)
- Component-specific sizing (navbar height, sidenav width)
- Anything not repeated in 2+ components

---

## CLAUDE.md Update

As part of this implementation, a `CLAUDE.md` file will be created at the repo root (`care-giver-site/CLAUDE.md`) with the following guidance for future sessions:

```markdown
## Shared Styles

This project uses `libs/ui-tokens` as the centralized style library.

**When writing styles:**
- Always use CSS custom properties from `_tokens.scss` for colors, spacing, border-radius, and shadows — never hardcode these values in component stylesheets
- Before writing a new CSS class, check `_utilities.scss` — if a shared pattern already exists (`.card`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.modal-button`, `.alert-*`), use it
- If a new pattern appears in 2 or more components, add it to `_utilities.scss` rather than duplicating it

**When updating styles:**
- If a color, spacing, radius, or shadow value needs to change globally, update the token in `_tokens.scss`
- If a shared utility class needs updating, update it in `_utilities.scss` — do not patch individual component files
```

---

## Migration Approach

The implementation should migrate existing components to use shared tokens/classes. The recommended order:

1. Create the `libs/ui-tokens` lib and wire it into `angular.json`
2. Migrate `alert/` component (already closest to the utility class shape)
3. Migrate card-pattern components (calendar, daily-timeline, upcoming-events, status-monitor, quick-log, event-table, chart)
4. Migrate modal-button patterns (event-modal, receiver-selection, quick-log, event-table)
5. Migrate button styles (auth, shell, feedback)
6. Migrate `auth/` status message styles to use `.alert-*` classes
7. Create `CLAUDE.md` with shared styles guidance

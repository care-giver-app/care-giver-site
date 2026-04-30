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

# Event Icon SVG Redesign

## Goal

Replace all event icons with clean, consistent solid/filled SVGs sourced from Phosphor Icons (MIT license). Icons are displayed as `<img>` tags in Angular components and must render legibly at small sizes (20–32px) both on light backgrounds and on colored circular badge backgrounds.

## Icon Mapping

| Event type | JSON config file | New SVG file | Phosphor icon name |
|---|---|---|---|
| Urination | `urination.json` | `urination-icon.svg` | Drop (Fill) |
| Medication | `medication.json` | `medication-icon.svg` | Pill (Fill) |
| Bowel Movement | `bowel_movement.json` | `bowel-movement-icon.svg` | Toilet (Fill) |
| Shower | `shower.json` | `shower-icon.svg` | Shower (Fill) |
| Walk | `walk.json` | `walk-icon.svg` | PersonSimpleWalk (Fill) |
| Weight | `weight.json` | `weight-icon.svg` | Scales (Fill) |
| Doctor Appointment | `doctor_appointment.json` | `appointment-icon.svg` | Stethoscope (Fill) |

## SVG Spec

- Source: Phosphor Icons v2 filled variants (https://phosphoricons.com), MIT license
- `viewBox="0 0 256 256"`, no explicit width/height (sized by CSS)
- Fill: `#000000` (black). CSS `filter: brightness(0) invert(1)` is applied by consuming components when the icon sits on a colored background
- No stroke, no gradients, no masks — single path per icon where possible
- Strip all metadata, comments, and unnecessary attributes from the SVG source

## Asset Changes

**In `libs/shared/assets/`:**
- Add 7 new SVG files (paths listed above)
- Delete old PNG files: `urination-icon.png`, `medication-icon.png`, `bowel-movement-icon.png`, `shower-icon.png`, `walk-icon.png`, `weight-icon.png`
- Delete old low-quality auto-generated SVGs: `bowel-movement-icon.svg`, `medication-icon.svg`, `shower-icon.svg`, `urination-icon.svg`, `weight-icon.svg`
- Keep `appointment-icon.svg` — overwrite it with the Stethoscope design

## Config Changes

Update 6 JSON files in `care-giver-golang-common/pkg/event/types/` — change `"icon"` value from `.png` to `.svg`:

| File | Before | After |
|---|---|---|
| `urination.json` | `assets/urination-icon.png` | `assets/urination-icon.svg` |
| `medication.json` | `assets/medication-icon.png` | `assets/medication-icon.svg` |
| `bowel_movement.json` | `assets/bowel-movement-icon.png` | `assets/bowel-movement-icon.svg` |
| `shower.json` | `assets/shower-icon.png` | `assets/shower-icon.svg` |
| `walk.json` | `assets/walk-icon.png` | `assets/walk-icon.svg` |
| `weight.json` | `assets/weight-icon.png` | `assets/weight-icon.svg` |

`doctor_appointment.json` already references `assets/appointment-icon.svg` — no change needed.

## CSS Changes

**`status-monitor.component.css`** — add `filter: brightness(0) invert(1)` to `.icon-badge-img`. Icons on dark colored badge backgrounds currently render as black (invisible). This is the only component missing the filter.

All other components that display icons on colored backgrounds (`upcoming-events`) already apply this filter correctly.

## Go Test Changes

`event_test.go` — update the 6 test assertions that check `Icon` field values to expect `.svg` extensions instead of `.png`.

## Out of Scope

- No changes to how icons are loaded (remain `<img>` tags, no inline SVG)
- No changes to icon sizing or badge layout
- No changes to the iOS app (separate repo)
- `trash-icon.png` is not an event icon — not touched
- `caretosher-logo.png` — not touched

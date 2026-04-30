# Navbar Redesign — Design Spec

**Date:** 2026-04-26
**Status:** Approved

## Overview

Replace the current navbar + separate receiver-selection row with a unified, mobile-first navigation system: a slide-in drawer on mobile and a persistent expanded sidebar on desktop. The care receiver name is prominently displayed at the bottom of the sidebar/drawer. A floating action button (FAB) gives one-tap access to logging any event type from any page.

## Current State

- `navbar.component` — top bar with logo, three nav links (Dashboard, Stats, Feedback), user icon menu (sign out only)
- `receiver-selection.component` — separate row below the navbar showing an initials mini-fab button + a swap icon button. The current receiver's full name is never visible without opening a menu.
- No "add event" entry point exists outside of page-specific UI.

## Design Decisions

### Navigation Structure

**Mobile:** A slide-in drawer triggered by a hamburger button in the top bar. The drawer overlays content with a semi-transparent scrim behind it. Tapping outside or the close button dismisses it.

**Desktop:** A persistent sidebar (~150px wide) always visible on the left. No hamburger, no toggle — it is always open.

Both the drawer and the sidebar use the same dark navy background (`#1a237e`) with white icons and labels.

### Top Bar

Minimal on both breakpoints:

| Element | Position | Behavior |
|---------|----------|----------|
| Hamburger icon | Left (mobile only) | Opens/closes the drawer |
| Logo ("CareToSher") | Left | Links to `/` |
| User avatar (initials) | Right | Opens mat-menu with Sign Out |

The receiver name does **not** appear in the top bar. It lives in the sidebar instead.

### Sidebar / Drawer Navigation Items

```
Dashboard       (icon + label)
Stats           (icon + label)
─────────────────────────────
Feedback        (icon + label)
─────────────────────────────
Sign Out        (icon + label)
```

Active route is highlighted with a subtle white fill on the item background. Sign Out is separated by a divider and moves out of the user avatar menu (currently in the navbar) into the sidebar for discoverability.

### Receiver Section (sidebar bottom)

Anchored at the bottom of both the sidebar and the mobile drawer, separated from the nav links by a horizontal rule:

```
CARING FOR
[JD]  Jane Doe
      tap to switch ▾
```

- Shows a circular initials avatar and the **full name** of the currently selected care receiver.
- Tapping/clicking opens the existing receiver-switcher mat-menu (switch receiver, add new receiver, add care giver).
- Replaces the existing `receiver-selection.component` row beneath the navbar.

### Floating Action Button (FAB)

- Fixed position, bottom-right corner of the viewport (`position: fixed; bottom: 24px; right: 24px`).
- Renders on all authenticated pages.
- Uses Angular Material `matFab` with a `+` / `add` icon.
- On click, opens a `mat-menu` (or bottom sheet on mobile) listing all available event types, identical to the options available in `quick-log.component`.
- The FAB is rendered at the app shell level (dashboard component), not inside individual pages.

## Component Plan

### Components to modify

| Component | Change |
|-----------|--------|
| `navbar.component` | Becomes the top bar only: hamburger (mobile), logo, user avatar. Remove nav links. |
| `receiver-selection.component` | Remove the separate row; its logic (fetch receivers, select, switch, add receiver/caregiver modals) is reused but rendered inside the sidebar. |
| `dashboard.component` | Remove `<care-receiver-selection>` from below the navbar. Add the FAB and sidebar/drawer shell. |

### New component: `app-shell` (or extend `dashboard.component`)

A wrapper that provides:
- The top bar (`care-navbar`)
- The sidebar (desktop) / drawer (mobile) with nav links and receiver section
- The FAB
- A `<router-outlet>` for page content

Since all current pages already use `DashboardComponent` as a wrapper, the sidebar can be added directly there rather than creating a new shell component, unless route-level isolation becomes necessary.

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 768px (mobile) | Sidebar hidden; hamburger + drawer |
| ≥ 768px (desktop/tablet) | Sidebar always visible; hamburger hidden |

## Styling

- Sidebar background: `#1a237e` (Material indigo-900, consistent with the Material azure theme)
- Active nav item: `rgba(255, 255, 255, 0.14)` background
- Nav text/icons: `rgba(255, 255, 255, 0.65)` default, `#fff` when active
- FAB: Material `color="primary"` (azure theme blue)
- Top bar: white background, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`

## Out of Scope

- Changing the nav links themselves (Dashboard, Stats, Feedback) — adding/removing pages is a separate concern.
- Animating the drawer open/close — Angular Material `MatDrawer` handles this.
- Changing the event-logging flow triggered by the FAB — only the entry point changes, not the event modal itself.

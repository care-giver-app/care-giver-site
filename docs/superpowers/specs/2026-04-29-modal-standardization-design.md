# Modal Standardization Design

**Date:** 2026-04-29

## Overview

Standardize the event modal system into two focused components: one for creating/editing events, one for viewing events. This eliminates the duplicated inline modal code currently spread across `quick-log` and `event-table`, and upgrades the view modal to support inline editing and delete confirmation.

## Current State

- `care-modal` — base shell with header/body/footer slots via `ng-content`
- `event-modal.component` — view + delete-confirm modal used by dashboard and stats
- Add-event form — inline in both `quick-log.component` and `event-table.component` (duplicated)
- Edit — `EventAction.update` is defined but never implemented

## Component Structure

```
libs/care/src/lib/care/modal/
  modal.component.*          ← unchanged
  event-form-modal/          ← NEW
  event-view-modal/          ← NEW
  event-modal/               ← DELETED
```

## EventFormModalComponent

**Selector:** `care-event-form-modal`

### Inputs
| Input | Type | Description |
|---|---|---|
| `eventTypes` | `EventMetadata[]` | All available event types |
| `initialTypes` | `string[]` (optional) | Pre-selected types (used by quick-log) |
| `show` | `boolean` | Controls visibility |

### Outputs
| Output | Type | Description |
|---|---|---|
| `showChange` | `EventEmitter<boolean>` | Two-way binding for show |
| `submitted` | `EventEmitter<void>` | Emits after successful submit; parent refreshes data |

### Form Fields
- Multi-select event type dropdown (all eventTypes available)
- Date picker (defaults to today)
- Time picker (defaults to now, rounded to nearest 10 min)
- Dynamic fields per selected type — driven by `EventMetadata.fields` and `EventMetadata.data` (text/number/textarea/date inputs)
- Optional note (shared across all selected types)

### Behavior
- Supports one or multiple selected event types; creates one event per type on submit
- `quick-log` passes `initialTypes: [meta.type]`; `event-table` passes no initial types
- On submit: calls `ReceiverService.addEvent` for each selected type, then emits `submitted`
- On close/cancel: resets all state, emits `showChange(false)`

### Services Used
- `AuthService` — `getCurrentUserId()`
- `ReceiverService` — `currentReceiverId`, `addEvent()`
- `AlertService` — success/failure feedback

## EventViewModalComponent

**Selector:** `care-event-view-modal`

### Inputs
| Input | Type | Description |
|---|---|---|
| `event` | `Event` | The event to display/edit/delete |
| `eventTypes` | `EventMetadata[]` | For field labels, units, and edit form |
| `show` | `boolean` | Controls visibility |

### Outputs
| Output | Type | Description |
|---|---|---|
| `showChange` | `EventEmitter<boolean>` | Two-way binding for show |
| `eventChange` | `EventEmitter<void>` | Emits after edit or delete; parent refreshes data |

### Internal States
`'view' | 'edit' | 'delete-confirm'` — resets to `'view'` whenever a new event is passed in via `ngOnChanges`.

### View State
- Displays: event type, logged by (resolved via `UserService`), timestamp, all data fields with labels/units, note
- Footer: **Edit** button (→ `'edit'`), **Delete** button (→ `'delete-confirm'`)

### Edit State (inline)
- Form pre-populated from existing event: type, date, time, data fields, note
- Same dynamic field rendering pattern as `EventFormModalComponent`
- Footer: **Save** (calls update API, emits `eventChange`, returns to `'view'`), **Cancel** (returns to `'view'`)
- **Prerequisite:** Backend update endpoint required (`ReceiverService.updateEvent`)

### Delete-Confirm State (inline)
- Body: "Are you sure you want to delete this event?" + event type and timestamp summary
- Footer: **Confirm Delete** (calls `ReceiverService.deleteEvent`, emits `eventChange`, closes modal), **Cancel** (returns to `'view'`)

### Services Used
- `EventService` — `getReadableTimestamp()`, `getEventConfigs()`
- `UserService` — `getLoggedUser()`
- `AuthService` — `getCurrentUserId()`
- `ReceiverService` — `currentReceiverId`, `deleteEvent()`, `updateEvent()`
- `AlertService` — success/failure feedback

## Migration

| Component | Change |
|---|---|
| `quick-log.component` | Remove inline `<care-modal>` and all form state/logic; add `<care-event-form-modal [eventTypes]="eventTypes" [initialTypes]="[selectedType.type]" [(show)]="showModal" (submitted)="onNewEvent()">` |
| `event-table.component` | Remove inline `<care-modal>` and all form state/logic; add `<care-event-form-modal [eventTypes]="eventTypes" [(show)]="showModal" (submitted)="newEvent.emit()">` |
| `dashboard.component` | Swap `<care-event-modal>` for `<care-event-view-modal [event]="selectedEvent" [eventTypes]="eventTypes" [(show)]="showEventModal" (eventChange)="getLatestEvents()">`. Remove `eventAction` field — the view modal manages its own internal state. |
| `stats.component` | Same swap as dashboard. Both `handleDeleteEvent` and `handleViewEvent` methods simplify to just setting `selectedEvent` and `showEventModal = true` — the modal always opens in view state. |
| `event-modal/` directory | Deleted entirely |

## Prerequisites

- `ReceiverService.updateEvent()` method must be added before the edit feature in `EventViewModalComponent` can be implemented
- Backend must expose an update event endpoint

## Styling

Follow `CLAUDE.md` conventions: use CSS custom properties from `_tokens.scss`, apply shared utility classes from `_utilities.scss` (`.modal-button`, `.btn-primary`, `.btn-secondary`, `.btn-danger`), keep component-specific layout in the component's own CSS file.

Styles must be **mobile-first**: base styles target small screens, with `min-width` media queries layering in desktop enhancements. Both modal components must be fully usable on mobile (touch-friendly tap targets, scrollable body for long forms, no horizontal overflow) and polished on desktop (appropriate max-width, comfortable spacing).

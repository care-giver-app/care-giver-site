# Daily Timeline — Design Spec

## Goal

Add a `daily-timeline` component to the dashboard that shows all of a receiver's events for a selected day in chronological order. Users can navigate backwards (and forward, up to today) one day at a time. Each new day fires a scoped API call; previously-visited days are served from an in-memory cache.

---

## Affected Repos

- `care-giver-api` — Go handler change (date query params)
- `care-giver-site` — Angular service change + new component + dashboard wiring

---

## API Changes (`care-giver-api`)

**File:** `internal/handlers/event.go` — `HandleGetReceiverEvents`

Add optional query params `startTime` and `endTime` (RFC3339 strings). If both are present, pass them as `TimestampBound{Lower: startTime, Upper: endTime}` to `GetEvents`. If only one is present or neither, fall back to the current unbounded behavior (empty `TimestampBound{}`).

The DynamoDB layer already supports this via the `receiver-start-time` GSI — no repository changes needed.

---

## Angular Service Changes (`care-giver-site`)

**File:** `libs/services/src/lib/receiver/receiver.service.ts`

Extend `getReceiverEvents` with two optional parameters:

```ts
getReceiverEvents(
  receiverId: string,
  userId: string,
  startTime?: string,
  endTime?: string
): Promise<Observable<Event[]>>
```

When both `startTime` and `endTime` are provided, append them as query params:

```
/events/{receiverId}?userId=...&startTime=...&endTime=...
```

Existing callers (dashboard `getLatestEvents`) pass no date args and continue working unchanged.

---

## New Angular Component (`care-giver-site`)

**Location:** `libs/care/src/lib/care/daily-timeline/`

**Selector:** `care-daily-timeline`

**No `@Input()` bindings** — the component is self-contained and injects its own services.

### Injected services

- `ReceiverService` — for `getReceiverEvents` and `currentReceiverId`
- `EventService` — for `eventConfigs$` (resolves icon/color per event type)
- `AuthService` — for `getCurrentUserId`

### Internal state

```ts
interface TimelineRow {
  meta: EventMetadata;
  event: Event;
  timeLabel: string;    // "8:45 AM"
  dataSummary: string;  // "22 mins" | "148 lbs" | ""
}

selectedDate: Date          // default: today
rows: TimelineRow[]
loading: boolean
cache: Map<string, Event[]> // key: "YYYY-MM-DD"
eventTypes: EventMetadata[]
```

### Behavior

**On init:**
- Subscribe to `eventConfigs$` to populate `eventTypes`
- Fetch today's events via `loadDate(today)`

**`loadDate(date: Date)`:**
1. Compute `startTime` = start of day (00:00:00Z) and `endTime` = end of day (23:59:59Z) as UTC RFC3339 strings
2. Check cache — if hit, build `rows` immediately from cached events, return (no loading state)
3. Set `loading = true`, show skeleton
4. Call `getReceiverEvents(receiverId, userId, startTime, endTime)`, store result in cache
5. Sort events by `startTime` ascending
6. Build `rows` by joining each event with its matching `EventMetadata`
7. Set `loading = false`

**Date navigation:**
- `‹` (previous day): `selectedDate -= 1 day`, call `loadDate`
- `›` (next day): `selectedDate += 1 day`, call `loadDate` — button disabled when `selectedDate` is today

**`dataSummary` computation:**
- If `meta.data` exists (single numeric field — Walk, Weight): format as `"${event.data[0].value} ${meta.data.unit.toLowerCase()}"` (e.g. "22 mins", "148 lbs")
- If `meta.fields` exists (multi-field — Doctor Appointment): join all `event.data` values with " · " (e.g. "Dr. Chen · City Clinic")
- Otherwise return `""`

**Date label format:**
- Today → `"Today, Apr 23"`
- Yesterday → `"Yesterday, Apr 22"`
- Older → `"Wednesday, Apr 21"` (weekday + month + day)

### Display

**Header:**
```
‹   [date label]   ›
```
`›` is disabled and dimmed (`opacity: 0.4`, `pointer-events: none`) when `selectedDate` is today.

**Loading state — structural skeleton (3 rows):**
- Grey shimmer blocks in the exact shape of the populated layout: 34px rounded square badge placeholder, title line, subtitle line, time on right
- Spine connector line (`2px #E5E7EB`) visible between skeleton rows
- Shimmer via `@keyframes` CSS animation (no external dependency)

**Populated rows — spine timeline:**
- 34×34px rounded square badge: `color.primary` background, white-filtered SVG icon (`filter: brightness(0) invert(1)`)
- `2px #E5E7EB` vertical connector line between badges; omitted after the last row
- Event name: bold, 13.5px, `#1A1D2E`
- `dataSummary` on second line: 11.5px, `#9CA3AF` — hidden if empty
- `note` on third line: 11.5px, lighter grey (`#B0B8C4`), italic — hidden if absent
- Time on right: 12px, `#9CA3AF`, `h:mm a` format

**Empty state:**
Single line of muted text: `"No events logged for this day"` — centered in the card body.

---

## Dashboard Wiring (`care-giver-site`)

**File:** `libs/care/src/lib/care/pages/dashboard/dashboard.component.html`

Add after `<care-status-monitor>` and before `<care-calendar>`:

```html
<care-daily-timeline></care-daily-timeline>
```

Import `DailyTimelineComponent` in `dashboard.component.ts`.

---

## Out of Scope

- Tapping a row to view/edit the event (the existing calendar already provides this)
- Hard limit on how far back navigation can go
- Persisting the selected date across page reloads

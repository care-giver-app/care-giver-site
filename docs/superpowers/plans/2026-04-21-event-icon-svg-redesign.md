# Event Icon SVG Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 7 event type icons with clean solid/filled SVGs from Phosphor Icons, update JSON configs to reference `.svg`, fix the status-monitor CSS filter, and update Go tests.

**Architecture:** SVG files live in `libs/shared/assets/` and are served as static assets referenced by path strings in the Go event config JSON files. Angular components load them via `<img>` tags. No component logic changes — only assets, configs, one CSS rule, and tests.

**Tech Stack:** Phosphor Icons v2 (MIT), Angular (care-giver-site), Go (care-giver-golang-common)

---

## Files

**care-giver-site:**
- Overwrite: `libs/shared/assets/appointment-icon.svg` — Stethoscope (Fill)
- Create: `libs/shared/assets/urination-icon.svg` — Drop (Fill)
- Create: `libs/shared/assets/medication-icon.svg` — Pill (Fill)
- Create: `libs/shared/assets/bowel-movement-icon.svg` — Toilet (Fill)
- Create: `libs/shared/assets/shower-icon.svg` — Shower (Fill)
- Create: `libs/shared/assets/walk-icon.svg` — PersonSimpleWalk (Fill)
- Create: `libs/shared/assets/weight-icon.svg` — Scales (Fill)
- Delete: `libs/shared/assets/urination-icon.png`, `medication-icon.png`, `bowel-movement-icon.png`, `shower-icon.png`, `walk-icon.png`, `weight-icon.png`
- Delete: `libs/shared/assets/bowel-movement-icon.svg`, `medication-icon.svg`, `shower-icon.svg`, `urination-icon.svg`, `weight-icon.svg` (old auto-generated, low quality)
- Modify: `libs/care/src/lib/care/status-monitor/status-monitor.component.css` — add `filter` to `.icon-badge-img`

**care-giver-golang-common:**
- Modify: `pkg/event/types/urination.json`
- Modify: `pkg/event/types/medication.json`
- Modify: `pkg/event/types/bowel_movement.json`
- Modify: `pkg/event/types/shower.json`
- Modify: `pkg/event/types/walk.json`
- Modify: `pkg/event/types/weight.json`
- Modify: `pkg/event/event_test.go` — update Icon assertions for shower and weight (the only two currently asserting `.png` paths)

---

## Task 1: Write the SVG files

All SVGs use Phosphor Icons v2 filled paths, `viewBox="0 0 256 256"`, black fill, no width/height attributes, no metadata.

- [ ] **Step 1: Write `appointment-icon.svg` (Stethoscope Fill)**

Overwrite `libs/shared/assets/appointment-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M244,152a76.08,76.08,0,0,1-76,76c-36.32,0-68.6-26.33-74.68-62.29C77,163.05,56,142.28,56,116V72A20,20,0,0,1,76,52H92a12,12,0,0,1,0,24H80v40c0,22.06,17.94,40,40,40s40-17.94,40-40V76H148a12,12,0,0,1,0-24h16a20,20,0,0,1,20,20v44c0,26.28-21,47.05-37.32,49.71C152.55,183.48,176,204,204,204a52,52,0,0,0,52-52,12,12,0,0,1,24,0ZM84,40a16,16,0,1,0-16-16A16,16,0,0,0,84,40Zm88,0a16,16,0,1,0-16-16A16,16,0,0,0,172,40Z"/></svg>
```

- [ ] **Step 2: Write `urination-icon.svg` (Drop Fill)**

Create `libs/shared/assets/urination-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M174,47.75a254.19,254.19,0,0,0-41.45-38.3,12,12,0,0,0-14.1,0A254.19,254.19,0,0,0,77,47.75C54.51,79.32,40,112.6,40,144a88,88,0,0,0,176,0C216,112.6,201.49,79.32,174,47.75Z"/></svg>
```

- [ ] **Step 3: Write `medication-icon.svg` (Pill Fill)**

Create `libs/shared/assets/medication-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M225,80.4,175.6,31a56,56,0,0,0-79.2,79.2l29.1,29.1-71.1,71.1a56,56,0,1,0,79.2,79.2L228,136A56,56,0,0,0,225,80.4ZM96.4,49.6a32,32,0,0,1,45.26,0l19.2,19.2-45.26,45.26-19.2-19.2A32,32,0,0,1,96.4,49.6Z"/></svg>
```

- [ ] **Step 4: Write `bowel-movement-icon.svg` (Toilet Fill)**

Create `libs/shared/assets/bowel-movement-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M244,96H212V48a20,20,0,0,0-20-20H64A20,20,0,0,0,44,48V96H12a12,12,0,0,0,0,24H44v4a84.09,84.09,0,0,0,72,83.14V220H104a12,12,0,0,0,0,24h48a12,12,0,0,0,0-24H140V207.14A84.09,84.09,0,0,0,212,124v-4h32a12,12,0,0,0,0-24ZM68,52H188V96H68ZM128,188a60.07,60.07,0,0,1-60-60v-8H188v8A60.07,60.07,0,0,1,128,188Z"/></svg>
```

- [ ] **Step 5: Write `shower-icon.svg` (Shower Fill)**

Create `libs/shared/assets/shower-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M229,75,181,27a20,20,0,0,0-28.28,0L136,43.71,112.29,20A20,20,0,0,0,84,20L28,76a20,20,0,0,0,0,28.28L51.71,128,27,152.72A20,20,0,0,0,41,184H56v16a12,12,0,0,0,24,0V184H96a20,20,0,0,0,14.14-34.14L85.46,125.17,100,110.63l78.7,78.7A20,20,0,0,0,207,184h1a20,20,0,0,0,14-6L229,171A20,20,0,0,0,229,75ZM96,160H76l24-24ZM213,155l-88-88,20.69-20.69,88,88Z"/></svg>
```

- [ ] **Step 6: Write `walk-icon.svg` (PersonSimpleWalk Fill)**

Create `libs/shared/assets/walk-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M152,80a32,32,0,1,0-32-32A32,32,0,0,0,152,80Zm-16.44,56L120,192.59V224a12,12,0,0,1-24,0V192a12,12,0,0,1,.49-3.41l16-56a12,12,0,0,1,4.1-6.13L152,100.5V120a12,12,0,0,0,3.52,8.49l32,32A12,12,0,1,0,204.48,143.51L176,115V96a12,12,0,0,0-4.77-9.58l-32-24a12,12,0,0,0-14.44.3L80.38,104.13A12,12,0,0,0,76,113.41V152a12,12,0,0,0,24,0V118.33l16-12.88ZM96,200.33l-19.51,16.27a12,12,0,0,1-15.46-18.37L80,184.58V152a12,12,0,0,0-24,0v37.67L32,213.4A12,12,0,0,0,47.51,231.6L96,192.33Z"/></svg>
```

- [ ] **Step 7: Write `weight-icon.svg` (Scales Fill)**

Create `libs/shared/assets/weight-icon.svg`:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><path fill="#000" d="M239.07,194l-32.24-120.9A20,20,0,0,0,187.57,60H156a28,28,0,1,0-56,0H68.43a20,20,0,0,0-19.26,14.5c-.06.2-32.24,120.9-32.24,120.9A20,20,0,0,0,36.2,220H219.8a20,20,0,0,0,19.27-26ZM100,80a4,4,0,0,1,4-4h48a4,4,0,0,1,0,8H104A4,4,0,0,1,100,80Zm28,104a48,48,0,1,1,48-48A48.05,48.05,0,0,1,128,184Zm0-72a24,24,0,1,0,24,24A24,24,0,0,0,128,112Z"/></svg>
```

- [ ] **Step 8: Commit the SVG files**

```bash
cd care-giver-site
git add libs/shared/assets/appointment-icon.svg libs/shared/assets/urination-icon.svg libs/shared/assets/medication-icon.svg libs/shared/assets/bowel-movement-icon.svg libs/shared/assets/shower-icon.svg libs/shared/assets/walk-icon.svg libs/shared/assets/weight-icon.svg
git commit -m "feat: add Phosphor filled SVG icons for all event types"
```

---

## Task 2: Remove old assets

- [ ] **Step 1: Delete old PNG files**

```bash
cd care-giver-site
rm libs/shared/assets/urination-icon.png
rm libs/shared/assets/medication-icon.png
rm libs/shared/assets/bowel-movement-icon.png
rm libs/shared/assets/shower-icon.png
rm libs/shared/assets/walk-icon.png
rm libs/shared/assets/weight-icon.png
```

- [ ] **Step 2: Delete old auto-generated SVGs**

```bash
rm libs/shared/assets/bowel-movement-icon.svg
rm libs/shared/assets/medication-icon.svg
rm libs/shared/assets/shower-icon.svg
rm libs/shared/assets/urination-icon.svg
rm libs/shared/assets/weight-icon.svg
```

Note: `appointment-icon.svg` was overwritten in Task 1 (not deleted). `walk-icon.svg` is newly created (no old version to delete).

- [ ] **Step 3: Commit deletions**

```bash
git add -u libs/shared/assets/
git commit -m "chore: remove old PNG and auto-generated SVG icon files"
```

---

## Task 3: Update JSON configs (care-giver-golang-common)

Update the `"icon"` field in 6 files. `doctor_appointment.json` already uses `.svg` — do not touch it.

- [ ] **Step 1: Update `urination.json`**

In `pkg/event/types/urination.json`, change:
```json
"icon": "assets/urination-icon.png",
```
to:
```json
"icon": "assets/urination-icon.svg",
```

- [ ] **Step 2: Update `medication.json`**

In `pkg/event/types/medication.json`, change:
```json
"icon": "assets/medication-icon.png",
```
to:
```json
"icon": "assets/medication-icon.svg",
```

- [ ] **Step 3: Update `bowel_movement.json`**

In `pkg/event/types/bowel_movement.json`, change:
```json
"icon": "assets/bowel-movement-icon.png",
```
to:
```json
"icon": "assets/bowel-movement-icon.svg",
```

- [ ] **Step 4: Update `shower.json`**

In `pkg/event/types/shower.json`, change:
```json
"icon": "assets/shower-icon.png",
```
to:
```json
"icon": "assets/shower-icon.svg",
```

- [ ] **Step 5: Update `walk.json`**

In `pkg/event/types/walk.json`, change:
```json
"icon": "assets/walk-icon.png",
```
to:
```json
"icon": "assets/walk-icon.svg",
```

- [ ] **Step 6: Update `weight.json`**

In `pkg/event/types/weight.json`, change:
```json
"icon": "assets/weight-icon.png",
```
to:
```json
"icon": "assets/weight-icon.svg",
```

- [ ] **Step 7: Run Go tests to verify configs parse correctly**

```bash
cd care-giver-golang-common
make test
```

Expected: tests fail for `Shower` and `Weight` with icon path mismatch — that is correct, the test assertions need updating in Task 4.

All other tests should pass.

- [ ] **Step 8: Commit config changes**

```bash
git add pkg/event/types/urination.json pkg/event/types/medication.json pkg/event/types/bowel_movement.json pkg/event/types/shower.json pkg/event/types/walk.json pkg/event/types/weight.json
git commit -m "feat: update event icon paths from .png to .svg"
```

---

## Task 4: Update Go tests

The test file at `pkg/event/event_test.go` has two assertions that check the `Icon` field: Shower (line ~139) and Weight (line ~147). Both currently assert `.png` paths.

- [ ] **Step 1: Update Shower icon assertion**

In `pkg/event/event_test.go`, in the `TestGetAllConfigs` `"Happy Path"` test, find the Shower config entry and change:
```go
Icon: "assets/shower-icon.png",
```
to:
```go
Icon: "assets/shower-icon.svg",
```

- [ ] **Step 2: Update Weight icon assertion**

In the same test, find the Weight config entry and change:
```go
Icon: "assets/weight-icon.png",
```
to:
```go
Icon: "assets/weight-icon.svg",
```

- [ ] **Step 3: Run tests to verify all pass**

```bash
cd care-giver-golang-common
make test
```

Expected output — all packages green:
```
ok  github.com/care-giver-app/care-giver-golang-common/pkg/event    0.4s
ok  github.com/care-giver-app/care-giver-golang-common/pkg/...
```

- [ ] **Step 4: Commit test update**

```bash
git add pkg/event/event_test.go
git commit -m "test: update icon path assertions from .png to .svg"
```

---

## Task 5: Fix status-monitor CSS filter

Icons in the status-monitor sit on colored circular badge backgrounds (`color.primary`). Without a filter, the black SVG icon is invisible against dark badge colors.

- [ ] **Step 1: Add filter to `.icon-badge-img`**

In `care-giver-site/libs/care/src/lib/care/status-monitor/status-monitor.component.css`, find:

```css
.icon-badge-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
}
```

Change to:

```css
.icon-badge-img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
```

- [ ] **Step 2: Verify in browser**

Start the dev server (`nx serve care-giver-site`) and navigate to the dashboard. The status-monitor rows should show white icons on their colored badge circles.

- [ ] **Step 3: Commit**

```bash
cd care-giver-site
git add libs/care/src/lib/care/status-monitor/status-monitor.component.css
git commit -m "fix: invert status-monitor icon badge to white on colored background"
```

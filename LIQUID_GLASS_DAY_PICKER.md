# iOS Liquid Glass Day Selector

Quick reference for how the **Day 1 / Day 2** segmented control is built on iOS with liquid glass.

## Where it lives

| Piece | Path |
|-------|------|
| iOS UI | `src/components/DayPicker.ios.tsx` |
| Android / fallback | `src/components/DayPicker.tsx` (Jetpack Compose picker, no glass) |
| Screen that uses it | `src/app/(tabs)/(calendar)/index.tsx` |
| Day enum | `src/consts.ts` → `ConferenceDay.One` / `ConferenceDay.Two` |

React Native picks the file by platform: importing `@/components/DayPicker` resolves to `DayPicker.ios.tsx` on iOS and `DayPicker.tsx` elsewhere.

## Stack (inside → out)

```
Picker (segmented, SwiftUI via @expo/ui)
  └── Host (@expo/ui/swift-ui — bridges SwiftUI into RN)
        └── GlassView (expo-glass-effect — frosted “liquid glass” capsule)
              └── View (padding / layout wrapper)
```

### 1. `GlassView` — the glass look

From **`expo-glass-effect`**. Wraps the control in a native frosted capsule.

- `borderRadius: theme.borderRadius80` — pill shape
- Fixed `height: 32` and horizontal margins so the bar size stays stable while scrolling

### 2. `Host` — SwiftUI bridge

From **`@expo/ui/swift-ui`**. Renders SwiftUI children inside React Native.

- `matchContents` — host sizes to the picker, not a fixed RN box
- `height: 31` on the host — stops layout “jump” when the segment changes

### 3. `Picker` — the actual Day 1 / Day 2 control

Also from **`@expo/ui/swift-ui`**.

```tsx
<Picker
  options={["Day 1", "Day 2"]}
  selectedIndex={selectedDay === ConferenceDay.One ? 0 : 1}
  onOptionSelected={({ nativeEvent: { index } }) => {
    onSelectDay(index === 0 ? ConferenceDay.One : ConferenceDay.Two);
  }}
  variant="segmented"
/>
```

- `variant="segmented"` — iOS-style two-segment control (not a wheel dropdown)
- Index `0` → Day 1, `1` → Day 2; parent maps that to `ConferenceDay`

No custom colors on iOS: the segmented control uses system styling inside the glass shell (unlike Android, which sets `elementColors` on the Compose picker).

## Props contract

```ts
interface DayPickerProps {
  selectedDay: ConferenceDay;
  onSelectDay: (day: ConferenceDay) => void;
}
```

Parent owns state; `DayPicker` is presentational.

## How the Schedule screen wires it

In `src/app/(tabs)/(calendar)/index.tsx`:

1. **State** — `useState(getInitialDay())` picks Day 1 or 2 from the current date (`src/utils/formatDate.ts`).
2. **Data** — `data = selectedDay === ConferenceDay.One ? dayOne : dayTwo` from the Zustand store.
3. **Handler** — `handleSelectDay` updates state and scrolls the list back up if the user had scrolled down.
4. **Placement** — `DayPicker` is `ListHeaderComponent` with `stickyHeaderIndices={[0]}` so it sticks under the nav bar while the schedule scrolls.

### Liquid glass + sticky header

The screen checks **`isLiquidGlassAvailable()`** from `expo-glass-effect`:

- Sticky header `backgroundColor` is **`transparent`** when glass is available (so content shows through the frosted picker and nav chrome).
- Otherwise it uses the normal themed background.
- `HEADER_SCROLL_OFFSET` is `110` with glass vs `90` without — extra space for the taller glass header when parallax-scrolling.

Calendar stack layout (`src/app/(tabs)/(calendar)/_layout.tsx`) also sets the nav **`headerStyle.backgroundColor`** to transparent when liquid glass is available, so the glass picker and large title sit on the same blurred stack.

## Dependencies

| Package | Role |
|---------|------|
| `expo-glass-effect` | `GlassView`, `isLiquidGlassAvailable()` |
| `@expo/ui` (swift-ui) | `Host`, `Picker` (native segmented control) |

Requires a recent iOS build with liquid glass support; on unsupported devices the app still runs but uses non-glass fallbacks elsewhere (e.g. solid header backgrounds).

## Related pattern

`src/components/TimeZoneSwitch.ios.tsx` uses the same **`Host` + `Picker`** stack, but glass there is applied via SwiftUI **`buttonStyle("glass")`** on a `ContextMenu` when `isLiquidGlassAvailable()` — not a `GlassView` wrapper. The day picker is the simpler “glass capsule around a segmented control” pattern.

## File to edit

To change labels, spacing, or glass shape: **`src/components/DayPicker.ios.tsx`**.

To change when which day is selected or which schedule list loads: **`src/app/(tabs)/(calendar)/index.tsx`** and `ConferenceDay` in **`src/consts.ts`**.

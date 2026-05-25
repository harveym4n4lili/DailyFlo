# Onboarding — UI architecture

**Purpose:** Record **header chrome** (transparent native bar, **`Stack.Toolbar` not used**, dots + Skip) plus **introductory body layout**: **horizontal `pagingEnabled` `ScrollView`**, each page **full-screen background** with **top-padded body** clearing the transparent header.

**Audience:** Engineers implementing onboarding in Expo Router + React Native (`frontend/dailyflo`).

**Related doc:** Phases, routes, and persistence are described in [`plan/onboarding-plan.md`](./plan/onboarding-plan.md). Align **intro carousel** mechanics with §6 (“introductory pager”) there; this doc narrows choices (ScrollView paging + layout).

**Status:** Living doc — update when implementation ships or product changes Skip / indicator rules.

---

## 1. Transparent native header

Onboarding steps use the **same general idea** as main tab stacks (e.g. Browse, Planner, Today): a **native stack header** that is **transparent** over the screen body.

**Single full-screen background (required):** The **header chrome must not introduce its own opaque or material fill** beneath the indicators and Skip. Transparency here means **one continuous background you control from the screen** — solid color on the root **`contentStyle`**, `LinearGradient`, image, blur on a **single** wrapping `View`, etc. Avoid opaque **`headerStyle` background colors**, blur materials, or “lifted” bar fills unless product explicitly overrides this doc.

- Prefer **`headerShown: true`** on iOS for steps that show this chrome (unless a specific route intentionally hides the bar).
- Use **`headerTransparent: true`**, **`headerShadowVisible: false`**, and no heavy default title styling where the design is custom.
- If the platform still paints a header surface, mirror the pattern used elsewhere: e.g. **`headerBlurEffect: 'none'`**, **`headerStyle: { backgroundColor: 'transparent' }`**, and/or **`headerBackground`** returning **`null`** or a transparent `View` (`StyleSheet.absoluteFill` + **`backgroundColor: 'transparent'`**) so nothing blocks the route’s background.
- Keep **`contentStyle`** (and any screen-root `View`) aligned so transitions do not flash a different tint — the funnel background is **defined by the route**, not by the navbar.

Exact `Stack.Screen` options should live in `(onboarding)/_layout.tsx` or per-route overrides, consistent with other app stacks.

---

## 2. No Stack.Toolbars

DailyFlo elsewhere uses **`Stack.Toolbar`** / **`Stack.Toolbar.Button`** (e.g. Browse home modal actions, Browse settings close) for **native bar items** tied to Expo Router patterns.

**Onboarding intentionally does not use `Stack.Toolbar` for header chrome.**

Rationale:

- Indicator + Skip are **layout-heavy** (width, alignment, paging state) and read more naturally as **custom header content** than a chain of discrete SF Symbol bar buttons.
- We avoid mixing two idioms (`Stack.Toolbar` + another custom strip) in the same header row.

Implement header UI through the **navigator’s header customization APIs** instead (see below).

---

## 3. Header content: page indicator and Skip

The **transparent native header region** hosts:

| Element | Role |
| --- | --- |
| **Page indicator** | Shows position in the flow — implemented as **`OnboardingDotIndicator`** (dots). Pass **`totalSteps`** + **`activeIndex`** (0-based); render inside **`headerTitle`** (see §3.1). |
| **Skip** | Optional per step; invokes product-defined behavior (jump to setup, finish intro, etc.) — behavior stays aligned with [`plan/onboarding-plan.md`](./plan/onboarding-plan.md) open decisions. |

**Placement (shipped):**

- **Indicator:** **Title area** — render **`OnboardingDotIndicator`** via **`headerTitle`** (`function` or element). `headerRight` is explicitly set to `() => null`. See §3.1 for import path and props.
- **Skip:** **In-screen `Pressable`**, absolutely positioned (`position: 'absolute'`, `right: 16`, `top: insets.top + 10`, `zIndex: 3`) — **not** in `headerRight`. Rationale: iOS native-stack `headerRight` wraps controls in the toolbar / liquid-glass chrome, overriding text color and hit-area; keeping Skip in screen content preserves plain-text styling and eliminates that platform interference. `headerRight: () => null` is set alongside `headerLeft: () => null` to suppress any system-injected bar item.

Adjust **`headerLeft`** only if the flow needs an explicit **Back** control separate from the system gesture; many setup steps may still use **`router.back()`** via gesture or a custom leading control.

**Android:** Skip is already in-screen (absolute position) so it renders the same way on both platforms without a `headerShown: false` workaround. If a future step sets `headerShown: false`, replicate the **indicator** inside the screen using the same `useSafeAreaInsets` + `Paddings` pattern.

**Intro carousel on one route:** When the body is a **horizontal pager** (§4), **`activeIndex`** for dots comes from **scroll position** (e.g. **`onMomentumScrollEnd`**). Update **`headerTitle` / `headerRight`** via **`navigation.setOptions`** or parent state so dots stay in sync with the visible page.

### 3.1 Dot indicator component (`OnboardingDotIndicator`)

- **Module:** `frontend/dailyflo/components/features/onboarding/introductory/ui/OnboardingDotIndicator.tsx`  
- **Import:** `import { OnboardingDotIndicator } from '@/components/features/onboarding';`  
- **Props:** `totalSteps: number`, `activeIndex: number` — `activeIndex` is clamped internally so it stays in range.  
- **Visual:** Row of circles; active step is larger + **`text.primary`**; inactive dots use muted **`text.tertiary`** with opacity. Spacing is fixed in the component for now; tweak there if design tokens need to change.  
- **Accessibility:** Container uses **`accessibilityRole="progressbar"`** and **`accessibilityValue`** (`Step n of m`); individual dots are hidden from accessibility so the row is announced once.  
- **Usage:** Mount as **`headerTitle: () => <OnboardingDotIndicator totalSteps={…} activeIndex={…} />`** (or equivalent `options` object) so it sits in the transparent native title area next to **`headerRight`** Skip. Same component can be reused in a custom Android top row if **`headerShown` is false**.

---

## 4. Body layout — horizontal paged carousel (introductory)

**Chosen pattern:** one host screen renders a **`ScrollView`** with **`horizontal`**, **`pagingEnabled`** (and typically **`showsHorizontalScrollIndicator={false}`**). Each horizontal “page” is one intro beat. Tracks [`plan/onboarding-plan.md`](./plan/onboarding-plan.md) introductory §6 (pager, sync index after scroll settles).

### 4.1 Scroll host

- **Width math:** Children must match viewport width (`useWindowDimensions().width`) so snapping aligns edges; **`ScrollView` `style={{ flex: 1 }}`**, **`contentContainerStyle`** only as wide as **`pageCount × width`** horizontally.
- **Index sync:** On **`onMomentumScrollEnd`** (and optionally **`onScroll`** for finer updates), derive **`pageIndex = Math.round(contentOffset.x / width)`**. Use that **`pageIndex`** for **`OnboardingDotIndicator`** (via **`setOptions`** or shared state for header).
- **Vertical scroll inside a page (optional):** If a slide needs scrolling copy, nest a **vertical** `ScrollView` or `KeyboardAwareScrollView` **inside** the page **`View`** (not the horizontal parent), keeping the horizontal pager as the swipe axis between slides.

### 4.2 Each page (“slide”) structure

Every child of the horizontal `ScrollView`:

1. **Outer wrapper (`View`) — full viewport for that slide**  
   - **`width: windowWidth`**, **`flexGrow: 1`** / **`minHeight: '100%'`** (or **`flex: 1`** relative to root flex host) so the slide occupies the visible area under the opaque stack scene.  
   - **Owns the slide background** (`backgroundColor`, full-bleed **`LinearGradient`**, **`ImageBackground`**, etc.) so each page can diverge visually if product asks; using the **same token** on every slide is fine for a unified canvas.

2. **Inner content column — not under the dots by default**  
   - **`flex: 1`** (when using fill layout) wrapping title, body, primary CTA.  
   - **Top spacing:** **`paddingTop: useHeaderHeight() + <design gap>`** from **`@react-navigation/elements`** so text and buttons start **below** the transparent native header (same idea as **`browse/settings.tsx`**).  
   - **Horizontal insets:** **`Paddings.screen`** (or design equivalent).  
   - **Bottom:** **`paddingBottom: insets.bottom + <cta safe gap>`** via **`useSafeAreaInsets`** so CTAs clear the home indicator.

The horizontal pager itself sits **below** the header in layout terms; **`useHeaderHeight()`** still expresses the stacked header footprint so padded content clears **Skip**, dots, and status overlap.

### 4.3 Stacked setup spine (outside this carousel)

[**`plan/onboarding-plan.md`**](./plan/onboarding-plan.md) **setup** phase uses **one Expo Router screen per step** (`router.push`). Those screens reuse the **same top-padding rule** (§4.2 inner column + **`useHeaderHeight()`**) but **omit** horizontal **`pagingEnabled`** — vertical layout only unless a particular step overrides.

---

## 5. Implementation notes (non-normative)

- Use React Navigation / native-stack **header props** (`headerTitle`, `headerRight`, `headerLeft`, `headerTitleStyle` as needed) from **`Stack.Screen` `options`**, or **`useLayoutEffect` + `navigation.setOptions`** when **pager index** or Skip visibility changes on the intro host route.
- Do **not** import **`Stack.Toolbar`** for onboarding header pieces unless a future product decision explicitly adopts that pattern here.
- Reuse **`useThemeColors`**, **`useTypography`**, **`Paddings`** for spacing and type so onboarding matches Browse / Planner polish.
- Prefer **`OnboardingDotIndicator`** for dots instead of one-off markup so header and optional Android mirror stay consistent.
- **`react-native-pager-view`** remains an optional upgrade per [`plan/onboarding-plan.md`](./plan/onboarding-plan.md) §6; **this doc standardizes on `ScrollView` + `pagingEnabled`** until native pager is consciously adopted.

---

## 6. Changelog

| Date | Change |
| --- | --- |
| 2026-04-30 | Initial doc — transparent native header, full-screen controlled background, no `Stack.Toolbar`; indicator + Skip in native header slots. **`OnboardingDotIndicator`** added under `components/features/onboarding/` and documented in §3.1. |
| 2026-04-30 | §4: horizontal **`pagingEnabled`** `ScrollView`; per-slide full-bleed background + inner content with **`useHeaderHeight()`** top padding; header dots sync from scroll index; setup spine still per-route with same padding rule. |
| 2026-04-30 | §3: corrected Skip placement — **in-screen absolute `Pressable`**, not `headerRight`. `headerRight: () => null` + `headerLeft: () => null` set explicitly. Android note updated accordingly. |

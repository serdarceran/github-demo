# Mobile UI Enhancement Plan — "Galactic Scoreboard"

## Context

The React Native mobile app (`apps/mobile`) is a functional skeleton: two screens (login, goals list), zero custom components, hardcoded gray/white colors, no animations, no typography system. The app is a high-stakes monthly goal tracker where missing a day doubles the next day's required amount — the **penalty system creates dramatic tension** that the current UI completely ignores. This plan overhauls the visual experience to make the stakes viscerally clear through design, adds three missing screens, and builds a reusable component library.

**Aesthetic direction: "Galactic Scoreboard"** — deep space dark with electric amber-gold, condensed impact typography (Bebas Neue), and crimson danger signals. Like a Bloomberg terminal grew a soul and started tracking your fitness goals.

---

## Phase 1 — Package Installation & Build Config

### Packages to install (from `apps/mobile/`)

```bash
# Expo SDK-compatible installs
expo install expo-linear-gradient expo-haptics expo-font @expo-google-fonts/bebas-neue @expo-google-fonts/nunito react-native-svg

# npm install
pnpm add react-native-reanimated
```

### `babel.config.js` — add Reanimated plugin

**File:** `apps/mobile/babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["react-native-reanimated/plugin"],  // ADD THIS — must be last
  };
};
```

> ⚠️ After this change, Metro bundler cache must be cleared: `expo start --clear`

---

## Phase 2 — Design System

**File to create:** `apps/mobile/constants/theme.ts`

Single source of truth — every component imports from here, nothing hardcoded.

### Colors
```typescript
export const Colors = {
  bg: {
    base: '#060B18',        // screen background
    card: '#0D1526',        // card surface
    cardHover: '#111E33',   // pressed state
  },
  amber: {
    400: '#FBBF24',
    500: '#F59E0B',
    glow: '#F59E0B40',      // 25% opacity for shadow glow
  },
  danger: {
    400: '#F87171',
    500: '#EF4444',
    600: '#DC2626',
    glow: '#EF444440',
  },
  success: {
    400: '#34D399',
    500: '#10B981',
    glow: '#10B98140',
  },
  neutral: {
    700: '#374151',
    500: '#6B7280',
    400: '#9CA3AF',
    white: '#FFFFFF',
  },
  arcTrack: '#1E2D47',   // unfilled portion of circular arcs
  status: {
    active: '#F59E0B',
    completed: '#10B981',
    failed: '#EF4444',
  },
} as const;
```

### Typography
- `display.*` — `BebasNeue_400Regular` at sizes 72/48/32/24 (metrics, headings)
- `body.*` — `Nunito_400Regular`, `Nunito_600SemiBold`, `Nunito_700Bold` at 18/16/14/12
- `body.label` — Nunito 700, 11px, `letterSpacing: 1.5`, `textTransform: 'uppercase'`

### Spacing
`xs:4, sm:8, md:16, lg:24, xl:32, xxl:48, screen: { horizontal: 20, vertical: 24 }`

### Shadows/Glows
```typescript
export const Shadows = {
  amberGlow: { shadowColor: Colors.amber[500], shadowOffset:{width:0,height:0}, shadowOpacity:0.5, shadowRadius:16, elevation:12 },
  dangerGlow: { shadowColor: Colors.danger[500], ...same... },
  successGlow: { shadowColor: Colors.success[500], shadowOpacity:0.4, shadowRadius:12, elevation:10 },
  subtle: { shadowColor: '#000', shadowOffset:{width:0,height:4}, shadowOpacity:0.3, shadowRadius:8, elevation:6 },
}
```

### Border Radius
`sm:8, md:12, lg:16, xl:24, full:9999`

---

## Phase 3 — Shared UI Components

All in `apps/mobile/components/ui/`. Barrel export in `components/ui/index.ts`.

### Build order (each depends on previous):

| # | File | Visual Description | Key APIs |
|---|------|--------------------|----------|
| 1 | `ScreenContainer.tsx` | `SafeAreaView` + `backgroundColor: bg.base` + `StatusBar style="light"` | `SafeAreaView` from `react-native-safe-area-context`, `expo-status-bar` |
| 2 | `GlowText.tsx` | Bebas Neue number with colored shadow glow | `Text` + shadow props from `Shadows` |
| 3 | `StatusBadge.tsx` | Pill: status color bg at 15%, full-color border + Ionicons icon + uppercase label | `@expo/vector-icons` Ionicons |
| 4 | `MetricRow.tsx` | Label (label style, neutral 500) + value (display.md + color) + unit (body.md, aligned baseline) | `flexDirection:'row'`, `alignItems:'flex-end'` |
| 5 | `PrimaryButton.tsx` | 56px tall, variants: amber/danger/success/ghost; press scale via Reanimated `withSpring(0.96)` | `Pressable`, `useSharedValue`, `useAnimatedStyle`, `withSpring` |
| 6 | `InputField.tsx` | 56px, bg.card; amber border on focus via `useState(focused)` + conditional border; error text below | `TextInput`, `onFocus/onBlur`, Ionicons `alert-circle` |
| 7 | `DifficultyPicker.tsx` | 3 horizontal cards; selected = amber glow border + `LinearGradient` bg; press triggers haptic | `expo-linear-gradient`, `expo-haptics`, `useSharedValue` |
| 8 | `CircularProgressArc.tsx` | SVG arc animates 0→percent on mount; `Path` math: radius=(size-strokeWidth)/2, rotate -90° | `react-native-svg` `Svg/Circle`, `Animated.createAnimatedComponent`, `useSharedValue` + `withTiming` driving `strokeDashoffset` |
| 9 | `DangerBanner.tsx` | Full-width crimson strip; `LinearGradient` sweep overlay; slides in from top | `SlideInUp` from `react-native-reanimated`, `expo-linear-gradient` |
| 10 | `GoalCard.tsx` | Card: name + streak (top), CircularProgressArc (center), cumulativeTotal/unit (amber), StatusBadge + multiplier warning (bottom); pulsing "2× TOMORROW" when multiplier=2; staggered entrance | Reanimated `FadeInDown.delay(index*80).springify()`, `Animated.loop` for pulse, `expo-haptics` on press |

### Helper hook
**File:** `apps/mobile/hooks/useCountUp.ts`  
Drives `useRef(new Animated.Value(0))` + `Animated.timing` to count a number from 0 to target over duration, exposes current value via `useState` listener.

---

## Phase 4 — Modified Files

### `app/_layout.tsx`
Add `useFonts` from `expo-font` + `@expo-google-fonts/bebas-neue` + `@expo-google-fonts/nunito`. Return `null` until `fontsLoaded === true`. This unblocks all typography globally.

```typescript
const [fontsLoaded] = useFonts({
  BebasNeue_400Regular,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
});
if (!fontsLoaded) return null;
```

### `app/(app)/_layout.tsx`
Add `headerShown: false` to Stack, and register the log modal screen:
```typescript
<Stack screenOptions={{ headerShown: false }}>
  <Stack.Screen name="goals/log" options={{ presentation: 'modal' }} />
</Stack>
```

---

## Phase 5 — Screen Redesigns

### Login Screen (`app/(auth)/login.tsx`) — REDESIGN

**Emotional intent:** "You are entering something serious."

Layout top→bottom:
1. Full `bg.base` background
2. Top 40%: `LinearGradient` `['#0D1526', '#060B18']` vertical
3. Logo: "GALACTIC" in `display.lg` amber + "SCOREBOARD" in `display.md` white (stacked, centered)
4. Subtitle: "Your goals. Your debt. Your streak." in `body.md` neutral 500
5. 1px amber-at-20% horizontal rule
6. Two `InputField` components (email, password)
7. `PrimaryButton` variant='amber' label "ENTER THE SCOREBOARD" fullWidth
8. `DangerBanner` slides in from top on error

**Animations:** Logo group `FadeIn.delay(200)`, form `FadeInUp.delay(400)` from Reanimated entering presets.  
**Logic unchanged** — only JSX and styles replaced.

---

### Dashboard (`app/(app)/index.tsx`) — REDESIGN

**Emotional intent:** "Mission control."

Layout:
1. `ScreenContainer`
2. Header: "MY GOALS" in `display.sm` white (left) + amber `plus-circle` Ionicon button (right)
3. Date strip: "APRIL 2026" in `body.label` neutral 500
4. `DangerBanner` above FlatList if any active goal has `nextDayMultiplier === 2` and not logged today
5. `FlatList` of `GoalCard` with `contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}`
6. Empty state: amber 64px `flag-outline` icon + "No goals yet" + "Launch your first mission" + `PrimaryButton` "CREATE GOAL"
7. FAB: 60×60 amber circle, `Ionicons add`, `Shadows.amberGlow`, `position:'absolute', bottom:32, right:20`

**Navigation:** `GoalCard.onPress` → `router.push({ pathname:'/(app)/goals/[id]', params:{id} })`  
**Data:** existing `useQuery` pattern preserved, only rendering changed.

---

## Phase 6 — New Screens

### Goal Detail (`app/(app)/goals/[id].tsx`) — NEW

**Emotional intent:** "Your personal war room."

**Data:** `useLocalSearchParams<{id:string}>()` + `useQuery` calling `createGoalsApi(client).get(id)`

Layout:
1. **Hero (fixed 280dp):** `LinearGradient` vertical backdrop; centered `CircularProgressArc` size=180, strokeWidth=12; inside arc: `percentage%` in `display.xl` amber; goal name in `display.sm` white below; `StatusBadge` centered; back chevron absolute top-left (44×44 tap target)
2. **Scrollable body:**
   - "STATS" `body.label` section header
   - 2-column `MetricRow` grid: `cumulativeTotal/unit` (amber) | `totalDebt/unit` (danger); `streak/"days"` (emerald) | `daysRemaining/"left"` (neutral)
   - `nextDayMultiplier` card: when `>1` → full-width danger card "2× MULTIPLIER ACTIVE — LOG TODAY TO RESET" (pulsing); when `===1` → emerald card "ON TRACK"
   - `netBalance` `MetricRow`: amber when positive, danger when negative
   - "ACTIVITY" header
   - 30-day heatmap: `FlatList numColumns={7}` of 32×32 circles colored by log status (emerald=met, crimson=missed, neutral=future)
3. **Sticky bottom bar:**
   - `status==='active'` + not logged today → `PrimaryButton` amber "LOG TODAY'S PROGRESS" → `router.push('/(app)/goals/log')`
   - Already logged → ghost disabled "LOGGED TODAY" with checkmark
   - failed/completed → informational pill

**Animations:** `CircularProgressArc` draws in on mount; `MetricRow` values count up via `useCountUp` hook.

---

### Create Goal (`app/(app)/goals/create.tsx`) — NEW

**Emotional intent:** "Signing a contract."

Layout:
1. Header: back chevron + "NEW MISSION" in `display.sm`
2. `InputField` — Goal Name
3. `InputField` — Unit (e.g. "km")
4. `InputField` — Daily Target (`keyboardType='decimal-pad'`)
5. `InputField` — Badge Name
6. `DifficultyPicker`
7. **Live preview GoalCard** — read-only mini card updating as user types (makes commitment tangible before submit)
8. `PrimaryButton` amber "LAUNCH MISSION"

**Mutation:**
```typescript
useMutation({
  mutationFn: (body) => createGoalsApi(client).create(body),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['goals'] });
    Haptics.notificationAsync(NotificationFeedbackType.Success);
    router.replace('/(app)');
  },
})
```

**Validation:** all fields required, `dailyTarget > 0`; show `InputField error` prop on submit attempt.

---

### Log Progress Modal (`app/(app)/goals/log.tsx`) — NEW

**Emotional intent:** "Accountability moment."

Presented as bottom sheet modal. Layout:
1. Goal name in `display.sm`
2. "TODAY YOU NEED" label + required amount in `display.xl` amber with glow
3. If `nextDayMultiplier===2`: crimson badge "PENALTY ACTIVE — 2× required"
4. `InputField` "HOW MUCH DID YOU DO?" `keyboardType='decimal-pad'`
5. Live feedback as user types: entered `>=` required → emerald checkmark + "DEBT CLEARED"; else crimson warning + remaining shortfall shown
6. `PrimaryButton` "SUBMIT LOG"

**Mutation:** calls `createGoalsApi(client).logProgress(goalId, body)`; on success → invalidate queries + `Haptics.notificationAsync` (Success if met, Warning if short) + `router.back()`

---

## Final File Structure

```
apps/mobile/
├── app/
│   ├── _layout.tsx                    # MODIFIED: useFonts gate
│   ├── (auth)/
│   │   └── login.tsx                  # REDESIGNED
│   └── (app)/
│       ├── _layout.tsx                # MODIFIED: Stack modal config
│       ├── index.tsx                  # REDESIGNED: dashboard
│       └── goals/
│           ├── [id].tsx               # NEW: goal detail
│           ├── create.tsx             # NEW: create goal form
│           └── log.tsx                # NEW: log progress modal
├── components/
│   └── ui/
│       ├── ScreenContainer.tsx
│       ├── GlowText.tsx
│       ├── StatusBadge.tsx
│       ├── MetricRow.tsx
│       ├── PrimaryButton.tsx
│       ├── InputField.tsx
│       ├── DifficultyPicker.tsx
│       ├── CircularProgressArc.tsx
│       ├── DangerBanner.tsx
│       ├── GoalCard.tsx
│       └── index.ts                   # barrel export
├── constants/
│   └── theme.ts                       # NEW: design tokens
├── hooks/
│   └── useCountUp.ts                  # NEW: animated count-up hook
└── babel.config.js                    # MODIFIED: reanimated plugin
```

---

## Implementation Order

1. Install packages + update `babel.config.js`
2. Create `constants/theme.ts`
3. Modify `app/_layout.tsx` — font loading gate
4. Build components 1–10 in order from table above
5. Redesign login screen
6. Redesign dashboard
7. Build `[id].tsx` goal detail screen
8. Build `create.tsx` create goal screen
9. Modify `(app)/_layout.tsx` + build `log.tsx` modal
10. Polish pass: spacing audit, loading skeletons, `app.json` backgroundColor `#060B18`

---

## Verification

After each phase:
- `pnpm --filter @goal-tracker/mobile start` — verify no Metro errors
- On first launch after Phase 1: confirm dark background + Bebas Neue/Nunito fonts loaded
- Login flow: enter credentials → home screen with redesigned cards
- Goal detail: tap a card → hero arc animates in, stats count up
- FAB → create form → submit → card appears in list
- Long-press or tap LOG → modal slides up → submit → stats refresh

---
name: mobile-expo-safety
description: "Expo-specific rules: Metro config, babel, dependencies, build checks, common pitfalls. Load BEFORE adding dependency or editing config. MANDATORY on build errors."
---

# Expo Safety Rules

## ⚠️ MANDATORY Compliance

### 1. Check dependency before adding

**NEVER add a package without checking:**
- Compatible with current Expo SDK version?
- Need `npx expo install` instead of `bun/npm install`?
- Has native code? (if yes → rebuild app)

```bash
# Correct: install via expo for auto-resolved version
npx expo install package-name

# Wrong: direct install may cause version conflict
bun add package-name
```

### 2. Check AFTER every code change

**MANDATORY run after changing code:**
```bash
bun run typecheck   # TypeScript errors
bun run lint        # ESLint errors
```

**If errors:**
- FIX IMMEDIATELY before continuing
- DO NOT commit with errors
- DO NOT ignore warnings

### 3. Metro config — be careful

File: `metro.config.js`

**DO NOT edit unless:**
- Adding resolver for new file type
- Fixing "Unable to resolve module"
- Explicitly requested

**If must edit:**
- Backup file first
- Test build immediately after
- Comment reason for change

### 4. Babel config — extremely careful

File: `babel.config.js`

**DO NOT add new plugin unless:**
- Checked Expo SDK compatibility
- Necessary for specific feature
- Has example from Expo docs

### 5. Asset handling

**Icons:** `assets/icons/*.png` — import via `require()`
**Fonts:** `assets/fonts/*.ttf` — load via `useFonts`
**Images:** `assets/` — place in correct directory

**Rules:**
- Do NOT use absolute paths for assets
- Do NOT import SVG directly (only PNG/JPG)
- Font names must match `useFonts` config

## Common Expo Pitfalls

### 1. "Unable to resolve module"

**Causes:**
- Package installed wrong (`bun add` instead of `npx expo install`)
- Stale Metro cache
- Wrong import path

**Fix:**
```bash
npx expo install --fix
rm -rf node_modules/.cache
npx expo start -c
```

### 2. "TypeError: Cannot read property 'X' of undefined"

**Causes:**
- Native module not linked
- Package incompatible with Expo Go
- Missing rebuild after adding native dependency

**Fix:**
```bash
npx expo run:android  # or ios
# If still broken:
npx expo prebuild --clean
```

### 3. Build fail after adding package

**Causes:**
- Version conflict with Expo SDK
- Native dependency not compatible
- Missing permission in `app.json`

**Fix:**
- Check `package.json` — version must match Expo SDK ~54
- Check `app.json` — required permissions
- `npx expo doctor` to check health

### 4. Hot reload not working

**Fix:**
```bash
# Clear cache
npx expo start -c

# Restart Metro
Ctrl+C → npx expo start

# If still not: kill process
# Windows: taskkill /F /IM node.exe
# Mac/Linux: killall node
```

### 5. TypeScript errors out of nowhere

**Fix:**
```bash
# Clear TS cache
rm -rf node_modules/.cache
# Restart TS server (in editor)
# Or:
bun run typecheck
```

## Build Checklist

### Before production build:

- [ ] `bun run typecheck` PASS
- [ ] `bun run lint` PASS
- [ ] No `console.log` in production code
- [ ] No `any` types
- [ ] Assets optimized (not too large)
- [ ] `app.json` config correct (permissions, splash, icon)
- [ ] Test on real device (not just simulator)

### After build:

- [ ] App launches on device
- [ ] Auth flow works (login → dashboard)
- [ ] Navigation works (tabs, push, back)
- [ ] API calls work (data loads)
- [ ] No crash on basic test

## Version Management

**Expo SDK ~54 compatible dependencies:**
- `expo-router` ~6
- `react-native` 0.81
- `@expo/vector-icons` ^15
- `expo-av` ^16
- `expo-secure-store` ~15

**DO NOT upgrade version unless:**
- Official Expo SDK upgrade
- Clear technical reason
- Tested on both Android and iOS

## Native Modules

**Warning:** Expo Go does not support all native modules

**If need native module:**
1. Check Expo docs — is there a built-in alternative?
2. If not → `npx expo prebuild` to create native project
3. Test on real build (`npx expo run:android/ios`)

**Native modules in use:**
- `expo-secure-store` — token storage
- `expo-haptics` — haptic feedback
- `expo-av` — audio playback/recording
- `expo-speech` — text-to-speech
- `expo-image-picker` — photo upload
- `expo-linear-gradient` — gradients

## Double Check Rules

**AFTER EVERY CODE SESSION:**

1. **Type check:** `bun run typecheck` — must PASS
2. **Lint:** `bun run lint` — must PASS  
3. **Navigation test:** Open app → test modified routes
4. **API test:** Test called endpoint (if any)
5. **UI test:** Check layout on simulator
6. **Logic test:** Verify flow works as planned

**DO NOT SKIP ANY STEP.**

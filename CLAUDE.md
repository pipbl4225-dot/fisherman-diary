# Fisherman Diary — Project Guide

## Stack
- React 19 + Vite
- React Router DOM v7 (hash router for PWA/offline)
- Zustand v5 (state management)
- Dexie v4 (IndexedDB ORM)
- Leaflet + React-Leaflet (maps)
- Chart.js + react-chartjs-2 (water level charts)
- vite-plugin-pwa (offline support)

## Project Structure

```
src/
  components/
    Map/          # Leaflet map, markers, layers
    BottomMapper/ # Depth sounding / bottom profile
    Diary/        # Fishing session log entries
    Tackle/       # Tackle/gear inventory
    WaterLevel/   # Water level charts and data
    Navigation/   # Bottom tab bar component
  store/          # Zustand stores (one per domain)
  db/             # Dexie DB schema and table helpers
  hooks/          # Custom React hooks
  utils/          # Pure helpers (formatters, geo math, etc.)
  App.jsx         # Router + layout shell
  main.jsx        # Entry point
  index.css       # Global styles + CSS custom properties (dark theme)
```

## Architecture Notes

### Routing
Hash-based routing (`HashRouter`) so the app works offline as a PWA without a server. Five top-level routes matching the five bottom-nav tabs.

### State
Each domain (diary, tackle, waterLevel, map) has its own Zustand store in `src/store/`. Stores hold UI state; persistent data lives in Dexie.

### Database
Single Dexie instance exported from `src/db/index.js`. Versioned schema — always increment the version number when changing tables, never mutate an existing version.

### Theming
Dark theme via CSS custom properties on `:root` in `index.css`. Components use `var(--color-*)` tokens. No inline colour values in component files.

## Five Tabs
| # | Label | Route | Component dir |
|---|-------|-------|---------------|
| 1 | Карта | `/` | `Map/` |
| 2 | Дневник | `/diary` | `Diary/` |
| 3 | Снасти | `/tackle` | `Tackle/` |
| 4 | Вода | `/water` | `WaterLevel/` |
| 5 | Промер дна | `/bottom` | `BottomMapper/` |

## Commands
```bash
npm run dev      # dev server
npm run build    # production build
npm run preview  # preview production build
```

---

# Behavioral Guidelines

Behavioral guidelines to reduce common LLM coding mistakes.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

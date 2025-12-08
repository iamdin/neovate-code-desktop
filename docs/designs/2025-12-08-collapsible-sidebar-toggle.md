# Collapsible Sidebar Toggle

**Date:** 2025-12-08

## Context

The RepoSidebar currently has a fixed width of 256px. The goal is to add a toggle button that collapses the sidebar to an icon-only mode, providing more screen space for the main content area while keeping essential actions accessible.

## Discussion

### Width When Collapsed
- **Options:** Narrow (48-56px), Medium (64-72px), or match footer icon spacing
- **Decision:** Narrow (48-56px) - minimal visual footprint with just enough space for icons

### Toggle Icon Style
- **Options:** Chevron arrows, Hamburger/lines, or sidebar-specific HugeIcons
- **Decision:** Use HugeIcons library (ArrowLeft01Icon when expanded, ArrowRight01Icon when collapsed)

### Icon Behavior When Collapsed
- **Options:** Perform action directly, expand first then act, or show tooltip with direct action
- **Decision:** Perform action directly - same behavior as expanded mode

### State Management Approach
- **Approach A:** Local state in RepoSidebar - simple but isolated
- **Approach B:** Zustand store state - persistent, accessible globally
- **Approach C:** Parent-controlled via App.tsx props - explicit but requires prop drilling
- **Decision:** Approach B (Zustand store) - consistent with existing patterns, supports persistence

## Approach

Add `sidebarCollapsed` boolean state to the Zustand store. RepoSidebar reads this state and conditionally renders either the full layout or icon-only layout. The toggle button appears at the top of the sidebar in both modes. When collapsed, footer icons (Add Repo, Settings) stack vertically. CSS transitions provide smooth animation.

## Architecture

### Store Changes (`src/renderer/store.tsx`)

```typescript
// State
sidebarCollapsed: boolean  // default: false

// Actions
toggleSidebar: () => void
```

Integrates with existing `persist` middleware for state persistence across sessions.

### RepoSidebar Layout

**Expanded (256px / w-64):**
```
┌──────────────────┐
│ [←] Repositories │  ← Toggle + title
├──────────────────┤
│ Accordion        │
│ - Repos          │
│ - Workspaces     │
│ - Sessions       │
├──────────────────┤
│ [+]         [⚙]  │  ← Footer horizontal
└──────────────────┘
```

**Collapsed (48px / w-12):**
```
┌────┐
│ [→]│  ← Toggle only
│    │
│    │  ← No accordion
│    │
│ [+]│  ← Add Repo
│ [⚙]│  ← Settings (stacked)
└────┘
```

### Component Changes (`src/renderer/components/RepoSidebar.tsx`)

- Import `ArrowLeft01Icon`, `ArrowRight01Icon` from HugeIcons
- Read `sidebarCollapsed`, `toggleSidebar` from store
- Conditional width class: `w-12` (collapsed) vs `w-64` (expanded)
- Add `transition-all duration-200` for smooth animation
- Header: Toggle button always visible, title hidden when collapsed
- Content: Accordion hidden when collapsed
- Footer: Vertical stack when collapsed, horizontal when expanded

### App.tsx Changes

No changes required. The flex layout (`flex-1` on main content) automatically adjusts when RepoSidebar width changes.

### Files Modified

1. `src/renderer/store.tsx` - Add state and action
2. `src/renderer/components/RepoSidebar.tsx` - Implement collapsible layout

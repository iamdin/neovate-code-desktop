# Three-State Plan Mode

**Date:** 2025-12-05

## Context

The current `PlanMode` type only supports two states (`'plan' | 'brainstorm'`), with no way to indicate "normal" input mode. The goal is to introduce a third state (`'normal'`) as the default, and visually highlight the ChatInput border when in plan or brainstorm mode.

## Discussion

### State Cycling
- **Question:** How should users cycle through the 3 states?
- **Decision:** Shift+Tab cycles through all 3 states: normal → plan → brainstorm → normal

### Border Colors
- **Question:** What border colors should indicate each mode?
- **Decision:** 
  - Plan mode: blue (`#3b82f6`)
  - Brainstorm mode: purple (`#8b5cf6`)
  - Normal mode: default subtle border

### Type Design
- **Question:** How to represent the 3 states in TypeScript?
- **Options explored:**
  1. Explicit `'normal'` — `PlanMode = 'normal' | 'plan' | 'brainstorm'`
  2. Nullable type — `PlanMode = 'plan' | 'brainstorm' | null`
- **Decision:** Explicit `'normal'` for clarity

## Approach

Add `'normal'` as an explicit state in `PlanMode`, default to it, and update the toggle function to cycle through all three states. The ChatInput component will apply colored borders based on the current plan mode.

## Architecture

### Files to Modify

**1. `src/renderer/store/inputStore.ts`**
- Change type: `export type PlanMode = 'normal' | 'plan' | 'brainstorm';`
- Change default: `planMode: 'normal'`
- Update `togglePlanMode` to cycle:
  ```ts
  togglePlanMode: () =>
    set((state) => ({
      planMode: state.planMode === 'normal' ? 'plan' 
              : state.planMode === 'plan' ? 'brainstorm' 
              : 'normal',
    })),
  ```

**2. `src/renderer/components/ChatInput/ChatInput.tsx`**
- Update `borderColor` useMemo to check planMode:
  - `'plan'` → `#3b82f6` (blue)
  - `'brainstorm'` → `#8b5cf6` (purple)
  - Memory/bash input modes still take precedence over plan mode colors
- Update toolbar button styling to highlight when not `'normal'`
- Update tooltip to show next state in cycle

**3. `src/renderer/hooks/useInputHandlers.ts`**
- No changes needed — already calls `togglePlanMode()` on Shift+Tab

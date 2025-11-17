# Light Theme CSS Variables Foundation

**Date:** 2025-11-17

## Context

The application currently uses a dark theme with gray color palette defined in CSS utility classes. The goal is to shift to a light theme with Vercel-style aesthetics—clean, minimal, and modern. Rather than a complete overhaul, the objective is to create a clean light theme foundation in the CSS files that components can gradually adopt over time.

## Discussion

### Design Goals
The primary focus is on establishing a color palette foundation with neutral grays, subtle borders, and clean backgrounds. The scope is intentionally minimal, requiring only 3-4 shades (background, surface, border, text) rather than a comprehensive design system covering typography, spacing, or interactive elements.

### Explored Approaches

Three approaches were considered:

1. **Semantic Class Names**: Create utility classes like `.bg-primary`, `.bg-surface`, `.border-subtle`, `.text-primary`
   - Trade-offs: Self-documenting, flexible, no Tailwind conflicts
   - Complexity: Low

2. **CSS Variables** (Selected): Define theme colors as CSS custom properties in `:root`
   - Trade-offs: More flexible, easier theme switching later, modern approach
   - Complexity: Low-Medium, requires component updates to use variables

3. **Override Tailwind Gray Scale**: Replace existing dark gray utilities with light equivalents using same naming
   - Trade-offs: Drop-in replacement, less refactoring needed
   - Complexity: Low, but locks into Tailwind naming

The CSS Variables approach was selected for its flexibility and future-proofing capabilities.

## Approach

Establish a minimal 4-variable color system using CSS custom properties that components can adopt incrementally. The Vercel light theme uses very subtle contrasts, providing a clean and professional aesthetic without harsh visual boundaries.

### Color System

- **`--bg-primary`**: `#ffffff` - Pure white for main app background
- **`--bg-surface`**: `#fafafa` - Very light gray for elevated surfaces (panels, cards)
- **`--border-subtle`**: `#eaeaea` - Soft neutral for dividers and outlines
- **`--text-primary`**: `#171717` - Near-black for readable, high-contrast text

## Architecture

### File Structure

**`src/renderer/index.css`** will be updated to:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg-primary: #ffffff;
  --bg-surface: #fafafa;
  --border-subtle: #eaeaea;
  --text-primary: #171717;
}
```

The existing `components.css` import can be removed or commented out since the dark theme utility classes will no longer be needed.

### Usage Patterns

Components consume these CSS variables in two ways:

1. **Direct inline styles (React)**:
   ```jsx
   <div style={{ backgroundColor: 'var(--bg-surface)' }}>
     <p style={{ color: 'var(--text-primary)' }}>Content</p>
   </div>
   ```

2. **Component-specific CSS classes**:
   ```css
   .sidebar {
     background-color: var(--bg-surface);
     border-right: 1px solid var(--border-subtle);
   }
   
   .panel-header {
     color: var(--text-primary);
   }
   ```

### Migration Strategy

Existing components (`MainLayout`, `RepoSidebar`, `SessionPanel`, etc.) currently use dark theme classes like `bg-gray-900` and `text-gray-200`. These will be gradually replaced as components are updated—no immediate breaking changes required.

### Best Practices

- Use CSS variables for theme-related colors only
- Keep Tailwind utilities for spacing, flex, grid, and other layout concerns
- Name component classes semantically (`.sidebar`, `.header`) rather than utility-based (`.bg-white-panel`)
- Variables cascade, so components can override locally if needed

### Technical Details

- Variables defined in `:root` selector are globally accessible
- Single source of truth for theme colors
- Works in all modern browsers (IE11+ with fallbacks if needed)
- File size impact: ~200 bytes
- No additional dependencies required
- Keeps Tailwind setup intact
- Prepares groundwork for future theme switching capabilities

### Post-Implementation

Components can adopt these variables incrementally at their own pace. The foundation is in place when components are ready to migrate from dark to light theme.

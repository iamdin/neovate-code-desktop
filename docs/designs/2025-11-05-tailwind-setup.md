# Tailwind CSS Setup - Design Document

## Overview

Implementation of basic Tailwind CSS setup in neovate-code-desktop, following the minimal foundation from emdash (Approach 2: Replace & Consolidate).

**Scope:** Basic Tailwind + PostCSS + Autoprefixer only. No theming, no plugins, no CSS variables - pure Tailwind defaults.

---

## Section 1: Architecture & Dependencies

### Dependencies to Install

Add to `devDependencies`:
- `tailwindcss` (v3.3.6) - Core framework
- `postcss` (v8.4.32) - CSS transformation required by Tailwind
- `autoprefixer` (v10.4.16) - Vendor prefix handling

### New Configuration Files

**`tailwind.config.js`** (root)
- Content paths pointing to `src/**/*.{ts,tsx,html}`
- Minimal configuration with no theme customization

**`postcss.config.js`** (root)
- Plugin configuration for Tailwind + Autoprefixer

### File Modifications

- **`package.json`** - Add devDependencies
- **`src/renderer/index.css`** - Replace with Tailwind directives + minimal base styles
- **`src/renderer/App.tsx`** - Remove inline styles, use Tailwind utility classes

### Build Integration

Vite automatically processes CSS through PostCSS when it detects `postcss.config.js`.

**No changes needed to:**
- `vite.config.ts`
- Existing dev and build scripts
- TypeScript configurations

The setup mirrors emdash's minimal foundation but without theming, plugins, or CSS variables.

---

## Section 2: Configuration Files & CSS Structure

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{ts,tsx,html}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**Key points:**
- ES module export (matches emdash pattern)
- Content paths target only renderer code where React components live
- No theme customization - uses Tailwind defaults
- No plugins

### postcss.config.js

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Key points:**
- Identical to emdash
- Straightforward plugin chain
- CommonJS export for PostCSS compatibility

### src/renderer/index.css

**Replace entire file with:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Changes:**
- Current file: 17 lines with manual reset and font styles
- New file: 3 lines with Tailwind directives
- Tailwind's base layer includes Preflight (modern CSS reset), eliminating need for manual reset
- System font stack handled by Tailwind's `font-sans` utility

---

## Section 3: Component Refactoring

### src/renderer/App.tsx Transformation

Replace inline styles with Tailwind utility classes:

| Current Inline Style | Tailwind Class |
|---------------------|----------------|
| `padding: '3rem'` | `p-12` |
| `fontFamily: 'system-ui, -apple-system, sans-serif'` | `font-sans` (default) |
| `maxWidth: '800px', margin: '0 auto'` | `max-w-3xl mx-auto` |
| `fontSize: '2.5rem', marginBottom: '1rem'` | `text-4xl mb-4` |
| `fontSize: '1.2rem', color: '#666', marginBottom: '2rem'` | `text-xl text-gray-600 mb-8` |
| `backgroundColor: '#f5f5f5', padding: '1.5rem', borderRadius: '8px'` | `bg-gray-100 p-6 rounded-lg` |
| `fontFamily: 'monospace'` | `font-mono` |
| `marginTop: 0, fontSize: '1.2rem'` | `mt-0 text-xl` |

### Component Structure

**Unchanged:**
- Same JSX element hierarchy
- Same conditional rendering logic
- Same data flow and props
- Same TypeScript types

**Changed:**
- Replace `style` props with `className` props
- Use Tailwind utility classes instead of CSS-in-JS objects

### Benefits

1. **Smaller bundle:** Shared utility classes vs unique inline styles
2. **Consistent spacing:** Tailwind's spacing scale (0.25rem increments)
3. **Easier responsive design:** Can add `md:`, `lg:` prefixes later
4. **Better maintainability:** Standard utility names vs arbitrary values
5. **Performance:** No runtime style calculation

---

## Implementation Order

1. Install dependencies (`tailwindcss`, `postcss`, `autoprefixer`)
2. Create `postcss.config.js` in root
3. Create `tailwind.config.js` in root
4. Replace `src/renderer/index.css` content
5. Refactor `src/renderer/App.tsx` to use Tailwind classes
6. Test dev server and build process

---

## Verification Steps

1. Run `npm run dev` - confirm app renders correctly with new styles
2. Run `npm run build` - confirm build succeeds
3. Visual inspection - confirm styling matches original appearance
4. Check console for any CSS warnings or errors

---

## Future Considerations

This minimal setup provides foundation for:
- Adding tailwindcss-animate plugin later
- Implementing dark mode with class strategy
- Adding custom theme colors via `theme.extend`
- Integrating shadcn/ui or other component libraries
- Custom utility classes in `@layer components`

All of these can be added incrementally without breaking the base setup.

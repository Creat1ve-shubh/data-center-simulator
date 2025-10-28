# Color Palette Improvements

## Overview
The color palette has been upgraded with a modern, professional design system that better reflects the energy efficiency and sustainability focus of the data center simulator.

## Key Changes

### 1. **Primary Color System**
- **Old**: Purple-focused (`#7033ff`)
- **New**: Green-focused (`#10b981` for light mode, `#34d399` for dark mode)
- **Rationale**: Green better represents sustainability, renewable energy, and environmental consciousness

### 2. **Enhanced Color Hierarchy**

#### Light Mode
```css
--primary: #10b981        /* Emerald green - energy & sustainability */
--secondary: #f1f5f9      /* Soft gray-blue */
--accent: #dcfce7         /* Light green tint */
--background: #fafbfc     /* Clean, soft white */
--foreground: #0f172a     /* Deep slate for text */
```

#### Dark Mode
```css
--primary: #34d399        /* Brighter emerald for contrast */
--secondary: #1e293b      /* Rich slate */
--accent: #065f46         /* Deep green */
--background: #0f172a     /* Deep slate background */
--foreground: #f8fafc     /* Bright text */
```

### 3. **New Semantic Colors**
Added utility colors for better communication:
- `--success`: Green tones for positive metrics
- `--warning`: Amber for caution states
- `--info`: Blue for informational content
- Each with proper foreground pairs for accessibility

### 4. **Improved Chart Colors**
- **chart-1**: `#10b981` (Emerald) - Primary data/renewable energy
- **chart-2**: `#3b82f6` (Blue) - Secondary metrics/traditional energy
- **chart-3**: `#f59e0b` (Amber) - Warning/inefficiency indicators
- **chart-4**: `#8b5cf6` (Purple) - Tertiary data/projections
- **chart-5**: `#ec4899` (Pink) - Additional metrics
- **chart-6**: `#06b6d4` (Cyan) - New addition for richer visualizations

### 5. **Better Contrast & Accessibility**
- Improved color contrast ratios for WCAG compliance
- Softer shadows with reduced opacity (0.1 vs 0.2)
- Better text legibility with `#0f172a` and `#f8fafc`
- Border colors that work in both themes

### 6. **Refined Border Radius**
- Reduced from `1.4rem` to `0.75rem` for a more modern, professional look
- Maintains consistency across all components

### 7. **Updated Component Styling**
The documentation page now uses semantic color tokens instead of hardcoded colors:
- `bg-background` instead of `bg-neutral-950`
- `text-foreground` instead of `text-neutral-100`
- `border-border` instead of `border-neutral-800`
- `text-muted-foreground` instead of `text-gray-700`

This ensures automatic theme support and easier maintenance.

## Benefits

1. **Brand Alignment**: Green palette reinforces the sustainability message
2. **Better Accessibility**: Improved contrast ratios and semantic color usage
3. **Theme Consistency**: All colors now work seamlessly in light and dark modes
4. **Maintainability**: Semantic tokens make it easy to update colors globally
5. **Professional Look**: Modern, clean aesthetic suitable for enterprise applications
6. **Data Visualization**: Enhanced chart colors for better data distinction

## Usage Examples

### Using Semantic Colors
```tsx
// Primary actions
<button className="bg-primary text-primary-foreground">Save</button>

// Success states
<div className="bg-success/10 border border-success/30 text-success-foreground">
  Efficiency improved!
</div>

// Info messages
<div className="bg-info/20 border border-info/40">
  Learn more about PUE
</div>

// Cards with proper theming
<Card className="bg-card text-card-foreground border-border">
  Content
</Card>
```

### Chart Integration
The new chart colors automatically integrate with Recharts and other visualization libraries:
```tsx
<Line stroke="hsl(var(--chart-1))" />  // Emerald green
<Bar fill="hsl(var(--chart-2))" />     // Blue
<Area fill="hsl(var(--chart-3))" />    // Amber
```

## Next Steps

Consider these enhancements for future iterations:
1. Add gradient variants for hero sections
2. Create color palettes for specific metric types (energy, cost, carbon)
3. Add animation timing tokens for consistent transitions
4. Consider adding a high-contrast mode for accessibility

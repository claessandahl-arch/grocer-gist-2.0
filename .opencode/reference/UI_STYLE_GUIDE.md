# UI Style Guide

## Design Philosophy

This app uses a **clean, light design** with subtle shadows and slate-based color palette. The UI is optimized for readability and feels professional without being overwhelming.

## Color Palette

### Primary Colors
| Color | Class | Usage |
|-------|-------|-------|
| Teal | `text-teal-600` / `bg-teal-500` | Positive values, savings, income, CTAs |
| Red | `text-red-600` / `bg-red-500` | Expenses, negative values, warnings |
| Orange | `text-orange-600` / `bg-orange-500` | Variable expenses |
| Green | `text-green-600` / `bg-green-500` | Savings goals |
| Blue | `text-blue-600` / `bg-blue-500` | Information, totals |

### Slate Scale (Grays)
| Color | Class | Usage |
|-------|-------|-------|
| slate-800 | `text-slate-800` | Primary text, headings |
| slate-700 | `text-slate-700` | Important body text |
| slate-600 | `text-slate-600` | Secondary text, legends |
| slate-500 | `text-slate-500` | Muted text, labels |
| slate-200 | `border-slate-200` | Borders, dividers |
| slate-100 | `border-slate-100` | Subtle dividers |
| slate-50 | `bg-slate-50` | Highlight backgrounds |

## Card Styles

### Standard Card
```jsx
<Card className="bg-white border-slate-200 shadow-sm">
  <CardHeader>
    <CardTitle className="text-lg text-slate-800">Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

### Accent Cards (KPIs)
Use gradient backgrounds for KPI highlight cards:
```jsx
<Card className="bg-gradient-to-br from-teal-500 to-teal-600 border-none text-white">
```

## Typography

| Element | Class |
|---------|-------|
| Page title | `text-3xl font-bold text-slate-800` |
| Section title | `text-2xl font-bold text-slate-800` |
| Card title | `text-lg text-slate-800` or `text-xl text-slate-800` |
| Body text | `text-slate-700` |
| Labels | `text-sm text-slate-500` |
| Large numbers | `text-3xl font-bold` + semantic color |

## Charts

### Tooltips (Light Theme)
```jsx
<Tooltip
  contentStyle={{ 
    backgroundColor: '#fff', 
    border: '1px solid #e2e8f0', 
    borderRadius: '8px' 
  }}
  labelStyle={{ color: '#1e293b' }}
  itemStyle={{ color: '#1e293b' }}
/>
```

### Chart Colors
Use the `CATEGORY_COLORS` palette defined in Reports.tsx:
- Teal, Orange, Violet, Pink, Green, Blue, Yellow, Red, Cyan, Purple, Amber, Emerald, Indigo, Lime, Fuchsia

## Interactive Elements

### Buttons
- Primary: `bg-teal-500 hover:bg-teal-600 text-white`
- Secondary: `bg-white border-slate-300 hover:border-slate-400 text-slate-700`
- Disabled: `opacity-50` or reduced opacity + `line-through` for hidden states

### Loading Spinner
```jsx
<div className="size-12 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
```

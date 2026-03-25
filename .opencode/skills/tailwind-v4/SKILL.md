---
name: tailwind-v4
description: Tailwind CSS v4 utilities, classes, and responsive design patterns
license: MIT
compatibility: opencode
metadata:
  css: Tailwind
  version: "4.x"
---

## What This Skill Covers

Tailwind CSS v4 patterns and utilities for the PortoSantoGuide project.

## Core Concepts

### Utility-First Approach
```html
<!-- Don't do this -->
<div class="card">
  <style>.card { padding: 1rem; background: white; }</style>
</div>

<!-- Do this -->
<div class="p-4 bg-white rounded-lg shadow">
```

## Common Utilities

### Layout
```
flex              display: flex
grid              display: grid
hidden            display: none
block             display: block
container         max-width with responsive padding
```

### Spacing (rem-based)
```
p-4               padding: 1rem
px-4              padding-left/right: 1rem
py-2              padding-top/bottom: 0.5rem
m-4               margin: 1rem
mb-2              margin-bottom: 0.5rem
gap-4             gap: 1rem
space-y-4         > * + * margin-top: 1rem
```

### Sizing
```
w-full            width: 100%
w-64              width: 16rem
h-screen          height: 100vh
min-h-full        min-height: 100%
max-w-md          max-width: 28rem
```

### Colors (semantic)
```
bg-white          background-color: white
bg-gray-100       background-color: #f3f4f6
text-gray-900     color: #111827
text-blue-600     color: #2563eb
border-gray-200   border-color: #e5e7eb
```

### Typography
```
text-sm           font-size: 0.875rem
text-lg           font-size: 1.125rem
font-bold         font-weight: 700
leading-tight     line-height: 1.25
text-center       text-align: center
```

### Borders & Effects
```
rounded-lg        border-radius: 0.5rem
rounded-full      border-radius: 9999px
shadow            box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1)
shadow-lg         box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1)
```

## Responsive Design

Use `sm:`, `md:`, `lg:`, `xl:` prefixes:

```html
<!-- Stack on mobile, side-by-side on desktop -->
<div class="flex flex-col md:flex-row gap-4">
  <div class="w-full md:w-1/2">Left</div>
  <div class="w-full md:w-1/2">Right</div>
</div>

<!-- Hide on mobile, show on desktop -->
<div class="hidden md:block">Desktop only</div>
```

## Dark Mode

```html
<div class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
```

## Custom Classes with @apply

In CSS files (use sparingly):
```css
@layer components {
  .btn-primary {
    @apply px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700;
  }
}
```

## Tailwind Merge

Use for conditional classes:
```tsx
import { twMerge } from 'tailwind-merge';

const className = twMerge(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-600 text-white',
  isDisabled && 'opacity-50 cursor-not-allowed'
);
```

## Project Patterns

### Card Component
```tsx
<div className="bg-white rounded-lg shadow p-4 border border-gray-200">
```

### Form Input
```tsx
<input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
```

### Button
```tsx
<button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
```

## When to Use

Use this skill when:
- Choosing Tailwind utilities for styling
- Implementing responsive layouts
- Creating consistent UI components
- Working with dark mode or custom themes

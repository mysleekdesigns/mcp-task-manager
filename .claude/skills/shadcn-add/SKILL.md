---
name: shadcn-add
description: Add shadcn/ui components to the project. Use when you need to install new UI components like buttons, dialogs, cards, or any shadcn/ui component.
allowed-tools: Bash
---

# Add shadcn/ui Components

Install shadcn/ui components with proper configuration.

## Instructions

1. Specify the component name(s) to add
2. Components are installed to `src/components/ui/`
3. After adding, components can be imported from `@/components/ui/`

## Command

```bash
npx shadcn@latest add $ARGUMENTS
```

## Available Components

Common components for this project:
- `button` - Button component with variants
- `card` - Card container with header, content, footer
- `dialog` - Modal dialog component
- `dropdown-menu` - Dropdown menu with items
- `input` - Form input field
- `label` - Form label
- `select` - Select dropdown
- `tabs` - Tab navigation
- `toast` - Toast notifications
- `badge` - Status badges
- `avatar` - User avatars
- `separator` - Visual separator
- `skeleton` - Loading skeleton
- `scroll-area` - Scrollable container
- `sheet` - Slide-out panel
- `table` - Data table

## Examples

Add a single component:
```bash
npx shadcn@latest add button
```

Add multiple components:
```bash
npx shadcn@latest add card dialog dropdown-menu
```

## After Installation

Import components from the ui directory:
```tsx
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
```

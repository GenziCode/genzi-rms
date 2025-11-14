# UI Components Documentation

This document provides comprehensive documentation for reusable UI components used throughout the application.

## Table of Contents

1. [Sonner Toast](#sonner-toast)
2. [Spinner](#spinner)
3. [Popover](#popover)
4. [Switch](#switch)
5. [Badge with Spinner](#badge-with-spinner)
6. [Input Group with Spinner](#input-group-with-spinner)

---

## Sonner Toast

**Location:** `src/components/ui/sonner.tsx`

An opinionated toast component for React. Provides non-blocking notifications that don't interrupt user workflow.

### Installation

Already installed via `npm install sonner`

### Setup

Add the `Toaster` component to your root layout (`App.tsx`):

```tsx
import { Toaster as SonnerToaster } from '@/components/ui/sonner';

function App() {
  return (
    <>
      {/* Your app content */}
      <SonnerToaster position="top-right" richColors />
    </>
  );
}
```

### Usage

```tsx
import { toast } from 'sonner';

// Success toast
toast.success('Purchase Order Created!', {
  description: 'Your purchase order has been created successfully.',
});

// Error toast
toast.error('Error Creating Purchase Order', {
  description: 'Failed to create purchase order.',
});

// Warning toast
toast.warning('No Data', {
  description: 'Please upload a CSV file or paste CSV content.',
});

// Info toast
toast.info('Information', {
  description: 'This is an informational message.',
});

// Loading toast
const toastId = toast.loading('Processing...');
// Later, update or dismiss
toast.dismiss(toastId);
toast.success('Completed!', { id: toastId });
```

### Toast Types

- `toast.success()` - Green checkmark icon
- `toast.error()` - Red X icon
- `toast.warning()` - Yellow triangle icon
- `toast.info()` - Blue info icon
- `toast.loading()` - Spinning loader icon
- `toast()` - Default toast

### Options

```tsx
toast.success('Title', {
  description: 'Optional description text',
  duration: 4000, // Auto-dismiss after 4 seconds
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo clicked'),
  },
  cancel: {
    label: 'Cancel',
    onClick: () => console.log('Cancel clicked'),
  },
});
```

### Best Practices

- Use toast notifications instead of blocking modals/alerts
- Keep titles concise (1-3 words)
- Use descriptions for additional context
- Don't overuse - reserve for important actions
- Use appropriate toast types (success, error, warning, info)

---

## Spinner

**Location:** `src/components/ui/spinner.tsx`

A loading spinner component using Lucide React's `Loader2` icon.

### Usage

```tsx
import { Spinner } from '@/components/ui/spinner';

// Basic usage
<Spinner />

// With size
<Spinner size="sm" />  // Small (h-4 w-4)
<Spinner size="md" />  // Medium (h-6 w-6) - default
<Spinner size="lg" />  // Large (h-8 w-8)

// With custom color
<Spinner className="text-blue-600" />
<Spinner className="text-red-500" />
<Spinner className="text-green-500" />
```

### Examples

#### In Buttons

```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner size="sm" className="text-white" />
      Loading...
    </>
  ) : (
    'Submit'
  )}
</button>
```

#### In Search Input

```tsx
<div className="relative">
  <input
    type="text"
    disabled={isLoading}
    placeholder="Search..."
  />
  {isLoading && (
    <div className="absolute right-3 top-1/2 -translate-y-1/2">
      <Spinner size="sm" className="text-gray-400" />
    </div>
  )}
</div>
```

#### In Dropdowns

```tsx
<select disabled={isLoading}>
  <option value="">
    {isLoading ? (
      <span className="flex items-center gap-2">
        <Spinner size="sm" />
        Loading...
      </span>
    ) : (
      'Select option...'
    )}
  </option>
</select>
```

#### In Refresh Buttons

```tsx
<button onClick={refetch} disabled={isLoading}>
  {isLoading ? (
    <Spinner size="sm" className="text-gray-600" />
  ) : (
    <RefreshCw className="w-5 h-5 text-gray-600" />
  )}
</button>
```

---

## Popover

**Location:** `src/components/ui/popover.tsx`

Displays rich content in a portal, triggered by a button. Built with Radix UI.

### Installation

Already installed via `npm install @radix-ui/react-popover`

### Usage

```tsx
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function PopoverDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Dimensions</h4>
            <p className="text-sm text-muted-foreground">
              Set the dimensions for the layer.
            </p>
          </div>
          <div className="grid gap-2">
            <div className="grid grid-cols-3 items-center gap-4">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                defaultValue="100%"
                className="col-span-2 h-8"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

### Positioning

```tsx
<PopoverContent 
  align="start"      // "start" | "center" | "end"
  side="bottom"     // "top" | "right" | "bottom" | "left"
  sideOffset={4}    // Distance from trigger
>
  {/* Content */}
</PopoverContent>
```

---

## Switch

**Location:** `src/components/ui/switch.tsx`

A toggle switch component. Built with Radix UI.

### Installation

Already installed via `npm install @radix-ui/react-switch`

### Usage

```tsx
import { Switch } from '@/components/ui/switch';
import { useState } from 'react';

function SwitchDemo() {
  const [enabled, setEnabled] = useState(false);

  return (
    <div className="flex items-center space-x-2">
      <Switch
        checked={enabled}
        onCheckedChange={setEnabled}
        id="airplane-mode"
      />
      <label
        htmlFor="airplane-mode"
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        Airplane Mode
      </label>
    </div>
  );
}
```

### With Description

```tsx
<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
  <div className="flex items-center gap-3">
    <Switch
      checked={holdScreen}
      onCheckedChange={setHoldScreen}
    />
    <div>
      <label className="text-sm font-semibold">Hold Screen Mode</label>
      <p className="text-xs text-gray-600">
        Keep search open for faster bulk addition
      </p>
    </div>
  </div>
</div>
```

### Disabled State

```tsx
<Switch
  checked={enabled}
  onCheckedChange={setEnabled}
  disabled
/>
```

---

## Badge with Spinner

Combine Badge and Spinner components for status indicators.

### Usage

```tsx
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';

function SpinnerBadge() {
  return (
    <div className="flex items-center gap-4">
      <Badge>
        <Spinner size="sm" />
        Syncing
      </Badge>
      <Badge variant="secondary">
        <Spinner size="sm" />
        Updating
      </Badge>
      <Badge variant="outline">
        <Spinner size="sm" />
        Processing
      </Badge>
    </div>
  );
}
```

---

## Input Group with Spinner

Show loading state in input fields.

### Usage

```tsx
import { Spinner } from '@/components/ui/spinner';
import { Loader2 } from 'lucide-react';

function InputGroupSpinner() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      {/* Spinner in addon */}
      <div className="relative">
        <input
          placeholder="Searching..."
          disabled
          className="w-full pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Spinner size="sm" />
        </div>
      </div>

      {/* With text and spinner */}
      <div className="relative">
        <input
          placeholder="Saving changes..."
          disabled
          className="w-full pr-24"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Saving...</span>
          <Spinner size="sm" />
        </div>
      </div>

      {/* Using LoaderIcon directly */}
      <div className="relative">
        <input
          placeholder="Refreshing data..."
          disabled
          className="w-full pr-24"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
```

---

## Best Practices

### When to Use Spinners

1. **API Calls**: Show spinner while fetching data
2. **Form Submissions**: Show spinner in submit button
3. **Search Operations**: Show spinner in search input
4. **Refresh Actions**: Show spinner in refresh buttons
5. **Long Operations**: Show spinner for operations > 500ms

### When to Use Toast

1. **Success Actions**: After successful form submission
2. **Error Messages**: For non-critical errors
3. **Warnings**: For user warnings that don't block workflow
4. **Info Messages**: For informational updates
5. **NOT for**: Critical errors requiring user action (use modal instead)

### When to Use Popover

1. **Additional Information**: Show extra details without navigating
2. **Quick Actions**: Provide action buttons near trigger
3. **Form Inputs**: Show related form fields
4. **Help Text**: Display contextual help
5. **NOT for**: Complex forms (use modal instead)

### When to Use Switch

1. **Boolean Settings**: Toggle features on/off
2. **Preferences**: User preference toggles
3. **Feature Flags**: Enable/disable features
4. **NOT for**: Multiple options (use select/radio instead)

---

## Component Dependencies

- **Sonner**: `sonner` package
- **Spinner**: Uses `lucide-react` Loader2 icon
- **Popover**: `@radix-ui/react-popover`
- **Switch**: `@radix-ui/react-switch`

All components use Tailwind CSS for styling and are compatible with the existing design system.

---

## Migration Guide

### Replacing SweetAlert with Sonner

**Before:**
```tsx
import { useAlert } from '@/hooks/useSweetAlert';

const alert = useAlert();
alert.success('Success', 'Operation completed');
```

**After:**
```tsx
import { toast } from 'sonner';

toast.success('Success', {
  description: 'Operation completed',
});
```

### Replacing Loader2 with Spinner

**Before:**
```tsx
<Loader2 className="w-5 h-5 animate-spin" />
```

**After:**
```tsx
<Spinner size="sm" />
```

---

## Examples in Codebase

- **CreatePOModal**: Uses Sonner toast for all notifications
- **CreatePOModal**: Uses Spinner in buttons, inputs, and dropdowns
- **Various Forms**: Use Switch for toggle settings

---

## Future Enhancements

- [ ] Add Sidebar component (when needed)
- [ ] Add more toast variants
- [ ] Add spinner variants (dots, bars, etc.)
- [ ] Add popover animations
- [ ] Add switch variants

---

Last Updated: 2024-01-XX


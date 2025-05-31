# E2E Testing Troubleshooting Guide

## 🚨 Critical Issue: UI Components Not Forwarding Test Attributes

### **The Problem That Cost Us Hours**

**Date Encountered**: January 2025  
**Severity**: HIGH - Caused complete test suite failure  
**Root Cause**: UI component library components not forwarding `data-testid` attributes

#### **Symptoms**
- ✅ React logs showed components rendering correctly
- ✅ Browser DevTools showed correct HTML structure
- ❌ Playwright `page.locator('[data-testid="..."]')` consistently returned 0 elements
- ❌ Tests timing out on element selection
- ❌ Console logs: `DOM CHECK - Image cards in DOM after render: 0`

#### **The Misleading Investigation Path**
We initially suspected:
- React hydration issues
- Server-side rendering problems
- Timing issues between React render and DOM availability
- Network latency affecting component mounting
- Playwright selector engine problems
- React virtual DOM vs real DOM synchronization issues
- Image loading delays causing layout shifts
- Component lifecycle timing problems

**Time Wasted**: ~6 hours debugging the wrong issues
**Multiple Wait Strategies Attempted**: `waitForSelector()`, `waitForFunction()`, manual polling, React completion flags
**Lines of Debug Code Added**: 400+ console.log statements
**Actual Problem**: 2-line fix in UI component prop forwarding

#### **The Actual Root Cause**
The `Card` component in our UI library was **NOT forwarding `data-testid` attributes** to the actual DOM elements.

**Before (Broken)**:
```tsx
// In /src/components/ui/Card.tsx
export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  // Missing: extends React.HTMLAttributes<HTMLDivElement>
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  onClick,
  // Missing: ...otherProps destructuring
}, ref) => {
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={baseClasses}
      // Missing: {...otherProps} spread - data-testid was ignored!
    >
      {children}
    </div>
  );
});
```

**After (Fixed)**:
```tsx
// In /src/components/ui/Card.tsx
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  onClick,
  hover = false,
  border = false,
  ...otherProps  // ✅ CRITICAL: Capture all other props including data-testid
}, ref) => {
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={`${baseClasses} ${hoverClasses} ${borderClasses} ${className}`}
      {...otherProps}  // ✅ CRITICAL: Forward all props to DOM including data-testid
    >
      {children}
    </div>
  );
});
```

#### **Usage Example**
```tsx
// In SelectImagesDialog.tsx - This now works!
<Card 
  key={image.id}
  className="cursor-pointer"
  onClick={() => handleSelectImage(image.id)}
  data-testid={`select-images-image-card-${image.id}`}  // ✅ Now forwarded to DOM
  data-selected={isSelected.toString()}                 // ✅ Now forwarded to DOM
>
  {/* card content */}
</Card>
```

#### **Detection Methods**
1. **Browser DevTools**: Check if `data-testid` attribute exists on the actual DOM element
2. **Console Debugging**: 
   ```js
   // In browser console
   document.querySelectorAll('[data-testid^="your-prefix-"]').length
   ```
3. **Playwright Inspector**: Use `npx playwright test --debug` to inspect selectors live

#### **Prevention**
- **Always** extend `React.HTMLAttributes<HTMLElement>` in component interfaces
- **Always** spread `...otherProps` to the root DOM element
- **Test** component libraries with `data-testid` attributes during development
- **Document** which props are forwarded in component libraries

---

## 🚀 Quick Diagnostic Commands

### 🔍 Instant Element Check
```bash
# Run this in test to quickly check if elements exist
await page.evaluate(() => {
  const elements = document.querySelectorAll('[data-testid^="select-images-"]');
  console.log(`Found ${elements.length} elements with select-images prefix`);
  elements.forEach((el, i) => console.log(`${i}: ${el.getAttribute('data-testid')}`));
  return elements.length;
});
```

### 🛠️ Component Prop Debugging
```tsx
// Add this temporarily to any component to debug prop forwarding
const ComponentDebugger = (props: any) => {
  useEffect(() => {
    console.log('🔍 Component received props:', Object.keys(props));
    console.log('🔍 data-testid prop:', props['data-testid']);
    console.log('🔍 All data- props:', 
      Object.keys(props).filter(key => key.startsWith('data-'))
    );
  }, [props]);
  return null;
};

// Use in component: <ComponentDebugger {...props} />
```

### ⚡ DOM Reality Check
```javascript
// Paste in browser console during test debugging
const testIds = Array.from(document.querySelectorAll('[data-testid]'))
  .map(el => el.getAttribute('data-testid'))
  .sort();
console.log('🔍 All data-testid attributes in DOM:', testIds);
```

---

## 🛠️ Common E2E Test Issues & Solutions

### 1. **Modal Overlays Intercepting Clicks**

**Symptoms**: `<div class="fixed inset-0 bg-black bg-opacity-50">...</div> intercepts pointer events`

**Solution**:
```typescript
// Handle any open confirmation dialogs before clicking buttons
const confirmationModal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
const modalCount = await confirmationModal.count();

if (modalCount > 0) {
  for (let i = 0; i < modalCount; i++) {
    const modal = confirmationModal.nth(i);
    if (await modal.isVisible()) {
      const cancelButton = modal.locator('button').filter({ hasText: 'Cancel' });
      if (await cancelButton.isVisible()) {
        await cancelButton.click();
      }
    }
  }
}
```

### 2. **Dialog Not Fully Closed Before Next Action**

**Symptoms**: Previous modal still visible, interfering with new interactions

**Solution**:
```typescript
// Wait for dialog to be completely closed
await page.getByTestId('dialog-close-button').click();
await expect(page.getByTestId('dialog-overlay')).not.toBeVisible();
```

### 3. **React State Not Synchronized with DOM**

**Symptoms**: React logs show correct state, but DOM queries fail

**Investigation Steps**:
1. Check if components forward props correctly
2. Verify `data-testid` attributes reach actual DOM
3. Use browser DevTools to inspect element hierarchy

### 4. **Network Timing Issues**

**Symptoms**: API calls complete but UI not updated

**Solution**:
```typescript
// Wait for specific content to appear
await expect(page.locator('[data-testid="content"]')).toContainText('Expected Content');

// Or wait for network idle
await page.waitForLoadState('networkidle');
```

### 5. **Image Loading Delays**

**Symptoms**: Tests fail because images haven't loaded

**Solution**:
```typescript
// Wait for specific images to load
await expect(page.locator('img[data-testid="gallery-image"]')).toHaveCount(expectedCount);

// Or wait for all images in container
await page.waitForFunction(() => {
  const images = document.querySelectorAll('img');
  return Array.from(images).every(img => img.complete);
});
```

---

## 🔍 Debugging Workflow

### Step 1: Verify Element Exists in DOM
```typescript
// In test file
console.log('Elements found:', await page.locator('[data-testid="your-element"]').count());
```

### Step 2: Check Browser DevTools
```typescript
// Add breakpoint in test
await page.pause(); // Opens Playwright Inspector
```

### Step 3: Manual Console Inspection
```javascript
// In browser console
document.querySelectorAll('[data-testid^="your-prefix-"]')
```

### Step 4: Component Props Investigation
```typescript
// Add to component for debugging
useEffect(() => {
  console.log('Component props:', props);
}, [props]);
```

### Step 5: DOM Mutation Observation
```javascript
// In browser console
const observer = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    console.log('DOM changed:', mutation);
  });
});
observer.observe(document.body, { childList: true, subtree: true });
```

---

## 📋 Prevention Checklist

### For Component Libraries
- [ ] Extend `React.HTMLAttributes<HTMLElement>` in interfaces
- [ ] Spread `...otherProps` to root DOM element
- [ ] Test components with `data-testid` during development
- [ ] Document prop forwarding behavior

### For E2E Tests
- [ ] Always wait for dialogs to fully close
- [ ] Handle modal overlays before clicking buttons
- [ ] Verify element existence before interaction
- [ ] Use specific selectors over generic ones
- [ ] Add meaningful error messages to expectations

### For Development
- [ ] Test UI components with test attributes early
- [ ] Use browser DevTools to verify DOM structure
- [ ] Include e2e-friendly attributes in component design
- [ ] Document test patterns for team reference

---

## 🎯 Quick Reference Commands

```bash
# Debug specific test
npx playwright test --debug test-name

# Run with trace
npx playwright test --trace on

# Generate test report
npx playwright show-report

# Check element in browser console
document.querySelectorAll('[data-testid^="prefix-"]').length

# Inspect component props (add to component)
console.log('Props received:', Object.keys(props));
```

---

## 📝 Lessons Learned

1. **UI component libraries are common culprits** - Always verify prop forwarding
2. **React rendering ≠ DOM availability** - Components can render without forwarding attributes
3. **Browser DevTools are your friend** - Always verify DOM structure manually
4. **Timing issues are often red herrings** - Look for structural problems first
5. **Test your component libraries** - Don't assume they forward all props correctly

---

*Last Updated: January 2025*  
*Next Review: As needed when new patterns emerge*

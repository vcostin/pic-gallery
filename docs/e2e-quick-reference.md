# E2E Testing Quick Reference Card

> 🚨 **Most Common Issue**: UI components not forwarding `data-testid` props

## 🔥 Emergency Debugging (30 seconds)

```bash
# 1. Check if elements exist in DOM
await page.evaluate(() => document.querySelectorAll('[data-testid^="your-prefix-"]').length);

# 2. If 0 elements found, check React vs DOM:
await page.pause(); # Open inspector, check DevTools Elements tab

# 3. If React shows elements but DOM doesn't have data-testid:
# → Component prop forwarding issue (see fix below)
```

## ⚡ The Million-Dollar Fix

**Problem**: Component renders, but Playwright can't find `data-testid`
**Solution**: Add prop forwarding to UI components

```tsx
// ❌ BROKEN (no prop forwarding)
export interface CardProps {
  children: React.ReactNode;
}
export const Card = ({ children, className }: CardProps) => (
  <div className={className}>{children}</div>
);

// ✅ FIXED (forwards all props including data-testid)
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}
export const Card = ({ children, className, ...otherProps }: CardProps) => (
  <div className={className} {...otherProps}>{children}</div>
);
```

## 🛠️ Instant Diagnostics

### Check Element Existence
```typescript
// In test file
const count = await page.locator('[data-testid="your-element"]').count();
console.log(`Found ${count} elements`);
```

### Verify DOM Structure
```javascript
// In browser console
document.querySelectorAll('[data-testid]').forEach(el => 
  console.log(el.getAttribute('data-testid'), el)
);
```

### Debug Component Props
```tsx
// Add to React component temporarily
console.log('Props keys:', Object.keys(props));
console.log('data-testid received:', props['data-testid']);
```

## 🚨 Common Symptoms → Solutions

| Symptom | Likely Cause | Quick Fix |
|---------|--------------|-----------|
| `Found 0 elements` | Prop forwarding issue | Add `...otherProps` to component |
| Modal intercepts click | Overlay blocking | Handle confirmation dialogs first |
| Element exists but not clickable | Dialog not closed | Wait for previous dialog to close |
| Timeout on network call | Race condition | Use `waitForLoadState('networkidle')` |
| Images not loaded | Asset timing | Wait for image `complete` state |

## 📋 Essential Wait Patterns

```typescript
// Wait for element to exist
await expect(page.locator('[data-testid="element"]')).toBeVisible();

// Wait for dialog to close
await expect(page.locator('[data-testid="dialog"]')).not.toBeVisible();

// Wait for content to load
await expect(page.locator('[data-testid="content"]')).toContainText('Expected');

// Wait for network to settle
await page.waitForLoadState('networkidle');
```

## 🔍 Investigation Order

1. **Elements exist?** → `page.locator().count()`
2. **Props forwarded?** → Browser DevTools check
3. **Modal blocking?** → Look for overlay elements
4. **Timing issue?** → Add appropriate waits
5. **Network delay?** → Check for pending requests

## 💡 Prevention Rules

- ✅ Always extend `React.HTMLAttributes` in component interfaces
- ✅ Always spread `...otherProps` in UI components  
- ✅ Test components with `data-testid` during development
- ✅ Handle modal overlays before clicking buttons
- ✅ Wait for dialogs to fully close before next action

---

> **Remember**: 90% of e2e failures are prop forwarding or modal overlay issues. Check these first!

*Quick Reference v1.0 - Based on real debugging sessions*

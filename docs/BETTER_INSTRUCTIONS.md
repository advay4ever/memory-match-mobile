# Better Instructions - Enhancement Plan

## Current State

Basic 3-step instructions without visual aids or detailed explanations.

---

## Improvements to Add

### 1. **Visual Preview of Selection Screen**
Show a mini-grid of sample sound icons so patients know what to expect.

```tsx
<div className="grid grid-cols-3 gap-2 p-4 bg-gray-50 rounded-xl mb-4">
  <div className="text-3xl text-center">🐕</div>
  <div className="text-3xl text-center">🔔</div>
  <div className="text-3xl text-center">💧</div>
  <div className="text-3xl text-center">🐦</div>
  <div className="text-3xl text-center">🚗</div>
  <div className="text-3xl text-center">📞</div>
</div>
<p className="text-sm text-center text-gray-500">
  Example: You'll tap the icons you heard
</p>
```

### 2. **Clarify 8-Second Delay**
Current: "Wait for the selection screen"
Better: "Wait 8 seconds (countdown shown)"

```tsx
<p className="text-gray-800 font-medium">
  ⏳ Wait 8 seconds while we prepare the screen
  <span className="block text-sm text-gray-500 mt-1">
    This tests your short-term memory!
  </span>
</p>
```

### 3. **Explain Selection Mechanic**
Add sub-instruction about tap to select/deselect:

```tsx
<p className="text-gray-800 font-medium">
  👆 Tap the {count} sounds you heard
  <span className="block text-sm text-gray-500 mt-1">
    💡 Tap once to select (blue), tap again to deselect
  </span>
</p>
```

### 4. **Show Example Icons**
Display actual sound icons they might encounter:

```tsx
<div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
  <p className="text-xs text-gray-600 mb-2 text-center font-medium">
    Example sounds you might hear:
  </p>
  <div className="flex justify-center gap-2 flex-wrap">
    <span className="text-2xl">🐕</span>
    <span className="text-2xl">🔔</span>
    <span className="text-2xl">💧</span>
    <span className="text-2xl">🐦</span>
    <span className="text-2xl">🚗</span>
    <span className="text-2xl">📞</span>
    <span className="text-2xl">🐱</span>
    <span className="text-2xl">⛈️</span>
  </div>
</div>
```

### 5. **Add Progress Indicator**
Show which step they're on:

```tsx
<div className="flex justify-center gap-2 mb-4">
  <div className="w-2 h-2 rounded-full bg-blue-600"></div>
  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
</div>
<p className="text-xs text-center text-gray-500">
  Step 1 of 4: Instructions
</p>
```

### 6. **Larger Text for Accessibility**
Increase instruction text size:
- Current: `text-gray-800 font-medium`
- Better: `text-lg text-gray-800 font-semibold`

### 7. **Add "Operator Notes" Section**
Help for the healthcare worker:

```tsx
<div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
  <p className="text-sm font-bold text-purple-800 mb-2">
    👨‍⚕️ For Operator:
  </p>
  <ul className="text-xs text-purple-700 space-y-1 list-disc list-inside">
    <li>Make sure patient can see the screen clearly</li>
    <li>Ensure volume is audible but not too loud</li>
    <li>Patient can tap the screen during selection</li>
  </ul>
</div>
```

---

## New Translations Needed (en.json)

```json
{
  "game": {
    "instructionPreview": "You'll see icons like these:",
    "instructionDelay": "Wait 8 seconds (countdown shown)",
    "instructionDelayHint": "This tests your short-term memory!",
    "instructionSelectHint": "Tap once to select (blue), tap again to deselect",
    "exampleSounds": "Example sounds you might hear:",
    "operatorNotes": "For Operator:",
    "operatorNote1": "Make sure patient can see the screen clearly",
    "operatorNote2": "Ensure volume is audible but not too loud",
    "operatorNote3": "Patient can tap the screen during selection",
    "stepOfTotal": "Step {{current}} of {{total}}"
  }
}
```

---

## Benefits

| Improvement | Benefit |
|-------------|---------|
| Visual preview | Reduces confusion about what to expect |
| 8-second explanation | Patient understands the wait is intentional |
| Selection mechanic | Clear how to use the interface |
| Example icons | Familiar with icon types |
| Operator notes | Healthcare worker knows how to help |
| Larger text | Better accessibility for elderly |

---

## Estimated Effort

- **Implementation:** 1 hour
- **Testing:** 15 minutes
- **Translation keys:** 30 minutes
- **Total:** ~1.5 hours

---

*Document created: January 26, 2026*

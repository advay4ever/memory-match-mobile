# Adaptive Difficulty - Implementation Plan

## Overview

Adaptive Difficulty automatically increases the difficulty level when a patient scores 100% on a test. This helps find the patient's cognitive ceiling efficiently without requiring multiple manual adjustments.

**Key Requirement:** This is an **optional feature** that operators can enable/disable via a toggle.

---

## Feature Behavior

### When Enabled:
1. Patient completes a test with **100% accuracy**
2. System automatically suggests the next difficulty level
3. If already at Hard → stays at Hard (ceiling reached)
4. Progression: Easy → Medium → Hard

### When Disabled:
- Standard behavior: difficulty stays the same unless manually changed
- No auto-suggestions after perfect scores

### Edge Cases:
- Already at Hard + 100% → Show "Maximum difficulty reached!" message
- Feature toggled mid-session → Takes effect on next test
- Different patients → Each uses their own starting difficulty

---

## UI/UX Design

### 1. Toggle Location
Add toggle in the **operator setup screen** (before starting test):

```
┌─────────────────────────────────────┐
│  ⚙️ Test Settings                   │
│                                     │
│  Auto-Increase Difficulty    [🔘]   │
│  ─────────────────────────────────  │
│  When ON: Difficulty increases      │
│  automatically after 100% score     │
└─────────────────────────────────────┘
```

### 2. Feedback Screen (When Triggered)
After a 100% score with adaptive mode ON:

```
┌─────────────────────────────────────┐
│         🎉 Perfect Score!           │
│                                     │
│     ✨ 100% Accuracy                │
│     🟢 Normal Performance           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📈 DIFFICULTY INCREASED      │  │
│  │  Easy → Medium                │  │
│  │                               │  │
│  │  Next test will use Medium   │  │
│  └───────────────────────────────┘  │
│                                     │
│     [🏠 Return to Operator]         │
└─────────────────────────────────────┘
```

### 3. When Ceiling Reached (Hard + 100%)

```
┌─────────────────────────────────────┐
│         🎉 Perfect Score!           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │  🏆 MAXIMUM LEVEL REACHED     │  │
│  │  Patient has mastered the    │  │
│  │  hardest difficulty!         │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## Technical Implementation

### Step 1: Add State Variable

```typescript
// In App.tsx state declarations
const [adaptiveDifficultyEnabled, setAdaptiveDifficultyEnabled] = useState(false);
```

### Step 2: Add Toggle UI

Location: Setup screen, near the "Start Memory Test" button

```tsx
<div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
  <div>
    <p className="font-bold text-gray-800">Auto-Increase Difficulty</p>
    <p className="text-sm text-gray-500">Increase after 100% score</p>
  </div>
  <button
    onClick={() => setAdaptiveDifficultyEnabled(!adaptiveDifficultyEnabled)}
    className={`w-14 h-8 rounded-full transition-colors ${
      adaptiveDifficultyEnabled ? 'bg-blue-600' : 'bg-gray-300'
    }`}
  >
    <div className={`w-6 h-6 bg-white rounded-full shadow transition-transform ${
      adaptiveDifficultyEnabled ? 'translate-x-7' : 'translate-x-1'
    }`} />
  </button>
</div>
```

### Step 3: Add Difficulty Increase Logic

In the feedback phase, after calculating results:

```typescript
// After calculating accuracy
const handleAdaptiveDifficulty = () => {
  if (!adaptiveDifficultyEnabled) return null;
  if (!isCorrect) return null; // Only on 100%
  
  const nextDifficulty: Record<DifficultyLevel, DifficultyLevel | null> = {
    'easy': 'medium',
    'medium': 'hard',
    'hard': null // Already at max
  };
  
  const next = nextDifficulty[difficulty];
  
  if (next) {
    setDifficulty(next);
    return { from: difficulty, to: next };
  }
  
  return { maxReached: true };
};
```

### Step 4: Show Notification on Feedback Screen

```tsx
{adaptiveDifficultyEnabled && isCorrect && (
  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
    {difficulty === 'hard' ? (
      <>
        <p className="font-bold text-blue-800">🏆 Maximum Level Reached!</p>
        <p className="text-sm text-blue-600">Patient has mastered the hardest difficulty</p>
      </>
    ) : (
      <>
        <p className="font-bold text-blue-800">📈 Difficulty Increased</p>
        <p className="text-sm text-blue-600">
          {difficulty === 'easy' ? 'Easy → Medium' : 'Medium → Hard'}
        </p>
        <p className="text-xs text-gray-500 mt-1">Next test will use higher difficulty</p>
      </>
    )}
  </div>
)}
```

### Step 5: Add Translation Keys (en.json only for now)

```json
{
  "game": {
    "adaptiveDifficulty": "Auto-Increase Difficulty",
    "adaptiveDifficultyHint": "Increase after 100% score",
    "difficultyIncreased": "Difficulty Increased",
    "nextDifficulty": "Next test will use {{level}}",
    "maxLevelReached": "Maximum Level Reached!",
    "maxLevelHint": "Patient has mastered the hardest difficulty"
  }
}
```

### Step 6: Persist Setting (Optional)

Store the toggle preference in localStorage:

```typescript
// On toggle change
localStorage.setItem('adaptiveDifficultyEnabled', JSON.stringify(enabled));

// On app load
const savedPref = localStorage.getItem('adaptiveDifficultyEnabled');
if (savedPref) setAdaptiveDifficultyEnabled(JSON.parse(savedPref));
```

---

## Implementation Checklist

- [x] Add `adaptiveDifficultyEnabled` state variable
- [x] Add toggle switch UI on setup screen
- [x] Add difficulty increase logic after 100% score
- [x] Update feedback screen to show difficulty change notification
- [x] Add "Maximum Level Reached" message for Hard + 100%
- [x] Add translation keys to en.json
- [x] Persist toggle setting in localStorage
- [ ] Test all difficulty transitions (Easy→Medium, Medium→Hard, Hard→Hard)
- [ ] Test toggle on/off behavior

---

## Files Modified

| File | Changes |
|------|---------|
| `App.tsx` | Added state, toggle UI, difficulty increase logic, feedback notification |
| `locales/en.json` | Added translation keys |

---

## Status: ✅ IMPLEMENTED

*Implemented: January 26, 2026*

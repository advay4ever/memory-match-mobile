# Feature Priorities

## Memory Match Mobile - Cognitive Assessment App

This document outlines the prioritized features for improving the cognitive assessment capabilities of the Memory Match Mobile app, designed for rural healthcare workers.

---


## ✅ COMPLETED

| # | Feature | Status | Notes |
|---|---------|--------|-------|
| 1 | **Difficulty Levels (Easy/Medium/Hard)** | ✅ Done | Easy (3 sounds), Medium (4 sounds), Hard (6 sounds). Age-based recommendations included. |
| 2 | **Age Input** | ✅ Done | Optional age input during patient registration. Used for difficulty recommendations. |
| 3 | **Age-Adjusted Scoring + Confidence Display** | ✅ Done | 🟢🟡🔴 indicators based on age group and difficulty. Thresholds for child/adult/older/senior. |
| 4 | **Adaptive Difficulty (Auto-Advance)** | ✅ Done | **Optional toggle** (default: ON). When enabled: starts at Easy, auto-advances on 100% score WITHOUT showing results until wrong answer or max level reached. Finds true cognitive ceiling efficiently. See `docs/ADAPTIVE_DIFFICULTY.md`. |

---

## 🔴 HIGH PRIORITY (Must Have)

These features significantly improve assessment accuracy and reliability.

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 5 | **Per-Patient Alert System** | Low | Trigger "consult doctor" alert based on individual patient's history, not mixed with other patients. |
| 6 | **Enhanced Results Screen** | Medium | Show additional metrics: error count, first-try success rate, hesitation patterns. More data for better assessment. |

---

## 🟡 MEDIUM PRIORITY (Should Have)

These features add valuable functionality but aren't critical for basic operation.

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 7 | **Error Type Tracking** | Medium | Track what kind of mistakes: random errors (less concerning) vs. repeated errors (memory issue). Different error types have different clinical meanings. |
| 8 | **Practice Mode** | Low | Optional warm-up round that doesn't count. Reduces patient anxiety and ensures fair assessment. |
| 9 | **Timer Display During Game** | Low | Show live timer during gameplay. Operator can see if patient is taking unusually long (potential concern indicator). |
| 10 | **Longitudinal Trend Chart** | Medium | Visual chart showing patient's performance over multiple sessions. Detects gradual decline over time. |

---

## 🟢 LOW PRIORITY (Nice to Have)

These features enhance user experience but have lower clinical impact.

| # | Feature | Effort | Description |
|---|---------|--------|-------------|
| 11 | **Sound Playback in Results** | Low | Allow replay of sounds in results screen. Educational for patient to understand what they missed. |
| 12 | **Hint System** | Low | Optional hints for stuck patients. Helps accessibility but may invalidate results. Mark if hints were used. |
| 13 | **Larger Cards Option** | Low | Settings option for larger touch targets. Accessibility for patients with motor difficulties. |

---

## 📋 Visual Priority Summary

```
✅ COMPLETED
─────────────────────────
1. Difficulty Levels          ███████████ ✓ DONE
2. Age Input                  ███████████ ✓ DONE
3. Age-Adjusted Scoring       ███████████ ✓ DONE (includes 🟢🟡🔴)
4. Adaptive Difficulty        ███████████ ✓ DONE (auto-increase on 100%)

HIGH PRIORITY (Do First)
─────────────────────────
5. Per-Patient Alerts         ██████████░ Individual tracking
6. Enhanced Results           ██████████░ Insight

MEDIUM PRIORITY (Do Next)
─────────────────────────
7. Error Type Tracking        ████████░░░ Diagnosis
8. Practice Mode              ███████░░░░ Fairness
9. Timer Display              ██████░░░░░ Context
10. Longitudinal Trends       ██████░░░░░ Long-term view

LOW PRIORITY (Later)
─────────────────────────
11. Sound Playback            ████░░░░░░░ Education
12. Hint System               ███░░░░░░░░ Accessibility
13. Larger Cards              ███░░░░░░░░ Accessibility
```

---

## 🚀 Recommended Implementation Phases

### Phase 1: Core Assessment Improvements ✅ NEARLY COMPLETE
*No backup infrastructure needed*

- [x] Difficulty Levels (Easy/Medium/Hard)
- [x] Age Input
- [x] Age-Adjusted Scoring + Confidence Display (🟢🟡🔴)
- [x] Adaptive Difficulty (Auto-Increase on 100%, optional toggle)
- [ ] Per-Patient Alert System

**Outcome:** More accurate and clinically useful assessments

---

### Phase 2: Better Insights
*Enhanced data during each session*

- [ ] Enhanced Results Screen
- [ ] Error Type Tracking
- [ ] Practice Mode

**Outcome:** Deeper understanding of patient's cognitive state

---

### Phase 3: Visualization
*Long-term data analysis*

- [ ] Longitudinal Trend Chart
- [ ] Timer Display During Game

**Outcome:** Track patients over time, spot gradual decline

---

### Phase 4: Polish & Accessibility
*Quality of life improvements*

- [ ] Sound Playback in Results
- [ ] Hint System
- [ ] Larger Cards Option

**Outcome:** Better user experience for all users

---

## 📚 Research Basis

These priorities are informed by cognitive assessment research:

1. **Difficulty Levels** - Based on neuropsychological testing standards that use graduated difficulty
2. **Age-Adjusted Scoring** - Standard practice in cognitive screening (MMSE, MoCA use age norms)
3. **Longitudinal Tracking** - Research shows decline rate is more diagnostic than single scores
4. **Response Time** - Processing speed is an early indicator of cognitive decline

### Key Citations

- Welsh KA, et al. (1992). "Detection and staging of dementia in Alzheimer disease." *Archives of Neurology*
- Petersen RC, et al. (1999). "Mild cognitive impairment: clinical characterization and outcome." *Archives of Neurology*
- Craik FIM, Bialystok E, Freedman M. (2010). "Delaying the onset of Alzheimer disease." *Neurology*

---

## 📝 Notes

- ✅ Difficulty Levels implemented: Easy (3 sounds), Medium (4 sounds), Hard (6 sounds)
- ✅ Age input implemented with age-based difficulty recommendations
- ✅ Age-Adjusted Scoring with 🟢🟡🔴 confidence indicators by age group
- ✅ Adaptive Difficulty implemented: Auto-increases after 100% score (optional toggle)
- Features should include translations for 15 supported languages (add to en.json first, batch translate later)
- Mobile-first design for rural healthcare workers using smartphones

---

*Last updated: January 26, 2026*

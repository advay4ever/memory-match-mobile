# Feature Details & Implementation Guide

## Memory Match Mobile - Cognitive Assessment App

This document contains detailed explanations, UI mockups, and implementation notes for all planned features.

---

# Table of Contents

1. [Difficulty Levels](#1-difficulty-levels)
2. [Age Input + Adjusted Scoring](#2-age-input--adjusted-scoring)
3. [Confidence Score Display](#3-confidence-score-display)
4. [Enhanced Results Screen](#4-enhanced-results-screen)
5. [Google Sheets Auto-Sync](#5-google-sheets-auto-sync)
6. [Error Type Tracking](#6-error-type-tracking)
7. [Practice Mode](#7-practice-mode)
8. [WhatsApp Backup](#8-whatsapp-backup)
9. [Timer Display](#9-timer-display)
10. [Longitudinal Trend Chart](#10-longitudinal-trend-chart)
11. [Sound Playback in Results](#11-sound-playback-in-results)
12. [Hint System](#12-hint-system)
13. [Larger Cards Option](#13-larger-cards-option)
14. [Export/Import Data](#14-exportimport-data)
15. [Backup Reminder](#15-backup-reminder)

---

# 1. Difficulty Levels

## Priority: 🔴 HIGH

## Description
Add three difficulty levels to make the assessment more sensitive. Currently, healthy patients can score 100%, leaving no room to detect subtle decline.

## Difficulty Settings

| Level | Card Pairs | Total Cards | Sounds Used | Target User |
|-------|------------|-------------|-------------|-------------|
| Easy | 3 pairs | 6 cards | 3 sounds | Severely impaired patients |
| Medium | 6 pairs | 12 cards | 6 sounds | General screening (current) |
| Hard | 9 pairs | 18 cards | 9 sounds | Detect subtle early decline |

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  Select Difficulty                  │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │  EASY   │ │ MEDIUM  │ │  HARD   ││
│  │         │ │         │ │         ││
│  │ 3 pairs │ │ 6 pairs │ │ 9 pairs ││
│  │         │ │    ✓    │ │         ││
│  └─────────┘ └─────────┘ └─────────┘│
│                                     │
│  Recommended: Medium for first test │
│                                     │
└─────────────────────────────────────┘
```

## Clinical Rationale
- **Easy**: For patients who struggle with Medium level
- **Medium**: Standard screening - good for most patients
- **Hard**: For healthy patients to establish baseline; small decline becomes visible

---

# 2. Age Input + Adjusted Scoring

## Priority: 🔴 HIGH

## Description
Collect patient age before the game and adjust scoring thresholds accordingly. Normal performance varies significantly by age.

## Age-Adjusted Thresholds

| Age Group | Normal Score | Mild Concern | Significant Concern |
|-----------|--------------|--------------|---------------------|
| 50-60 | 85%+ | 70-84% | Below 70% |
| 60-70 | 75%+ | 60-74% | Below 60% |
| 70-80 | 65%+ | 50-64% | Below 50% |
| 80+ | 55%+ | 40-54% | Below 40% |

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  Patient's Age                      │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  50-60  │ │  60-70  │           │
│  └─────────┘ └─────────┘           │
│                                     │
│  ┌─────────┐ ┌─────────┐           │
│  │  70-80  │ │   80+   │           │
│  └─────────┘ └─────────┘           │
│                                     │
└─────────────────────────────────────┘
```

## Result Display Example

**Age 55, Score 65%:**
```
Score: 65%
🔴 Below average for age 50-60
Recommendation: Medical evaluation
```

**Age 75, Score 65%:**
```
Score: 65%
🟢 Normal for age 70-80
Recommendation: Routine retest in 3 months
```

---

# 3. Confidence Score Display

## Priority: 🔴 HIGH

## Description
Show a clear, color-coded indicator that tells the operator exactly what to do. No ambiguity.

## Color Coding

| Color | Meaning | Action |
|-------|---------|--------|
| 🟢 Green | Normal | Routine follow-up |
| 🟡 Yellow | Monitor | Retest in 2-4 weeks |
| 🔴 Red | Concern | Refer to doctor |

## UI Mockup - Normal Result

```
┌─────────────────────────────────────┐
│                                     │
│             🟢                      │
│           NORMAL                    │
│                                     │
│    Score: 83%                       │
│    Time: 45 seconds                 │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│    This result suggests healthy     │
│    cognitive function for this      │
│    patient's age group.             │
│                                     │
│    📋 RECOMMENDATION:               │
│    Routine retest in 3-6 months     │
│                                     │
└─────────────────────────────────────┘
```

## UI Mockup - Concerning Result

```
┌─────────────────────────────────────┐
│                                     │
│             🔴                      │
│       NEEDS ATTENTION               │
│                                     │
│    Score: 42%                       │
│    Time: 89 seconds                 │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│    This result suggests possible    │
│    cognitive concerns that should   │
│    be evaluated by a doctor.        │
│                                     │
│    📋 RECOMMENDATION:               │
│    Refer for medical evaluation     │
│                                     │
└─────────────────────────────────────┘
```

---

# 4. Enhanced Results Screen

## Priority: 🔴 HIGH

## Description
Show additional metrics beyond accuracy and time to give deeper insight.

## Metrics to Add

| Metric | What It Measures | How to Calculate |
|--------|------------------|------------------|
| First-try matches | Immediate recall | Matches on first attempt / Total pairs |
| Wrong attempts | Error frequency | Count of incorrect matches |
| Average hesitation | Processing speed | Time between card flips |
| Consistency | Stability | Variation in response times |

## UI Mockup

```
┌─────────────────────────────────────┐
│  📊 Detailed Results                │
│                                     │
│  MAIN SCORES                        │
│  ─────────────────────────────────  │
│  Accuracy:        83%     🟢        │
│  Total Time:      45s     🟢        │
│                                     │
│  DETAILED ANALYSIS                  │
│  ─────────────────────────────────  │
│  First-try matches:   4/6 (67%)     │
│  Wrong attempts:      3             │
│  Avg hesitation:      2.3s          │
│                                     │
│  PATTERNS                           │
│  ─────────────────────────────────  │
│  ✓ Consistent response times        │
│  ✓ No repeated errors               │
│  ⚠ Slower in second half            │
│                                     │
└─────────────────────────────────────┘
```

---

# 5. Google Sheets Auto-Sync

## Priority: 🔴 HIGH

## Description
Automatically sync all session data to a Google Sheet. Zero effort for the worker after initial setup.

## Benefits

| Benefit | Description |
|---------|-------------|
| Automatic backup | Data saved without any action |
| Remote access | Supervisor can view from anywhere |
| Data analysis | Easy to analyze in spreadsheet |
| Free | Google Sheets is free |

## How It Works

```
Worker finishes game
       ↓
App automatically sends data to Google Sheet
       ↓
Data appears as new row
       ↓
Worker never has to do anything!
```

## Sheet Structure

| Date | Time | Patient | Age | Attempt | Accuracy | Time(s) | Result | Notes |
|------|------|---------|-----|---------|----------|---------|--------|-------|
| 2026-01-25 | 09:30 | Maria | 72 | 1 | 83% | 45 | 🟢 Normal | |
| 2026-01-25 | 09:45 | John | 68 | 3 | 58% | 72 | 🔴 Concern | Referred |

## Setup Required
1. Create Google Sheet
2. Set up Google Apps Script
3. Enter Sheet ID in app settings (one-time)

---

# 6. Error Type Tracking

## Priority: 🟡 MEDIUM

## Description
Track what kinds of mistakes patients make. Different error types have different clinical meanings.

## Error Categories

| Error Type | Description | Clinical Meaning |
|------------|-------------|------------------|
| Random error | Single wrong match | Normal confusion |
| Repeated error | Same wrong match multiple times | Memory concern |
| Perseverative | Keeps trying matched pairs | Executive function issue |
| Near-miss | Confused similar sounds | Less concerning |

## UI Mockup

```
┌─────────────────────────────────────┐
│  Error Analysis                     │
│                                     │
│  Total errors: 3                    │
│                                     │
│  ├─ Random errors: 2                │
│  │  (Normal - minor confusion)      │
│  │                                  │
│  └─ Repeated errors: 1              │
│     ⚠ Tried dog/cat twice           │
│     (May indicate memory issue)     │
│                                     │
└─────────────────────────────────────┘
```

---

# 7. Practice Mode

## Priority: 🟡 MEDIUM

## Description
A warm-up round that doesn't count toward assessment. Reduces anxiety and ensures fair testing.

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  🎮 Practice Round                  │
│                                     │
│  This is just for practice.         │
│  Results will NOT be saved.         │
│                                     │
│  The patient can learn how          │
│  the game works without stress.     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │     START PRACTICE          │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  [Skip - Start Real Test]           │
│                                     │
└─────────────────────────────────────┘
```

---

# 8. WhatsApp Backup

## Priority: 🟡 MEDIUM

## Description
One-tap backup to WhatsApp. Familiar to rural workers in developing countries.

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  💾 Save Your Data                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │  📱 Send to WhatsApp        │   │
│  │                             │   │
│  │  Saves all patient data     │   │
│  │  to your WhatsApp           │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  Last saved: January 20, 2026       │
│  Sessions since backup: 5           │
│                                     │
└─────────────────────────────────────┘
```

## How It Works
1. Worker taps "Send to WhatsApp"
2. WhatsApp opens with data file attached
3. Worker sends to themselves or supervisor
4. To restore: Open message, tap file

---

# 9. Timer Display

## Priority: 🟡 MEDIUM

## Description
Show a live timer during the game so operator can see how long it's taking.

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  ⏱️ 0:32                            │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  ?  │ │  ?  │ │  ?  │ │  ?  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  ?  │ │ 🐕  │ │  ?  │ │  ?  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  ?  │ │  ?  │ │  ?  │ │  ?  │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                     │
└─────────────────────────────────────┘
```

---

# 10. Longitudinal Trend Chart

## Priority: 🟡 MEDIUM

## Description
Visual chart showing patient's performance over multiple sessions. Detects gradual decline.

## What It Shows

```
📊 Maria's Performance Trend

   Session 1 (Jan 5):   85% ████████░░
   Session 2 (Jan 12):  82% ████████░░
   Session 3 (Jan 19):  78% ███████░░░
   Session 4 (Jan 26):  71% ███████░░░
   
   📉 Trend: Gradual decline (-14% over 3 weeks)
   
   🟡 RECOMMENDATION: Monitor closely, retest in 1 week
```

## Trend Categories

| Pattern | Status | Action |
|---------|--------|--------|
| Stable (±5%) | 🟢 Normal | Routine follow-up |
| Mild decline (5-15%) | 🟡 Monitor | Increase testing frequency |
| Significant decline (>15%) | 🔴 Concern | Refer to doctor |

---

# 11. Sound Playback in Results

## Priority: 🟢 LOW

## Description
Allow replay of sounds in results screen so patient can learn what they missed.

## UI Mockup

```
┌─────────────────────────────────────┐
│  Sounds Review                      │
│                                     │
│  Your matches:                      │
│  ├─ 🔊 Dog bark      ✅ Correct     │
│  ├─ 🔊 Bell ring     ✅ Correct     │
│  ├─ 🔊 Bird chirp    ❌ Missed      │
│  └─ 🔊 Water drop    ✅ Correct     │
│                                     │
│  Tap 🔊 to hear the sound again     │
│                                     │
└─────────────────────────────────────┘
```

---

# 12. Hint System

## Priority: 🟢 LOW

## Description
Optional hints for patients who are stuck. Marks that hints were used.

## UI Mockup

```
┌─────────────────────────────────────┐
│                                     │
│  Patient seems stuck?               │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  💡 Show Hint               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Using hints will be noted      │
│  in the results                     │
│                                     │
└─────────────────────────────────────┘
```

## Result with Hints

```
Results:
  Accuracy: 83%
  Time: 52 seconds
  Hints used: 2 ⚠️
  
  Note: Results may not reflect true
  ability due to hint usage.
```

---

# 13. Larger Cards Option

## Priority: 🟢 LOW

## Description
Settings option for larger touch targets. Helps patients with motor difficulties.

## UI Mockup - Settings

```
┌─────────────────────────────────────┐
│  ⚙️ Settings                        │
│                                     │
│  Card Size                          │
│  ┌──────────────┐ ┌──────────────┐ │
│  │   Normal     │ │    LARGE     │ │
│  │      ✓       │ │              │ │
│  └──────────────┘ └──────────────┘ │
│                                     │
│  Sound Volume                       │
│  ──────────●───────────             │
│                                     │
└─────────────────────────────────────┘
```

---

# 14. Export/Import Data

## Priority: 🟢 LOW

## Description
Manual export/import of data files. For technical users or backup.

## Export Options

| Format | Best For |
|--------|----------|
| JSON | Re-importing to app |
| CSV | Opening in Excel/Sheets |

## UI Mockup

```
┌─────────────────────────────────────┐
│  📊 Data Management                 │
│                                     │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ 📤 Export   │  │ 📥 Import   │  │
│  │    Data     │  │    Data     │  │
│  └─────────────┘  └─────────────┘  │
│                                     │
│  Export as:                         │
│  [JSON - for backup]                │
│  [CSV - for Excel]                  │
│                                     │
└─────────────────────────────────────┘
```

## Exported JSON Structure

```json
{
  "exportDate": "2026-01-25T10:30:00Z",
  "appVersion": "1.0.0",
  "totalSessions": 47,
  "sessions": [
    {
      "id": "abc123",
      "timestamp": "2026-01-15T09:00:00Z",
      "participantName": "Maria Santos",
      "attemptNumber": 1,
      "accuracy": 83.3,
      "reactionTime": 45200,
      "correctSounds": ["dog", "bell", "water"],
      "selectedSounds": ["dog", "bell", "water"],
      "gameNumber": 1,
      "isCorrect": true
    }
  ]
}
```

## Exported CSV Structure

```csv
Date,Patient Name,Attempt,Accuracy %,Time (s),Result
2026-01-15,Maria Santos,1,83.3,45.2,Correct
2026-01-22,Maria Santos,2,66.7,52.1,Incorrect
```

---

# 15. Backup Reminder

## Priority: 🟢 LOW

## Description
Remind operator to backup data periodically if using manual backup.

## UI Mockup

```
┌─────────────────────────────────────┐
│  ⚠️ Backup Reminder                 │
│                                     │
│  You haven't backed up in 7 days.   │
│  You have 12 new sessions.          │
│                                     │
│  ┌─────────────┐  ┌─────────────┐  │
│  │ Backup Now  │  │ Remind Later│  │
│  └─────────────┘  └─────────────┘  │
│                                     │
│  □ Don't remind me again            │
│                                     │
└─────────────────────────────────────┘
```

---

# Research Citations

## Key Studies Supporting These Features

### Difficulty Levels & Scoring
- Welsh KA, Butters N, Hughes JP, Mohs RC, Heyman A. (1992). "Detection and staging of dementia in Alzheimer disease: Use of the neuropsychological measures developed for the Consortium to Establish a Registry for Alzheimer's Disease." *Archives of Neurology*, 49(4), 448-452.

### Age-Adjusted Norms
- Petersen RC, Smith GE, Waring SC, et al. (1999). "Mild cognitive impairment: clinical characterization and outcome." *Archives of Neurology*, 56(3), 303-308.

### Longitudinal Tracking
- Jack CR, et al. (2010). "Hypothetical model of dynamic biomarkers of the Alzheimer's pathological cascade." *Lancet Neurology*, 9(1), 119-128.

### Cognitive Reserve
- Craik FIM, Bialystok E, Freedman M. (2010). "Delaying the onset of Alzheimer disease: Bilingualism as a form of cognitive reserve." *Neurology*, 75(19), 1726-1729.

### Processing Speed
- Salthouse TA. (1996). "The processing-speed theory of adult age differences in cognition." *Psychological Review*, 103(3), 403-428.

---

*Last updated: January 25, 2026*

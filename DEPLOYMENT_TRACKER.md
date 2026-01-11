# Deployment Tracker — Memory Match Mobile

## 🏥 About This App

**Memory Match Mobile** is a cognitive assessment tool designed for rural health workers to screen patients for memory and cognitive impairment. The app tests immediate recall, delayed recall, and attention through an audio-based number sequence game.

**Target Users:** Community health workers, nurses, and medical staff in rural clinics with limited resources, unreliable internet, and basic smartphones.

**Key Features:**
- 🌍 15 languages (English, Chinese, Hindi, Spanish, French, Arabic, Bengali, Portuguese, Russian, Japanese, German, Swahili, Hausa, Amharic, Yoruba)
- ♿ WCAG 2.1 AA accessible (large touch targets, keyboard navigation, screen reader support)
- 📱 Optimized for cheap Android phones ($50-100 devices)
- 🔊 Audio-based cognitive testing
- 📊 Exportable patient results

**Current Status:** 92/100 accessibility score, production-ready UI, awaiting deployment preparation.

---

Use this file to track launch tasks for rural health workers. Click checkboxes in VS Code or GitHub to mark done.

## How to use
- Update an item by changing `- [ ]` → `- [x]` when complete.
- Add owner and date next to completed items.
- Move lower-priority items below when you finish critical work.

---

## � Me Description

**Who I am:** [Add your name and role here]

**My goal with this project:** [Describe why you're building this app and what impact you hope to make for rural health workers]

**Timeline:** [Add your target launch date or milestone]

---

## �🔴 Critical (Blockers) — Must before pilot
- [ ] Verify translations exist and are complete for all 15 languages (owner: ) — ETA:
- [ ] Implement PWA offline support (service worker, cache assets, IndexedDB) (owner: ) — ETA:
- [ ] Persist assessment results locally and add export (CSV/PDF) (owner: ) — ETA:
- [ ] Test on cheap Android phone (Android 8/9, 1-2GB RAM) and fix issues (owner: ) — ETA:
- [ ] Privacy policy & data retention notice (translations) (owner: ) — ETA:

## 🟠 High priority
- [ ] Battery/animation optimizations (reduce animate-pulse, provide low-power mode) (owner: )
- [ ] Clear localized error messages and translations (owner: )
- [ ] Volume check/replay options for audio-based phases (owner: )
- [ ] Installation instructions (PWA install guide + screenshots) (owner: )

## 🟡 Medium priority
- [ ] Training materials (short manual + video) in top languages (owner: )
- [ ] Large-text / high-contrast accessibility toggle (owner: )
- [ ] Practice mode (no-save demo) (owner: )
- [ ] Analytics (privacy-safe) to track language usage & completion rates (owner: )
- [ ] Backup & restore (export/import JSON, QR transfer) (owner: )

## 🟢 Low priority
- [ ] Visual polish (Phase 6/7 items: checkmarks, toasts, scroll indicators) (owner: )
- [ ] Multi-patient queue & dashboard (owner: )
- [ ] EHR integration / SMS sharing / Bluetooth printer (future) (owner: )

---

## Quick links
- Test plan: `TEST_PHASE4.md`
- Component: `components/LanguageSelector.tsx`

---

_Last updated: 2026-01-11_

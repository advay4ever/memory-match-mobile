# Deployment Tracker — Memory Match Mobile

Use this file to track launch tasks for rural health workers. Click checkboxes in VS Code or GitHub to mark done.

## How to use
- Update an item by changing `- [ ]` → `- [x]` when complete.
- Add owner and date next to completed items.
- Move lower-priority items below when you finish critical work.

---

## 🔴 Critical (Blockers) — Must before pilot
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

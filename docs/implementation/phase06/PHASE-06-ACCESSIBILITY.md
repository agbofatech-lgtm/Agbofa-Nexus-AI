# Phase 06 — Accessibility evidence

Environment: static inspection of Phase 06 components + production HTML. No assistive-technology runtime.

| Test ID | Description | Result | Classification |
|---|---|---|---|
| PH06-R31 | Keyboard | Search uses combobox, Escape clears, Ctrl/Cmd-K focuses. Full focus-order runtime not driven | STATIC PASS / RUNTIME BLOCKED |
| PH06-R32 | Focus | Existing OS focus styles retained; header search expanded state exposed | STATIC PASS / RUNTIME BLOCKED |
| PH06-R33 | Reduced motion | `prefers-reduced-motion` rules in `phase-six.css` | STATIC PASS |
| PH06-R34 | Semantic/ARIA | Sections, headings, tables with row headers, listbox/combobox, activity `role=status` empty | STATIC PASS |
| PH06-R35 | Contrast | Existing cinematic tokens; no new low-contrast palette. Runtime contrast not measured | STATIC PASS / RUNTIME BLOCKED |

Do not treat this file as WCAG 2.2 AA runtime certification.

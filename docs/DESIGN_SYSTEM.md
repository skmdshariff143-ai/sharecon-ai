# ShaRecon AI — Fintech Design System & Component Guidelines

## 1. Visual Language & Principles

- **Quiet Confidence**: Professional financial tools should feel robust, dependable, and calm. High density is preferred over unnecessary whitespace.
- **Evidence Before Decoration**: Visual elements must communicate status, lineage, or risk. Avoid decorative gradients, 3D shapes, or generic AI sparkle icons.
- **Restrained Color Coding**: Colors represent financial state, not arbitrary aesthetics:
  - **Slate / Navy (`#0f172a`, `#1e293b`, `#334155`)**: Primary text, headers, and navigation rail.
  - **Electric Blue (`#2563eb`, `#1d4ed8`)**: Primary interactive accent, selected tabs, and focus rings.
  - **Emerald (`#059669`, `#10b981`)**: Verified safe automated matches and successful reconciliations.
  - **Amber (`#d97706`, `#f59e0b`)**: Review-required states, ambiguous amounts, and manual queues.
  - **Rose (`#dc2626`, `#ef4444`)**: Unmatched exceptions, missing bank advice, and financial exposure.
  - **Violet (`#7c3aed`, `#8b5cf6`)**: Strictly reserved for Grounded AI Advisory features and disclosures.

---

## 2. Typography & Formatting

- **Font Family**: Modern sans-serif (`Inter`, system-ui) for interface copy; tabular monospace (`ui-monospace`, `SFMono-Regular`) for identifiers, UTRs, timestamps, and currency numbers.
- **Monetary Representation**: Indian Numbering Format (`en-IN`) strictly formatted from integer paise (`₹1,540.50`, `₹18,28,782.00`).
- **Date Representation**: ISO 8601 timestamps and compact dates (`2026-03-02 10:00 UTC` or `02 Mar 2026`).

---

## 3. Workspace Layout Architecture

```
+-------------------------------------------------------------------------+
| TOP COMMAND BAR (Product Identity, Dataset Status, Dry-Run, AI Status)  |
+------------+------------------------------------------------------------+
| LEFT RAIL  | WORKSPACE CONTENT CONTAINER (Responsive & Scrollable)      |
|  - Control |                                                            |
|  - Reconc. |  [Workspace Header & Quick Actions]                        |
|  - Except. |  [KPI Summary Metric Cards]                                |
|  - Audit   |  [Interactive Grids / Visualizations / Facet Filters]       |
|  - Lab     |  [Data Tables / Exception Triage Cards]                    |
|  - Safety  |                                                            |
+------------+------------------------------------------------------------+
```

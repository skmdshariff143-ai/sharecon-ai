# ShaRecon AI — Fintech Design System & Component Guidelines

**Product**: ShaRecon AI  
**Tagline**: *Explainable reconciliation. Confident financial control.*  
**Design Philosophy**: Institutional clarity, restrained elegance, zero decorative noise, rock-solid numerical readability.

---

## 1. Color Palette & Semantic Roles

| Token Name | Hex Code | Tailwind Utility | Semantic Purpose |
| :--- | :--- | :--- | :--- |
| **Nav Surface** | `#0f172a` | `bg-slate-900` | Deep navy primary navigation rail and persistent branding shell |
| **Canvas Background**| `#f8fafc` | `bg-slate-50` | Soft warm neutral canvas preventing harsh contrast fatigue |
| **Card Surface** | `#ffffff` | `bg-white` | Elevated data container with subtle `border-slate-200` |
| **Subtle Inset** | `#f1f5f9` | `bg-slate-100` | Inset metrics, table headers, and secondary grouping containers |
| **Brand Accent** | `#2563eb` | `bg-blue-600` | Primary action buttons, active navigation states, focus rings |
| **Verified Emerald**| `#10b981` | `text-emerald-700 bg-emerald-50`| Auto-reconciled matches, zero exposure, positive validation |
| **Triage Amber** | `#f59e0b` | `text-amber-800 bg-amber-50` | Pending human review queue, medium confidence, warnings |
| **Risk & Exposure Rose**| `#ef4444` | `text-rose-700 bg-rose-50` | Unmatched exceptions, monetary exposure, critical severity |
| **AI Advisory Violet**| `#8b5cf6` | `text-violet-700 bg-violet-50`| Grounded Gemini analysis, deterministic fallback, assistant |

---

## 2. Typography Hierarchy

| Style Role | Font Family | Size / Weight | Line Height | Application |
| :--- | :--- | :--- | :--- | :--- |
| **App Header Title** | System Sans (`font-sans`) | `text-base font-bold` | `leading-tight` | Persistent top bar brand & view titles |
| **Section Header** | System Sans (`font-sans`) | `text-sm font-bold` | `leading-snug` | Workspace section titles, card group headers |
| **Body Standard** | System Sans (`font-sans`) | `text-xs font-normal` | `leading-relaxed`| Descriptions, audit notes, trace explanations |
| **Label / Sub-header**| System Sans (`font-sans`) | `text-[10px] font-semibold uppercase tracking-wider` | `leading-none` | Table column headers, badge labels, metadata tags |
| **Financial Values** | Monospace (`font-mono`) | `text-xs to text-xl font-bold tabular-nums` | `leading-none` | Rupee amounts, paise deltas, confidence percentages, IDs |

---

## 3. Surface & Elevation Layers

1. **Layer 0 (Canvas)**: `#f8fafc` (`bg-slate-50`)
2. **Layer 1 (Card Containers)**: `#ffffff` (`bg-white border border-slate-200/80 rounded-2xl shadow-xs`)
3. **Layer 2 (Inset Surfaces & Drilldowns)**: `#f8fafc` (`bg-slate-50/80 border border-slate-200/60 rounded-xl`)
4. **Layer 3 (Modals, Overlays, Evidence Drawer)**: Floating `#ffffff` (`shadow-2xl border border-slate-200`) with backdrop `bg-slate-950/40 backdrop-blur-2xs`
5. **Layer 4 (Command Palette & Guided Tour)**: `#0f172a` floating dark glass with gradient top highlight `from-blue-500 via-violet-500 to-emerald-500`

---

## 4. Interaction & Motion Standards

- **Transitions**: `transition-colors duration-150 ease-in-out` on interactive buttons and tab switches.
- **Card Hover**: Subtle hover feedback (`hover:border-slate-300 hover:shadow-xs`) without jarring transform jumps.
- **Drawer Slide-in**: Smooth `translate-x` slide over `200ms ease-out` with backdrop blur.
- **Reduced Motion**: Respects `@media (prefers-reduced-motion: reduce)` by disabling transform transitions.
- **Touch Targets**: Minimum `44 × 44` px clickable bounding area for mobile action buttons.

---

## 5. Accessibility Requirements

- Color contrast ratio \(\ge 4.5:1\) for all body copy and \(\ge 3:1\) for interface borders and icons.
- Never convey financial state by color alone — always accompany badges with descriptive text and icons (`CheckCircle2`, `Clock`, `AlertCircle`, `ShieldCheck`).
- Strict focus rings (`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`).
- Full keyboard trap and `Escape` dismiss on all overlays.

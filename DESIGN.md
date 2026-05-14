\# Design System Document



\## 1. Overview \& Creative North Star: "Fleet Master (Precision and Control)d"

The automotive industry is defined by precision, movement, and technical mastery. This design system moves away from the static, boxy layouts of traditional enterprise software toward a "Engine" aesthetic. 



The North Star of this system is \*\*High-Velocity Clarity\*\*. We achieve this through "The Digital Curator" approach: using intentional asymmetry to draw eyes to critical metrics, overlapping elements to create a sense of depth and motion, and an editorial typography scale that treats data as a headline, not just a value. By rejecting standard grid containers in favor of layered, tonal surfaces, we create a dashboard that feels less like a spreadsheet and more like a high-end vehicle’s head-up display (HUD).



\## 2. Colors \& Surface Philosophy

The palette utilizes a sophisticated spectrum of blues and slates to establish a "high-tech" atmosphere, punctuated by high-energy "Safety Orange" (`tertiary`) for critical alerts.



\### The "No-Line" Rule

Explicitly prohibited: 1px solid borders for sectioning content. Boundaries must be defined through background shifts or tonal transitions. To separate a sidebar from a main feed, use `surface-container-low` against a `surface` background. The eye should perceive the change in depth, not a drawn line.



\### Surface Hierarchy \& Nesting

Treat the UI as physical layers of frosted glass and machined metal. 

\- \*\*Base Layer:\*\* `surface` (#faf8ff) for the overall application canvas.

\- \*\*Content Zones:\*\* Use `surface-container` to group major modules.

\- \*\*Interactive Layers:\*\* Nested cards should use `surface-container-lowest` (#ffffff) to "pop" forward, or `surface-container-highest` to indicate a recessed, secondary interactive area.



\### The "Glass \& Gradient" Rule

For floating action panels or navigation overlays, apply \*\*Glassmorphism\*\*: 

\- Background: `surface-variant` at 70% opacity.

\- Backdrop-blur: 20px. 

\- Main CTAs should utilize a linear gradient from `primary` (#0051c9) to `primary\_container` (#316be4) at a 135-degree angle to provide a "soul" and visual depth that flat colors lack.



\## 3. Typography: The Editorial Edge

We use a dual-typeface system to balance technical efficiency with premium brand authority.



\*   \*\*Display \& Headlines (Manrope):\*\* Chosen for its geometric precision and modern "tech" feel. Use `display-lg` for hero metrics (e.g., total fleet uptime) to make them feel like a statement.

\*   \*\*Body \& Labels (Inter):\*\* The workhorse. `body-md` and `label-sm` provide maximum legibility for dense data tables and status readouts.

\*   \*\*Intentional Contrast:\*\* Always pair a `headline-sm` in Manrope with a `label-md` in Inter (all-caps, tracked out +5%) to create a sophisticated, high-end hierarchy that guides the user’s eye.



\## 4. Elevation \& Depth: Tonal Layering

Traditional shadows are often "dirty." In this system, we use light and color to convey height.



\*   \*\*The Layering Principle:\*\* Depth is achieved by stacking. Place a `surface-container-lowest` card on top of a `surface-container-low` section. This creates a soft, natural lift.

\*   \*\*Ambient Shadows:\*\* For high-elevation elements like modals or floating tooltips, use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(19, 27, 46, 0.06)`. The shadow color is a tinted version of `on\_surface` to mimic natural light.

\*   \*\*The "Ghost Border" Fallback:\*\* If a container requires more definition (e.g., in high-density charts), use a "Ghost Border": `outline-variant` (#c2c6d8) at 15% opacity. Never use 100% opaque borders.



\## 5. Components



\### Cards \& Data Modules

\*   \*\*Constraint:\*\* Forbid divider lines. Use vertical white space (1.5rem to 2rem) or `surface-container` shifts to separate metrics.

\*   \*\*Style:\*\* Use the `xl` (0.75rem) roundedness for main cards to soften the technical edge.

\*   \*\*Interactive Charts:\*\* Background grids in charts should use the "Ghost Border" style (10% opacity `outline`).



\### Buttons \& Actions

\*   \*\*Primary:\*\* Gradient of `primary` to `primary\_container`. Text: `on\_primary`. Shape: `full` (pill-shaped) for high-energy "action" feel.

\*   \*\*Secondary:\*\* `surface-container-highest` background with `primary` text. No border.

\*   \*\*Tertiary (Alert):\*\* Use `tertiary` (#954000) solely for critical automotive failures or safety alerts.



\### Status Badges \& Chips

\*   \*\*Logic:\*\* Use `secondary\_container` for neutral states and `error\_container` for critical issues.

\*   \*\*Shape:\*\* `md` (0.375rem) corner radius to differentiate them from the "pill" buttons.



\### Automotive Specifics

\*   \*\*The Progress Engine:\*\* Use linear progress bars for fuel/battery levels. Background: `surface-variant`. Fill: `primary`. 

\*   \*\*Status Indicators:\*\* Use pulsing semi-transparent rings around `tertiary` icons to indicate active alerts without cluttering the screen with text.



\## 6. Do's and Don'ts



\### Do:

\*   \*\*Do\*\* use asymmetrical layouts for dashboards (e.g., a 70/30 split where the 30% side uses a different `surface-container` tier).

\*   \*\*Do\*\* utilize `surface-bright` for hover states on cards to create a "glow" effect.

\*   \*\*Do\*\* favor `manrope` for any numeric value above 24px to emphasize the "machine" aesthetic.



\### Don't:

\*   \*\*Don't\*\* use pure black (#000000) for text. Use `on\_surface` (#131b2e) for high-contrast readability.

\*   \*\*Don't\*\* use standard "drop shadows" on every card. Rely on the "No-Line" color shifts first.

\*   \*\*Don't\*\* use 1px dividers to separate list items; use 8px of `surface` space or subtle tonal shifts between `surface-container-low` and `surface-container-lowest`.


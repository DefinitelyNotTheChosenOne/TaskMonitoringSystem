---
trigger: always_on
---

NEUMORPHISM.md, design spec for AI agents
Follow these tokens verbatim. Accessibility rules are NOT optional.

== 1. Visual identity ==
Palette: monochrome. One base hue for page AND every surface.
  --bg:      #E0E5EC  /* light mode: page and cards are identical */
  --bg-dark: #2A2D32  /* dark mode base */
Accent: exactly one saturated color, used ONLY on interactive
  --accent:  #5B7CFA  /* buttons, active toggle, focus ring */
Radius: 12-20px on all elements. Never sharp, never balloon-round.
Contrast rule: surfaces match the page; depth comes from shadow,
  never from fill color.

== 2. Shadow recipes (the whole look) ==
Light source is ALWAYS top-left. Keep it consistent screen-wide.
Extrude (resting, raised):
  box-shadow:
    -8px -8px 16px var(--light),  /* highlight, top-left */
     8px  8px 16px var(--dark);   /* shade, bottom-right */
Inset (pressed / input wells):
  box-shadow:
    inset 6px 6px 12px var(--dark),
    inset -6px -6px 12px var(--light);
Light/dark stops:
  light mode -> --light #FFFFFF, --dark #A3B1C6
  dark  mode -> --light #34383E, --dark #1C1E21
  (dark mode: highlight is light gray, NOT white; shade is
   dark gray, NOT black)

== 3. Typography ==
  Family: clean sans, like Inter, SF Pro, Manrope, Nunito Sans
  Weights: 500 body, 600 labels, 700 headings
  Sizes: h1 28-32, h2 22, body 16 min, caption 13
  Contrast: body text >= 7:1 against the surface. This overrides
  the soft look. If gray-on-gray fails 7:1, darken the text.

== 4. Component recipes ==
Button (primary):
  bg --bg, label uses --accent or text >= 7:1,
  extrude shadow at rest,
  :active -> swap to INSET shadow (the dent = pressed feedback)
  ALWAYS add a 1px --accent border OR accent label so the button
  is distinguishable from a plain surface.
Card:
  bg --bg, radius 16-20, extrude shadow, no inner border.
  Cards are non-interactive: no accent, softer shadow is fine.
Input:
  INSET shadow only (a pressed-in well), radius 12-16,
  text >= 7:1, visible --accent border on :focus-visible.
Toggle:
  track = inset well, thumb = extruded circle,
  ON state fills the track or thumb with --accent (color, not
  shadow, communicates state, so screen readers need aria-checked).
Slider:
  track = inset groove, thumb = extruded knob with --accent dot,
  never rely on shadow alone to show the filled portion.

== 5. Accessibility requirements (mandatory) ==
  - Body text contrast >= 7:1, never below 4.5:1 (WCAG AA floor)
  - Every interactive element needs a non-shadow cue: accent
    color, border, or label. Shadow alone is not a state.
  - Focus: visible 2px --accent ring or border via :focus-visible
  - Hit target >= 44x44px (WCAG 2.2)
  - Pressed state must change shadow direction (extrude -> inset)
    AND set the matching ARIA state attribute.

== 6. Use when ==
  - Single-purpose instrument UIs (player, remote, calculator)
  - Smart-home and IoT control panels
  - Tactile widgets where one calm screen is the whole product
  - Concept work and design-challenge shots

== 7. Avoid when ==
  - Data-dense dashboards and tables
  - Long reading or content-heavy flows
  - Accessibility-critical audiences (low vision, older users)
  - E-commerce or any screen with many competing CTAs

== 8. Common mistakes AI agents make ==
  - Forgetting the INSET shadow on the active state, so presses
    feel dead instead of dented
  - Letting text sit gray-on-gray below 4.5:1 (the cardinal sin)
  - Using a single drop shadow instead of the dual light+dark pair
  - Adding bright, saturated accent colors everywhere, which
    destroys the monochrome calm; accent is ONE color, used rarely
  - Making buttons indistinguishable from cards (no accent, no
    border), so users cannot find the clickable element
  - Pure white highlights / pure black shades in dark mode, which
    turns soft molding into harsh plastic
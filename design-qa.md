# Design QA — Particle wave

final result: passed

## Visual truth and evidence

The user supplied the wide particle-wave design as an explicit correction. This supersedes the earlier centered Orbital design.

- Source: `.design/selected-reference.png` (1488 x 1056 pixels).
- Implementation: `.design/desktop.png` (1488 x 1056 pixels, same CSS viewport, device density 1).
- Combined comparison: `.design/comparison.png`, source left and implementation right, both scaled equally to 744 x 528 without distortion.
- Mobile: `.design/mobile.png`, 390 x 844 CSS/pixel viewport, density 1.
- State: dark theme, page top, featured projects, dialogs closed; reduced motion for repeatable capture.

## Findings and comparison history

The previous centered composition was superseded by the user's explicit screenshot selection. Replaced the centered headline, orbital artwork, availability badge, and pill navigation with the selected left-aligned headline, right-side introduction and CTA, uppercase wordmark, simple navigation, and full-width particle wave. The selected-work heading and scroll cue now occupy the lower first-screen region.

The final combined comparison shows matching composition, hierarchy, text placement, and section rhythm. No actionable P0/P1/P2 findings remain. The source's exact wave pattern varies from the generated artwork; its cyan particle structure, panoramic subject, scale, sharpness, and depth of field match the intended direction. This is an acceptable asset variation.

## Fidelity surfaces

- Fonts/typography: self-hosted Inter, oversized bold white/cyan two-line title, uppercase tracked introduction and wordmark. Right-side summary uses readable 20px type; mobile scales and stacks the columns.
- Spacing/layout: wide gutters, asymmetric hero columns, wave separated from copy, caption at the wave's bottom, large selected-work heading, centered scroll cue. Mobile remains unclipped.
- Colors/tokens: deep navy #050a14 and cyan #7dd3fc, white headings, fine cyan divider, cyan CTA. Retained accessible light theme through the command palette.
- Images/icons: standalone generated particle-wave raster, with no text baked into the artwork. Phosphor supplies the arrow, caret, and mobile navigation icons. No code-drawn substitute for the reference artwork.
- Copy/content: source headline, introduction label, caption, CTA, and selected-work heading reproduced. Profile name and stack remain data-driven. Existing case-study content is retained.

Full-view comparison provides readable headline/navigation evidence. Native-resolution `.design/desktop.png` was also inspected for summary, CTA, caption, and divider details; a separate crop was unnecessary for this sparse hero. Existing project-card comparison evidence is from the prior composition and is not used as the visual truth for this update.

## Browser verification

See `.design/browser-checks.json`: hero CTA, featured/archive projects, technology filtering, case-study open/next/Escape, capability accordion, copy email, command menu/search, mobile menu, and theme switch/persistence all passed. No horizontal page overflow at 375, 390, 768, 1024, or 1488px; images loaded; no browser console or page errors. Theme changes are now accessed through Ctrl/Cmd+K to preserve the selected desktop navigation.

Production build and Git whitespace checks passed.

## Remaining limits

The wave is static artwork. Personal details and career/project claims remain existing template data; generated dashboard concepts should be replaced with real captures before publication. External social destinations and email delivery were not tested.

## Implementation checklist

- [x] Corrected screenshot implemented.
- [x] Wave artwork integrated.
- [x] Desktop/mobile visuals compared.
- [x] Core interactions and responsive widths verified.
- [x] Build and whitespace checks passed.

## Animation update

Added staggered transform/opacity entrances, a slow transform-only wave drift, one-time project reveals, navigation underline and button/card microinteractions, and a restrained scroll cue. Existing composition is preserved; updated captures `.design/animated-desktop.png` and `.design/comparison.png` were inspected together with the selected source. No actionable P0/P1/P2 differences.

`.design/animation-checks.json` verifies visible playback, offscreen pause, hidden-tab pause, and reduced-motion disabling. A three-second Chrome sample after entrance completion recorded zero layouts and 46ms total page task time. This is a local sample, not a guarantee across hardware. There is no per-frame application JavaScript loop or canvas renderer. Mobile and normal interaction checks passed again. The former static-wave limitation is superseded by composited image motion; the asset itself remains a single raster.

final result: passed

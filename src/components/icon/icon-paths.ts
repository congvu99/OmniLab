/**
 * Inner SVG markup of every icon, drawn on a 24px grid (2px safe area), 1.5
 * stroke, round caps/joins, no fill. The first 26 entries are the concept
 * "Studio" set verbatim (25 UI icons + the `omni` brand mark); the block
 * marked "extras" are additions in the same monoline style for UI states the
 * concept does not show (spinner, empty/offline states, external link, ...).
 *
 * Rendered once per page as <symbol>s by icon-sprite.astro and referenced
 * with <use> by icon.astro. Static trusted strings only (no user input).
 */
export const ICON_PATHS = {
  resume: '<circle cx="12" cy="12" r="8.25"/><path d="M10.25 9v6l4.75-3z"/>',
  domains:
    '<rect x="4" y="4" width="6.5" height="6.5" rx="1.75"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="3.25"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.75"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.75"/>',
  search: '<circle cx="10.75" cy="10.75" r="6"/><path d="M15.25 15.25 19.5 19.5"/>',
  bookmark: '<path d="M7.75 4.75h8.5a1 1 0 0 1 1 1v13.5L12 15.75l-5.25 3.5V5.75a1 1 0 0 1 1-1z"/>',
  network:
    '<circle cx="12" cy="5.75" r="2"/><circle cx="5.75" cy="18.25" r="2"/><circle cx="18.25" cy="18.25" r="2"/><path d="M11.1 7.55 6.65 16.45M12.9 7.55l4.45 8.9M7.75 18.25h8.5"/>',
  wallet:
    '<path d="M16.25 7.75V5.5a.75.75 0 0 0-.9-.73L5.6 6.9a1.5 1.5 0 0 0-.85 1.35"/><rect x="4.75" y="7.75" width="14.5" height="11.5" rx="2"/><path d="M19.25 11.5h-3a2 2 0 0 0 0 4h3"/>',
  briefcase:
    '<rect x="3.75" y="7.75" width="16.5" height="11.5" rx="2"/><path d="M9 7.75V6.25c0-.83.67-1.5 1.5-1.5h3c.83 0 1.5.67 1.5 1.5v1.5M3.75 12.75h16.5M10.75 12.75v1.75h2.5v-1.75"/>',
  check: '<path d="M5.75 12.5l4 4 8.5-9"/>',
  'check-circle': '<circle cx="12" cy="12" r="8.25"/><path d="M8.5 12.25l2.4 2.4 4.6-5"/>',
  clock: '<circle cx="12" cy="12" r="8.25"/><path d="M12 7.75V12l2.75 1.75"/>',
  'arrow-right': '<path d="M5 12h14M13.5 6.5 19 12l-5.5 5.5"/>',
  'chevron-left': '<path d="M14.5 6 8.5 12l6 6"/>',
  'chevron-right': '<path d="M9.5 6l6 6-6 6"/>',
  sun: '<circle cx="12" cy="12" r="3.75"/><path d="M12 3.75v1.5M12 18.75v1.5M3.75 12h1.5M18.75 12h1.5M6.17 6.17l1.06 1.06M16.77 16.77l1.06 1.06M6.17 17.83l1.06-1.06M16.77 7.23l1.06-1.06"/>',
  moon: '<path d="M19.25 14.25A7.5 7.5 0 0 1 9.75 4.75a7.5 7.5 0 1 0 9.5 9.5z"/>',
  bulb: '<path d="M9.75 17.25h4.5M10.5 20.25h3M12 3.75a5.75 5.75 0 0 0-3.4 10.38c.55.4.9 1.04.9 1.72v1.4h5v-1.4c0-.68.35-1.32.9-1.72A5.75 5.75 0 0 0 12 3.75z"/>',
  info: '<circle cx="12" cy="12" r="8.25"/><path d="M12 11.25v4.5M12 8.25v.01"/>',
  command:
    '<path d="M9.25 9.25V7a2.25 2.25 0 1 0-2.25 2.25h10a2.25 2.25 0 1 0-2.25-2.25v10a2.25 2.25 0 1 0 2.25-2.25H7a2.25 2.25 0 1 0 2.25 2.25z"/>',
  toc: '<path d="M9.25 7h10M9.25 12h10M9.25 17h10M4.75 7h.5M4.75 12h.5M4.75 17h.5"/>',
  type: '<path d="M3.75 18.25 8.25 5.75l4.5 12.5M5.4 13.75h5.7M17.25 10.75v7.5M17.25 12.6a2.6 2.6 0 1 0 0 3.8"/>',
  close: '<path d="M6.75 6.75l10.5 10.5M17.25 6.75 6.75 17.25"/>',
  history: '<path d="M4.75 12a7.25 7.25 0 1 0 2.12-5.13L4.75 9"/><path d="M4.75 4.75V9H9M12 8.25V12l2.5 1.5"/>',
  doc: '<path d="M6.75 3.75h7.5l4 4v11.5a1 1 0 0 1-1 1H6.75a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1z"/><path d="M14 3.75V8h4.25M9 12.5h6M9 16h4"/>',
  spark:
    '<path d="M12 3.75c.4 4.3 3.95 7.85 8.25 8.25-4.3.4-7.85 3.95-8.25 8.25-.4-4.3-3.95-7.85-8.25-8.25 4.3-.4 7.85-3.95 8.25-8.25z"/>',
  replay: '<path d="M19.25 12A7.25 7.25 0 1 1 17.1 6.87L19.25 9"/><path d="M19.25 4.75V9H15"/>',
  omni: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="1.5"/><path d="M12 2.75v2.75"/>',

  // --- extras (same grid / stroke / caps) ---
  circle: '<circle cx="12" cy="12" r="8.25"/>',
  external:
    '<path d="M13.25 5.75h5v5M18.25 5.75l-7 7M17 13.5v3.75a1.5 1.5 0 0 1-1.5 1.5H6.75a1.5 1.5 0 0 1-1.5-1.5V8.5A1.5 1.5 0 0 1 6.75 7H10.5"/>',
  expand: '<path d="M14 5.75h4.25V10M10 18.25H5.75V14M18.25 5.75l-5 5M5.75 18.25l5-5"/>',
  loader: '<path d="M12 3.75a8.25 8.25 0 1 0 8.25 8.25"/>',
  inbox:
    '<path d="M4.75 13.5 7 6.25a1.5 1.5 0 0 1 1.43-1.05h7.14A1.5 1.5 0 0 1 17 6.25l2.25 7.25v4a1.5 1.5 0 0 1-1.5 1.5H6.25a1.5 1.5 0 0 1-1.5-1.5v-4zM4.75 13.5h4l1 2.25h4.5l1-2.25h4"/>',
  'wifi-off':
    '<path d="M4.25 9.75a11 11 0 0 1 3.4-2.2M19.75 9.75A11 11 0 0 0 11 6.8M7.5 13.25a6.5 6.5 0 0 1 2.25-1.4M16.5 13.25a6.5 6.5 0 0 0-1.9-1.2M12 17.25v.01M4.5 4.5l15 15"/>',
  pie: '<path d="M11 5.75A7.25 7.25 0 1 0 18.25 13H11z"/><path d="M13 3.75A7.25 7.25 0 0 1 20.25 11H13z"/>',
  user: '<circle cx="12" cy="8.5" r="3.5"/><path d="M5.25 19.25c.6-3.4 3.25-5.25 6.75-5.25s6.15 1.85 6.75 5.25"/>',
  // Lesson audio player (play/pause, 15-second skips, "listen" affordance).
  play: '<path d="M7.75 5.6v12.8a.75.75 0 0 0 1.14.64l10.2-6.4a.75.75 0 0 0 0-1.28l-10.2-6.4a.75.75 0 0 0-1.14.64z"/>',
  pause: '<rect x="6.75" y="5.25" width="3.5" height="13.5" rx="1"/><rect x="13.75" y="5.25" width="3.5" height="13.5" rx="1"/>',
  'skip-back-15':
    '<path d="M4.75 12A7.25 7.25 0 1 0 6.9 6.87L4.75 9"/><path d="M4.75 4.75V9H9M9.25 10.25l1.25-.75v5.25M15.25 9.5h-2.5l-.3 2.55a1.6 1.6 0 1 1-.05 2.25"/>',
  'skip-forward-15':
    '<path d="M19.25 12A7.25 7.25 0 1 1 17.1 6.87L19.25 9"/><path d="M19.25 4.75V9H15M9.25 10.25l1.25-.75v5.25M15.25 9.5h-2.5l-.3 2.55a1.6 1.6 0 1 1-.05 2.25"/>',
  headphones:
    '<path d="M4.75 15.5V12a7.25 7.25 0 0 1 14.5 0v3.5"/><rect x="4.75" y="13.75" width="3.5" height="5.5" rx="1.25"/><rect x="15.75" y="13.75" width="3.5" height="5.5" rx="1.25"/>',
} as const;

export type IconName = keyof typeof ICON_PATHS;

/* Whale motifs, drawn as inline SVG so they stay crisp at any size and can be
   animated independently of the character art.
   Palette comes from the sprite sampling: mid #343d7b / bright #556bb2 /
   light #83a4e3 / pale #d5daeb / deep #1b1d43. */

/**
 * A small round whale, side view, tail up. Used for the one held in her arms,
 * the falling-whale rain, and decorative spots.
 * @param {{ cls?: string, title?: string, blush?: boolean }} [opts]
 */
export function whaleSvg(opts = {}) {
  const { cls = 'whale-art', title = '', blush = false } = opts;
  const label = title ? `<title>${title}</title>` : '';
  return `<svg class="${cls}" viewBox="0 0 80 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="${title ? 'false' : 'true'}" focusable="false">
  ${label}
  <!-- spout -->
  <path d="M26 13c0-4 2-6 4-7-1 3 0 5 2 6-2 0-4 1-6 1z" fill="var(--whale-spout, #a8dcf7)" opacity="0.9"/>
  <path d="M30 6.5c1.6-2.4 3.6-3 5.4-2.6" stroke="var(--whale-spout, #a8dcf7)" stroke-width="1.7" stroke-linecap="round"/>
  <!-- tail fluke -->
  <path d="M63 26c4-5 8-7 12-6.5-2.5 3-3 6-2 9 3-1.5 6-1 8 1-4.5 2-7.5 5-9 9.5-2.6-4.4-6-7.4-10-8.5l1-4.5z" fill="var(--whale-tail, #4a86d8)" stroke="var(--whale-line, #1b1d43)" stroke-width="1.6" stroke-linejoin="round"/>
  <!-- body -->
  <path d="M12 28c0-9.4 8.6-16 20-16s18.5 6.6 20 16c1 6-4 10-11 10H23c-7 0-11.5-3.6-11-10z" fill="var(--whale-body, #83a4e3)" stroke="var(--whale-line, #1b1d43)" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- belly -->
  <path d="M18 33c1.5-3.5 5.5-5.5 12-5.5s12 2 14 5.5c-2 3.4-7 4.8-14 4.8s-10.5-1.4-12-4.8z" fill="var(--whale-belly, #e8eeff)" opacity="0.95"/>
  <!-- pectoral fin -->
  <path d="M25 33c-2.2 2.4-3 4.6-2.4 6.6 2.4-.6 4.6-2.2 6.2-4.6" fill="var(--whale-fin, #556bb2)" stroke="var(--whale-line, #1b1d43)" stroke-width="1.5" stroke-linejoin="round"/>
  <!-- eye -->
  <ellipse cx="24" cy="25.5" rx="1.9" ry="2.3" fill="var(--whale-line, #1b1d43)"/>
  <circle cx="24.7" cy="24.7" r="0.7" fill="#fff"/>
  <!-- mouth -->
  <path d="M14.5 30.5c1.6 1.4 3.4 2 5.4 1.9" stroke="var(--whale-line, #1b1d43)" stroke-width="1.4" stroke-linecap="round"/>
  ${blush ? '<ellipse cx="18.5" cy="30" rx="2.4" ry="1.5" fill="#f3a9bd" opacity="0.55"/>' : ''}
</svg>`;
}

/**
 * Repeating wave rule — a tiling sine crest used for panel frames and dividers.
 * @param {string} [color]
 */
export function waveTile(color = 'currentColor') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="10" viewBox="0 0 24 10"><path d="M0 7c3-6 9-6 12 0s9 6 12 0" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Foam dots used at panel corners. */
export function foamDots(count = 3) {
  return `<span class="foam" aria-hidden="true">${'<i></i>'.repeat(count)}</span>`;
}

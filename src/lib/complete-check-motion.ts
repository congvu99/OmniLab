/**
 * "Complete lesson" motion (concept motion lab): progress ring draws (220ms),
 * disc snaps in (180ms, +200ms), tick draws (200ms, +320ms), sparks burst at
 * 360ms; the button gives a small press-bounce. The elements already carry
 * their FINAL (done) styles when this runs, so every animation uses
 * `fill: 'backwards'` — it shows the from-keyframe during the delay and then
 * settles on the CSS state, leaving no lingering animation objects.
 *
 * Reduced motion: a single 120ms crossfade, no movement, no sparks.
 */

const EASE = 'cubic-bezier(.2,.8,.2,1)';
const SNAP = 'cubic-bezier(.3,1.35,.5,1)';
const SPARK_COUNT = 8;

export interface CompleteMotionTargets {
  /** SVG badge containing .c-fill / .c-disc / .c-tick (optional: aside variant has none). */
  check: Element | null;
  /** The toggle button (press bounce + inline tick). */
  button: HTMLElement;
  /** Small tick path inside the button. */
  buttonTick: Element | null;
}

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

function cancelAll(...els: Array<Element | null>) {
  for (const el of els) el?.getAnimations().forEach((a) => a.cancel());
}

function sparks(host: Element) {
  const r = host.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return;
  for (let i = 0; i < SPARK_COUNT; i++) {
    const s = document.createElement('i');
    const angle = i * (360 / SPARK_COUNT);
    s.style.cssText =
      `position:fixed;left:${r.left + r.width / 2 - 1.5}px;top:${r.top + r.height / 2 - 4}px;` +
      'width:3px;height:8px;border-radius:2px;background:var(--volt-ink);z-index:300;pointer-events:none';
    document.body.appendChild(s);
    const a = s.animate(
      [
        { transform: `rotate(${angle}deg) translateY(-${r.width * 0.28}px)`, opacity: 1 },
        { transform: `rotate(${angle}deg) translateY(-${r.width * 0.62}px) scaleY(.4)`, opacity: 0 },
      ],
      { duration: 360, easing: EASE },
    );
    a.finished.then(() => s.remove(), () => s.remove());
  }
}

export function playCompleteMotion({ check, button, buttonTick }: CompleteMotionTargets): void {
  const fill = check?.querySelector('.c-fill') ?? null;
  const disc = check?.querySelector('.c-disc') ?? null;
  const tick = check?.querySelector('.c-tick') ?? null;
  cancelAll(check, button, buttonTick, fill, disc, tick);

  if (prefersReducedMotion()) {
    (check ?? button).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 120 });
    return;
  }

  button.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(.96)' }, { transform: 'scale(1.02)' }, { transform: 'scale(1)' }],
    { duration: 280, easing: SNAP },
  );
  buttonTick?.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
    duration: 220,
    delay: 80,
    easing: EASE,
    fill: 'backwards',
  });

  if (fill && disc && tick) {
    fill.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], { duration: 220, easing: EASE, fill: 'backwards' });
    disc.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], {
      duration: 180,
      delay: 200,
      easing: SNAP,
      fill: 'backwards',
    });
    tick.animate([{ strokeDashoffset: 100 }, { strokeDashoffset: 0 }], {
      duration: 200,
      delay: 320,
      easing: EASE,
      fill: 'backwards',
    });
  }

  const burstHost = check ?? buttonTick ?? button;
  setTimeout(() => {
    if (burstHost.isConnected) sparks(burstHost);
  }, 360);
}

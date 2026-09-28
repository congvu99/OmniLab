// Tests for src/lib/progress-scroll-throttle.ts in isolation (progress-store
// tests cover it end-to-end through the store's public API; these exercise
// the throttle's own contract directly, incl. the manual flush() that lets
// a caller persist a pending write immediately instead of waiting out the
// throttle window — see docs/system-architecture.md "Client state").
import { describe, expect, it, vi } from 'vitest';
import { createScrollThrottle } from '../src/lib/progress-scroll-throttle.ts';

function createClock(start = 1000) {
  let t = start;
  return { now: () => t, advance: (ms) => (t += ms) };
}

describe('createScrollThrottle', () => {
  it('flushes the first save for an id immediately', () => {
    const flushed = [];
    const clock = createClock();
    const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

    throttle.save('a', 0.3);
    expect(flushed).toEqual([['a', 0.3]]);
  });

  it('coalesces calls within the window into one trailing flush with the latest value', () => {
    vi.useFakeTimers();
    try {
      const flushed = [];
      const clock = createClock();
      const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

      throttle.save('a', 0.1); // immediate
      throttle.save('a', 0.5);
      throttle.save('a', 0.9);
      expect(flushed).toEqual([['a', 0.1]]);

      vi.advanceTimersByTime(1000);
      expect(flushed).toEqual([['a', 0.1], ['a', 0.9]]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flush(id) persists a pending write immediately and cancels the scheduled timer', () => {
    vi.useFakeTimers();
    try {
      const flushed = [];
      const clock = createClock();
      const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

      throttle.save('a', 0.1); // immediate
      throttle.save('a', 0.5); // scheduled
      throttle.flush('a');
      expect(flushed).toEqual([['a', 0.1], ['a', 0.5]]);

      // The scheduled timer must have been cancelled — advancing time must
      // not flush 'a' a third time.
      vi.advanceTimersByTime(1000);
      expect(flushed).toEqual([['a', 0.1], ['a', 0.5]]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flush() with no id flushes every lesson with a pending write, independently', () => {
    vi.useFakeTimers();
    try {
      const flushed = [];
      const clock = createClock();
      const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

      throttle.save('a', 0.1); // immediate
      throttle.save('a', 0.4); // scheduled
      throttle.save('b', 0.2); // immediate
      throttle.save('b', 0.8); // scheduled
      expect(flushed).toEqual([['a', 0.1], ['b', 0.2]]);

      throttle.flush();
      expect(flushed).toEqual([
        ['a', 0.1],
        ['b', 0.2],
        ['a', 0.4],
        ['b', 0.8],
      ]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('flush() is a no-op for an id with nothing pending', () => {
    const flushed = [];
    const clock = createClock();
    const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

    throttle.flush('never-saved');
    throttle.flush();
    expect(flushed).toEqual([]);
  });

  it('after a manual flush, a later save still respects the throttle window from the flush time', () => {
    vi.useFakeTimers();
    try {
      const flushed = [];
      const clock = createClock();
      const throttle = createScrollThrottle({ throttleMs: 1000, now: clock.now, onFlush: (id, r) => flushed.push([id, r]) });

      throttle.save('a', 0.1); // immediate, lastFlush = t=1000
      clock.advance(200);
      throttle.flush('a'); // nothing pending, no-op
      clock.advance(200); // t=1400, elapsed since lastFlush = 400ms < 1000ms
      throttle.save('a', 0.6); // still within window -> scheduled, not immediate
      expect(flushed).toEqual([['a', 0.1]]);

      vi.advanceTimersByTime(600); // remaining time to reach the 1000ms window
      expect(flushed).toEqual([['a', 0.1], ['a', 0.6]]);
    } finally {
      vi.useRealTimers();
    }
  });
});

/*
 * Pre-paint display prefs. Loaded synchronously in <head> (before CSS) so the
 * first paint already has the right theme: sets <html data-theme data-text-size
 * data-motion> from localStorage 'omnilab:prefs' (shape: src/lib/user-prefs.ts).
 * Plain script, no imports (CSP script-src 'self'). theme "system" follows
 * prefers-color-scheme live. Re-applies after ClientRouter swaps <html>, when
 * another tab changes the prefs, and when the page dispatches
 * 'omnilab:prefs-changed' after a local write.
 */
(function () {
  var KEY = 'omnilab:prefs';
  var root = document.documentElement;
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var COLORS = { light: '#F3F4F6', dark: '#0B0C0E' }; // = --bg in tokens.css

  function read() {
    var p = { theme: 'system', textSize: 'm', motion: 'system' };
    try {
      var d = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (d && typeof d === 'object') {
        if (d.theme === 'light' || d.theme === 'dark') p.theme = d.theme;
        if (d.textSize === 's' || d.textSize === 'l') p.textSize = d.textSize;
        if (d.motion === 'reduce') p.motion = 'reduce';
      }
    } catch (e) {}
    return p;
  }

  function apply() {
    var p = read();
    var theme = p.theme === 'system' ? (mq && mq.matches ? 'dark' : 'light') : p.theme;
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-text-size', p.textSize);
    root.setAttribute('data-motion', p.motion);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[theme]);
  }

  apply();
  if (mq && mq.addEventListener) mq.addEventListener('change', apply);
  window.addEventListener('storage', function (e) {
    if (e.key === null || e.key === KEY) apply();
  });
  document.addEventListener('omnilab:prefs-changed', apply);
  document.addEventListener('astro:after-swap', apply);
})();

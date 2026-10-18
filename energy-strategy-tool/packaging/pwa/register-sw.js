/* Service worker registration and the "Update ready" notice (inlined into index.html by build-pwa.mjs).
 * Does nothing where service workers are unavailable: a file:// copy, plain http on a non-local host, a browser
 * without them, or a browser that refuses registration. The app itself never depends on this script. */
(function () {
  'use strict';
  try {
    if (!('serviceWorker' in navigator) || !window.isSecureContext || !/^https?:$/.test(location.protocol)) return;
  } catch (e) { return; }

  var waiting = null;
  var reloading = false;
  var lastCheck = 0;
  var box = null;
  var msg = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  // The notice is created hidden at start-up so its live region is in place before it has anything to say; the text
  // is set after it is shown, which screen readers announce politely. Focus is never moved.
  function buildNotice() {
    box = el('div', 'pwa-update');
    box.hidden = true;
    msg = el('p', 'pwa-update-msg');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');
    var reload = el('button', 'pwa-update-reload', 'Reload');
    reload.type = 'button';
    var later = el('button', 'pwa-update-later', 'Later');
    later.type = 'button';
    later.setAttribute('aria-label', 'Later: keep working; the update applies next time the app starts');
    reload.addEventListener('click', applyUpdate);
    later.addEventListener('click', function () { box.hidden = true; msg.textContent = ''; });
    box.appendChild(msg);
    box.appendChild(reload);
    box.appendChild(later);
    document.body.appendChild(box);
  }

  function showNotice(worker) {
    waiting = worker;
    if (!box) buildNotice();
    if (!box.hidden && msg.textContent) return;
    box.hidden = false;
    setTimeout(function () { msg.textContent = 'Update ready — reload to use the new version.'; }, 150);
  }

  function applyUpdate() {
    reloading = true;
    if (waiting) waiting.postMessage({ type: 'SKIP_WAITING' });
    // If the new worker took over already (another window applied it), controllerchange may not come: reload anyway.
    setTimeout(function () { location.reload(); }, 3000);
  }

  function watch(reg) {
    if (reg.waiting && navigator.serviceWorker.controller) showNotice(reg.waiting);
    reg.addEventListener('updatefound', function () {
      var w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', function () {
        // "installed" with a page already controlled = an update (on first install there is no controller yet).
        if (w.state === 'installed' && navigator.serviceWorker.controller) showNotice(w);
      });
    });
    function check() {
      lastCheck = Date.now();
      reg.update().catch(function () { /* offline or server unreachable: try again later */ });
    }
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && Date.now() - lastCheck > 60000) check();
    });
    setInterval(function () { if (document.visibilityState === 'visible') check(); }, 3600000);
  }

  navigator.serviceWorker.addEventListener('controllerchange', function () {
    // The first install also takes control of the page (clients.claim); only reload when the user asked for it.
    if (reloading) location.reload();
  });

  function register() {
    navigator.serviceWorker.register('sw.js', { scope: './', updateViaCache: 'none' }).then(function (reg) {
      lastCheck = Date.now();
      watch(reg);
    }).catch(function () { /* registration refused: the app keeps working online, without the offline copy */ });
  }
  if (document.readyState === 'complete') register();
  else window.addEventListener('load', register);
})();

/* Runs synchronously in <head>, before first paint.
 *
 * Its only job is to decide whether text should start hidden. The type
 * choreography wipes words up from behind a mask, and that initial hidden
 * state has to be in place before the browser paints — set it from a module
 * later and the whole page flashes in, then jumps back out to animate.
 *
 * The checks here are the cheap half of the gate in main.js: viewport,
 * memory, and what the visitor has asked for. WebGL is not tested, because
 * the type layer does not need it.
 *
 * Deliberately not a module and deliberately tiny. If it throws, nothing is
 * hidden and the page is simply static — which is the safe direction.
 */
(function () {
    var root = document.documentElement;
    try {
        var query = new URLSearchParams(window.location.search).get('motion');
        var stored = null;
        try { stored = localStorage.getItem('fx'); } catch (e) { /* private mode */ }

        var wanted;
        if (query === 'on') wanted = true;
        else if (query === 'off') wanted = false;
        else if (stored === 'on') wanted = true;
        else if (stored === 'off') wanted = false;
        else wanted = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        var possible = window.matchMedia('(min-width: 1024px)').matches
            && !(navigator.deviceMemory && navigator.deviceMemory < 4);

        if (possible && wanted) root.classList.add('fx-pending');
    } catch (e) {
        /* Leave the page static rather than risk hiding text we cannot unhide. */
    }
})();

(function () {
    'use strict';

    // --- Static loader config (QAL locked contract) -------------------------
    // Edit these before publishing / pointing at a live partner UI.
    // TC-V2-014 (bad-origin fail-closed): change UI_URL to a different
    // origin WITHOUT changing UI_ORIGIN and the loader must refuse to mount.
    var UI_ORIGIN = 'https://aspects.surge.sh';
    var UI_URL = 'https://aspects.surge.sh/v2/modal/harness/partner-ui-harness.html';

    // manifest/apsect-manifest-locked.json -> aspectTypes.modal.channels.web.security.sandboxDirectives
    // allow-scripts + allow-same-origin only. allow-forms, allow-popups,
    // allow-popups-to-escape-sandbox, allow-downloads, allow-modals are all
    // false in the manifest — do not add them (regression guard for CE-12302).
    var SANDBOX = 'allow-scripts allow-same-origin';

    // manifest -> aspectTypes.modal.channels.web.placements.center_overlay
    //   .dimensionConstraints: medium preset is width 500-640px, height
    //   200-765px. 600x500 is the happy-path size (TC-V2-034,
    //   TC-V2-037 / CE-12362 — extension boundary must not clip this).
    var IFRAME_WIDTH = '990px';
    var IFRAME_HEIGHT = '500px';

    function readOptionalConfig() {
        var raw =
            document.currentScript &&
            document.currentScript.getAttribute('data-aspect-config');
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch (error) {
            console.error('[loader] invalid data-aspect-config', error);
            return null;
        }
    }

    function mount() {
        // Fail closed: the UI url must resolve to the configured UI origin.
        var resolvedOrigin;
        try {
            resolvedOrigin = new URL(UI_URL).origin;
        } catch (error) {
            console.error('[loader] fail closed: invalid UI_URL', error);
            return;
        }
        if (resolvedOrigin !== UI_ORIGIN) {
            console.error(
                '[loader] fail closed: bad_origin',
                resolvedOrigin,
                'expected',
                UI_ORIGIN
            );
            return;
        }

        var iframe = document.createElement('iframe');
        iframe.src = UI_URL;
        iframe.title = 'Modal partner harness';
        iframe.id = 'modal-iframe';
        // Manifest-exact sandbox tokens only (see SANDBOX comment above).
        iframe.sandbox = SANDBOX;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        // No `allow` attribute is set: the manifest denies camera and
        // clipboard-write for modal, so nothing is delegated to the inner
        // iframe via Permissions-Policy/allow.
        iframe.style.cssText =
            'border:0;width:' + IFRAME_WIDTH + ';height:' + IFRAME_HEIGHT + ';';
        document.body.appendChild(iframe);
        console.log('[loader] modal iframe mounted', UI_URL);
    }

    // Forward hostToAspect modalOpen into the inner UI so message-bus TCs can
    // log receipt in the partner harness.
    window.addEventListener('message', function (e) {
        console.log('[loader] hostToAspect message received', e.data.type);
        var msg = e.data;
        if (!msg || msg.type !== 'modalOpen') {
            return;
        }
        // wait for 10s before below code is executed
        setTimeout(function () {
            var innerFrame = document.getElementById('modal-iframe');
            if (innerFrame) {
                innerFrame.contentWindow.postMessage(msg, UI_ORIGIN);
                console.log('[loader] forwarded hostToAspect to inner UI', msg.type);
            }
        }, 10000);
    });

    var cfg = readOptionalConfig();
    if (cfg) {
        // Informational only — DevEx scriptData (e.g. configUrl/uiOrigin) is
        // logged for cross-check but is not required to mount the happy path.
        console.log('[loader] data-aspect-config (informational only):', cfg);
    }

    mount();
})();

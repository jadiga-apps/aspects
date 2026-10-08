(function () {
    'use strict';

    // --- Static loader config (QAL locked contract) -------------------------
    // Edit these before publishing / pointing at a live partner UI.
    // TC-V2-014 (bad-origin fail-closed): change UI_URL to a different
    // origin WITHOUT changing UI_ORIGIN and the loader must refuse to mount.
    var UI_ORIGIN = 'https://aspects.surge.sh';
    var UI_URL = 'https://aspects.surge.sh/v2/chat/harness/partner-ui-harness.html';

    // manifest/apsect-manifest-locked.json -> aspectTypes.chatbot.channels.web.security.sandboxDirectives
    // allow-scripts + allow-same-origin only. allow-forms, allow-popups,
    // allow-popups-to-escape-sandbox, allow-downloads are all false — do not
    // add them (regression guard for CE-12302).
    var SANDBOX = 'allow-scripts allow-same-origin';

    // Host wrapper owns collapsed FAB vs expanded panel size (TC-V2-029).
    // Inner iframe fills the wrapper: width 80–400px, height 80–600px.
    var IFRAME_WIDTH = '100%';
    var IFRAME_HEIGHT = '100%';

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

    function probeGeolocation() {
        // TC-V2-044 step 3: call from the Wrapper / static-loader document.
        if (!navigator.geolocation) {
            console.log('[loader] geolocation probe: API unavailable');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            function () {
                console.error(
                    '[loader] geolocation probe: UNEXPECTED success (manifest permissionsPolicy.geolocation: false)'
                );
            },
            function (err) {
                console.log(
                    '[loader] geolocation probe: blocked as expected (' +
                        (err && err.message ? err.message : err) +
                        ')'
                );
            },
            { timeout: 5000 }
        );
    }

    function mount() {
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
        iframe.title = 'Partner chatbot';
        iframe.id = 'chatbot-iframe';
        iframe.sandbox = SANDBOX;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        // No `allow` attribute: chatbot PP denies geolocation, camera,
        // microphone, and clipboard-write (CE-12340).
        iframe.style.cssText =
            'border:0;width:' +
            IFRAME_WIDTH +
            ';height:' +
            IFRAME_HEIGHT +
            ';display:block;';
        document.body.appendChild(iframe);
        console.log('[loader] chatbot iframe mounted', UI_URL);
        probeGeolocation();
    }

    // Forward hostToAspect chatbotOpen / contextUpdate into the inner UI so
    // TC-V2-031 can log receipt in the partner harness.
    window.addEventListener('message', function (e) {
        console.log('[loader] hostToAspect message received', e.data.type);
        var msg = e.data;
        if (!msg || (msg.type !== 'chatbotOpen' && msg.type !== 'contextUpdate')) {
            return;
        }
        // wait for 10s before below code is executed
        setTimeout(function () {
            var innerFrame = document.getElementById('chatbot-iframe');
            if (innerFrame) {
                innerFrame.contentWindow.postMessage(msg, UI_ORIGIN);
                console.log('[loader] forwarded hostToAspect to inner UI', msg.type);
            }
        }, 10000);
    });

    var cfg = readOptionalConfig();
    if (cfg) {
        console.log('[loader] data-aspect-config (informational only):', cfg);
    }

    mount();
})();

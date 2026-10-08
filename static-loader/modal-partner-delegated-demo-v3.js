/**
 * Partner-delegated credit card promo demo — static partner loader.
 *
 * Runs in the same sandbox document as aspect-extension.js. Mounts the
 * partner UI iframe on document.body.
 */
(function () {
    'use strict';

    // Document loaded inside the inner iframe.
    var UI_URL = 'https://aspects.surge.sh/v2/modal/demo/partner-delegated/partner-ui.html';
    var UI_ORIGIN = new URL(UI_URL).origin;
    // Scripts may run and the frame may keep its own origin. No forms, popups, or downloads.
    var SANDBOX = 'allow-scripts allow-same-origin';

    function mount() {
        var iframe = document.createElement('iframe');
        iframe.src = UI_URL;
        iframe.title = 'Credit card promo';
        iframe.id = 'modal-iframe';
        iframe.sandbox = SANDBOX;
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.style.cssText = 'border:0;width:980px;height:600px;display:block;';
        document.body.appendChild(iframe);
    }

    // Forward hostToAspect modalOpen into the inner UI.
    window.addEventListener('message', function (e) {
        console.log('[loader] hostToAspect message received', e.data.type);
        var msg = e.data;
        if (!msg || (msg.type !== 'modalOpen')) {
            return;
        }        
        // wait for 20s before below code is executed
        setTimeout(() => {
            const innerFrame = document.getElementById('modal-iframe');
            if (innerFrame) {
                innerFrame.contentWindow.postMessage(msg, UI_ORIGIN);
                console.log('[loader] forwarded hostToAspect to inner UI', msg.type);
            }
        }, 20000);
    });
    
    mount();
})();

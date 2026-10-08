/**
 * Chatbot demo — static partner loader.
 *
 * Runs in the same sandbox document as aspect-extension.js. This script is
 * the only one that talks downward into the partner UI iframe.
 *
 */
(function () {
    'use strict';

    // Document loaded inside the inner iframe. Origin is derived from this URL.
    var UI_URL = 'https://aspects.surge.sh/v2/chat/demo/partner-ui.html';
    var UI_ORIGIN = new URL(UI_URL).origin;
    // Scripts may run and the frame may keep its own origin. No forms, popups, or downloads.
    var SANDBOX = 'allow-scripts allow-same-origin';

    var HOST_ORIGIN = window.location.origin;
    var innerFrame = null;

    function mount() {
        var iframe = document.createElement('iframe');
        iframe.src = UI_URL;
        iframe.title = 'Partner chatbot';
        iframe.sandbox = SANDBOX;
        iframe.id = 'chatbot-iframe';
        // Send the sandbox origin as the referrer so partner-ui can target
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.style.cssText = 'border:0;width:100%;height:100%;display:block;';
        document.body.appendChild(iframe);
    }

    // Forward hostToAspect chatbotOpen / contextUpdate into the inner UI.
    window.addEventListener('message', function (e) {
        console.log('[loader] hostToAspect message received', e.data.type);
        var msg = e.data;
        if (!msg || (msg.type !== 'chatbotOpen' && msg.type !== 'contextUpdate')) {
            return;
        }        
        // wait for 10s before below code is executed
        setTimeout(() => {
            const innerFrame = document.getElementById('chatbot-iframe');
            if (innerFrame) {
                innerFrame.contentWindow.postMessage(msg, UI_ORIGIN);
                console.log('[loader] forwarded hostToAspect to inner UI', msg.type);
            }
        }, 10000);
    });

    mount();
})();

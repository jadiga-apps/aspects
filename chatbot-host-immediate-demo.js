/**
 * Chatbot demo — static partner loader.
 *
 * Runs in the same sandbox document as aspect-extension.js. This script is
 * the only one that talks downward into the partner UI iframe.
 *
 * On mount it creates a sandboxed iframe for partner-ui.html, then posts
 * window.__ASPECT_CONTEXT into that frame as a contextUpdate. Later messages
 * from the host (chatbotOpen, contextUpdate) are forwarded the same way.
 *
 * Mount is refused when UI_URL does not parse.
 */
(function () {
    'use strict';

    // Document loaded inside the inner iframe. Origin is derived from this URL.
    var UI_URL = 'https://aspects.surge.sh/v2/chat/demo/partner-ui.html';
    // Scripts may run and the frame may keep its own origin. No forms, popups, or downloads.
    var SANDBOX = 'allow-scripts allow-same-origin';

    function mount() {    
        
        var iframe = document.createElement('iframe');
        iframe.src = UI_URL;
        iframe.title = 'Partner chatbot';
        iframe.sandbox = SANDBOX;
        // Send the sandbox origin as the referrer so partner-ui can target
        // postMessage back at this document without using '*'.
        iframe.referrerPolicy = 'strict-origin-when-cross-origin';
        iframe.style.cssText = 'border:0;width:100%;height:100%;display:block;';
        document.body.appendChild(iframe);
        innerFrame = iframe;
    }
    
    mount();
})();

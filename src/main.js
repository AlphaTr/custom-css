/* global chrome, EventEmitter */
"use strict";
(function (window, chrome, undefined) {
    var css = {},

        /* 事件中心 */
        eventHub = new EventEmitter(),

        insertCSS = function (tab) {
            var tabId = tab.id, tabUrl = tab.url, i, regexp;
            for (i in css) {
                regexp = new RegExp(i, 'i');
                if (regexp.test(tabUrl) && /^http.*/i.test(tabUrl)) {
                    chrome.tabs.insertCSS(tabId, {code: css[i].css, allFrames: true, runAt: 'document_start'});
                }
            }
        },

        // 初始化
        init = function () {
            chrome.storage.local.get('css', function (obj) {
                if (obj.css) {
                    css = obj.css;
                    eventHub.trigger('ready');
                } else {
                    chrome.storage.local.set({css: {}});
                }
            });
        };

    eventHub.on('ready', function () {
        var initTabs = function () {
                chrome.tabs.query({}, function (tabs) {
                    var i = 0;
                    for (; i < tabs.length; i++) {
                        insertCSS(tabs[i]);
                    }
                });
            };

        // 刷新标签
        chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
            if (changeInfo.status === 'loading') {
                insertCSS(tab);
            }
        });

        initTabs();
    });

    init();

    chrome.runtime.onMessage.addListener(function (request) {
        if (request.action && request.action === 'init') {
            init();
        }
        return true;
    });
}(window, chrome));

/*-----------------------------------------------------------------------------------------*/
/*-------------------------------------Business Logic--------------------------------------*/
/*-----------------------------------------------------------------------------------------*/
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (!tabState.hasOwnProperty(sender.tab.id)) { return; }
    sendResponse(parseMessage(request.msg, sender.tab.id));
});

function parseMessage(msg, tabId) {
    if(msg) {
        tabState[tabId] = JSON.parse(msg)
    } else {
        tabState[tabId] = { active: false, state: null }
    }

    if(!tabState[tabId].active) {
        chrome.browserAction.setIcon({ tabId: tabId, path: icon_gray });
        chrome.browserAction.setBadgeText({ tabId: tabId, text: "" });
    } else {
        chrome.browserAction.setIcon({ tabId: tabId, path: icon_red });
        
        switch (tabState[tabId].state) {
            case state.BaselineWaived:
            case state.FlashPreservation:
            case state.ScrapeStarted:
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: badge_green });
                break;
            case state.BaselineStarted:
            case state.BaselineCompleted:
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: badge_yellow });
                break;
            case state.ScrapePaused:
                chrome.browserAction.setBadgeText({ tabId: tabId, text: "||" });
            case state.BaselineRequired:
                chrome.browserAction.setBadgeBackgroundColor({ tabId: tabId, color: badge_red });
                break;
            default:
                chrome.browserAction.setBadgeText({ tabId: tabId, text: msg });
                break;
        }
    }

    return tabState[tabId];
}



/*
chrome.webRequest.onCompleted.addListener((details) => {
    const { tabId, requestId, frameId, type, initiator, timestamp, statusCode, url } = details;
    if (!tabStorage.hasOwnProperty(tabId) || !tabStorage[tabId].requests.hasOwnProperty(requestId)) {
        return;
    }

    chrome.tabs.get(itabId, (tab) => {
        const { id, url } = tab;
    })

    storeData()
    const request = tabStorage[tabId].requests[requestId];

    Object.assign(request, {
        endTime: details.timeStamp,
        requestDuration: details.timeStamp - request.startTime,
        status: 'complete'
    });
    console.log(tabStorage[tabId].requests[details.requestId]);
}, networkFilters);
*/
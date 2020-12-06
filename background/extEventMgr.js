/*
Manages the state of all tabs
*/
class extEventMgr {
    constructor(storageKey, debugMode) {
        this._storageKey = storageKey
        this._debugMode = debugMode
        this.extTabs = {}
        
        this.onLoad =              new listener(debugMode)
        this.onUrlNavigated =      new listener(debugMode)
        this.onHTTPResponse =      new listener(debugMode)
        this.onTabActivated =      new listener(debugMode)
        this.onTabCompleted =      new listener(debugMode)
        this.onTabLoading =        new listener(debugMode)
        this.onTabIconChanged =    new listener(debugMode)
        this.onTabRemoved =        new listener(debugMode)

        this.onStateChanged =      new listener(debugMode)
        this.onActiveChanged =     new listener(debugMode)

        if(debugMode) {
            //TODO: REMOVE THIS...
            //chrome.storage.local.clear(()=>{})
        }

        //Add every tab to our list when it loads.
        chrome.windows.getAll({populate:true},(windows) => {
            console.log("GetALL Ran")
            windows.forEach((window) => {
                window.tabs.forEach((tab) => {
                    this._tabInit(tab, false, "getAll_OnLoad")
                });
            });
        });

        //Tab created using the "Activated event"
        chrome.tabs.onActivated.addListener((tab) => {
            console.log("Activated")
            const tabId = tab ? tab.tabId : chrome.tabs.TAB_ID_NONE;
            this.onTabActivated._runListeners(tabId, null, this.extTabs[tabId])
        })

        //Tab has finished loading.
        chrome.tabs.onUpdated.addListener((tabId , info, tab) => {
            if (info.status === 'complete') {
                this._tabInit(tab, false, "onUpdate_Complete")
                this.onTabCompleted._runListeners(tabId, { "url": tab.url }, this.extTabs[tabId])
            }

            if(this.extTabs[tabId]) {
                this.extTabs[tabId].setURL(tab.url)
                this.extTabs[tabId].setHostname(new URL(tab.url).hostname)
                this.onTabIconChanged._runListeners(tabId, { "url": tab.url }, this.extTabs[tabId])
                
                if(info.status === 'loading') {
                    this.onTabLoading._runListeners(tabId, { "url": tab.url }, this.extTabs[tabId])
                }
            }
        });

        //Icon changed for the tab.
        chrome.webNavigation.onBeforeNavigate.addListener((details) => {
            //Root Frame Only
            if(details.frameID == 0) {
                this.onTabIconChanged._runListeners(details.tabId, { "url": details.url }, this.extTabs[details.tabId])
            }
        })

        //Tab Deleted
        chrome.tabs.onRemoved.addListener((tab) => {
            if (!this.extTabs.hasOwnProperty(tab)) { return; }
            this.extTabs[tab.id] = null
            if(this._debugMode) { 
                console.info("Tab " + tab + ": Has been removed removed from tabState.")
            }
            this.onTabRemoved._runListeners(tab, null ,null)
        })

        //Navigation occured into a new window, we want any active window
        //that spawns a new window to also be active, this new active window
        //will also capture data as expected
        chrome.webNavigation.onCreatedNavigationTarget.addListener((details) => {
            const { sourceTabId, sourceFrameId, sourceProcessId, url, tabId, timeStamp } = details
            let srcTab = this.extTabs[sourceTabId]
            if(srcTab?.isActive()) {
                chrome.tabs.get(tabId, (tab) => {
                    this._tabInit(tab, true, "onCreatedNavigationTarget")?.toggleActive()
                })
            } else {
                chrome.tabs.get(tabId, (tab) => {
                    this._tabInit(tab, true, "onCreatedNavigationTarget")
                })
            }
        })

        //On webRequest completed, react to the response
        //THIS does NOT contain the request body, but in the response, you can fetch the file and hit the cache...
        chrome.webRequest.onCompleted.addListener((details) => {
            const { tabId } = details;
            let tab = this.extTabs[tabId]

            if(tab?.isActive()) {
                this.onHTTPResponse._runListeners(tabId, {"currState": tab.getState(), "response": details }, tab)
            }

        }, {urls: []})

        //Parse the message and act upon it
        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if(msg?.tabId) {
                console.info("tab found: " + msg.tabId + " sending to parse message...")

                //Last ditch effort to add the tab, if we missed it anywhere else.
                if (!this.extTabs.hasOwnProperty(msg.tabId)) { this._tabInit(msg.tabId, false, "onMessage") }

                //Finally parse and send the response.
                sendResponse(this._parseMessage(msg.command, this.extTabs[msg.tabId]))
            } else {
                switch(msg.command) {
                    case "pauseAllTabs":
                        for(t in this.extTabs) {
                            this.extTabs[t].pause()
                        }
                        break;
                }
            }
            return true
        });

    }

    _tabInit(tab, newWindow, debugMsg) {
        //I keep getting an undefined ID, I am not exactly sure why...
        if(!tab?.id) { return; }

        //If the tab already exists...
        if (this.extTabs.hasOwnProperty(tab.id)) { return; }
        this.debugLog(tab.id, " Has been found and added to the tabState.")

        //When a new window is initiated, it does not have the URL yet
        if(!newWindow) {
            this.extTabs[tab.id] = new extTabState(tab.id, false, tab.url, new URL(tab.url).hostname, newWindow, this._debugMode)
        } else {
            this.extTabs[tab.id] = new extTabState(tab.id, false, tab.url, null, newWindow, this._debugMode)
        }

        //Add the on state Change default listener.
        this.extTabs[tab.id].onTabStateChanged.addListener((tabId, data) => {
            const { oldState, newState } = data
            if (newState == "tab_init") {
                chrome.storage.sync.get([this._storageKey], (result) => {
                    if (!result) {
                        let key = this._storageKey
                        chrome.storage.sync.set({key: defaultData}, () => {})
                        this.extTabs[tabId].setState("Load_FirstRun")
                    } else {
                        this._extData = result
                        this.extTabs[tabId].setState("Load")
                    }
                })
            } else if(newState == "Load_FirstRun") {
                this.debugLog(tabId, "onLoad_FirstRun has been started.")
                this["onLoad"]._runListeners(tabId, {"oldState": oldState, "newState": newState, "firstRun": true}, this.extTabs[tabId])
            } else {
                this.debugLog(tabId, "on" + newState + " has been started")
                this["on"+newState]._runListeners(tabId, {"oldState": oldState, "newState": newState, "firstRun": false}, this.extTabs[tabId])
            }
            this.onStateChanged._runListeners(tab.id, data, this.extTabs[tabId])
        })

        this.extTabs[tab.id].onTabActiveChanged.addListener((tabId, data) => {
            this.onActiveChanged._runListeners(tab.id, data, this.extTabs[tabId])
        })

        this.extTabs[tab.id].setState("tab_init")
        return this.extTabs[tab.id]
    }

    //TODO: can be overwritten...
    _parseMessage(cmd, tab) {
        console.info("cmd=" + cmd)
        console.info(tab)
        switch(cmd) {
            case "getFullState":
                return tab.toString()
            default:
                tab[cmd]()
        }
    }

    debugLog(tabId, msg) {
        if(this._debugMode) {
            console.info(tabId, msg)
        }
    }
}
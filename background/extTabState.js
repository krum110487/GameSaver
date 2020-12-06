//TODO: move to it's own utilities.js...
function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

class extTabState {
    constructor(tabId, active, url, hostName, newWindow, debug) { 
        this._tabId = tabId
        this._active = active
        this._state = null
        this._url = url
        this._hostName = hostName
        this._debugMode = debug
        this._data = null
        this._newActiveWindow = newWindow
        this._debuggerAttached = false
        this._paused = false

        this.onTabStateChanged =    new listener(debug)
        this.onTabActiveChanged =   new listener(debug)
        this.onTabStateChanged =    new listener(debug)
        this.onTabActiveChanged =   new listener(debug)
    }

    setIcon(iconPath) {
        chrome.browserAction.setIcon({ tabId: this._tabId, path: iconPath });
    }

    setBadgeColor(BGcolor) {
        chrome.browserAction.setBadgeBackgroundColor({ tabId: this._tabId, color: BGcolor });
    }

    setBadgeText(value) {
        let txt = value.toString()
        if(isNumeric(txt)) {
            if(parseInt(txt) > 999) {
                txt = "999+"
            }
        } else {
            txt = txt.substring(0,4)
        }

        chrome.browserAction.setBadgeText({ tabId: this._tabId, text: txt });
    }

    getState() { return this._state }
    setState(newState) {
        let oldState = this.getState()
        if(oldState !== newState) {
            console.log("state change from "+ oldState + " to " + newState)
            this._state = newState
            this.onTabStateChanged._runListeners(this._tabId, {"oldState": oldState, "newState": newState}, this)
        }
    }

    pause() {
        this._paused = true
    }

    unpause() {
        this._paused = false
    }

    isActive() { return this._active }
    toggleActive() { this.setActive(!this.isActive()) }
    setActive(flag) {
        let oldActive = this.isActive()
        if(oldActive !== flag) {
            if(flag) { console.info(this._tabId, "Tab is now Active.")   }
            else     { console.info(this._tabId, "Tab is now Inactive.") }
            this._active = flag
            console.log()
            this.onTabActiveChanged._runListeners(this._tabId, {"isActive": flag}, this)
        }
    }

    isNewActiveWindow() { return this._newActiveWindow }
    toggleNewActiveWindow() { this._newActiveWindow = !this._newActiveWindow }

    isDebuggerAttached() { return this._debuggerAttached }
    setDebuggerAttached(flag) { this._debuggerAttached = flag }

    getURL() { return this._url }
    setURL(url) { this._url = url }

    getHostname() { return this._hostName }
    setHostname(hostName) { this._hostName = hostName }

    toString() {
        return JSON.stringify({
            "tabId": this._tabId,
            "active": this._active,
            "state": this._state,
            "url": this._url,
            "debugMode": this._debugMode,
            "data": this._data
        })
    }
}
class listener {
    constructor(debug) { this._arr = []; this._debugMode = debug }
    addListener(func) {
        this._arr.push(func)
        if(this._debugMode && func.name.length > 0) {
            console.info("Function named \"" + func.name + "\" has been registered as a listener.")
        }
    }

    _runListeners(tabId, data, extTab) {
        this._arr.forEach((f) => {
            f(tabId, data, extTab)
        })
    }
}
/*
Checklist
    1) Popup.html 
        Enable/Disable Extension 
        Enable/Disable Extension for ALL locations
        For each tab ask if you want to save the collected data per-tab?
        Enable Flash Preservation Mode (skips baseline check, grabs swf's and Other files automatically)
    2) Debug Mode
        Enter baseline mode (no need to implement it just yet)
        Enter Scrape mode
    3) Options.html
        Ignore Baseline mode for all pages
        Auto Enabled for all tabs
    4) Export.html
        Show a list of all the files by base URL in curation format.
           Content folder > Path/to/files.swf
        Gives user the ability to rename a game all info includes
           Name, BaseURL, fileName, filePath, RequestURL (not shown)
        Export to a zip which contains all of the zips for a domain

*/
console.log("TESTING123")
const state = {
    TabActivated: "TabActivated",
    TabRemoved: "TabRemoved",
    TabNavigated: "TabNavigated",
    ExtFirstLoad: "ExtFirstLoad",
    ExtLoad: "ExtLoad",
    ExtActiveChange: "ExtActiveChange",
    TutorialStarted: "TutorialStarted",
    TutorialSkipped: "TutorialSkipped",
    TutorialCompleted: "TutorialCompleted",
    FlashPreservation: "FlashPreservation",
    BaselineOpened: "BaselineOpened",
    BaselineRequired: "BaselineRequired",
    BaselineWaived: "BaselineWaived",
    BaselineStarted: "BaselineStarted",
    BaselineNonGameScan: "BaselineNonGameScan",
    BaselineGamePageScan: "BaselineGamePageScan",
    BaselineCompleted: "BaselineCompleted",
    ScrapeStarted: "ScrapeStarted",
    ScrapePaused: "ScrapePaused"
}

const commands = {
    toggleActive: "toggleActive"
}

const icon = {
    GreyIcon: "..\\images\\icon_grey.png",
    RedIcon: "..\\images\\icon_red3d.png",
    GreenIcon: "..\\images\\icon_green.png",
    YellowIcon: "..\\images\\icon_yellow.png"
}

const badgeColor = {
    badge_gray: "#808080",
    badge_red: "#FF0000",
    badge_yellow: "#FFFF00",
    badge_green: "#008000"
}

const defaultData = {
    firstRun: false
}

const DSName = "GameSaver"

class gameSaver extends extEventMgr {
    constructor(storageMode, debugMode) {
        super(storageMode, debugMode)

        this._extData = defaultData
        this._debugMode = debugMode

        //Managed application state listener events
        this.onTutorialStarted = new listener(debugMode)
        this.onTutorialSkipped = new listener(debugMode)
        this.onTutorialCompleted = new listener(debugMode)
        this.onFlashPreservation = new listener(debugMode)
        this.onBaselineOpened = new listener(debugMode)
        this.onBaselineRequired = new listener(debugMode)
        this.onBaselineWaived = new listener(debugMode)
        this.onBaselineStarted = new listener(debugMode)
        this.onBaselineNonGameScan = new listener(debugMode)
        this.onBaselineGamePageScan = new listener(debugMode)
        this.onBaselineCompleted = new listener(debugMode)
        this.onScrapeStarted = new listener(debugMode)
        this.onScrapePaused = new listener(debugMode)

        //Unmanaged Listener Events
        this.onFlashPreservationResponse = new listener(debugMode)
        this.onBaselineNonGameResponse = new listener(debugMode)
        this.onBaselineGamePageResponse = new listener(debugMode)

        //Send changes to storage if it exists.
        /*
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            if(namespace === "local") {
                chrome.runtime.sendMessage(changes, function() {})
            }
        });
        */
        
    }

    /* Stores in this format
    {
        "www.gamesite.com": {
            "www.gamesite.com/page/i/am/on?with=query": {

            }
        }
    }
    */

    //TODO: can be overwritten...
    _parseMessage(cmd, tab) {
        switch (cmd) {
            case "setModeflashOnly":
            case "setModeAll":
            case "getFullState":
                return tab.toString()
            default:
                tab[cmd]()
        }
    }
}

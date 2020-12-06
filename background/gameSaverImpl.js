function cleanPath(filePath, platform) {
    if(platform === "windows") {
        //use just hostname and pathName, we have kept the original url in case we need the query string
        //to make the path unique
        let u = new URL(filePath)
        return decodeURI(u.hostname + u.pathname + u.search)
                 .replaceAll("<","﹤")
                 .replaceAll(">","﹥")
                 .replaceAll(":", "：")
                 .replaceAll("\"", "＂")
                 .replaceAll("\\", "%5C")
                 .replaceAll("|", "%7C")
                 .replaceAll("?","？")
                 .replaceAll("*", "%2A")
    } else {
        //todo...maybe...
    }
}

function decodePath(filePath, platform) {
    if(platform === "windows") {
        //use just hostname and pathName, we have kept the original url in case we need the query string
        //to make the path unique
        let u = new URL(filePath)
        return decodeURI(u.hostname + u.pathname + u.search)
                 .replaceAll("﹤","<")
                 .replaceAll("﹥",">")
                 .replaceAll("：",":")
                 .replaceAll("＂","\"")
                 .replaceAll("%5C","\\")
                 .replaceAll("%7C","|")
                 .replaceAll("？","?")
                 .replaceAll("%2A","*")
    } else {
        //todo...maybe...
    }
}

function createValidPath(filePath, platform) {
    let c = cleanPath(filePath, platform)
    return c.replace(/\/$/, '').replaceAll("/", "∕")
    //return c.split("/").slice(0,-1).join("∕") + "/" + c.split("/").slice(-1)
}

function pad(num, size) {
    var s = "000000000" + num;
    return s.substr(s.length-size);
}

function storeFile(dUrl, spUrl, fUrl, sha256, md5, crc, data) {
    let tdKey = "TDATA_" + fUrl

    let d = {}
    d.pageCount = 1
    d.fileCount = 1
    d.idnum = 1
    d.idstr = "DOMAIN_"
    d.totalSize = 0

    let spdata = {}
    spdata.idnum = 1
    spdata.idstr = "PATH_0000001"
    spdata.fileCount = 1
    spdata.totalSize = 0
    d[spUrl] = spdata
    
    let fdata = {}
    fdata.idnum = 1
    fdata.idstr = "FILE_000001"
    fdata.fileKey = tdKey
    fdata.safePath = cleanPath(fUrl, "windows")
    fdata.safeQuery = cleanPath(fUrl, "windows")
    fdata.sha256 = sha256
    fdata.md5 = md5
    fdata.crc = crc
    d[spUrl][fUrl] = fdata

    Queue.enqueue(() => { 
        return new Promise((res, rej) => {
            //Set Blob Data
            chrome.storage.local.get(tdKey, function (blobData) {
                let newBD = {}
                if(Object.keys(blobData).length === 0 && blobData.constructor === Object) {
                    newBD[tdKey] = {
                        "fileURL": fUrl, 
                        "fileData": data,
                        "contentPath": cleanPath(fUrl, "windows"),
                        "domain": dUrl,
                        "page": createValidPath(spUrl, "windows"),
                        "sha256": sha256
                    }
                    console.log("FILE DATA", newBD)
                    chrome.storage.local.set(newBD, ()=>{
                        res("Completed Data Successfully")
                    })
                } else {
                    res("Data Already Exists")
                }
            })

            //Get domain count
            chrome.storage.local.get("domainCnt", function (cnt) {
                let domainCnt = null
                if(Object.keys(cnt).length === 0 && cnt.constructor === Object) {
                    domainCnt = 0
                } else {
                    domainCnt = cnt.domainCnt
                }

                chrome.storage.local.get(dUrl, function (domain) {
                    //We have everything for this domain, 
                    console.log("DOMAIN DATA:", domain)
                    let newD = {}
                    if(Object.keys(domain).length === 0 && domain.constructor === Object) {
                        //Domain doesn't exist, we need to add it
                        domainCnt++
                        newD[dUrl] = d
                        newD[dUrl].idnum = domainCnt

                        let did = "DOMAIN_" + pad(newD[dUrl].idnum, 4)
                        newD[dUrl].idstr = did
                        newD[dUrl].parentid = "#"

                        let pid = "PAGE_" + pad(newD[dUrl].idnum, 4) + "_" + pad(newD[dUrl][spUrl].idnum, 7)
                        newD[dUrl][spUrl].idstr = pid
                        newD[dUrl][spUrl].parentid = did

                        let fid = "FILE_" + pad(newD[dUrl].idnum, 4) + "_" + pad(newD[dUrl][spUrl].idnum, 7) + "_" + pad(newD[dUrl][spUrl][fUrl].idnum, 6)
                        newD[dUrl][spUrl][fUrl].idstr = fid
                        newD[dUrl][spUrl][fUrl].parentid = pid

                        //Increment the total domains, then set the storage.
                        chrome.storage.local.set({ "domainCnt": domainCnt }, ()=>{
                            chrome.storage.local.set(newD, ()=>{
                                res("Completed Successfully")
                            })
                        })
                    } else {
                        newD = domain
                        if(!domain[dUrl].hasOwnProperty(spUrl)) {
                            newD[dUrl].pageCount++
                            newD[dUrl].fileCount++
                            newD[dUrl][spUrl] = spdata
                            newD[dUrl][spUrl].idnum = newD[dUrl].pageCount

                            let pid = "PAGE_" + pad(newD[dUrl].idnum, 4) + "_" + pad(newD[dUrl][spUrl].idnum, 7)
                            newD[dUrl][spUrl].idstr = pid
                            newD[dUrl][spUrl].parentid = newD[dUrl].idstr

                            let fid = "FILE_" + pad(newD[dUrl].idnum, 4) + "_" + pad(newD[dUrl][spUrl].idnum, 7) + "_" + pad(newD[dUrl][spUrl][fUrl].idnum, 6)
                            newD[dUrl][spUrl][fUrl].idstr = fid
                            newD[dUrl][spUrl][fUrl].parentid = pid

                            //Update this entry.
                            chrome.storage.local.set(newD, ()=>{
                                res("Completed Successfully")
                            })
                        }
                        else if(!domain[dUrl][spUrl].hasOwnProperty(fUrl)) {
                            newD[dUrl].pageCount++
                            newD[dUrl].fileCount++
                            newD[dUrl][spUrl].fileCount++
                            newD[dUrl][spUrl][fUrl] = fdata
                            newD[dUrl][spUrl][fUrl].idnum = newD[dUrl][spUrl].fileCount

                            let fid = "FILE_" + pad(newD[dUrl].idnum, 4) + "_" + pad(newD[dUrl][spUrl].idnum, 7) + "_" + pad(newD[dUrl][spUrl][fUrl].idnum, 6)
                            newD[dUrl][spUrl][fUrl].idstr = fid
                            newD[dUrl][spUrl][fUrl].parentid = newD[dUrl][spUrl].idstr

                            //Update this entry
                            chrome.storage.local.set(newD, ()=>{
                                res("Completed Successfully")
                            })
                        } else {
                            if(domain[dUrl][spUrl][fUrl].sha256 != fdata.sha256) {
                                rej("CONFLICT!!!")
                            } else {
                                res("Duplicate Ignored!!!")
                            }
                        }
                    }
                });
            });
        })
    })
}

let gs = new gameSaver("GameSaver", true);

gs.onActiveChanged.addListener((tabId, data, extTab) => {
    const { isActive } = data
    if(isActive) {
        extTab.setIcon(icon.RedIcon)
    } else {
        extTab.setIcon(icon.GreyIcon)
    }
})

gs.onTabCompleted.addListener((tabId, data, extTab) => {
    //the tab completed, we can do stuff....
})

gs.onTabIconChanged.addListener((tabId, data, extTab) => {
    //the tab completed, so now we need to make sure the icon is right...
    if(extTab?.isActive()) {
        extTab?.setIcon(icon.RedIcon)
    } else {
        extTab?.setIcon(icon.GreyIcon)
    }
})

/*----------------------------------------------------------------------*/
/*--------------------------Per-Tab Load Logic--------------------------*/
/*----------------------------------------------------------------------*/
gs.onLoad.addListener((tabId, data, extTab) => {
    const { firstLoad } = data

    if(firstLoad) {
        gs.debugLog("FirstLoad occured")
        extTab.setState(state.TutorialStarted)
    }
    //This is run for EACH tab loaded
})

gs.onUrlNavigated.addListener((tabId, data, extTab) => {
    if(extTab.isActive()) {
        if(!gs.hasBaseline(tabId) && !gs.hasBaselineWaiver(tabId)) {
            extTab.setState(tabId, state.BaselineRequired)
        } else if (gs.hasBaselineWaiver(tabId)) {
            extTab.setState(tabId, state.BaselineWaived)
        } else {
            extTab.setState(tabId, state.BaselineCompleted)
        }
    }
})

gs.onHTTPResponse.addListener((tabId, data, extTab) => {
    const { requestId, frameId, type, initiator, timestamp, statusCode, url, responseHeaders } = data.response
    //let mime = resph["Content-Type"]?.split(";")[0]?.trim()
    let cs = data.currState
    //TODO: REMOVE THIS once we actually care about the state...
    cs = state.FlashPreservation
    switch(cs) {
        case state.ScrapeStarted:
            //TODO: Need domain info to add check to see if baseline is completed or waived
            //Get stuff, filter stuff based upon baseline
            break;
        case state.FlashPreservation:
            //Get SWF stuff only, ignore baseline
            //We only want null items, but when a popup loads while active
            //the initiator will be null, so we need to skip the first null item
            if(initiator === "null") {
                gs.debugLog("Flash Preservation Log:", data.response)
                let hostname = extTab.getHostname()
                let pageUrl = extTab.getURL()
                let requestURL = data.response.url
                let statusCode = data.response.statusCode
                let timestamp = data.response.timestamp

                if(data.response.statusCode < 400) {
                    fetch(data.response.url)
                        .then(function(res) {
                            return res.blob()
                        })
                        .then(blob => {
                            return new Promise(function(resolve, reject) {
                                calculateHashes(blob).then((hashes) => {
                                    const reader = new FileReader();
                                    reader.onload = function (event) {
                                        resolve({"array": event.target.result, "hashes": hashes})
                                    }
                                    reader.readAsArrayBuffer(blob);
                                })
                            });
                        })
                        .then((fdata) => {
                            storeFile(
                                hostname,
                                pageUrl,
                                requestURL,
                                fdata.hashes.SHA256,
                                fdata.hashes.MD5,
                                fdata.hashes.crc,
                                null /*fdata.array.buffer*/)
                        })
                } else {

                }
            }
            break;
        case state.BaselineNonGameScan:
            //Do baseline storage for non-games
            break;
        case state.BaselineGamePageScan:
            //Do baseline storage for games
            break;
        default:
            
    }
})

/*----------------------------------------------------------------------*/
/*----------------------------Tutorial Logic----------------------------*/
/*----------------------------------------------------------------------*/
gs.onTutorialStarted.addListener((tabId, data, extTab) => {
    //TODO: Open window for the tutorial.
    //gs.showExtPopup(tabId,htmlPathToFile)
})

gs.onTutorialSkipped.addListener((tabId, data, extTab) => {
    gs.setTutorialSkipped(tabId, true)
    gs.closeExtPopup(tabId)
})

gs.onTutorialCompleted.addListener((tabId, data, extTab) => {

})


/*----------------------------------------------------------------------*/
/*--------------------------Flash Preservation--------------------------*/
/*----------------------------------------------------------------------*/
gs.onFlashPreservation.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})


/*----------------------------------------------------------------------*/
/*-------------------------------Baseline-------------------------------*/
/*----------------------------------------------------------------------*/
gs.onBaselineOpened.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineRequired.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineWaived.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineStarted.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineNonGameScan.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineGamePageScan.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineCompleted.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})


/*----------------------------------------------------------------------*/
/*-----------------------------Scrape Status----------------------------*/
/*----------------------------------------------------------------------*/
gs.onScrapeStarted.addListener((tabId, data, extTab) => {
    //Do the check for baseline
    if(gs.hasBaseline(tabId)) {
        //The baseline exists or is ignored
    } else {
        //Tell the user baseline is required.
        gs.setState(tabId, state.BaselineRequired)
    }
})

gs.onScrapePaused.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})


/*----------------------------------------------------------------------*/
/*----------------------------Network Events----------------------------*/
/*----------------------------------------------------------------------*/
gs.onFlashPreservationResponse.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineNonGameResponse.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})

gs.onBaselineGamePageResponse.addListener((tabId, data, extTab) => {
    //sync.set() to set the settings for the plugin.
})
activateToggle.onchange = function (element) {
    console.info("Attempt Change")
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let tabId = tabs[0].id
        console.log(tabs[0].id)

        chrome.runtime.sendMessage({ "command": "toggleActive", "tabId": tabId }, function(response) {
            console.info("Message Sent...: \"toggleActive\"")
            guiActivateChanged()
        })
    })
}

flashOnly.onchange = function (element) {
    //chrome.runtime.sendMessage({ "command": "setModeflashOnly" }, function(response) {
        //guiActivateChanged()
    //});
};

allMode.onchange = function (element) {
    //chrome.runtime.sendMessage({ "command": "setModeAll" }, function(response) {
        //guiActivateChanged()
    //});
};

async function guiActivateChanged() {
    tabState = await getState()
    console.log(tabState)
    
    let activateToggle = document.querySelector("#activateToggle")
    let flashOnly = document.querySelector("#flashOnly")
    let allMode = document.querySelector("#allMode")
    let autoBaseline = document.querySelector("#autoBaseline")
    let download = document.querySelector("#download")

    activateToggle.checked=tabState.active
    if(tabState.active) {
        activateToggle.labels[0].innerText = "Enabled"
        flashOnly.removeAttribute("disabled");
        //allMode.removeAttribute("disabled");
        //autoBaseline.removeAttribute("disabled");
    } else {
        activateToggle.labels[0].innerText = "Disabled"
        flashOnly.setAttribute("disabled", "true")
        allMode.setAttribute("disabled", "true")
        autoBaseline.setAttribute("disabled", "true")
    }
}

function getState() {
    return new Promise(resolve => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let tabId = tabs[0].id
            chrome.runtime.sendMessage({ "command": "getFullState", "tabId": tabId }, function(state) {
                resolve(JSON.parse(state))
            })
        })
    })
}

//Init the page:
guiActivateChanged()

$(document).ready(function () {
    let loadr = $("#loader")
    $("#download").click(() => {
        loadr.css('visibility', 'visible');
        let zipPromises = {};
        let zips = {}
        let run_count = 0

        chrome.storage.local.get(null, function (data) {
            for (d in data) {
                if (d.startsWith("TDATA_")) {
                    const fileUrl = data[d].fileURL
                    const fileData = data[d].fileData
                    const contentFile = "content/" + data[d].contentPath
                    const domain = data[d].domain
                    const page = data[d].page

                    const fullFilePath = page + "/" + contentFile
                    //If domain doesn't exist in the zips make it, 
                    if (!zips.hasOwnProperty(domain)) {
                        run_count++
                        zips[domain] = {}
                        zips[domain].zip = new JSZip()
                        zips[domain].count = 0
                        zipPromises[domain] = []
                    }

                    let file = null
                    if(!fileData) {
                        file = fetch(fileUrl).then(r => {
                            if (r.status === 200) return r.blob()
                            return Promise.reject(new Error(r.statusText))
                        })
                    } else {
                        file = new Uint8Array(fileData)
                    }

                    //Add the file to the page
                    zips[domain].count++
                    zipPromises[domain].push(
                        new Promise((res,rej) => {
                            loadr.css('visibility', 'visible');
                            zips[domain].zip.file(fullFilePath, file)
                            res(null)
                        }).then(()=>{
                        })
                    )
                }
            }

            for (domain in zips) {
                zips[domain].count++
                const name = domain + ".zip"

                Promise.resolve(domain).then((d) => {
                    Promise.all(zipPromises[d]).then(function (data) {
                        //Serve the zip...
                        zips[d].zip.generateAsync({ type: 'blob' })
                            .then((content) => {
                                saveAs(content, name)
                                run_count--
                                console.log(run_count)
                                if(run_count <= 0) {
                                    loadr.css('visibility', 'hidden');
                                }
                            })
                    })
                })
            }
        })
    })
})
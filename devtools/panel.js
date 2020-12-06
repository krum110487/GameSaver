let linkData = []

function generateEntry(data, key, newValue, type) {
    let resVal = null
    if (key != "fileCount" && key != "idnum" && key != "idstr" && key != "parentid" && key != "totalSize" && key != "pageCount") {
        if (newValue) {
            resVal = { "id": data[key].newValue.idstr, "parent": data[key].parentid, "text": key, "type": type, "data": { "sha256": "" } }
        } else {
            resVal = { "id": data[key].idstr, "parent": data[key].parentid, "text": key, "type": type, "data": { "sha256": "" } }
        }

        //Too short on time to do this properly..
        if (!resVal.id) {
            resVal = null
        }
    }

    return resVal
}

function updateAllData() {
    linkData = []
    chrome.storage.local.get(null, function (data) {
        for (d in data) {
            if (!d.startsWith("TDATA_") && !d.startsWith("domainCnt")) {
                let root = generateEntry(data, d, false)
                if (root && root?.id) { linkData.push(root) }

                for (p in data[d]) {
                    let page = generateEntry(data[d], p, false)
                    if (page && page?.id) { linkData.push(page) }

                    for (f in data[d][p]) {
                        let file = generateEntry(data[d][p], f, false, "file-other")
                        if (file && file?.id) { linkData.push(file) }
                    }
                }
            }
        }
        applyData()
    })
}

function applyData() {
    console.log(linkData)
    $('#jstree').jstree(true).settings.core.data = linkData;
    $('#jstree').jstree(true).refresh();
}

$(document).ready(function () {
    let loadr = $("#loader")
    loadr.css('visibility', 'hidden');
    /*
        { id : "domain_google.com", parent : "#", text : "google.com", data: {size: "5.12 kb"}},
        { id : "page_0000001", parent : "domain_google.com", text : "sub.google.com/game?gameId=100", data: {size: "5.12 kb"} },
        { id : "req_0000001", parent : "page_0000001", text : "swf.google.com/swf/gameName/game.swf", data: {size: "2.56 kb", sha256: "hisdhivhiasjekrasufusgiudvaasgfyugp"}},
        { id : "req_0000002", parent : "page_0000001", text : "swf.google.com/swf/gameName/game.xml", data: {size: "2.56 kb", sha256: "hisdhivhiasjekrasufusgiudvaasgfyugp"}}
    */
    var data = []
    $('#jstree').jstree({
        "core": {
            "animation": 0,
            "check_callback": true
        },
        "grid": {
            "columns": [
                { width: '100%', header: "Domain" },
                { width: 200, value: "sha256", header: "Hash" },
                { width: 100, value: "size", header: "Size" }
            ],
            resizable: true,
            contextmenu: true
        },
        "types": {
            "#": {
                "max_children": 1,
                "max_depth": 4,
                "valid_children": ["root"]
            },
            "root": {
                "icon": "/static/3.3.10/assets/images/tree_icon.png",
                "valid_children": ["default"]
            },
            "default": {
                "valid_children": ["default", "file"]
            },
            "file-other": {
                "icon": "jstree-file",
                "valid_children": []
            },
            "file-flash": {
                "icon": "jstree-flash",
                "valid_children": []
            }
        },
        "plugins": [
            "dnd", "search", "state", "types", "wholerow", "grid", "themes"
        ]
    }).on('refresh.jstree', function () {
        $('#jstree').jstree('open_all')
    });

    updateAllData()

    chrome.storage.onChanged.addListener(function (changes, namespace) {
        if (namespace === "local") {
            updateAllData()
        }
    });

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

    $("#copy").click(() => {
        chrome.storage.local.get(null, function (data) {
            let Links = ""
            for (d in data) {
                if (d.startsWith("TDATA_")) {
                    Links += data[d].fileURL + '\n'
                }
            }
            copyTextToClipboard(Links)
        })
    })

    $("#refresh").click(() => {
        updateAllData()
    })

    $("#clear").click(() => {
        chrome.storage.local.clear(() => { })
        linkData = []
        applyData()
    })
});

function copyTextToClipboard(text) {
    chrome.devtools.inspectedWindow.eval(
        "copy(`" + text + "`)",
        function(result, isException) { console.log(result, isException) }
    );
}

/*

    $("#download").click(() => {
        let zips = {}
        let pages = {}

        chrome.storage.local.get(null, function (data) {
            for (d in data) {
                if (d.startsWith("TDATA_")) {
                    let fileUrl = data[d].fileURL
                    let fileData = data[d].fileData
                    let contentFile = "content/" + data[d].contentPath
                    let domain = data[d].domain
                    let page = data[d].page

                    //If domain doesn't exist in the zips make it, 
                    if (!zips.hasOwnProperty(domain)) {
                        zips[domain] = new JSZip()
                        pages[domain] = {}
                    }

                    //If page isn't in domainPages
                    if (!pages[domain].hasOwnProperty(page)) {
                        pages[domain][page] = new JSZip()
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
                    pages[domain][page].file(contentFile, file)
                }
            }

            for (pd in pages) {
                for (page in pages[pd]) {
                    zips[pd].file(page + ".zip", new Promise((res, rej) => {
                        pages[pd][page].generateAsync({ type: 'blob' }).then((blob) => {
                            res(blob)
                        })
                    }))
                }
                let name = pd + ".zip"
                zips[pd].generateAsync({ type: 'blob' })
                    .then((content) => {
                        saveAs(content, name)
                    })
            }
        })
    })

    */
console.log("Injected Activiti-admin.js")

/*TODO:
    Shorten the "Name" and "Type" columns, lengthen the "Value" to fill it out.
    Fill out vertical Task, Subprocesses and Jobs to fill the vertical space  
*/

//Inject script to run when Modal appears, run editor code to enable auto complete
var modifyObserverScript = document.createElement('script');
var injectCode = `
var executionCode = \`// Define execution to allow the scripts to work
class exMap {
    private def keyMap = [:]
    public def _print = true
    private def _pl = null
    public exMap(Boolean print, pl)              {_print = print; _pl = pl}
    public def getVariable(String key)           { return keyMap.get(key) }
    public def setVariable(String key, Object o) { keyMap.put(key, o); if(_print){ _pl("Set Variable: "+key+" = "+o)}}
    public def setVariable(String key, Object o, Boolean p) { keyMap.put(key, o); if(p){ _pl("Set Variable: "+key+" = "+o)}}
}
def printLine = {println(it)}
execution = new exMap(false, printLine);

//Generated setVariables based upon getVariables in the script.
if(true) {
\\t\`

var executionCodeFooter = \`
\\texecution._print=true
}

//Paste test code below here!
\`

function kronosGetVars(URL) {
    let rows = document.querySelectorAll(".ngRow")
    let buildFuncs = []
    rows.forEach((row) => {
        let col0 = row.querySelector(".col0 .ng-binding").innerText.trim()
        let col2 = row.querySelector(".col2 .ng-binding").innerText.trim()
        buildFuncs.push("execution.setVariable(\\"" + col0 + "\\",\\"" + col2 + "\\")")
    })

    navigator.clipboard.writeText(executionCode + buildFuncs.join("\\n\\t") + executionCodeFooter).then(function() {
        if(URL) {
            window.open(URL, "_blank")
        }
    }, function() {
        /* clipboard write failed */
    });
}

var ClipboardLink = '<a onclick="kronosGetVars()" style="cursor: pointer">Copy Variables to Clipboard</a>'
var OpenGroovyLink = '<a onclick="kronosGetVars(\\'https://groovy-playground.appspot.com/?checkClipboard=true\\')" style="cursor: pointer">Open in Groovy</a>'
var observer = new MutationObserver(function(mutations) {
    for(let i = 0; i < mutations.length; i++) {
        let mutation = mutations[i]

        if(window.location.href.indexOf("process-instance") == -1) {
            break;
        }

        let ngScope =     document.querySelector('.row:not([class*="ng-scope"]) > .col-md-9')
        let ngScopeNew =  document.querySelector('.col-md-12')
        let tabs =        document.querySelector(".tabs-wrapper")
        let comp =        document.querySelector(".col-md-9 .component")
        let viewPort =    document.querySelector(".ngViewport")
        let gridwrap =    document.querySelector(".grid-wrapper")
        let gridstyle =   document.querySelector(".grid-wrapper .gridStyle")
        let varActions =  document.querySelector(".row:nth-of-type(2) .col-md-3 .component")
        let gridMessage = document.querySelector(".grid-message")

        if(ngScopeNew && viewPort) {
            if(viewPort.getAttribute("style") == "width:100%; height:95%") {
                break;
            }
        }

        if(ngScope && tabs && comp) {
            ngScope.setAttribute("class", "col-md-12")
            document.querySelector(".col-md-12 .component").setAttribute("style", "height:800px")
            tabs.setAttribute("style", "height:100%")
        }
        
        if(viewPort && gridwrap && gridstyle && varActions && gridMessage) {
            if (viewPort.getAttribute("style") != "width:100%; height:95%") {
                viewPort.setAttribute("style", "width:100%; height:95%")
                gridwrap.setAttribute("style", "height:95%")
                gridstyle.setAttribute("style", "height:95%")
                varActions.setAttribute("style", "display:none")
                gridMessage.innerHTML += ClipboardLink + " OR " + OpenGroovyLink
            }
        }
    }
});

observer.observe(document.querySelector('body'), {
    attributes: true,
    subtree: true,
    childList: true,
    characterData: true
});`

modifyObserverScript.textContent = injectCode;
(document.head||document.documentElement).appendChild(modifyObserverScript);

var XHRInject = document.createElement('script');
let XHRInjectCode =`
var _open = XMLHttpRequest.prototype.open;
var wfdUserList = ["delegatorName",
"empDstStart",
"empDstEnd",
"employee",
"empTimezoneId",
"empTimezoneOffset",
"estimatedPunchTime",
"initiator",
"isCCRequest",
"isReassignable",
"minutesSinceLastPunch",
"originator",
"originator_kreference",
"punchTime",
"resourceId",
"timeFrame",
"transferString"]

var wfdServerList = ["application_context",
"attestationProcessId",
"deploymentId",
"ext_tenantId",
"server_language",
"server_name",
"server_port",
"server_protocol",
"userAgentHeader",
"web_server_name",
"web_server_protocol",
"wfc_url",
"WFD_X_Forwarded_For",
"xForwardedForHeader"]

window.XMLHttpRequest.prototype.open = function (method, URL) {
    var _onreadystatechange = this.onreadystatechange,
        _this = this;

    _this.onreadystatechange = function () {
        if (_this.readyState === 4 && _this.status === 200 && ~URL.indexOf('variables?serverId=')) {
            try {
                var res = JSON.parse(_this.responseText);
                workflow = []
                workflowEnd = []
                wfdUser = []
                wfdServer = []

                for(let i = 0; i < res.data.length; i++) {
                  var name = res.data[i].variable.name
                  if(wfdServerList.includes(name)) {
                      var newData = res.data[i];
                      newData.variable.type = "string (WFD Server)"
                      wfdServer.push(newData)
                  } else if(wfdUserList.includes(name)) {
                      var newData = res.data[i];
                      newData.variable.type = "string (WFD User)"
                      wfdUser.push(newData)
                  } else if(name.startsWith("completedTask")) {
                      var newData = res.data[i];
                      newData.variable.type = "string (Workflow)"
                      workflowEnd.push(newData)
                  } else {
                      var newData = res.data[i];
                      newData.variable.type = "string (Workflow)"
                      workflow.push(newData)
                  }
                }

                res.data = workflow.concat(workflowEnd).concat(wfdUser).concat(wfdServer)

                Object.defineProperty(_this, 'responseText', {value: JSON.stringify(res)});
                Object.defineProperty(_this, 'response', {value: JSON.stringify(res)});
            } catch (e) {
              console.log(e)
            }

            console.log('Caught! :)', method, URL/*, _this.response*/);
        }
        // call original callback
        if (_onreadystatechange) _onreadystatechange.apply(this, arguments);
    };

    // detect any onreadystatechange changing
    Object.defineProperty(this, 'onreadystatechange', {
        get: function () {
            return _onreadystatechange;
        },
        set: function (value) {
            _onreadystatechange = value;
        }
    });

    return _open.apply(_this, arguments);
};`


XHRInject.textContent = XHRInjectCode;
(document.head||document.documentElement).appendChild(XHRInject);

/*
//Shorten the tags width
//Loop through the data and create the CSS
var aTags = document.getElementsByTagName("div");
var type;

for (var i = 0; i < aTags.length; i++) {
  if (aTags[i].textContent == "Type") {
    type = aTags[i];
    break;
  }
}

//Use this to create the CSS
//Once we find the width, we get the new 
//  width = col2_width + col1_width - 100
//  left  = col1_left + 100
var style = document.createElement('style');
style.type = 'text/css';
style.innerHTML += '.col1_new { width: 100px !important; }';
style.innerHTML += '.col2_new { width: 600px !important; left: 466px; }';

document.getElementsByTagName('head')[0].appendChild(style);
  .col1 = "width: 100px !important;"
  .col2 = "width: 600px !important; left: 466px;"
*/
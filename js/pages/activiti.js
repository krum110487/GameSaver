/*
Updates the current ace editor to have more features
TODO: make a custom mode for groovy
*/

console.log("ext-language_tools.js Injected.")

//Inject required ext-language_tools.js
var languageToolsScript = document.createElement('script');
languageToolsScript.src = chrome.runtime.getURL('js/library/ace-editor/ext-language_tools.js');
languageToolsScript.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(languageToolsScript);

//Inject script to run when Modal appears, run editor code to enable auto complete
var modifyObserverScript = document.createElement('script');
var injectCode = `
var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        let editorDiv = mutation.target.querySelector('.ace_editor')
        if(editorDiv) {
            let langTools = ace.require('ace/ext/language_tools');
            let aceEditor = ace.edit(editorDiv)
            aceEditor.session.setMode("ace/mode/groovy");
            aceEditor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
            
            var customCompleter = {
                getCompletions: function(editor, session, pos, prefix, callback) {
                    if (prefix.length === 0) { callback(null, []); return }
                    callback(null, [
                      {name: "execution", value: "execution", score: 300, meta: "keyword"},
                      {name: "setVariable", value: "setVariable", score: 300, meta: "method"},
                      {name: "getVariable", value: "getVariable", score: 300, meta: "method"}
                    ])
                }
            }
            langTools.addCompleter(customCompleter);
        }
    });
});

observer.observe(document.querySelector('body'), {
    attributes: true
});`

modifyObserverScript.textContent = injectCode;
//modifyObserverScript.onload = function() {
//    this.remove();
//};
(document.head||document.documentElement).appendChild(modifyObserverScript);
/*
let aceEditor = ace.edit(document.querySelector(".ace_editor"))
aceEditor.session.setMode("ace/mode/groovy");
//aceEditor.setTheme("ace/theme/tomorrow");

// enable autocompletion and snippets
aceEditor.setOptions({
    enableBasicAutocompletion: true,
    enableSnippets: true,
    enableLiveAutocompletion: false
});
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
            let aceEditor = ace.edit(editorDiv)
            aceEditor.session.setMode("ace/mode/groovy");
            aceEditor.setOptions({
                enableBasicAutocompletion: true,
                enableSnippets: true,
                enableLiveAutocompletion: true
            });
        }
    });
});

observer.observe(document.querySelector('body'), {
    attributes: true
});`

modifyObserverScript.textContent = injectCode;
modifyObserverScript.onload = function() {
    this.remove();
};
(document.head||document.documentElement).appendChild(modifyObserverScript);
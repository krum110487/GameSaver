// Can use
// chrome.devtools.*
// chrome.extension.*

// Create a tab in the devtools area
chrome.devtools.panels.create("Game Saver", null, "/devtools/panel.html", function(panel) {});
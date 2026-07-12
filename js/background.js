/**
 * KeyAtlas background service worker.
 * Powers the omnibox keyword search: typing "ka <query>" in the Chrome
 * address bar opens a popup-sized window with the results pre-filled.
 */
chrome.omnibox.setDefaultSuggestion({
  description: "Search KeyAtlas shortcuts for: %s"
});

chrome.omnibox.onInputEntered.addListener((text) => {
  const url = chrome.runtime.getURL("popup.html") + "?q=" + encodeURIComponent(text);
  chrome.windows.create({
    url,
    type: "popup",
    width: 360,
    height: 540
  });
});

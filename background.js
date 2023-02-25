chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.type === "openExtensionTab") {
        console.log('openExtensionTab');

        redirectTab();
    }
    if (request.type === "open-popup") {
        console.log('open-popup');
        // chrome.browserAction.openPopup();
        // const popupUrl = chrome.runtime.getURL("extension-popup.html");
        // await chrome.windows.create({
        //   url: popupUrl,
        //   type: "popup",
        //   height: 600,
        //   width: 400,
        //   focused: true,
        // });
        chrome.action.openPopup();
      }
  });
  


  function redirectTab() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.create({
        url: chrome.runtime.getURL("extension-popup.html"),
        index: tabs[0].index + 1
      });
    });
  }
  
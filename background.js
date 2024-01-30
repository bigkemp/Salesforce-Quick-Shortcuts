"use strict";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "getSfHost") {
    getSfHost(request, sender, sendResponse);
    return true;
  }

  if (request.message === "getSession") {
    getSession(request, sender, sendResponse);
    return true;
  }

  if (request.message === "Hello from Popup!") {
    sendResponse(true);
  }

  return false;
});

function getCookies(params, callback) {
  chrome.cookies.get(params, callback);
}

function getAllCookies(params, callback) {
  chrome.cookies.getAll(params, callback);
}

function getSfHost(request, sender, sendResponse) {
  getCookies({
    url: request.url,
    name: "sid",
    storeId: sender.tab.cookieStoreId
  }, cookie => {
    if (!cookie) {
      sendResponse(null);
      return;
    }

    let [orgId] = cookie.value.split("!");
    findSessionCookie(sender.tab.cookieStoreId, orgId, ["salesforce.com", "cloudforce.com"], sendResponse);
  });
}

function getSession(request, sender, sendResponse) {
  getCookies({
    url: "https://" + request.sfHost,
    name: "sid",
    storeId: sender.tab.cookieStoreId
  }, sessionCookie => {
    if (!sessionCookie) {
      sendResponse(null);
      return;
    }

    let session = { key: sessionCookie.value, hostname: sessionCookie.domain };
    sendResponse(session);
  });
}

function findSessionCookie(storeId, orgId, domains, sendResponse) {
  let findCookie = (domain) => {
    getAllCookies({
      name: "sid",
      domain: domain,
      secure: true,
      storeId: storeId
    }, cookies => {
      let sessionCookie = cookies.find(c => c.value.startsWith(orgId + "!"));
      if (sessionCookie) {
        sendResponse(sessionCookie.domain);
      } else {
        if (domains.length > 0) {
          findCookie(domains.shift());
        } else {
          sendResponse(null);
        }
      }
    });
  };

  findCookie(domains.shift());
}

function forwardMessageToContentScript() {
  chrome.runtime.sendMessage({ message: "Forwarded from Background" });
}

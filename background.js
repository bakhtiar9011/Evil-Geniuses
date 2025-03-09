console.log('background.js: Service worker starting');

const checkLogin = (tab) => {
  console.log('background.js: Checking login for tab:', tab.id, tab.url);
  chrome.storage.session.get('Token', (result) => {
    const token = result.Token;
    console.log('background.js: Token:', token);
    if (token) {
      console.log('background.js: Injecting forum.js into tab:', tab.id);
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['forum.js']
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('background.js: Injection error:', chrome.runtime.lastError.message);
        } else {
          console.log('background.js: Forum script injected:', results);
        }
      });
    } else {
      console.log('background.js: Not logged in');
    }
  });
};

chrome.tabs.onActivated.addListener(function(activeInfo) {
  console.log('background.js: Tab activated:', activeInfo.tabId);
  chrome.tabs.get(activeInfo.tabId, async function(tab) {
    if (tab && tab.url) {
      await chrome.storage.session.set({ currentURL: tab.url });
      console.log('background.js: URL set:', tab.url);
      checkLogin(tab);
    }
  });
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.active) {
    console.log('background.js: Tab updated:', tabId, tab.url);
    chrome.storage.session.set({ currentURL: tab.url }, function() {
      console.log('background.js: URL updated and saved:', tab.url);
      checkLogin(tab);
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('background.js: Received message:', message);
  if (message.request === 'getToken') {
    chrome.storage.session.get('Token', (result) => {
      console.log('background.js: Sending token:', result.Token);
      sendResponse({ token: result.Token });
    });
    return true; // Keep channel open for async
  }
});

console.log('background.js: Message listener registered');
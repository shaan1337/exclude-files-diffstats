chrome.tabs.onCreated.addListener(
    function(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {
          message: 'page_changed'
        })
      }
    }
);

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {
      if (changeInfo.status === 'complete') {
        chrome.tabs.sendMessage(tabId, {
          message: 'page_changed'
        })
      } else if(changeInfo.url){
        chrome.tabs.sendMessage(tabId, {
          message: 'url_changed'
        })
      }
    }
);
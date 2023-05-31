import { getItems, setItems, initSync } from "./storage.js"
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);

      switch (message.type) {
        case 'getItems':
            getItems(message.key).then((items) => {
                console.log(items);
                sendResponse(items);
            });
            break;
        case 'setItems':
            setItems(message.key, message.value);
            break;
      }
        return true;
});
initSync();
import { getItems, setItems, initSync, getTags } from "./storage.js"
globalThis.getItems = getItems
globalThis.setItems = setItems
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message)
  switch (message.type) {
    case "getItems":
      getItems(message.key).then((items) => {
        console.log(items)
        sendResponse(items)
      })
      break
    case "setItems":
      setItems(message.key, message.value)
      sendResponse(true)
      break
    case "getTags":
      sendResponse(getTags())
      break
  }
  return true
})
initSync()

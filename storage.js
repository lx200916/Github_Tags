const storage = chrome.storage.sync
var cacheItems = {}
/*
 * DB: [K]=>{
 *         Key:[Tag]
 *           },
 *     "tags"=>[Tag]
 */
var cacheTags = new Set()

var isSyncing = false
var isInit = false
const KEY_DEBUG = -1
const KEY_TAGS = -2
var tags_user = {}
async function getItems(key) {
  if (key == undefined || key == null || key == "") {
    return []
  }
  if (key == KEY_DEBUG) {
    console.log(cacheItems)
    return new Promise((resolve, reject) => {
      storage.get().then((items) => {
        resolve(items)
      })
    })
  }
  if (key == KEY_TAGS) {
    console.log(cacheTags)
    return new Promise((resolve, reject) => {
      storage.get(["tags"]).then((items) => {
        if (items["tags"] == undefined || items["tags"] == null) {
          resolve([])
          return
        }
        resolve(items["tags"])
      })
    })
  }
  if (cacheItems[key] != undefined || cacheItems[key] != null) {
    return cacheItems[key]
  } else {
    // we partition the data according to the first character of the key
    let k = key[0]
    console.log("getItems", k, key)
    return new Promise((resolve, reject) => {
      storage.get([k], (items) => {
        console.log("getItems", items)
        if (items[k] == undefined || items[k] == null) {
          resolve([])
          return
        }
        resolve(items[k][key])
      })
    })
  }
}
async function setItems(key, value) {
  if (key == undefined || key == null || key == "") {
    return
  }
  cacheItems[key] = value

  value.forEach((element) => {
    cacheTags.add(element)
    // cacheItems[`_${element}`] = (cacheItems[`_${element}`] || []).concat([key])
  })
}
function initSync() {
  if (isSyncing || isInit) {
    return
  }
  isInit = true
  //Init Tags
  ;(async () => {
    let remote = await getItems(KEY_DEBUG)
    if (remote == null || remote == undefined) {
      return
    }
    Object.keys(remote).forEach((i) => {
      if (i != "tags" && typeof remote[i] == "object") {
        Object.values(remote[i]).forEach((v) => {
          if (Array.isArray(v)) {
            v.forEach((tag) => cacheTags.add(tag))
          }
        })
      }
    })
    console.log(cacheTags)
  })()
  setInterval(async () => {
    if (isSyncing || Object.keys(cacheItems).length == 0) {
      return
    }
    console.log("syncing", cacheItems)
    isSyncing = true
    let keys = Object.keys(cacheItems).filter((i) => i.startsWith("_") == false)
    const tags = Object.keys(cacheItems).filter((i) => i.startsWith("_"))
    let ns = []
    let data = {}
    let remote = await getItems(KEY_DEBUG)
    let remoteTags = await getItems(KEY_TAGS)
    remoteTags = new Set([...remoteTags, ...cacheTags])
    console.log("remote:", remote)
    for (let k of keys) {
      let n = k[0]
      if (ns.indexOf(n) == -1) {
        ns.push(n)
        if (remote[n] == undefined || remote[n] == null) remote[n] = {}
        data[n] = remote[n]
      }
      data[n][k] = cacheItems[k]
    }
    // for (let k in tags) {
    //   let n = k[1]
    //   if (ns.indexOf(n) == -1) {
    //     ns.push(n)
    //     if (remote[n] == undefined || remote[n] == null) remote[n] = {}
    //     data[n] = remote[n]
    //   }
    //   data[n][k] = (data[n][k] || []).concat(Array.from(new Set(cacheItems[k])))
    // }
    data["tags"] = Array.from(remoteTags)
    console.log(data)
    storage.set(data, () => {
      cacheItems = {}
      isSyncing = false
    })
  }, 1000)
  setInterval(collectTags, 2000)
}
function collectTags() {
  if (isSyncing) {
    return
  }
  storage.get().then((items) => {
    if (items["tags"] == undefined || items["tags"] == null) {
      return
    }
    let tags_user_ = {}
    items["tags"].forEach((tag) => {
      for (let k in items) {
        if (k == "tags") continue
        const v = items[k]
        if (v == undefined || v == null) continue
        for (let i in v) {
          if (v[i] == undefined || v[i] == null) continue
          if (v[i].indexOf(tag) != -1) {
            if (tags_user_[tag] == undefined || tags_user_[tag] == null) {
              tags_user_[tag] = []
            }
            tags_user_[tag].push(i)
          }
        }
      }
    })
    tags_user = tags_user_
  })
}
function getTags() {
  return tags_user
}
export { getItems, setItems, initSync, getTags }

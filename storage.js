const storage = chrome.storage.sync;
var cacheItems = {};
var isSyncing = false;
var isInit = false;
async function getItems(key){
    if(key==undefined||key==null||key==""){
        return [];
    }
    if(key==-1){
        console.log(cacheItems);
        return new Promise((resolve,reject)=>{

        storage.get().then((items)=>{
            resolve(items)
        });});
    }
    if(cacheItems[key]!=undefined||cacheItems[key]!=null){
        return cacheItems[key];
    }else{
        // we partition the data according to the first character of the key
        let k = key[0];
        console.log("getItems",k,key);
        return new Promise((resolve,reject)=>{
            storage.get([k],(items)=>{
                console.log("getItems",items);
                if(items[k]==undefined||items[k]==null){
                    resolve([]);
                    return;
                }
                resolve(items[k][key]);
            });
        });
    }

}
async function setItems(key,value){
    if(key==undefined||key==null||key==""){
        return;
    }
    cacheItems[key] = value;
}
function initSync(){
    if(isSyncing||isInit){
        return;
    }
    isInit = true;
     setInterval(async ()=>{
        if(isSyncing||Object.keys(cacheItems).length==0){
            return;
        }
        console.log("syncing",cacheItems)
        isSyncing = true;
        let keys = Object.keys(cacheItems);
        let ns = [];
        let data = {};
        let remote =await getItems(-1);
        console.log("remote:",remote);
        for(let k of keys){
            let n = k[0];
            if(ns.indexOf(n)==-1){
                ns.push(n);
                if(remote[n]==undefined||remote[n]==null) remote[n]={};
                data[n] = remote[n];
            }
            data[n][k] = cacheItems[k];
        }
        console.log(data);
        storage.set(data,()=>{
            cacheItems={};
            isSyncing = false;
        });
    },1000);
}
export {getItems,setItems,initSync};
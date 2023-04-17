const defaultSettings = {
   mypreferences:{
       linkOpenNewTab:true,
       alwaysShowCustoms:true,
       alwaysShowFavorites:true,
       HotKey: {code:81 ,name:"q"}
   }
};
var resetbtn = document.getElementById('sqab_ResetEverything');
resetbtn.onclick = doubleCheck;

var resetFinalebtn = document.getElementById('sqab_ResetEverythingFinale');
resetFinalebtn.onclick = resetEverything;

var ResetEverything_container = document.getElementById('sqab_ResetEverything_container');

var myloader = document.getElementById('sqab_loading-screen');
myloader.style.display = "none";

var mydoubleCheck = document.getElementById('sqab_doubleCheck');
mydoubleCheck.style.display = "none";

async function chromeStorageSet(type,data){
    await getData(type);
    let res = {[type]:data};
    await chrome.storage.sync.set(res);
    await getData(type);
}

function doubleCheck(){
    ResetEverything_container.style.display = "none";
    mydoubleCheck.style.display = "block";
}

async function resetEverything(){
    mydoubleCheck.style.display = "none";
    myloader.style.display = "block";
    await chromeStorageSet("mypreferences",defaultSettings["mypreferences"]);
    await chromeStorageSet("myorgs",[]);
    await chromeStorageSet("myshortcuts",[]);
    await chromeStorageSet("myobjs",[]);
    await chromeStorageSet("favorites",{});
    myloader.style.display = "none";
    alert("All Data was reset. Please refresh your page before using the modal again.");
    ResetEverything_container.style.display = "block";
}

async function getData(storageType){
    let data = await chrome.storage.sync.get(storageType);
    return data[storageType];
  }
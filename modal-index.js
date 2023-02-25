

var savedShortcuts;
var savedObjs;
var inputValue;
var shortcutFinding=[];
var addinputLabel = "";
var addinputValue = "";
var myshortcutsdata;
var myobjsdata;
var modalOpened = false;
var thisOrgExists = false;
var searchBarElement;
var current = 0;
var findingsBox
var orgList = [];
var DIVIDER='.';
var PLACEORDER_SHORTCUTS = "Enter Setup Option or Shortcut Name...";
var PLACEORDER_OBJECTS = "Enter Standard or Custom Object's label...";
var PLACEORDER_PRETTIFY = "Enter XML or JSON string...";
var placeHolders = {"sqab_tab-active-shortcuts":PLACEORDER_SHORTCUTS,
                    "sqab_tab-active-object-manager":PLACEORDER_OBJECTS,
                    "sqab_tab-active-prettify":PLACEORDER_PRETTIFY,
                    }
var activeTab = "sqab_tab-active-shortcuts";
var currentSettings = {
    linkOpenNewTab:true,
    alwaysShowCustoms:true,
    HotKey: {code:81 ,name:"q"}
};
var dataHandler;
initUserPreferences();

async function loaderHandler(){
    const src = chrome.runtime.getURL("./data-handler.js");
    dataHandler = await import(src);
}

window.addEventListener("keydown",keyPress);

async function initUserPreferences() {
    await loaderHandler();
    dataHandler.someFunction();
    let data = await dataHandler.getData("myshortcutssettings");
        if(data == undefined){
            return;
        }
        if(data.linkOpenNewTab != undefined){
            currentSettings.linkOpenNewTab = data.linkOpenNewTab;
        }
        if(data.HotKey != undefined){
            currentSettings.HotKey = data.HotKey;
        }
        if(data.alwaysShowCustoms != undefined){
            currentSettings.alwaysShowCustoms = data.alwaysShowCustoms;
        }
}

async function initOrgList() {
    let data = await dataHandler.getData("myorgs") 
        if(data == undefined){
            orgList= [];
        }else{
            orgList = data;
            let currentOrg = getURLminized()
            for (const org of orgList) {
                if(org.value.includes(currentOrg)){
                    thisOrgExists = true;
                }
            }
        }
}

 function keyPress(e) {
    let evtobj = e
    e.stopPropagation();
    
    switch (modalOpened) {
        case true:
            const searchBar = findSearchBar()
            if(!e.target.classList.contains("sqab_addinput")){
                searchBar.focus();
            }
            switch (evtobj.keyCode) {
                case 13://enter
                    
                    const highlightedRow = e.target;
                    if(highlightedRow.classList.contains('sqab_suggestions') && highlightedRow.length != 0 ){
                        // chose first row for redirect
                        redirectMe(highlightedRow.dataset.name);
                    } 
                    if(searchBar != null && searchBar.value[0] === '/'){ //passed Id for redirect
                        redirectMe(searchBar.value);
                    }
                    break;
                case 27:// esc
                    deleteModal();
                    break;
                case 38://arrow up
                    searchBar.blur();
  
                    e.preventDefault();
                    moveUp();
                    break;
                case 40://arrow down
                    searchBar.blur();
    
                    e.preventDefault();
                    moveDown();
                    break;
                case 9://tab
                    activeTab == "sqab_tab-active-shortcuts" ? tabSelection("Objects")  : tabSelection("Shortcuts");
                    e.preventDefault();
                    searchBar.focus();

                    break;
            }
            break;
        case false:
            if (evtobj.keyCode == currentSettings.HotKey.code && (evtobj.ctrlKey || evtobj.metaKey)){
                startUp();   
                modalOpened = true;
            }
            break;
    }
}
function moveUp() {
    let suggestions = findByClass("sqab_suggestions");
    if(suggestions.length == 0){
        return;
    }
    let allNOdes = suggestions;
    if (current > 0) {
        current--;
        if (allNOdes[current]) {
            allNOdes[current].scrollIntoView();
            allNOdes[current].focus();
        }
    }else{
        allNOdes[0].scrollIntoView();
        allNOdes[0].focus();
    }
}
function moveDown() {
    let suggestions = findByClass("sqab_suggestions");
    if(suggestions.length == 0){
        return;
    }
    let allNOdes = suggestions;

    if (current <  (suggestions.length-1)) {
        current++;
        if (allNOdes[current]) {
            allNOdes[current].scrollIntoView();
            allNOdes[current].focus();
        }
    }else{
        allNOdes[suggestions.length-1].scrollIntoView();
        allNOdes[suggestions.length-1].focus();
    }
}


function initRetrivedMemory(data){
    return data != undefined ? data : [];
}

function findSearchBar(){
    if(searchBarElement == undefined){
        searchBarElement = findById("shortcutFind");
    }
    return searchBarElement;
}

function findById(targetId){
    return document.getElementById(targetId);
}

function findByClass(targetClass){
    return document.getElementsByClassName(targetClass);
}

function startUp() {
    activeTab = "sqab_tab-active-shortcuts";
    initOrgList() 
    initUserPreferences(); // again in case preferences were changed
    fetch(chrome.runtime.getURL("data/shortcuts.json"))
        .then((r) => r.text())
        .then((json) => {
            savedShortcuts = JSON.parse(json);
        }).catch((e) =>{
            console.log(e);
        })
        fetch(chrome.runtime.getURL("data/obj-shortcuts.json"))
        .then((r) => r.text())
        .then((json) => {
            savedObjs = JSON.parse(json);
        }).catch((e) =>{
            console.log(e);
        })
    fetch(chrome.runtime.getURL("/modal-index.html"))
        .then((file) => file.text())
        .then((html) => { document.body.insertAdjacentHTML("beforeend", html)} ).then(() =>{
            if(thisOrgExists || currentSettings.alwaysShowCustoms){
                chrome.storage.sync.get('myshortcuts', (data) => {
                    let filteredshortcuts = [];
                    let currentOrg = getURLminized()
                    let currentOrgSavedFound = orgList.filter(org => org.value.includes(currentOrg));
                    let targetOrgSaved = currentOrgSavedFound.length == 0 ? false:true;
                    // if(data.myobjs != undefined){
                        for (const shortcut of data.myshortcuts) {
    
                            if(shortcut.org == undefined ||
                                shortcut.org.includes('all') || 
                                (targetOrgSaved) && shortcut.org.includes(currentOrgSavedFound[0].name)
                            ){
                                filteredshortcuts.push(shortcut);
                            }
                        }
                    // }
                    myshortcutsdata = {myshortcuts:filteredshortcuts};

                });
                chrome.storage.sync.get('myobjs', (data) => {
                    let filteredObjs = [];
                    let currentOrg = getURLminized()
                    let currentOrgSavedFound = orgList.filter(org => org.value.includes(currentOrg));
                    let targetOrgSaved = currentOrgSavedFound.length == 0 ? false:true;
                    if(data.myobjs != undefined){
                        for (const objs of data.myobjs) {
                            if(objs.org == undefined || 
                                objs.org.includes('all') || 
                                (targetOrgSaved) && objs.org.includes(currentOrgSavedFound[0].name)
                            ){
                                filteredObjs.push(objs);
                            }
                        }
                    }
                    myobjsdata = {myobjs:filteredObjs};
                });
            }else{
                myshortcutsdata = undefined;
                myobjsdata = undefined;
            }
        initmodal();
        }).catch((e) =>{
            console.log(e);
        })
}

function findTabs(){
   return findByClass("sqab_nav-item");
}

function initmodal(){
    let modal = findById("quicksearchmodal");
    let tabs = findTabs();
    for (const tab of tabs) {
        tab.onclick = tabClicked;
    }
    let searchbar = findSearchBar();
    searchbar.oninput = searchChange;
    searchbar.focus();
    findById("addbtn").onclick = addbtnHandler
    findById("addinput").oninput = addinputHandler
    findById("addsave").onclick = addsaveHandler
    findById("addcancel").onclick = resetAddbtn
    window.onclick = function(event) {
      if (event.target == modal) {
        deleteModal();
      }
    }
    tabSelection("Shortcuts");
    findingsBox = findById("finding");
}

function mousehighlistrow(e){
    e.target.focus();
    if(e.target.dataset.index){
        current = e.target.dataset.index;
    }
}

function deleteModal(){
    searchBarElement = undefined;
    findById("quicksearchmodal").remove();
    modalOpened = false;
}

function addClickEventsToSuggestions(){
    const suggestion = findByClass("sqab_suggestions");
    if(suggestion.length != 0){
        for (let index = 0; index < suggestion.length; index++) {
            const clickable = suggestion[index];
            clickable.onclick=clicked;
            if(index > 0){
                clickable.onmouseover  = mousehighlistrow;
            }else{
                clickable.onmouseover  = mousehighlistrow;
                clickable.focus();
            }
        }
    }
}

function clicked(event){
    redirectMe(event.target.dataset.name);
}

async function checkSettings(type){
    switch (type) {
        case "targetTab":
            let checkSettings = "_blank";
            let data = await dataHandler.getData("myshortcutssettings");
            let currentSettings = data;
                if(currentSettings != undefined && currentSettings.linkOpenNewTab != undefined){
                    if(!currentSettings.linkOpenNewTab){
                        checkSettings = "_self"
                    }
                }
        return checkSettings;
    }
    return null;
}

async function redirectMe(searchInputValue){
    let targetTab = await checkSettings("targetTab");
    switch (activeTab) {
        case "sqab_tab-active-shortcuts":
            redirectShortcuts(targetTab,searchInputValue);
            break;
        case "sqab_tab-active-object-manager":
            redirectObjs(targetTab,searchInputValue);
            break;
    }
}

function redirectObjs(targetTab,searchInputValue){
    let foundinmyshortcuts = false;
    let data = myobjsdata;
        if(!isEmpty(myobjsdata) && !isEmpty(myobjsdata.myobjs)){
            for (const shortcut of data.myobjs) {
                if(shortcut.name == searchInputValue){
                    foundinmyshortcuts= true;
                    window.open(`/lightning/setup/ObjectManager/${shortcut.value}/Details/view`, targetTab);
                    deleteModal();
                    return;
                }
            }
        }
        if(!foundinmyshortcuts){
            let valueSuitedForJson = searchInputValue.replaceAll(' ','-');
            if(savedObjs.urls[valueSuitedForJson] != undefined){
                window.open(savedObjs.urls[valueSuitedForJson]+"/Details/view", targetTab);
            }else if(searchInputValue != null && searchInputValue[0] === '/'){
                window.open(searchInputValue, targetTab);
            }
            deleteModal();
            return;
        }
}

function redirectShortcuts(targetTab,searchInputValue){
    let foundinmyshortcuts = false;
    let data = myshortcutsdata;
        if(!isEmpty(myshortcutsdata) && !isEmpty(myshortcutsdata.myshortcuts)){
            for (const shortcut of data.myshortcuts) {
                if(shortcut.name == searchInputValue){
                    foundinmyshortcuts= true;
                    let targetUrl= shortcut.value;
                    if(targetUrl.includes(".com") && !targetUrl.includes("http")){
                        targetUrl = 'http://'+targetUrl;
                    }
                    window.open(targetUrl, targetTab);
                    deleteModal();
                    return;
                }
            }
        }
        if(!foundinmyshortcuts){
            let valueSuitedForJson = searchInputValue.replaceAll(' ','-');
            if(savedShortcuts.urls[valueSuitedForJson] != undefined){
                window.open(savedShortcuts.urls[valueSuitedForJson], targetTab);
            }else if(searchInputValue != null && searchInputValue[0] === '/'){
                window.open(searchInputValue, targetTab);
            }
            deleteModal();
            return;
        }
}

function isNotBlank(value){
    if(value != undefined && value != ''){
        return true;
    }else{
        return false;
    }
}

function searchChange(event){
    inputValue = event.target.value;
    shortcutFinding=[];
    check4Suggestions();
}

function check4Suggestions(){
    switch (activeTab) {
        case "sqab_tab-active-shortcuts":
            searchObjects('shortcuts');
            break;
        case "sqab_tab-active-object-manager":
            searchObjects('objs');
            break;
        case "sqab_tab-active-prettify":
            check4Prettify();
            break;
    }
}

function searchObjects(objectType) {
    const findingbox = findById("finding");
    if (inputValue.length != 0 && !inputValue.startsWith("{") && !inputValue.startsWith("<")) {
      let objectData;
      let objectDefaults;
      if (objectType === "shortcuts") {
        objectData = myshortcutsdata;
        objectDefaults = savedShortcuts.defaults;
      } else if (objectType === "objs") {
        objectData = myobjsdata;
        objectDefaults = savedObjs.defaults;
      }
      if (!isEmpty(objectData) && !isEmpty(objectData[objectType])) {
        for (const shortcut of objectData[objectType]) {
          let finalshortcutname = shortcut.name;
          if (finalshortcutname.includes(DIVIDER)) {
            let splittedname = finalshortcutname.split('.');
            finalshortcutname = splittedname[splittedname.length - 1];
          }
          if (finalshortcutname.toUpperCase().includes(inputValue.toUpperCase())) {
            shortcutFinding.push({ Name: shortcut.name, custom: true });
          }
        }
      }
      objectDefaults.forEach((shortcut) => {
        let finalshortcutname = shortcut.Name;
        if (finalshortcutname.includes(DIVIDER)) {
          let splittedname = finalshortcutname.split('.');
          finalshortcutname = splittedname[splittedname.length - 1];
        }
        if (finalshortcutname.toUpperCase().includes(inputValue.toUpperCase())) {
          shortcut.custom = false;
          shortcutFinding.push(shortcut);
        };
      });
      let data = '';
      let myindex = 0;
      if (shortcutFinding.length > 0) {
        for (const shortcut of shortcutFinding) {
          let modifiedName = shortcut.Name;
          if (shortcut.Name.includes(DIVIDER)) {
            let splittedname = modifiedName.split('.');
            modifiedName = '';
            for (let index = 0; index < splittedname.length - 1; index++) {
              const element = splittedname[index];
              modifiedName += `<span tabIndex="-1" class="sqab_divider">${element}</span>`
            }
            modifiedName += `<span tabIndex="-1" style="pointer-events: none;display: inline-block;" >${boldRelevantChars(splittedname[splittedname.length - 1], inputValue)}</span>`;
          } else {
            modifiedName = boldRelevantChars(shortcut.Name, inputValue);
          }
          if (shortcut.custom) {
            data += `
            <li tabIndex="-1" data-index="${myindex}" class="sqab_suggestions" style="color:#bd5858;" data-name="${shortcut.Name}"><span class="sqab_divider">Custom</span>${modifiedName}</li>
            `;
          } else {
            data += `
            <li tabIndex="-1" data-index="${myindex}" class="sqab_suggestions" data-name="${shortcut.Name}">${modifiedName}</li>
            `;
          }
          myindex++;
        }
      }
      findingbox.innerHTML = data;
      if (findingbox.firstElementChild != null) {
        findingbox.firstElementChild.focus();
      }
      addClickEventsToSuggestions();
    } else {
      findingbox.innerHTML = '';
    }
  }

function isEmpty(obj) {
    if(obj == undefined || obj == null){
        return true;
    }
    return Object.keys(obj).length === 0;
}

function boldRelevantChars(rowNameMask,searchValue){
    let mystring = '';
    mystring = boldmyString(rowNameMask,searchValue);
    return mystring;
}

function boldmyString(str, substr) {
    let regEx = new RegExp(substr, "ig");
    return str.replace(regEx, '<b>$&</b>');
}

function tabClicked(event){
    tabSelection(event.target.innerText);
}

function tabSelection(etext){
    current = 0;
    let searchbar = findSearchBar();
    searchbar.value = "";
    inputValue = "";
    const findingbox = findById("finding");
    const addbtn = findById("addbtn");
    for (const tab of findTabs()) {
        if(tab.innerText == etext ){
            tab.firstElementChild.classList.add(tab.firstElementChild.dataset.tab);
            searchbar.classList.add(tab.firstElementChild.dataset.tab);
            findingbox.classList.add(tab.firstElementChild.dataset.tab);
            activeTab = tab.firstElementChild.dataset.tab;
            searchbar.placeholder = placeHolders[activeTab];
            addbtn.classList.add(tab.firstElementChild.dataset.tab);
            resetAddbtn();
            check4Suggestions();
        }else{
            tab.firstElementChild.classList.remove(tab.firstElementChild.dataset.tab);
            searchbar.classList.remove(tab.firstElementChild.dataset.tab);
            addbtn.classList.remove(tab.firstElementChild.dataset.tab);
            findingbox.classList.remove(tab.firstElementChild.dataset.tab);

        }
    }
}

function addbtnHandler(event){
    event.target.classList.add("sqab_hide");
    const addbox = findById("addbox");
    addbox.classList.add("sqab_active");
    findById("addinput").placeholder = "Enter Label...";
    let activeTab = findById("finding").classList[0];
    let storageType = activeTab == "sqab_tab-active-shortcuts" ? "myshortcuts" : "myobjs";
    let orgSelector = findByClass("sqab_orgSelect")[0];
    let option2s = findByClass("sqab_orgSelectoption");
    for (const element of option2s) {
        if(element.value != 'all'){
            element.remove();
        }
    }
    let currentOrgIsSaved = false;
    let currentUnTouchedOrg = getURLminized();
    for (const org of orgList) {
        const option = document.createElement('option');
        let currentOrg;
        if(orgList.find( org => org.value == currentUnTouchedOrg ) != undefined){
            currentOrgIsSaved = true;
        }
        currentOrg = org.name;
        option.value = currentOrg;
        option.classList.add("sqab_orgSelectoption");
        option.innerText = currentOrg;
        orgSelector.appendChild(option);
    }
    if(!currentOrgIsSaved){
        const option = document.createElement('option');
        let currentOrg = currentUnTouchedOrg;
        option.value = currentOrg;
        option.classList.add("sqab_orgSelectoption");
        option.innerText = currentOrg;
        orgSelector.appendChild(option);
    }

    if(storageType == "myobjs"){
        try {
            const try2findDetailTable = findByClass("object-detail-column")[0];
            let objLabel = try2findDetailTable.getElementsByTagName("ul")[0].getElementsByClassName("slds-form-element__static")[2].innerText;
            addbox.getElementsByClassName("sqab_addinput")[0].value = objLabel;
        } catch (error) {}
    }
}

function getURLminized(){
    let org = window.location.href.replace("https://","").substring(0,window.location.href.indexOf("."));
    return org.replace(org.substring(org.indexOf(".")),"");
}

function resetAddbtn(){
    const addbtn = findById("addbtn");
    if(addbtn != undefined){
        addbtn.classList.remove("sqab_hide");
    }
    addinputLabel = "";
    resetaddboxMessage();
    const addbox = findById("addbox");
    if(addbox != undefined){
        addbox.classList.remove("sqab_active");
    }
}

async function addsaveHandler(){
    let targetOrg = findById("sqab_orgSelect").value;
    let activeTab = findById("finding").classList[0];
    let storageType = activeTab == "sqab_tab-active-shortcuts" ? "myshortcuts" : "myobjs";
    addinputValue = window.location.href.substring(window.location.href.indexOf("com")+3);
    let data = await dataHandler.getData(storageType);
    let myMemory = initRetrivedMemory(data);
    let processStatus = addbtnValidations(addinputValue,storageType,myMemory,addinputLabel);
    if(processStatus.status == "validated"){
        let record = {};
        record["org"] = targetOrg == "all" ? undefined : [targetOrg];
        record["name"] = addinputLabel;
        record["value"] = addinputValue;
        myMemory.push(record);
        dataHandler.saveData(myMemory,storageType);
        let currentOrgIsSaved = false;
        let currentUnTouchedOrg = getURLminized();
        if(orgList.find( org => org.value == currentUnTouchedOrg ) != undefined){
            currentOrgIsSaved = true;
        }
        if(!currentOrgIsSaved){
            let orgData = await dataHandler.getData('myorgs');
            let myOrgMemory = initRetrivedMemory(orgData);
            myOrgMemory.push({name:currentUnTouchedOrg, value:currentUnTouchedOrg});
            dataHandler.saveData(myOrgMemory,'myorgs');
        }
        processStatus.status = "success";
        processStatus.message = "Saved!";
    }
    initaddboxMessage(processStatus);
    findById("addinput").value = "";
    findById("addbox").classList.remove("sqab_active");
    setTimeout(() => {resetAddbtn();}, 3000); 
}

function addinputHandler(event){
    addinputLabel = event.target.value;
}

function addbtnValidations(addURL,addType,addMemory,addLabel){
    let processStatus = {status:"validated", message:"" }

    if(addLabel == undefined || addLabel == ""){
        const autoValue = findById("addinput").value;
        if(autoValue == undefined || autoValue == ""){
            processStatus.status = "error";
            processStatus.message = "Label value is empty.";
            return processStatus;
        }else{
            addLabel = autoValue;
            addinputLabel = addLabel;
        }
    }

    if(addType == "myobjs"){
        if(!addURL.includes("/setup/ObjectManager/")){
            processStatus.status = "error";
            processStatus.message = "Cant save URL outside Object Manager.";
            return processStatus;
        }else{
            try {
                const try2findDetailTable = findByClass("object-detail-column")[0];
                const objAPI = try2findDetailTable.getElementsByTagName("ul")[0].getElementsByClassName("slds-form-element__static")[0].innerText;
                addinputValue = objAPI;
            } catch (error) {
                processStatus.status = "error";
                processStatus.message = "Not on record Details page.";
                return processStatus;
            }

        }
    }

    if(addMemory.filter((memory) => {return memory.name == addLabel}).length != 0){
        processStatus.status = "error";
        processStatus.message = "Label already in use.";
        return processStatus;
    }

    return processStatus;
}

function initaddboxMessage(processStatus){
    let addboxMessage =  findById("addboxMessage");
    addboxMessage.innerText = processStatus.message;
    addboxMessage.classList.add("sqab_"+processStatus.status,"sqab_active");
}

function resetaddboxMessage(){
    let addboxMessage =  findById("addboxMessage");
    if(addboxMessage != undefined){
        addboxMessage.classList.remove("sqab_error","sqab_success","sqab_active");
    }
}
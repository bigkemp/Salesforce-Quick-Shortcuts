var newShortcutURL="";
var jsonShortcuts;
var newShortcutName="";
var newShortcutOrg=[];
var shortcutFinding=[];

document.addEventListener(
    "DOMContentLoaded",
    function () {
        initYay();
    },
    false
);

export function initYay(){
    var coll = document.getElementsByClassName("sqab_pop_btn");
    var i;
    for (i = 0; i < coll.length; i++) {
        coll[i].addEventListener("click", clickedButton);
    }
}

function closeAllPages(){
    for (const btn of document.getElementsByClassName("sqab_pop_btn")) {
        btn.classList.remove("sqab_pop_active");
    }

    for (const btn3 of document.getElementsByClassName(`content`)) {
            btn3.style.display = "none";
    }
}

function defaultChangeTitle(type){
    let openTab = document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText;
    let addButton = document.getElementsByClassName("sqab_pop_addButton")[0];
    switch (type) {
        case "Add":
            if(addButton.classList.contains("sqab_pop_Shortcuts")){
                return `${openTab}: Add a Shortcut`;
            }else if(addButton.classList.contains("sqab_pop_Objects")){
                return `${openTab}: Add an Object`;
            }else if(addButton.classList.contains("sqab_pop_Orgs")){
                return `${openTab}: Add an Org Name`;
            }
        case "Settings":
            return "Change Settings";
    }
}


function setButtonAsActive(target){
    target.classList.toggle("sqab_pop_active");
}

function toggleAddButtonVisibillity(clickedButtonType){
    const addButton = document.getElementsByClassName("sqab_pop_addButton")[0];
    if(clickedButtonType != "Settings" && clickedButtonType != "Add"){
        addButton.classList.remove("sqab_pop_Shortcuts","sqab_pop_Objects","sqab_pop_Orgs");
        addButton.style.display = "block";
        addButton.classList.add("sqab_pop_"+clickedButtonType);
    }else{
        addButton.style.display = "none";
    }
}

function toggleContentPage(){
    document.getElementsByClassName("sqab_pop_contentAdd")[0].style.display = "none";
    document.getElementsByClassName("sqab_pop_contentSettings")[0].style.display = "none";

    const content = document.getElementsByClassName("sqab_pop_contentPage")[0];
    if (content.style.display === "block") {
        content.style.display = "none";
    } else {
        content.style.display = "block";
    }
}

async function setContentBody(clickedButtonType){
    switch (clickedButtonType) {
        case "Shortcuts":
        case "Objects":
        case "Orgs":
            toggleContentPage();
            buildContent(clickedButtonType);
            break;
        case "Settings":
            document.getElementsByClassName("sqab_pop_contentPage")[0].style.display = "none";
            document.getElementsByClassName("sqab_pop_contentAdd")[0].style.display = "none";
            document.getElementsByClassName("sqab_pop_contentSettings")[0].style.display = "block";
            initContentSettings();
            break;
        case "Add":
            document.getElementsByClassName("sqab_pop_contentSettings")[0].style.display = "none";
            document.getElementsByClassName("sqab_pop_contentPage")[0].style.display = "none";
            document.getElementsByClassName("sqab_pop_contentAdd")[0].style.display = "block";
            document.getElementsByClassName("sqab_pop_addMsg")[0].classList.remove("sqab_pop_success","sqab_pop_sqab_pop_error");
            await initAddBtn();
            break;
    }
}

function setContentHeader(target,clickedButtonType){
    var contenttitle = document.getElementsByClassName("sqab_pop_contentTitleText")[0];
    contenttitle.innerText = target.innerText ? target.innerText : defaultChangeTitle(clickedButtonType);
    let inputholder = contenttitle.innerText == "Add a Shortcut" ? "Enter URL" : "Enter Object API Name"
    document.getElementsByClassName("sqab_pop_inputvalue")[0].placeholder = inputholder;
}

function clickedButton(event){
    let clickedButtonType = event.target.dataset.type;
    closeAllPages();
    setButtonAsActive(event.target);
    toggleAddButtonVisibillity(clickedButtonType);
    setContentHeader(event.target,clickedButtonType);
    setContentBody(clickedButtonType);
}

function initContentSettings(){
    openNewLinksInit();
    alwaysShowCustomsInit();
    hotKeyInit();
}

function hotKeyInit(){
    var hotkey = document.getElementById("newHotKey");
    chrome.storage.sync.get('myshortcutssettings', (data) => {
        if(data.myshortcutssettings == undefined || data.myshortcutssettings.HotKey == undefined ){
            hotkey.value = "q";
        }else{
            hotkey.value = data.myshortcutssettings.HotKey.name;
        }
    });
    hotkey.addEventListener("keydown", function(event){
        chrome.storage.sync.get('myshortcutssettings', (data) => {
            if(data.myshortcutssettings == undefined){
                data.myshortcutssettings = {};
            }
            let currentSettings = data.myshortcutssettings;
            event.target.value = event.key ;
            currentSettings.HotKey = {code:event.keyCode ,name:event.key} ;
            if(currentSettings.HotKey != undefined){
                chrome.storage.sync.set({ myshortcutssettings: currentSettings });
            }
        });
    });
    hotkey.addEventListener("click", function(event){
        event.target.value = "";
    });

}

function openNewLinksInit(){
    var checkbox = document.getElementById("openLinksAsNewTab");
    chrome.storage.sync.get('myshortcutssettings', (data) => {
        if(data.myshortcutssettings == undefined){
            checkbox.checked = true;
        }else{
            checkbox.checked = data.myshortcutssettings.linkOpenNewTab;
        }
    });
    checkbox.addEventListener("click", function(event){
        chrome.storage.sync.get('myshortcutssettings', (data) => {
            if(data.myshortcutssettings == undefined){
                data.myshortcutssettings = {};
            }
            let currentSettings = data.myshortcutssettings;
            currentSettings.linkOpenNewTab = event.target.checked;
            chrome.storage.sync.set({ myshortcutssettings: currentSettings });
        });
    });
}

function alwaysShowCustomsInit(){
    var checkbox = document.getElementById("alwaysShowCustoms");
    chrome.storage.sync.get('myshortcutssettings', (data) => {
        if(data.myshortcutssettings == undefined){
            checkbox.checked = true;
        }else{
            checkbox.checked = data.myshortcutssettings.alwaysShowCustoms;
        }
    });
    checkbox.addEventListener("click", function(event){
        chrome.storage.sync.get('myshortcutssettings', (data) => {
            if(data.myshortcutssettings == undefined){
                data.myshortcutssettings = {};
            }
            let currentSettings = data.myshortcutssettings;
            currentSettings.alwaysShowCustoms = event.target.checked;
            chrome.storage.sync.set({ myshortcutssettings: currentSettings });
        });
    });
}

async function add_SaveNew() {
    document.getElementsByClassName("sqab_pop_addMsg")[0].classList.remove("sqab_pop_success","sqab_pop_error");
    let openTab = document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText;
    let targetPage = openTab.substring(0,openTab.indexOf(':'));
    let isEdit = false;
    let dataType= "";
    if(openTab.includes("Saved Shortcuts")){
        dataType = "myshortcuts";
    }else if(openTab.includes("Saved Objects")){
        dataType = "myobjs";
    }else if(openTab.includes("Saved Orgs")){
        dataType = "myorgs";
        newShortcutURL = newShortcutURL.replace("https://","");
        if(newShortcutURL.includes(".")){
            newShortcutURL = newShortcutURL.substring(0,newShortcutURL.indexOf("."));
        }
    }
    if(openTab.includes(": Edit ")){
        isEdit = true;
    }
    let targetOrgs = [];


    let data = await chrome.storage.sync.get(dataType);
    let myMemory =[];
    if(data[dataType] != undefined){
        myMemory = data[dataType];
    }
    let record = {};
    if(!openTab.includes("Saved Orgs")){
        let edittargetOrgsContainer = document.getElementById(`editorglist`); 
        let edittargetOrgsList = edittargetOrgsContainer.getElementsByTagName(`li`); 
        for (const org of edittargetOrgsList) {
            if(org.classList.contains("sqab_pop_exists")){
                targetOrgs.push(org.innerText);
            }
        }
        if(targetOrgs.length == 0 || targetOrgs.length == edittargetOrgsList.length){
            record["org"] = undefined;
        }else{
            record["org"] = targetOrgs;
        }
    }
    record["name"] = newShortcutName;
    record["value"] = newShortcutURL;

    if(isEdit){
        let originalLabel = openTab.substring(openTab.indexOf('"')+1,openTab.length -1)
        let originalData = myMemory.find( data => data.name == originalLabel );
        myMemory[myMemory.indexOf(originalData)] = record;
    }else{
        myMemory.push(record);
    }
    if(myMemory[myMemory.length - 1].value != undefined){
        let myMemoryType = {};
        myMemoryType[dataType] = myMemory;
        chrome.storage.sync.set(myMemoryType);
        if(openTab.includes("Saved Orgs") && isEdit){
            let originalLabel = openTab.substring(openTab.indexOf('"')+1,openTab.length -1)
            let dataSC = await chrome.storage.sync.get("myshortcuts");
            let dataO = await chrome.storage.sync.get("myobjs");
            for (const obj of dataO["myobjs"]) {
                if(obj.org != undefined && obj.org.includes(originalLabel)){
                    obj.org[obj.org.indexOf(originalLabel)] = record["name"];
                }
            }
            chrome.storage.sync.set(dataO);

            for (const shortcut of dataSC["myshortcuts"]) {
                if(shortcut.org != undefined && shortcut.org.includes(originalLabel)){
                    shortcut.org[shortcut.org.indexOf(originalLabel)] = record["name"];
                }
            }
            chrome.storage.sync.set(dataSC);

        }
        freezeShortcutInput();
        document.getElementsByClassName("sqab_pop_addMsg")[0].classList.add('sqab_pop_success');
        document.getElementsByClassName("sqab_pop_addMsg")[0].innerText = 'Saved Successfully';
        setTimeout(() => {
            clearShortcutInput();
            closeAllPages();
            toggleAddButtonVisibillity(targetPage.split(" ")[1]);
            var contenttitle = document.getElementsByClassName("sqab_pop_contentTitleText")[0];
            contenttitle.innerText = targetPage;
            let activeButton = document.getElementById(`btn${targetPage.split(" ")[1]}`); 
            setButtonAsActive(activeButton);
            setContentBody(targetPage.split(" ")[1]);
            }, 3000); // time in milliseconds
    }else{
        document.getElementsByClassName("sqab_pop_addMsg")[0].classList.add("sqab_pop_error");
        document.getElementsByClassName("sqab_pop_addMsg")[0].innerText = 'An error has occurred, Save has been cancelled.';
    }
}

function targetOrgOrginaizer(data,type) {
    let targetOrg=`<ul id="orgs${type}-${data.name}" class="sqab_pop_tags sqab_pop_silent">`;
    if(data.org != undefined){
        for (const org of data.org) {
            targetOrg +=`<li class="sqab_pop_tag sqab_pop_silent">${org}</li>`;
        }
    }else if(!type.includes("orgs")) {
        targetOrg +=`<li class="sqab_pop_tag sqab_pop_silent">all</li>`;
    }
    targetOrg += `</ul>`;
    return targetOrg;
}

function buildContent(type) {
    if(type == "Objects"){ // stupid fix cuz data is already saved as "objs" and not "objects"
        type = "Objs";
    }
    type = 'my'+type.toLowerCase();
    chrome.storage.sync.get(type, (data) => {
        let mySavedData = [];
        if(data[type] != undefined && data[type].length > 0){
            mySavedData = data[type];
            let allData = '';
            for (const data of mySavedData) {
                allData+=`
                <div id="${type}-${data.name}" class="sqab_pop_rowContainer">
                <button id="edit${type}-${data.name}" class="sqab_pop_editMy${type} sqab_pop_row sqab_pop_editbtn">Edit</button>
                    <div id="mini${type}-${data.name}" class="sqab_pop_mySc sqab_pop_row" >
                        <div class="sqab_pop_silent">
                            <input disabled value="${data.name}" class="sqab_pop_row sqab_pop_myScInput  sqab_pop_silent "></input>
                        </div>
                        <div class="sqab_pop_silent">
                        ${targetOrgOrginaizer(data,type)}
                        </div>
                    </div>
                    <button id="rev${type}-${data.name}" class="sqab_pop_removeMy${type} sqab_pop_row sqab_pop_deletebtn">Remove</button>
                </div>
                <div id="sec${type}-${data.name}" class="sqab_pop_hidSecretDiv" style="width:100%;">
                    <div style="display:flex;">
                        <input id="val${type}-${data.name}" disabled value="${data.value}" class="sqab_pop_row"></input>
                    </div>
                </div>
              `;
            }

            if(document.getElementById("containerMySC") == undefined){
                const div = document.createElement('div');
                div.id="containerMySC";
                div.innerHTML = allData;
                const container = document.getElementById("mainMenu");
                container.appendChild(div);
            }else{
                const div = document.getElementById("containerMySC");
                div.innerHTML = '';
                div.innerHTML = allData;
            }

            for (const data of mySavedData) {
                const addMySavedData = document.getElementById(`mini${type}-${data.name}`);
                addMySavedData.addEventListener('click', openMyShortcut);
            }
            for (const data of mySavedData) {
                const addMySavedData = document.getElementById(`rev${type}-${data.name}`);
                addMySavedData.addEventListener('click', removeMyShortcut);
            }
            for (const data of mySavedData) {
                const addMySavedData = document.getElementById(`edit${type}-${data.name}`);
                addMySavedData.addEventListener('click', editMyShortcut);
            }

        }else{
            if(document.getElementById("containerMySC") != undefined){
                const div =  document.getElementById("containerMySC");
                div.innerHTML = '';
            }
        }
    });
}

async function editMyShortcut(event) {
    let openTab = document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText;
    let type = event.target.id.split("-")[0].replace("edit","");
    let targetName = event.target.id.replace(`edit${type}-`,"");
    let targetValue = document.getElementById(`val${type}-${targetName}`).value; 
    let targetOrgsContainer = document.getElementById(`orgs${type}-${targetName}`); 
    let targetOrgsList = targetOrgsContainer.getElementsByTagName(`li`); 
    let targetOrgs = []; 
    for (const org of targetOrgsList) {
        targetOrgs.push(org.innerText);
    }
    await setContentBody('Add');
    document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText = `${openTab}: Edit "${targetName}"`;
    document.getElementById("addMySCtext").value = targetName; 
    document.getElementById("addMySCtextURL").value = targetValue; 
    document.getElementById("addMySC").innerText = "Save"; 
    newShortcutName = targetName;
    newShortcutURL = targetValue;
    toggleAddButtonVisibillity("Add");

    if(openTab.includes("Saved Orgs")){
        return;
    }
    let edittargetOrgsContainer = document.getElementById(`editorglist`); 
    let edittargetOrgsList = edittargetOrgsContainer.getElementsByTagName(`li`); 
    for (const org of edittargetOrgsList) {
        if(targetOrgs== "all" || targetOrgs.includes(org.innerText)){
            org.classList.add("sqab_pop_exists");
        }
    }
}

async function removeMyShortcut(event) {
    let openTab = document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText;
    let type = event.target.id.split("-")[0].replace("rev","");
    let targetName = event.target.id.replace(`rev${type}-`,"");
    let data = await chrome.storage.sync.get(type);
        let myMemory =[];
        if(data[type] != undefined){
            for (const shortcut of data[type]) {
                if(shortcut.name != targetName){
                    myMemory.push(shortcut);
                }
            }
            let myMemoryType = {};
            myMemoryType[type] = myMemory;
            chrome.storage.sync.set(myMemoryType);

            if(openTab.includes("Saved Orgs")){
                let originalLabel = targetName;
                let dataSC = await chrome.storage.sync.get("myshortcuts");
                let dataO = await chrome.storage.sync.get("myobjs");
                for (const obj of dataO["myobjs"]) {
                    if(obj.org != undefined && obj.org.includes(originalLabel)){
                        const index = obj.org.indexOf(originalLabel);
                        if (index > -1) { // only splice array when item is found
                            obj.org.splice(index, 1); // 2nd parameter means remove one item only
                        }
                    }
                }
                chrome.storage.sync.set(dataO);
    
                for (const shortcut of dataSC["myshortcuts"]) {
                    if(shortcut.org != undefined && shortcut.org.includes(originalLabel)){
                        const index = shortcut.org.indexOf(originalLabel);
                        if (index > -1) { // only splice array when item is found
                            shortcut.org.splice(index, 1); // 2nd parameter means remove one item only
                        }
                    }

                }
                chrome.storage.sync.set(dataSC);
    
            }
        }
        buildContent(type.replace("my",""));
}

function openMyShortcut(event) {
    let type = event.target.id.split("-")[0].replace("mini","");
    let targetName = event.target.id.replace(`mini${type}-`,"");

    chrome.storage.sync.get(type, (data) => {
        let details;
        if(data[type] != undefined){
            for (const shortcut of data[type]) {
                if(shortcut.name == targetName){
                    details = shortcut;
                    const addmyshortcut = document.getElementById(`sec${type}-${shortcut.name}`);
                    if(addmyshortcut.classList.contains("sqab_pop_hidSecretDiv")){
                        addmyshortcut.classList.remove("sqab_pop_hidSecretDiv");
                        addmyshortcut.classList.add("sqab_pop_showSecretDiv");
                    }else{
                        addmyshortcut.classList.remove("sqab_pop_showSecretDiv");
                        addmyshortcut.classList.add("sqab_pop_hidSecretDiv");
                    }
                }
            }
        }

    });
}

function add_UpdateLabel(event) {
    newShortcutName = event.target.value;
}

function add_UpdateValue(event) {
    newShortcutURL = event.target.value;
}

function add_UpdateOrg(event) {
    newShortcutOrg = event.target;
    if(newShortcutOrg.classList.contains("sqab_pop_exists")){
        newShortcutOrg.classList.remove("sqab_pop_exists");
    }else{
        newShortcutOrg.classList.add("sqab_pop_exists");
    }
}

function clearShortcutInput() {
    newShortcutURL = '';
    newShortcutName = '';
    const addmyshortcuttext = document.getElementById("addMySCtext");
    addmyshortcuttext.value = '';
    const addmyshortcuttextURL = document.getElementById("addMySCtextURL");
    addmyshortcuttextURL.value = '';
}

function freezeShortcutInput() {
    const addmyshortcuttext = document.getElementById("addMySCtext");
    addmyshortcuttext.disabled = true;
    const addmyshortcuttextURL = document.getElementById("addMySCtextURL");
    addmyshortcuttextURL.disabled = true;
    const addmyshortcut = document.getElementById("addMySC");
    addmyshortcut.classList.add("sqab_pop_disabled");
    addmyshortcut.disabled = false;
    const addmyshortcuttexorgs = document.getElementById("orglist");
    addmyshortcuttexorgs.classList.add("sqab_pop_disabled");
}

async function initAddBtn() {
    const addmyshortcut = document.getElementById("addMySC");
    addmyshortcut.addEventListener('click', add_SaveNew);
    addmyshortcut.innerText = "Add"; 
    addmyshortcut.disabled = false;
    addmyshortcut.classList.remove("sqab_pop_disabled");


    const addmyshortcuttext = document.getElementById("addMySCtext");
    addmyshortcuttext.disabled = false;
    addmyshortcuttext.addEventListener('input', add_UpdateLabel);
    addmyshortcuttext.value = ""; 
    
    const addmyshortcuttexturl = document.getElementById("addMySCtextURL");
    addmyshortcuttexturl.disabled = false;
    addmyshortcuttexturl.addEventListener('input', add_UpdateValue);
    addmyshortcuttexturl.value = "";
    let openTab = document.getElementsByClassName("sqab_pop_contentTitleText")[0].innerText;
    const addmyshortcuttexorgs = document.getElementById("orglist");
    addmyshortcuttexorgs.classList.remove("sqab_pop_disabled");

    if(openTab.includes("Saved Orgs")){
        if(!addmyshortcuttexorgs.classList.contains("sqab_pop_hide")){
            addmyshortcuttexorgs.classList.add("sqab_pop_hide");
        }
        return;
    }
    if(addmyshortcuttexorgs.classList.contains("sqab_pop_hide")){
        addmyshortcuttexorgs.classList.remove("sqab_pop_hide");
    }
    let type = 'myorgs';
     let data = await chrome.storage.sync.get(type);
        let mySavedData = [];
        if(data[type] != undefined && data[type].length > 0){
            mySavedData = data[type];
        }
            let targetOrg=`<ul id="editorglist" class="sqab_pop_tags">`;
            if(mySavedData.length > 0){
                for (const org of mySavedData) {
                    targetOrg +=`<li class="sqab_pop_tag sqab_pop_edit">${org.name}</li>`;
                }
            }else {
                targetOrg +=`<li class="sqab_pop_tag sqab_pop_edit">all</li>`;
            }
            targetOrg += `</ul>`;
        addmyshortcuttexorgs.innerHTML = targetOrg;   

        let edittargetOrgsContainer = document.getElementById(`editorglist`); 
        let edittargetOrgsList = edittargetOrgsContainer.getElementsByTagName(`li`); 
        for (const org of edittargetOrgsList) {
            org.addEventListener('click', add_UpdateOrg);
        }
}

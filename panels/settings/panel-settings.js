var handlers = [];
var type = "myorgs";
var editOldrecord = {};

export async function init(importedhandlers){
    handlers = importedhandlers
    handlers["data"].doStartFromPopup(true);
    document.getElementById('popup_myorgs').onclick = function () {buildContent("myorgs")};
    document.getElementById('popup_myobjs').onclick = function () {buildContent("myobjs")};
    document.getElementById('popup_myshortcuts').onclick = function () {buildContent("myshortcuts")};
    document.getElementById('popup_prefrences').onclick = function () {buildContent("myprefrences")};
    document.getElementById('edit_btn_save').onclick = saveEdit;
    document.getElementById('edit_btn_cancel').onclick = closeEdit;
}

function closeEdit() {
    let editMenu = document.getElementById('sqab_pop_modal');
    editMenu.classList.add("sqab_pop_hide");
}

async function saveEdit() {
    const editMenu = document.getElementById("sqab_pop_modal");
    const orgtags = document.getElementById('orglist');
    const edit_inputs = editMenu.getElementsByTagName("input");
    let updatedRecord = {custom:true,name:edit_inputs[0].value,value:edit_inputs[1].value,org:undefined};
    for (const tag of orgtags.getElementsByClassName('sqab_my_org')) {
        if(updatedRecord.org == undefined){
            updatedRecord.org = [];
        }
        updatedRecord.org.push(tag.textContent);
    }
    if(updatedRecord.org != undefined && updatedRecord.org.length == handlers['data'].getDataFromLibrary('myorgs').length ){
        updatedRecord.org = undefined;
    }
    let response = await handlers["save"].edit(handlers,updatedRecord,editOldrecord,type);
    alert(response.message);
    buildContent(type);
    closeEdit();
}

function hotkeyChanged(event){
    event.preventDefault();
    event.target.value = event.key;
    handlers["save"].savePreferences(handlers,"HotKey",{code:event.code, name:event.key});
    event.target.blur();
}

function checkboxChanged(event,type){
    event.preventDefault();
    handlers["save"].savePreferences(handlers,type,event.target.checked);
}

function hotkeyFocused(event){
    event.preventDefault();
    event.target.style.background = 'lightgray';
    event.target.value = "";
}

function getDefualts(type){
    let result = handlers["data"].findDataByNode(type,"mypreferences");
    return result;
}

async function buildContent(selectedType) {
    await handlers["data"].buildData();
    type = selectedType;
    if(type == 'myprefrences'){
        const hotkeyInput = document.getElementById('sqab_hotkey_input');
        hotkeyInput.style.background = 'white';
        hotkeyInput.value = handlers["data"].findDataByNode("HotKey","mypreferences").name;
        hotkeyInput.onkeydown = (event) => hotkeyChanged(event);
        hotkeyInput.onfocus = (event) => hotkeyFocused(event);
        hotkeyInput.onblur = (event) => {
          event.target.style.background = 'white';
          event.target.value = handlers["data"].findDataByNode("HotKey","mypreferences").name;
        };

        const newTabInput = document.getElementById('sqab_new_tab_input');
        newTabInput.checked = getDefualts("linkOpenNewTab");
        newTabInput.onchange = (event) => checkboxChanged(event,"linkOpenNewTab");

        const showAllInput = document.getElementById('sqab_show_all_input');
        showAllInput.checked = getDefualts("alwaysShowCustoms");
        showAllInput.onchange = (event) => checkboxChanged(event,"alwaysShowCustoms");

        const favoritesInput = document.getElementById('sqab_show_favorites_input');
        favoritesInput.checked = getDefualts("alwaysShowFavorites");
        favoritesInput.onchange = (event) => checkboxChanged(event,"alwaysShowFavorites");

        const floatingBtnInput = document.getElementById('sqab_show_floating_btn_input');
        floatingBtnInput.checked = getDefualts("enableFloatingBtn");
        floatingBtnInput.onchange = (event) => checkboxChanged(event,"enableFloatingBtn");

        const ResetFavoritesBtn = document.getElementById('sqab_ResetFavoritesBtn');
        if(await IhaveFavorites()){
            ResetFavoritesBtn.onclick = (event) => resetFavorites(event);
        }else{
            ResetFavoritesBtn.style.display = "none";
        }

        const enableHotKeyInput = document.getElementById('sqab_enable_hotkey_input');
        enableHotKeyInput.checked = getDefualts("enableHotKey");
        enableHotKeyInput.onchange = (event) => checkboxChanged(event,"enableHotKey");
        
    }else{
        let allData = htmlBuild(type);
        let div = document.getElementById("container_"+type);
        div.innerHTML = allData;
        for (const row of div.children) {
            if (type != "myorgs") {
                const editBtn = row.querySelector('.sqab_pop_btn:nth-of-type(1)');
                const removeBtn = row.querySelector('.sqab_pop_btn:nth-of-type(2)');
                editBtn.onclick = (event) => buttonEditClicked(event);
                removeBtn.onclick = (event) => buttonRemoveClicked(event);
            } else {
                const removeBtn = row.querySelector('.sqab_pop_btn:nth-of-type(1)');
                removeBtn.onclick = (event) => buttonRemoveClicked(event);
            }            
        }
    }
}

async function IhaveFavorites(){
    let localmem = await chrome.storage.sync.get("favorites");
    let favorites = localmem["favorites"] || undefined;
    if (favorites == undefined || Object.keys(favorites).length === 0  || favorites == []){
        return false;
    }
    return true;
}

async function resetFavorites(e){
    await handlers["data"].overrideManualData("favorites",{});
    const ResetFavoritesBtn = document.getElementById('sqab_ResetFavoritesBtn');
    const parent = ResetFavoritesBtn.parentNode;
    ResetFavoritesBtn.style.display = "none";
    const message = document.createElement('div');
    message.textContent = 'Please refresh';
    message.style.color = 'red';

    parent.replaceChild(message, ResetFavoritesBtn);
}

function buttonEditClicked(e){
    const parent = e.target.parentElement;
    const input = parent.querySelector('input');
    let editMenu = document.getElementById('sqab_pop_modal');
    editMenu.classList.remove("sqab_pop_hide");
    let edit_inputs = editMenu.getElementsByTagName("input");
    editOldrecord = handlers["data"].findDataByLabel(input.value,type);
    edit_inputs[0].value = input.value; // Label
    edit_inputs[1].value = editOldrecord.value; // value
    const orglist = document.getElementById('orglist');
    orglist.innerHTML = "";
    if(type != "myorgs"){
        orglist.append(alltargetOrgPin(editOldrecord));
    }
}

async function  buttonRemoveClicked(e){
    const parent = e.target.parentElement;
    const input = parent.querySelector('input');
    handlers["save"].remove(handlers,input.value,type);
    buildContent(type);
}

function htmlBuild(type){
    let allData = '';
    let mySavedData = handlers["data"].getDataFromLibrary(type);
    for (const data of mySavedData) {
        allData+=`
        <div class="sqab_pop_row_container">
        ${type != "myorgs" ? `<button class=" sqab_pop_btn" style="background-color: #90cd90;">Edit</button>` : ''}
            <div class="sqab_pop_row" >
                <input disabled value="${data.name}" class="sqab_pop_input"></input>
                <div id="sqab_pin" class="sqab_pop_silent">
                    ${targetOrgPin(data)}
                </div>
            </div>
            <button class=" sqab_pop_btn" style="background-color: #ce6363;">Remove</button>
        </div>
      `;
    }
    return allData;
}

function targetOrgPin(data) {
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

function alltargetOrgPin(recordOrgs) {
    const targetOrg = document.createElement('ul');
    targetOrg.classList.add('sqab_pop_tags');
  
    const myOrgs = handlers['data'].getDataFromLibrary('myorgs');
    for (const savedOrg of myOrgs) {
      const li = document.createElement('li');
      li.classList.add('sqab_pop_tag');
      li.textContent = savedOrg.name;
  
      if (recordOrgs.org == undefined || recordOrgs.org.includes(savedOrg.name)) {
        li.classList.add('sqab_my_org');
      }
  
      targetOrg.appendChild(li);
    }
  
    targetOrg.onclick = (event) => {
      if (event.target.tagName === 'LI') {
        const myorgtag = event.target;
        if (myorgtag.classList.contains('sqab_my_org')) {
          myorgtag.classList.remove('sqab_my_org');
        } else {
          myorgtag.classList.add('sqab_my_org');
        }
      }
    };
  
    return targetOrg;
  } 
  
  
  
  
var handlers = [];
var type = "myorgs";
var editOldrecord = {};
document.addEventListener("DOMContentLoaded",function () {init(null);},false);

export async function init(importedhandlers){
    debugger
    if(importedhandlers == null){
        await loadHandler("handlers/navigation-handler", "navigation");
        await loadHandler("handlers/data-handler", "data");
        await loadHandler("handlers/save-handler", "save");
        await loadHandler("handlers/suggestions-handler", "suggestions");
    }else{
        handlers = importedhandlers
    }
    console.log(handlers);
    handlers["data"].doStartFromPopup(true);
    document.getElementById('popup_myorgs').onclick = function () {buildContent("myorgs")};
    document.getElementById('popup_myobjs').onclick = function () {buildContent("myobjs")};
    document.getElementById('popup_myshortcuts').onclick = function () {buildContent("myshortcuts")};
    document.getElementById('edit_btn_save').onclick = saveEdit;
    document.getElementById('edit_btn_cancel').onclick = closeEdit;
}


function closeEdit() {
    let editMenu = document.getElementById('sqab_pop_modal');
    console.log('editMenu',editMenu);
    editMenu.classList.add("sqab_pop_hide");
}

async function saveEdit() {
    const editMenu = document.getElementById("sqab_pop_modal");
    const edit_inputs = editMenu.getElementsByTagName("input");
    let updatedRecord;
    if(type != 'myorgs'){
        updatedRecord = {custom:true,name:edit_inputs[0].value,value:edit_inputs[1].value,org:undefined};
    }else{
        updatedRecord = {name:edit_inputs[0].value,value:edit_inputs[1].value};
    }
    console.log('updatedRecord',updatedRecord);
    let response = await handlers["save"].edit(handlers,updatedRecord,editOldrecord,type);
    alert(response.message);
    buildContent(type);
}

async function loadHandler(handlerName, handlerKey){
    const src = chrome.runtime.getURL(`${handlerName}.js`);
    handlers[handlerKey] = await import(src);
    console.log("done "+handlerKey);
}

async function buildContent(selectedType) {
    console.log('buildContent',type);
    await handlers["data"].buildData();
    type = selectedType;
    let allData = htmlBuild(type);
    let div = document.getElementById("container_"+type);
    div.innerHTML = allData;
    for (const row of div.children) {
        const editBtn = row.querySelector('.sqab_pop_btn:nth-of-type(1)');
        const removeBtn = row.querySelector('.sqab_pop_btn:nth-of-type(2)');
        editBtn.addEventListener('click', (event) => buttonEditClicked(event));
        removeBtn.addEventListener('click', (event) => buttonRemoveClicked(event));
    }        
}

function buttonEditClicked(e){
    const parent = e.target.parentElement;
    const input = parent.querySelector('input');
    let editMenu = document.getElementById('sqab_pop_modal');
    editMenu.classList.remove("sqab_pop_hide");
    let edit_inputs = editMenu.getElementsByTagName("input");
    editOldrecord = handlers["data"].findDataFromLabel(input.value,type);
    edit_inputs[0].value = input.value;
    edit_inputs[1].value = editOldrecord.value;
    if(type != "myorgs"){
        document.getElementById('orglist').innerHTML = alltargetOrgPin(editOldrecord);
    }else{
        document.getElementById('orglist').innerHTML = "";
    }
    
}

async function  buttonRemoveClicked(e){
    console.log('type',type)
    const parent = e.target.parentElement;
    const input = parent.querySelector('input');
    console.log('input',input.value)
    // const elementValue = handlers["data"].findDataFromLabel(input.value,type).value};
    await handlers["data"].deleteData(input.value,type,'name');
    buildContent(type);
}

function htmlBuild(type){
    let allData = '';
    let mySavedData = handlers["data"].getDataFromLibrary(type);
    console.log('mySavedData',mySavedData);
    for (const data of mySavedData) {
        allData+=`
        <div class="sqab_pop_row_container">
        <button class=" sqab_pop_btn" style="background-color: #90cd90;">Edit</button>
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
    let targetOrg=`<ul id="orgs${type}-${recordOrgs.name}" class="sqab_pop_tags sqab_pop_silent">`;
    for (const savedOrg of handlers["data"].getDataFromLibrary("myorgs")) {
        if(recordOrgs.org == undefined || recordOrgs.org.includes(savedOrg.name)){
            targetOrg +=`<li class="sqab_pop_tag sqab_my_org sqab_pop_silent">${savedOrg.name}</li>`;
        }else{
            targetOrg +=`<li class="sqab_pop_tag sqab_pop_silent">${savedOrg.name}</li>`;
        }
    }
    targetOrg += `</ul>`;
    return targetOrg;
}
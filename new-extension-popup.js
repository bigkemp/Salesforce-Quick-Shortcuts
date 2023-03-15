var handlers = [];
document.addEventListener(
    "DOMContentLoaded",
    function () {
        init(null);
    },
    false
);


export async function init(handlers){
    if(handlers == null){
        console.log('1');
        await loadHandler("handlers/navigation-handler", "navigation");
        await loadHandler("handlers/data-handler", "data");
        await loadHandler("handlers/save-handler", "save");
        await loadHandler("handlers/suggestions-handler", "suggestions");
        console.log('2');

    }
    document.getElementById('popup_myorgs').onclick = buildContent("myorgs");
    document.getElementById('popup_myobjs').onclick = buildContent("myobjs");
    document.getElementById('popup_myshortcuts').onclick = buildContent("myshortcuts");
}

async function loadHandler(handlerName, handlerKey){
    const src = chrome.runtime.getURL(`${handlerName}.js`);
    handlers[handlerKey] = await import(src);
}

function buildContent(type) {
    let allData = htmlBuild(type);
    let div = document.getElementById("container_"+type);
    div.innerHTML = allData;
    for (const row of div.children) {
        const editBtn = row.querySelector('.sqab_pop_btn:nth-of-type(1)');
        const removeBtn = row.querySelector('.sqab_pop_btn:nth-of-type(2)');
    
        editBtn.addEventListener('click', (event) => buttonClicked(event, type));
        removeBtn.addEventListener('click', (event) => buttonClicked(event, type));
    }        
}

function buttonClicked(e,type){
    if(e.target.innerText == 'Edit'){
        const parent = e.target.parentElement;
        const input = parent.querySelector('input');
        let editMenu = document.getElementById('sqab_pop_modal');
        editMenu.classList.remove("sqab_pop_hide");
        let edit_inputs = editMenu.getElementsByTagName("input");
        edit_inputs[0].value = input.value;
        let mySavedData = handlers["data"].getDataFromLibrary(type);
        for (const data of mySavedData) {
            if(data.name == input.value){
                edit_inputs[1].value = data.value;
                break;
            }
        }
    }else{ //removed

    }
}

function htmlBuild(type){
    let allData = '';
    let mySavedData = handlers["data"].getDataFromLibrary(type);
    for (const data of mySavedData) {
        console.log('data',data);
        allData+=`
        <div class="sqab_pop_row_container">
        <button class=" sqab_pop_btn" style="background-color: #90cd90;">Edit</button>
            <div class="sqab_pop_row" >
                <input disabled value="${data.name}" class="sqab_pop_input"></input>
                <div id="sqab_pin" class="sqab_pop_silent">
                    ${targetOrgPin(data,type)}
                </div>
            </div>
            <button class=" sqab_pop_btn" style="background-color: #ce6363;">Remove</button>
        </div>
      `;
    }
    return allData;
}

function targetOrgPin(data,type) {
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
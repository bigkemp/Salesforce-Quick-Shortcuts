
var myOrgs;
const tabs =["shortcuts","objs","listviews","flows","metadatas","profiles"];
function targetOrgPin(data, type, targetCell) {
    const targetOrg = document.createElement('ul');
    targetOrg.id = `orgs${type}-${data.name}`;
    targetOrg.className = 'sqab_pop_tags sqab_pop_silent';
        for (const org of myOrgs) {
            const listItem = document.createElement('li');
            listItem.textContent = org.name;
            listItem.className = 'sqab_pop_tag';
            if(Array.isArray(data.org) && data.org.length > 0 && data.org.includes(org.name)){
                listItem.className += ' sqab_my_org';
            }
            listItem.onclick = () => {
                let updatedData = data;
                if(Array.isArray(data.org) && data.org.length > 0){
                    if(data.org.includes(org.name)){
                        data.org = data.org.filter(item => item !== org.name);
                        listItem.classList.remove("sqab_my_org");
                    }else{
                        data.org.push(org.name);
                        listItem.classList.add("sqab_my_org");
                    }
                }else{
                    data.org = [];
                    data.org.push(org.name);
                    listItem.classList.add("sqab_my_org");
                }
                saveEdit(updatedData,data,type);
            };
            targetOrg.appendChild(listItem);
        }
    targetCell.appendChild(targetOrg);
}

function createTable(type) {
    let mySavedData = handlers["data"].getDataFromLibrary(type);
    myOrgs = handlers["data"].getDataFromLibrary("myorgs")
    const table = document.createElement('table');
    table.id = 'dynamicTable';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    const headers = ['Name', 'Value', 'Target', 'Act'];

    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.appendChild(document.createTextNode(headerText));
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    mySavedData.forEach(rowData => {
        tbody.appendChild( addRow(tbody, rowData, type));
    });
    table.appendChild(tbody);

    return table;
}

async function saveEdit(rowData,rowOldData,type) {
    let response = await handlers["save"].edit(handlers,rowData,rowOldData,type);
    alert(response.message);
}

 function addRow(table, rowData, type) {
    const name = rowData.name;
    const value = rowData.value;

    const row = table.insertRow();

    const nameCell = row.insertCell(0);
    const valueCell = row.insertCell(1);
    const targetCell = row.insertCell(2);
    if(type != "myorgs"){
        targetOrgPin(rowData, type, targetCell);
    }
    const actionCell = row.insertCell(3);

    nameCell.appendChild(document.createTextNode(name));
    valueCell.appendChild(document.createTextNode(value));

   nameCell.onclick = () => {
        const newName = prompt("Edit Name:", nameCell.textContent);
        if (newName !== null) {
            nameCell.textContent = newName;
            let newRowData = JSON.parse(JSON.stringify(rowData));
            newRowData.name = newName; // Update the rowData
            saveEdit(newRowData,rowData,type);
        }
    };

    valueCell.onclick = () => {
        const newValue = prompt("Edit Value:", valueCell.textContent);
        if (newValue !== null) {
            valueCell.textContent = newValue;
            let newRowData = JSON.parse(JSON.stringify(rowData));
            newRowData.name = newName; // Update the rowData
            saveEdit(newRowData,rowData,type);
        }
    };


    const deleteButton = document.createElement('button');
    deleteButton.textContent = '✖️';
    deleteButton.onclick = () => {
        buttonRemoveClicked(rowData,type);
        const row = deleteButton.parentNode.parentNode;
        row.parentNode.removeChild(row);
    };

    actionCell.appendChild(deleteButton);
    return row;
}
  
function hotkeyChanged(event){
    event.preventDefault();
    event.target.value = event.key;
    handlers["save"].savePreferences(handlers,"HotKey",{code:event.code, name:event.key});
    event.target.blur();
}

function hotkeyFocused(event){
    event.preventDefault();
    event.target.style.background = 'lightgray';
    event.target.value = "";
}

function checkboxChanged(event,type){
    event.preventDefault();
    handlers["save"].savePreferences(handlers,type,event.target.checked);
}

function getDefualtPreference(type){
    let result = handlers["data"].findDataByNode(type,"mypreferences");
    return result;
}

async function resetFavorites(){
    await handlers["data"].overrideManualData("favorites",{});
    alert("Reset Completed, Please refresh page")
}

function  buttonRemoveClicked(rowData,type){
     handlers["save"].remove(handlers,rowData.name,type);
}

async function buildPreferencesContent() {
    const preferencesContent = document.getElementById('preferences-content');
    const inputFields = preferencesContent.querySelectorAll('input');

    inputFields.forEach(async input => {
        let selectedPreference = input.getAttribute('data-target');
        switch (selectedPreference) {
            case "HotKey":
                input.style.background = 'white';
                input.value = getDefualtPreference(selectedPreference).name;
                input.onkeydown = (event) => hotkeyChanged(event);
                input.onfocus = (event) => hotkeyFocused(event);
                input.onblur = (event) => {
                    event.target.style.background = 'white';
                    event.target.value = getDefualtPreference(selectedPreference).name;
                };
                break;
            case "ResetFavoritesBtn":
                input.onclick = (event) => {
                    resetFavorites(event);
                    window.showSuggestions();
                }
                break;
            case "alwaysShowFavorites":
                input.checked = getDefualtPreference(selectedPreference);
                input.onchange = (event) => {
                    checkboxChanged(event,selectedPreference);
                    window.showSuggestions();
                };
                break;
            case "linkOpenNewTab":
            case "alwaysShowCustoms":
            case "enableFloatingBtn":
            case "enableHotKey":
                input.checked = getDefualtPreference(selectedPreference);
                input.onchange = (event) => checkboxChanged(event,selectedPreference);
                break;
        }
    });
}

const buildContentForType = (typeOfMemory) => {
    const div = document.getElementById("container_" + typeOfMemory);
    div.innerHTML = '';
    div.appendChild(createTable(typeOfMemory));
};

function buildTabsContent(){
    const container = document.getElementById('container_mytabs');
    container.innerHTML = "";
    // Create container div
    const divContainer = document.createElement('div');
    divContainer.classList.add('sqab_p_settings_tab_container');

    // Create Active section
    const activeSection = document.createElement('div');
    const activeTitle = document.createElement('h2');
    activeTitle.classList.add('sqab_p_settings_tab_h2');
    activeTitle.textContent = 'Active';
    activeSection.appendChild(activeTitle);

    const activePicklist = document.createElement('ul');
    activePicklist.id = 'sqab_p_settings_tab_activePicklist';
    activePicklist.classList.add('sqab_p_settings_tab_picklist');
    activeSection.appendChild(activePicklist);

    // Create Inactive section
    const inactiveSection = document.createElement('div');
    const inactiveTitle = document.createElement('h2');
    inactiveTitle.classList.add('sqab_p_settings_tab_h2');
    inactiveTitle.textContent = 'Inactive';
    inactiveSection.appendChild(inactiveTitle);

    const inactivePicklist = document.createElement('ul');
    inactivePicklist.id = 'sqab_p_settings_tab_inactivePicklist';
    inactivePicklist.classList.add('sqab_p_settings_tab_picklist');

    // Add items to Inactive picklist
    const items = handlers["data"].findDataByNode('tabs','mypreferences');
    tabs.forEach(tab => {
        const li = document.createElement('li');
        li.textContent = tab;
        if(items.includes(tab)){
            activePicklist.appendChild(li);
        }else{
            inactivePicklist.appendChild(li);
        }
    });

    inactiveSection.appendChild(inactivePicklist);

    // Append sections to container div
    divContainer.appendChild(activeSection);
    divContainer.appendChild(inactiveSection);

    // Append container div to container_mytabs
    container.appendChild(divContainer);

    // Add event listeners for moving items
    inactivePicklist.addEventListener('click', (event) => {
        moveItem(event, activePicklist);
        let newTabArray = [];
        let liElements = activePicklist.querySelectorAll('li');
        liElements.forEach(tab => {
            newTabArray.push(tab.textContent);
        });
        handlers["save"].savePreferences(handlers,"tabs",newTabArray);
        window.refreshTabs();
    });

    activePicklist.addEventListener('click', (event) => {
        moveItem(event, inactivePicklist);
        let newTabArray = [];
        let liElements = activePicklist.querySelectorAll('li');
        liElements.forEach(tab => {
            newTabArray.push(tab.textContent);
        });
        handlers["save"].savePreferences(handlers,"tabs",newTabArray);
        window.refreshTabs();
    });

    function moveItem(event, targetPicklist) {
        if (event.target.tagName === 'LI') {
            targetPicklist.appendChild(event.target);
        }
    }
}


async function buildContent(page){
    // await handlers["data"].buildData(); // refresh memory with each entry
    switch (page) {
        case "preferences-content":
            buildPreferencesContent();
            break;
        case "saved-orgs-content":
            buildContentForType("myorgs");
            break;
        case "saved-shortcuts-content":
            buildContentForType("myshortcuts");
            break;
        case "saved-tabs-content":
            buildTabsContent();
            break;
    }

}
  
export async function init(importedhandlers) {
    handlers = importedhandlers
    handlers["data"].doStartFromPopup(true);
    const tabs = document.querySelectorAll('.sqab_p_settings_tab');
    let activeTab = null;

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (activeTab) {
                activeTab.classList.remove('active');
                const previousContentId = activeTab.getAttribute('data-target');
                document.getElementById(previousContentId).style.display = 'none';
            }
            tab.classList.add('active');
            const currentContentId = tab.getAttribute('data-target');
            document.getElementById(currentContentId).style.display = 'block';
            activeTab = tab;
            buildContent(activeTab.getAttribute('data-target'));
        });

        tab.addEventListener('mouseover', () => {
            tabs.forEach(t => {
                if (t !== tab) {
                    t.style.flexGrow = '0.5';
                } else {
                    t.style.flexGrow = '2';
                }
            });
        });

        tab.addEventListener('mouseout', () => {
            tabs.forEach(t => {
                t.style.flexGrow = '1';
            });
        });
    });
}

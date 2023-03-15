var data_library = {};
var currentOrg = getURLminized();
export var orgExists = {value:false,name:"",value:""};
buildData();

export async function getData(storageType){
  let data = await chrome.storage.sync.get(storageType);
  return data[storageType];
}

export function checkIfExists(newData,type){
  if(data_library[type] == undefined){
    return false;
  }else{
    data_library[type].forEach(data => {
      if(data.value == newData){
        return true;
      }
    });
    return false;
  }
}
export async function saveData(data,type){
  if(data_library[type] == undefined){
    data_library[type] = [];
  }
  data_library[type].push(data);
  let memoryStracture = {};
  memoryStracture[type] = data_library[type];
  chrome.storage.sync.set(memoryStracture);
}

export function getDataFromLibrary(name){
  return data_library[name] == undefined ? [] : data_library[name];
}

export function getShortcuts(name){
  if(name == 'listview'){
    name = 'objs';
  }
  const myData = data_library['my' + name];
  const data = data_library[name];
  const result = [];
  
  if (myData !== undefined && myData !== '') {
    result.push(myData);
  }
  
  if (data !== undefined && data !== '') {
    result.push(data);
  }
  
  if (result.length === 0) {
    return [];
  }
  return result;
}

export function findDefaultShortcut(type,nameForJson){
  if(type == 'listview'){
    type = 'objs';
  }
  return data_library[type]["urls"][nameForJson];
}

async function buildData(){
  data_library = {};
  orgExists = {value:false,name:"",value:""};
  await getMyOrgs();
  getMyData('myshortcuts');
  getMyData('myobjs');
  loadJson('shortcuts');
  loadJson('obj-shortcuts');
  console.log('data_library',data_library);
}

async function getMyOrgs(){
  let myorgs = await getData('myorgs');
  let currentPage = getURLminized();
  data_library["myorgs"] = myorgs;
  if(data_library["myorgs"] == undefined || data_library["myorgs"].length == 0){
    data_library["myorgs"] = [{name:currentPage, value:currentPage }]; 
  }else{
    data_library["myorgs"].forEach(org => {
      if(org.value.includes(currentPage)){
        orgExists.value = true;
      }
    });
    if(!orgExists.value){
      orgExists.name = currentPage;
      orgExists.value = currentPage;
      data_library["myorgs"].push({name:currentPage, value:currentPage }); 
    }
  }
}

async function getMyData(mySpecificData){
  let myorg = data_library["myorgs"]?.filter(org => org.value.includes(currentOrg));
  let targetOrgSaved = myorg?.length != 0;
  let mydata = await getData(mySpecificData);
  const filteredData = mydata?.filter(entry => {
    if (entry.org === undefined || entry.org.includes('all')) {
      return true;
    }
    if (targetOrgSaved) {
      return entry.org.includes(myorg[0].name);
    }
    return false;
  });
  data_library[mySpecificData] = filteredData?.length == 0 ? undefined : filteredData;
}

async function loadJson(data) {
  try {
    const response = await fetch(chrome.runtime.getURL(`data/${data}.json`));
    const json = await response.text();
    let parsed = JSON.parse(json);
    if(data == "obj-shortcuts"){
      data = "objs";
    }
    data_library[data] = parsed["defaults"];
    data_library[data]["urls"] = parsed["urls"];
  } catch (e) {
    console.log(e);
  }
}

export async function loadModalIndex() {
  try {
    const file = await fetch(chrome.runtime.getURL("/new-modal-index.html"));
    const html = await file.text();
    document.body.insertAdjacentHTML("beforeend", html);
  } catch (e) {
    console.log(e);
  }
}

export async function loadModalIndex2() {
  try {
    const file = await fetch(chrome.runtime.getURL("/new-extension-popup.html"));
    const html = await file.text();
    return html;
    // document.body.insertAdjacentHTML("beforeend", html);
  } catch (e) {
    console.log(e);
  }
}

function getURLminized(){ //TODO:UTILIZE CLASS
  let org = window.location.href.replace("https://","").substring(0,window.location.href.indexOf("."));
  return org.replace(org.substring(org.indexOf(".")),"");
}
var data_library = {};
var startFromPopup = false;
var currentOrg = getURLminized();
export var orgExists = {bool:false,name:"",value:""};
buildData();

export async function getData(storageType){
  let data = await chrome.storage.sync.get(storageType);
  return data[storageType];
}

export function doStartFromPopup(value){
  startFromPopup = value;
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

export function findDataByLabel(label,type) {
  let mySavedData = getDataFromLibrary(type);
  for (const data of mySavedData) {
      if(data.name == label){
          return data;
      }
  }
}

export function findDataByNode(node,type) {// for preferences data
  let mySavedData = getDataFromLibrary(type);
  return mySavedData[node];
}


export async function saveDataByReplace(index2Remove,newData,type){
  if(!type.includes("my")){
    type = "my"+type;
  }
  let memoryStructure = await getData(type);
  if(memoryStructure == undefined){
    memoryStructure = [];
  }else{
    memoryStructure.splice(index2Remove, 1, newData);

  }
  await chromeStorageSet(memoryStructure,type);
}

export async function saveDataByAdd(data,type){
  if(!type.includes("my")){
    type = "my"+type;
  }
  let memoryStructure = await getData(type);
  if(memoryStructure == undefined){
    memoryStructure = [];
  }
  if(data != null && data != undefined){// for non existing orgs, are added by defualt so data would be in that case undefined, Im setting as null as indicator.
    memoryStructure.push(data);
  }
  await chromeStorageSet(memoryStructure,type);
}

export async function overrideData(type){
  let memoryStructure = await getData(type);
  await chromeStorageSet(memoryStructure,type);
}

export async function overrideManualData(type,data){
  await chromeStorageSet(data,type);
}

async function chromeStorageSet(data,type){
  await chrome.storage.sync.set({[type]:data});
  await buildData();
}


export async function deleteData(value,type,by){
  let memoryStructure = data_library[type];
  memoryStructure = memoryStructure.filter(obj => obj[by] !== value);
  await chromeStorageSet(memoryStructure,type);
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

export async function buildData(){
  data_library = {};
  orgExists = {bool:false,name:"",value:""};
  await loadMyOrgs();
  await loadMyData('myshortcuts');
  await loadMyData('myobjs');
  await loadMyData('mypreferences');
  await loadJson('shortcuts');
  await loadJson('obj-shortcuts');
}

async function loadMyOrgs(){
  let myorgs = await getData('myorgs');
  let currentPage = getURLminized();
  console.log('loadMyOrgs',currentPage);
  data_library["myorgs"] = myorgs;
  if(currentPage != ""){
    if(data_library["myorgs"] == undefined || data_library["myorgs"].length == 0){
      // do nothing, need to remove. line "if(!orgExists.bool){" does the same
    }else{
      data_library["myorgs"].forEach(org => {
        if(org.value.includes(currentPage)){
          orgExists.bool = true;
          orgExists.name = org.name;
          orgExists.value = currentPage;
        }
      });
    }
    if(!orgExists.bool){
      orgExists.value = currentPage;
      orgExists.name = currentPage;
      orgExists.bool = false;
      data_library["myorgs"].push({name:currentPage, value:currentPage, exists:false}); 
    }
  }
  console.log('orgExists',orgExists);
}

async function loadMyData(mySpecificData){
  let myorg = data_library["myorgs"]?.filter(org => org.value.includes(currentOrg));
  let targetOrgSaved = myorg?.length != 0;
  let mydata = await getData(mySpecificData);
  console.log('mydata',mydata);
  if(mySpecificData == 'mypreferences'){
      if(mydata == undefined){ // if preferences were never defined, then define
        mydata = {
          linkOpenNewTab:true,
          alwaysShowCustoms:true,
          alwaysShowFavorites:true,
          HotKey: {code:81 ,name:"q"}
        };
        await chromeStorageSet(mydata,mySpecificData);
      }
      data_library[mySpecificData] = mydata;
  }else{
    const filteredData = mydata?.filter(entry => {
      if(startFromPopup){//means its from popup
        return true;
      }
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
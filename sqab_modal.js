
var r = document.querySelector(':root');
var isModalOpened = false;
var suggestions = [];
var tabsPane
var inputbar
var tabtypes = {
  "shortcuts": {"color":"#5356FF","placeholder":"Enter Shortcut Name","title":"Shortcuts"},
  "objs": {"color":"#378CE7","placeholder":"Enter Object Label","title":"Objects"},
  "listviews": {"color":"#67C6E3","placeholder":"Enter Object Label","title":"ListViews"},
  "flows": {"color":"#67C6E3","placeholder":"Enter Flow Name","title":"Flows"},
  "metadatas": {"color":"#67C6E3","placeholder":"Enter Metadata Type Name","title":"Metadata"},
  "profiles": {"color":"#67C6E3","placeholder":"Enter Profile Name","title":"Profiles"}
}

var handlersMap = {
  "settings": "/panels/settings/panel-settings",
  "add": "/panels/add/panel-add",
  "monitoring": "/panels/monitoring/panel-monitoring",
  "navigation": "handlers/navigation-handler",
  "data": "handlers/data-handler",
  "save": "handlers/save-handler",
  "favorites": "handlers/favorites-handler",
  "suggestions": "handlers/suggestions-handler",
  "connector": "handlers/connector-handler"
}


var paneltypes =  {
  "settings":"/panels/settings/panel-settings.html",
  "add":"/panels/add/panel-add.html",
  "monitoring":"/panels/monitoring/panel-monitoring.html"
}

var handlers = {};
var filteredSuggestions = [];
var selectedSuggestionIndex = 0;
var currentSelectedTab = "shortcuts";
var loadingScreen;
var highlightColor = 'rgb(213 213 213 / 33%)';
var suggestionsDropdown;
init();

async function init(){
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(isModalOpened === false && message?.text == "Wake Up!"){
      startUp();   
      isModalOpened = true;
    }
  });
  window.onkeydown = keyPress;
  for (let [handlerKey, handlerPath] of Object.entries(handlersMap)) {
    await loadHandler(handlerKey,handlerPath);
  }
  if(handlers["data"].findDataByNode("enableFloatingBtn","mypreferences")){
    createFloatingBtn();
  }
}

function createFloatingBtn(){
  const sfPageBody = document.getElementsByClassName("desktop")[0];
  const myDiv = document.createElement('div');
  myDiv.id = "sqab_mydiv";
  const myDivHeader = document.createElement('div');
  myDivHeader.id = "sqab_mydivheader";
  myDiv.appendChild(myDivHeader);
  sfPageBody.appendChild(myDiv);
  myDiv.onclick = function() {
    if(isModalOpened === false){
      startUp();   
      isModalOpened = true;
    }
  };
}

function hotkeyDetector(evtobj){
  return evtobj.key.toLowerCase() == handlers["data"].findDataByNode("HotKey","mypreferences").name.toLowerCase() && 
  (evtobj.ctrlKey || evtobj.metaKey)
}

function isHotkeyEnabled(){
  return  handlers["data"].findDataByNode("enableHotKey","mypreferences")
}

function keyPress(e) {
    let evtobj = e;
    e.stopPropagation();
    switch (isModalOpened) {
        case true:
          if(evtobj.key === "Escape"){
            deleteModal();
          }else if(evtobj.key === "Tab"){
            closeSidePanel();
            if(document.activeElement != inputbar){
              inputbar.focus();
              e.preventDefault();
              return;
            }
            selectedSuggestionIndex = 0;
            inputbar.value = '';
            let currentIndex = Array.prototype.findIndex.call(tabsPane, tab => tab.classList.contains("active"));

            if (currentIndex !== -1) {
                let nextIndex = (currentIndex + (evtobj.shiftKey ? -1 : 1)) % tabsPane.length;
                tabsPane[nextIndex].click();
                currentSelectedTab = tabsPane[nextIndex].dataset.type;
            }
              suggestionsDropdown.style.display = "none";
              inputbar.focus();
              e.preventDefault();
          }
        break;
        case false:
            if (handlers["data"] != undefined && isHotkeyEnabled() && hotkeyDetector(evtobj)){
                startUp();   
                isModalOpened = true;
                e.preventDefault();
            }
        break;
    }

}

async function loadHandler(handlerKey,handlerPath){
  const src = chrome.runtime.getURL(`${handlerPath}.js`);
  handlers[handlerKey] = await import(src);
}

async function startUp(){
  await handlers["data"].buildData();
  await handlers["data"].loadModalHTML();
  initModal();
}

function deleteModal(){
  const slideOutMenu = document.getElementById('sqab_slide-out-menu');
  if(slideOutMenu.style.right == "0px"){
    closeSidePanel();
    return;
  }
  findByClass("sqab_modal")[0].remove();
  isModalOpened = false;
}

function findById(targetId){
  return document.getElementById(targetId);
}

function findByClass(targetClass){
  return document.getElementsByClassName(targetClass);
}

function loading_Start(){
  loadingScreen.style.display = "block";
}

async function showSuggestions(inputValue = ''){
  inputValue == undefined ? '' : inputValue;
  let type = currentSelectedTab;
  if (inputValue != '') {
    filteredSuggestions = handlers["suggestions"].getSuggestions(handlers["data"].getShortcuts(type),inputValue);
  }else{
    filteredSuggestions =  handlers["suggestions"].getFavoritesSuggestions(await handlers["favorites"].getFavorites(type,handlers));
  }
  if(filteredSuggestions.length != 0){
    suggestionsDropdown.style.display = "contents";
    suggestionsDropdown.innerHTML = "";
    const suggestionsHTML = handlers["suggestions"].buildSuggestionsHTML(filteredSuggestions, '');
    suggestionsDropdown.innerHTML = suggestionsHTML;
    if (selectedSuggestionIndex >= filteredSuggestions.length) {
      selectedSuggestionIndex = filteredSuggestions.length - 1;
    } else if (selectedSuggestionIndex < 0) {
      selectedSuggestionIndex = 0;
    }
    const selectedSuggestion = suggestionsDropdown.children[selectedSuggestionIndex];
    if(selectedSuggestion != undefined){
      selectedSuggestion.style.backgroundColor = highlightColor;
      selectedSuggestion.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }else{
    selectedSuggestionIndex = 0;
    suggestionsDropdown.style.display = "none";
  }
}

function loading_End(){
  loadingScreen.style.display = "none";
}

function closeSidePanel(){
  const slideOutMenu = document.getElementById('sqab_slide-out-menu');
  slideOutMenu.style.right = '-430px'; /* Slide the menu back out */
  handlers["data"].doStartFromPopup(false);
}

function defineTipsBar(){
  const tipsBar = document.getElementById('sqab_tips_bar');
  const tipsArray = handlers["data"].getDataFromLibrary("tips");
  const randomTip = tipsArray[Math.floor(Math.random() * tipsArray.length)];
  tipsBar.innerText = `Quick Tip : ${randomTip}`;
}

function createTabs(tabHeader){
  const children = Array.from(tabHeader.children);

  // Iterate over the children and remove div elements
  children.forEach(child => {
    if (child.tagName.toLowerCase() === 'div') {
      tabHeader.removeChild(child);
    }
  });
  let firstActive = false;
  handlers["data"].findDataByNode('tabs','mypreferences').forEach(tab => {
    let newTab = document.createElement('div');
    newTab.setAttribute('data-type', tab);
    if(firstActive == false){
      newTab.classList.add('active');
      currentSelectedTab=tab;
      firstActive = true;
    }
    tabHeader.appendChild(newTab);
  });
}


function refreshTabs(){
  const tabHeader = document.getElementsByClassName("sqab_tab-header")[0];
  const tabIndicator = document.getElementsByClassName("sqab_tab-indicator")[0];
  createTabs(tabHeader);
  tabsPane = tabHeader.getElementsByTagName("div");
  inputbar = document.getElementById("sqab_modalInput");
  inputbar.focus();
  loadingScreen = document.getElementById("sqab_loading-screen");
  suggestionsDropdown = document.getElementById("sqab_suggestions-dropdown");
  r.style.setProperty('--numOfTabs', tabsPane.length);
  showSuggestions();
  inputbar.placeholder = tabtypes[tabsPane[0].dataset.type]["placeholder"];
  currentSelectedTab = tabsPane[0].dataset.type;
  tabIndicator.style.left = `calc(calc(100%/${tabsPane.length})*${0})`;
  r.style.setProperty('--indicatorcolor', tabtypes[tabsPane[0].dataset.type]["color"]);
  for(let i=0; i < tabsPane.length; i++){
    tabsPane[i].innerText = tabtypes[tabsPane[i].dataset.type]["title"];
    tabsPane[i].onclick = async function(e){
      let type = tabsPane[i].dataset.type;
      closeSidePanel();
      // resetLayout("main");
      inputbar.value = "";
      tabHeader.getElementsByClassName("active")[0].classList.remove("active");
      tabsPane[i].classList.add("active");
      inputbar.placeholder = tabtypes[type]["placeholder"];
      currentSelectedTab = type;
      tabIndicator.style.left = `calc(calc(100%/${tabsPane.length})*${i})`;
      r.style.setProperty('--indicatorcolor', tabtypes[type]["color"]);
      showSuggestions();
      if (type != "shortcuts" && handlers["data"].findDataByNode(type) == undefined){
        loading_Start();
        getRemoteData(type);
        loading_End();
      }
      inputbar.focus();
    }
  }
}

async function initModal(){
  definePanel("settings");
  definePanel("monitoring");
  definePanel("add");
  defineTipsBar();
  defineOutsideAsCloseModal();
  refreshTabs();
  initInput();
  initSuggesionsDropdown();
}

function selectedShortcut(){
  const myshortcut = filteredSuggestions[selectedSuggestionIndex];
  let type = currentSelectedTab;
  let shortcutResult;
  if(myshortcut){
    shortcutResult = myshortcut;
    handlers["favorites"].add2Favorites(type,shortcutResult,handlers);
  }else{
    shortcutResult = inputbar.value;
  }
  if(type == 'extensions'){
    inputbar.value = shortcutResult.name;
    var event = new Event('input', {
      bubbles: true,
      cancelable: true,
    });
    inputbar.dispatchEvent(event);
    suggestionsDropdown.style.display = "none";
    selectedSuggestionIndex = 0;
    filteredSuggestions = [];
  }else{
    handlers["navigation"].redirectShortcuts(type,shortcutResult,handlers, handlers["data"].findDataByNode('linkOpenNewTab','mypreferences'));
    suggestionsDropdown.style.display = "none";
    selectedSuggestionIndex = 0;
    filteredSuggestions = [];
    deleteModal();
  }
}

async function openPanel(panelType) {
  const slideOutMenu = document.getElementById('sqab_slide-out-menu');
  const slideOutMenuBody = document.getElementById('sqab_slide-out-menu-body');

  if (slideOutMenu.style.right === "0px") {
    closeSidePanel();
  }

  try {
    let html = await handlers["data"].loadPopHTML(paneltypes[panelType]);
    slideOutMenuBody.innerHTML = html;
    slideOutMenu.style.right = '0px';
    handlers[panelType].init(handlers);
  } catch (error) {
    console.error(`Error loading panel: ${panelType}`, error);
  }
}

async function getRemoteData(type){
  let res = await handlers["connector"].search(type);

  handlers["data"].setTempSearchData(type.replace(" ",""),res);
}

function initInput() {
  inputbar.oninput = function() {
    const inputValue = inputbar.value.toLowerCase();
    if(inputValue.length >= 3 || inputValue.length == 0){
      showSuggestions(inputValue);
    }
  };

  inputbar.onkeydown = function(event) {
    const key = event.key;
    switch (key) {
      case "ArrowDown":
      case "ArrowUp":
        if (selectedSuggestionIndex >= 0) {
          suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = "";
        }

        selectedSuggestionIndex = Math.max(0, Math.min(selectedSuggestionIndex + (key === "ArrowDown" ? 1 : -1), filteredSuggestions.length - 1));
        suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = highlightColor;
        suggestionsDropdown.children[selectedSuggestionIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });

        event.preventDefault();
        break;
      case "Enter":
        selectedShortcut();
        event.preventDefault();
        break;
      case "Escape":
        deleteModal();
        event.preventDefault();
        break;
    }
  }
}

function initSuggesionsDropdown(){
  suggestionsDropdown.onmouseover = function(event) {
    
    if (selectedSuggestionIndex >= 0 && suggestionsDropdown.children[selectedSuggestionIndex] != undefined) {
      suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = "";
    }

    selectedSuggestionIndex = Array.from(suggestionsDropdown.children).indexOf(event.target);

    if(suggestionsDropdown.children[selectedSuggestionIndex] != undefined){
      suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = highlightColor;
    }
  };

  suggestionsDropdown.onclick = function() {
    selectedShortcut();
  };
}

function definePanel(panel) {
  let icon = document.getElementById(`sqab_${panel}_icon`);
  switch (panel) {
    case "settings":
      icon.onclick = () => openPanel("settings");
      break;
    case "monitoring":
      icon.onclick = () => openPanel("monitoring");
      break;
    case "add":
      icon.onclick = () => openPanel("add");
      break;
  }
}

// function resetLayout(type){
//   const tabBody = document.getElementsByClassName("sqab_tab-body")[0];
//   tabBody.getElementsByClassName("active")[0].classList.remove("active");

//   switch (type) {
//     case "add" :
//       tabBody.getElementsByTagName("div")[1].classList.add("active");
//       for(let i=0; i < tabsPane.length; i++){
//         if(tabsPane[i].dataset.type == currentSelectedTab){
//           tabsPane[i].innerText = "Add";
//         }
//         else{
//           tabsPane[i].innerText = "-";
//         }
//       }
//       break;
  
//     default:
//       tabBody.getElementsByTagName("div")[0].classList.add("active");
//       for(let i=0; i < tabsPane.length; i++){
//         tabsPane[i].innerText = tabtypes[tabsPane[i].dataset.type]["title"];
//       }
//       break;
//   }
// }
 

function defineOutsideAsCloseModal(){
  window.onclick = function(event) {
    let modal = document.getElementsByClassName("sqab_modal")[0];
    if (event.target ==  modal) {
      deleteModal();
    }
  }
}
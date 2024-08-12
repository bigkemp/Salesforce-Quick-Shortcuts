
var r = document.querySelector(':root');
var isModalOpened = false;
var suggestions = [];
var tabsPane
var inputbar
var toggler
var tabtypes = {
  "shortcuts": {"color":"#5356FF","placeholder":"Im looking for a Setup Option...","title":"Shortcuts","toggler":false},
  "objs": {"color":"#378CE7","placeholder":"Im looking for an SObject...","title":"Objects","toggler":true},
  "listviews": {"color":"#67C6E3","placeholder":"Im looking for an SObject's Listview...","title":"ListViews","toggler":true},
  "flows": {"color":"#67C6E3","placeholder":"Im looking for a Flow...","title":"Flows","toggler":true},
  "metadatas": {"color":"#67C6E3","placeholder":"Im looking for a Custom Metadata Type...","title":"Metadata","toggler":true},
  "profiles": {"color":"#67C6E3","placeholder":"Im looking for a Profile...","title":"Profiles","toggler":false},
  "connectedapps": {"color":"#67C6E3","placeholder":"Im looking for an App...","title":"Connected Apps","toggler":false}
}

var handlersMap = {
  "navigation": "handlers/navigation-handler",
  "data": "handlers/data-handler",
  "save": "handlers/save-handler",
  "favorites": "handlers/favorites-handler",
  "suggestions": "handlers/suggestions-handler",
  "connector": "handlers/connector-handler",
}
var paneltypes =  {
  "settings":{"html":"panel-settings.html","path":"/panels/settings/","js":"panel-settings"},
  "add":{"html":"panel-add.html","path":"/panels/add/","js":"panel-add"},
  "monitoring":{"html":"panel-monitoring.html","path":"/panels/monitoring/","js":"panel-monitoring"},
}

var handlers = {};
var filteredSuggestions = [];
var selectedSuggestionIndex = 0;
var currentSelectedTab = "shortcuts";
var loadingScreen;
var highlightColor = 'rgb(213 213 213 / 33%)';
var suggestionsDropdown;
init();


function setListenerForPopUpCall(){
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(isModalOpened === false && message?.text == "Wake Up!"){
      startUp();   
      isModalOpened = true;
    }
  });
}

async function loadHandlers(handlers){
  for (let [handlerKey, handlerPath] of Object.entries(handlers)) {
    let loadedHandler = await loadHandler(handlerPath);
    this.handlers[handlerKey] = loadedHandler;
  }
}

async function init(){
  setListenerForPopUpCall();
  window.onkeydown = keyPress;
  await loadHandlers(handlersMap);
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

async function loadHandler(handlerPath){
  const src = chrome.runtime.getURL(`${handlerPath}.js`);
  const savedHandler = await import(src);
  return savedHandler;
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
  handlers["data"].findDataByNode('shownTabs','mypreferences').forEach(tab => {
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
  toggler = document.getElementById("sqab_apitoggle");
  toggler.innerText = handlers["data"].findDataByNode("apiToggler","mypreferences");
  inputbar = document.getElementById("sqab_modalInput");
  inputbar.focus();
  loadingScreen = document.getElementById("sqab_loading-screen");
  suggestionsDropdown = document.getElementById("sqab_suggestions-dropdown");
  r.style.setProperty('--numOfTabs', tabsPane.length);
  showSuggestions();
  inputbar.placeholder = tabtypes[tabsPane[0].dataset.type]["placeholder"];
  currentSelectedTab = tabsPane[0].dataset.type;
  if(currentSelectedTab != 'shortcuts'){
    toggler.classList.remove('hide');
  }else{
    toggler.classList.add('hide');
  }
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
      if(tabtypes[currentSelectedTab]["toggler"]){
        toggler.classList.remove('hide');
      }else{
        toggler.classList.add('hide');
      }
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
  definePanels();
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
  panelHandler = await loadHandler(paneltypes[panelType].path + paneltypes[panelType].js);
  const slideOutMenu = document.getElementById('sqab_slide-out-menu');
  const slideOutMenuBody = document.getElementById('sqab_slide-out-menu-body');
  
  if (slideOutMenu.style.right === "0px") {
    closeSidePanel();
  }
  let html = await handlers["data"].loadPopHTML(paneltypes[panelType].path + paneltypes[panelType].html);
  slideOutMenuBody.innerHTML = html;
  slideOutMenu.style.right = '0px';

  panelHandler.init(handlers);
}

async function getRemoteData(type){
  let res = await handlers["connector"].search(type,handlers["data"].findDataByNode("apiToggler","mypreferences"));
  handlers["data"].setTempSearchData(type.replace(" ",""),res);
}

function initInput() {
  toggler.onclick = (e) =>{
    if(e.target.innerText == "API"){
      e.target.innerText = "Label";
    }else{
      e.target.innerText = "API";
    }
    handlers["save"].savePreferences(handlers,"apiToggler",e.target.innerText);
    getRemoteData(currentSelectedTab);
  }

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

function definePanels() {
  for(let panel of Object.keys(paneltypes)){
    let chosenPanel = document.getElementById(`sqab_${panel}_icon`);
    if (chosenPanel) {
      chosenPanel.onclick = () => openPanel(panel);
    }
  };
}

function defineOutsideAsCloseModal(){
  window.onclick = function(event) {
    let modal = document.getElementsByClassName("sqab_modal")[0];
    if (event.target ==  modal) {
      deleteModal();
    }
  }
}
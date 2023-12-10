
var r = document.querySelector(':root');
var modalOpened = false;
var suggestions = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
var tabsPane
var inputbar
var inputPlaceholders = {
"#00acee": {"placeholder":"Enter Shortcut Name","type":"shortcuts"},
"#FFB562": {"placeholder":"Enter Object Label","type":"objs"},
"#6BCB77": {"placeholder":"Enter Object Label","type":"listview"},
"#FF6B6B": {"placeholder":"add","type":"add"}
}
var handlers = {};
var initied = false;
var filteredSuggestions = [];
var selectedSuggestionIndex = 0;
var currentSelectedTab="shortcuts";
var savedShortcuts
var loadingScreen;
var savedObjs
var currentOrg = getURLminized()
var highlightColor = 'rgb(213 213 213 / 33%)';
var suggestionsDropdown;
init();

async function init(){
  chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if(modalOpened === false && message?.text == "Wake Up!"){
      startUp();   
      modalOpened = true;
    }
  });
  window.onkeydown = keyPress;
  await loadHandler("new-extension-popup", "popup");
  await loadHandler("handlers/navigation-handler", "navigation");
  await loadHandler("handlers/data-handler", "data");
  await loadHandler("handlers/save-handler", "save");
  await loadHandler("handlers/favorites-handler", "favorites");
  await loadHandler("handlers/suggestions-handler", "suggestions");
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
  // myDivHeader.textContent = "Open Shortcuts";
  myDiv.appendChild(myDivHeader);
  sfPageBody.appendChild(myDiv);
  myDiv.onclick = function() {
    if(modalOpened === false){
      startUp();   
      modalOpened = true;
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
    switch (modalOpened) {
        case true:
          if(evtobj.key === "Escape"){
            deleteModal();
          }
          if(evtobj.key === "Tab"){
            closeSidePanel();
            if(document.activeElement != inputbar){
              inputbar.focus();
              e.preventDefault();
              return;
            }
            selectedSuggestionIndex = 0;
            inputbar.value = '';
               // Find the index of the currently active tab
              let currentIndex = -1;
              for (let i = 0; i < tabsPane.length; i++) {
                if (tabsPane[i].classList.contains("active")) {
                  currentIndex = i;
                  break;
                }
              }
              // Calculate the index of the next tab to activate
              let nextIndex = (currentIndex + 1) % tabsPane.length;
              // Deactivate the current tab and activate the next one
              tabsPane[currentIndex].classList.remove("active");
              tabsPane[nextIndex].classList.add("active");
              // Trigger a click event on the next tab to update the UI
              tabsPane[nextIndex].click();
              currentSelectedTab = inputPlaceholders[tabsPane[nextIndex].dataset.color]["type"];
              suggestionsDropdown.style.display = "none";
              inputbar.focus();
            e.preventDefault();
          }
        break;
        case false:
            if (handlers["data"] != undefined && isHotkeyEnabled() && hotkeyDetector(evtobj)){
                startUp();   
                modalOpened = true;
                e.preventDefault();
            }
        break;
    }

}

async function loadHandler(handlerName, handlerKey){
  const src = chrome.runtime.getURL(`${handlerName}.js`);
  handlers[handlerKey] = await import(src);
}

function getURLminized(){
  let org = window.location.href.replace("https://","").substring(0,window.location.href.indexOf("."));
  return org.replace(org.substring(org.indexOf(".")),"");
}

async function startUp(){
  await handlers["data"].buildData();
  await handlers["data"].loadModalHTML();
  initModal();
}

function deleteModal(){
  const slideOutMenu = document.getElementById('slide-out-menu');
  if(slideOutMenu.style.right == "0px"){
    closeSidePanel();
    return;
  }
  findByClass("sqab_modal")[0].remove();
  modalOpened = false;
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
  if (inputValue != '') {
    filteredSuggestions = handlers["suggestions"].getSuggestions(handlers["data"].getShortcuts(currentSelectedTab),inputValue);
  }else{
    filteredSuggestions =  handlers["suggestions"].getFavoritesSuggestions(await handlers["favorites"].getFavorites(currentSelectedTab,handlers));
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
  const slideOutMenu = document.getElementById('slide-out-menu');
  slideOutMenu.style.right = '-430px'; /* Slide the menu back out */
  handlers["data"].doStartFromPopup(false);
}

async function initModal(){
  currentSelectedTab="shortcuts";
  defineSettingsIcon();
  defineOutsideAsCloseModal();
  //define elements
  const tabHeader = document.getElementsByClassName("sqab_tab-header")[0];
  const tabIndicator = document.getElementsByClassName("sqab_tab-indicator")[0];
  const tabBody = document.getElementsByClassName("sqab_tab-body")[0];
  tabsPane = tabHeader.getElementsByTagName("div");
  inputbar = document.getElementById("modalInput");
  inputbar.focus();
  loadingScreen = document.getElementById("loading-screen");
  suggestionsDropdown = document.getElementById("suggestions-dropdown");

  showSuggestions();
  inputbar.placeholder = inputPlaceholders[tabsPane[0].dataset.color]["placeholder"];
  currentSelectedTab = inputPlaceholders[tabsPane[0].dataset.color]["type"];
  tabIndicator.style.left = `calc(calc(100%/${tabsPane.length})*${0})`;
  r.style.setProperty('--indicatorcolor', tabsPane[0].dataset.color);
  for(let i=0; i < tabsPane.length; i++){
    tabsPane[i].onclick = async function(e){
      closeSidePanel();
      inputbar.value = "";
      tabHeader.getElementsByClassName("active")[0].classList.remove("active");
      tabsPane[i].classList.add("active");
      tabBody.getElementsByClassName("active")[0].classList.remove("active");
      if(tabsPane[i].innerText == 'ADD'){
        tabBody.getElementsByTagName("div")[1].classList.add("active");
        ADDpage();
      }else{
        tabBody.getElementsByTagName("div")[0].classList.add("active");
      }
      inputbar.placeholder = inputPlaceholders[tabsPane[i].dataset.color]["placeholder"];
      currentSelectedTab = inputPlaceholders[tabsPane[i].dataset.color]["type"];
      tabIndicator.style.left = `calc(calc(100%/${tabsPane.length})*${i})`;
      r.style.setProperty('--indicatorcolor', tabsPane[i].dataset.color);
      showSuggestions();
      inputbar.focus();
    }
  }
  initInput();
  initSuggesionsDropdown();
}

function selectedShortcut(){
  const myshortcut = filteredSuggestions[selectedSuggestionIndex];
  let shortcutResult;
  if(myshortcut){
    shortcutResult = myshortcut;
    handlers["favorites"].add2Favorites(currentSelectedTab,shortcutResult,handlers);
  }else{
    shortcutResult = inputbar.value;
  }
  handlers["navigation"].redirectShortcuts(currentSelectedTab,shortcutResult,handlers, handlers["data"].findDataByNode('linkOpenNewTab','mypreferences'));
  suggestionsDropdown.style.display = "none";
  selectedSuggestionIndex = 0;
  filteredSuggestions = [];
  deleteModal();
}

async function openSettings() {
  const slideOutMenu = document.getElementById('slide-out-menu');
  if(slideOutMenu.style.right == "0px"){
    closeSidePanel();
    return;
  }else{
    const slideOutMenuBody = document.getElementById('slide-out-menu-body');
    let html = await handlers["data"].loadPopHTML();
    slideOutMenuBody.innerHTML = html;
    slideOutMenu.style.right = '0px'; /* Slide out the menu */
    handlers["popup"].init(handlers);
  }
}

function initInput(){
  inputbar.oninput = async function() {
    const inputValue = inputbar.value.toLowerCase();
    showSuggestions(inputValue);
  };

  inputbar.onkeydown = async function(event) {
    const isArrowDown = event.key === "ArrowDown";
    const isArrowUp = event.key === "ArrowUp";
    const isEnter = event.key === "Enter";
    const isEscape = event.key === "Escape";
    if (isArrowDown || isArrowUp) {
      // Remove highlight from previously selected suggestion
      if (selectedSuggestionIndex >= 0) {
        suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = "";
      }

      // Update selected suggestion index
      selectedSuggestionIndex = Math.max(0, Math.min(selectedSuggestionIndex + (isArrowDown ? 1 : -1), filteredSuggestions.length - 1));

      // Highlight selected suggestion and scroll into view
      suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = highlightColor;
      suggestionsDropdown.children[selectedSuggestionIndex].scrollIntoView({ behavior: "smooth", block: "nearest" });

      event.preventDefault();
    } else if (isEnter) {
      selectedShortcut();
      event.preventDefault();
    } else if (isEscape) {
      deleteModal();
      event.preventDefault();
    }
  }
}

function initSuggesionsDropdown(){
  suggestionsDropdown.onmouseover = function(event) {
    // Remove highlight from previously selected suggestion
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

function defineSettingsIcon(){
  let icon = document.getElementById("settingsIcon");
  icon.onclick = openSettings;
}

function defineOutsideAsCloseModal(){
  window.onclick = function(event) {
    let modal = document.getElementsByClassName("sqab_modal")[0];
    if (event.target ==  modal) {
      deleteModal();
    }
  }
}

function ADDpage(){
  suggestionsDropdown.innerHTML = "";
  const alertbox = document.getElementById("alert-box");
  alertbox.classList.remove("show");
  const addsection = document.getElementById("sqab_add_section")
  addsection.classList.remove("hide");
  const objOption = document.getElementById("option2");
  const shortcutOption = document.getElementById("option1"); 
  const addlabel = document.getElementById("add_label_input"); 
  const rowElement = addlabel.parentNode;
  rowElement.style.display = 'flex';
  const targetList = document.getElementById("targetList");
  let type = "shortcuts";

  inputbar.value = window.location.href.substring(window.location.href.indexOf("com")+3);
  if(inputbar.value.includes("/setup/ObjectManager/") && !inputbar.value.includes("/ObjectManager/home") ){
    const try2findDetailTable = findByClass("object-detail-column")[0];
    inputbar.value= try2findDetailTable.getElementsByTagName("ul")[0].getElementsByClassName("slds-form-element__static")[0].innerText;
    objOption.checked = true;
  }else{
    shortcutOption.checked = true;
    let possibleLabel = inputbar.value.split('/');
    addlabel.value = possibleLabel[possibleLabel.length -1];
  }

  let orgOptions = handlers["data"].getDataFromLibrary("myorgs");
  let data = '<option>All Orgs</option>';
  orgOptions.forEach(org => {
    data+=  `<option>${org.name}</option>`;
  });
  if(!handlers["data"].orgExists.bool){
    data+=  `<option>${handlers["data"].orgExists.name}</option>`;
  }
  targetList.innerHTML = data;

  objOption.onclick = function(e) {
    type = "objs";
    inputbar.placeholder = 'Enter Object API Name';
    if(inputbar.value.includes("__c")){
      let obgInUrl = inputbar.value.split("/").filter(element => element.includes("__c"));
      inputbar.value = obgInUrl;
    }else{
      inputbar.value = '';
    }
    rowElement.style.display = 'none';
  }

  shortcutOption.onclick = function(e) {
    rowElement.style.display = 'flex';
    inputbar.value = window.location.href.substring(window.location.href.indexOf("com")+3);
    addlabel.placeholder = "Enter Label";
    type = "shortcuts";
  }

  let addSave = document.getElementById("sqab_addSave"); 
  addSave.onclick = async function(e) {
    loading_Start();
    let result = await handlers["save"].save(handlers,inputbar.value,addlabel.value,document.getElementById("targetList").value,type);
    alertbox.classList.remove("success");
    alertbox.classList.remove("error");
    if(result.success){
      alertbox.classList.add("success");
    }else{
      alertbox.classList.add("error");
    }
    alertbox.classList.add("show");
    alertbox.innerText = result.message;
    addsection.classList.add("hide");
    inputbar.value = "";
    loading_End();
  }
}
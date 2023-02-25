
var r = document.querySelector(':root');
var modalOpened = false;
var suggestions = ["apple", "banana", "cherry", "date", "elderberry", "fig", "grape", "honeydew"];
var tabHeader
var tabIndicator
var tabBody
var tabsPane
var inputbar
var inputPlaceholders
var dataHandler;
var saveHandler;
var popupHandler;
var navigationHandler;
var suggestionHandler;
var currentSelectedTab="shortcuts";
var savedShortcuts
var loadingScreen;
var savedObjs
var currentOrg = getURLminized()
var highlightColor = 'lightgray';
init();
window.addEventListener("keydown",keyPress);
var currentSettings = {
    linkOpenNewTab:true,
    alwaysShowCustoms:true,
    HotKey: {code:81 ,name:"q"}
};
async function init(){
  await loadNavigation();
  await loadData();
  await loadSuggestions();
  await loadSaver();
}

function getURLminized(){
  let org = window.location.href.replace("https://","").substring(0,window.location.href.indexOf("."));
  return org.replace(org.substring(org.indexOf(".")),"");
}

async function loadData(){
  const src = chrome.runtime.getURL("./data-handler.js");
  dataHandler = await import(src);
}
async function loadSuggestions(){
  const src = chrome.runtime.getURL("./save-handler.js");
  saveHandler = await import(src);
}
async function loadSaver(){
  const src = chrome.runtime.getURL("./suggestions-handler.js");
  suggestionHandler = await import(src);
}
async function loadNavigation(){
  const src = chrome.runtime.getURL("./navigation-handler.js");
  navigationHandler = await import(src);
}
async function loadNavigation(){
  const src = chrome.runtime.getURL("./extension-popup.js");
  popupHandler = await import(src);
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
              const suggestionsDropdown = document.getElementById("suggestions-dropdown");
              suggestionsDropdown.style.display = "none";
              inputbar.focus();
            e.preventDefault();
          }
        break;
        case false:
            if (dataHandler != undefined && evtobj.keyCode == currentSettings.HotKey.code && (evtobj.ctrlKey || evtobj.metaKey)){
                startUp();   
                modalOpened = true;
                e.preventDefault();
            }
        break;
    }

}

async function startUp(){
  await dataHandler.loadModalIndex();
  initModal();
}

function deleteModal(){
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
function loading_End(){
  loadingScreen.style.display = "none";
}

function closeSidePanel(){
  const slideOutMenu = document.getElementById('slide-out-menu');
  slideOutMenu.style.right = '-430px'; /* Slide the menu back out */
}

function initModal(){
  let icon = document.getElementById("icon");
  let closebtn = document.getElementsByClassName("close-btn")[0];
  closebtn.onclick = closeSidePanel;
  icon.src = chrome.runtime.getURL("/resources/gear.png");
  icon.onclick = redirectTab;
  window.onclick = function(event) {
    let modal =document.getElementsByClassName("sqab_modal")[0];
    if (event.target ==  modal) {
      deleteModal();
    }
  }
  tabHeader = document.getElementsByClassName("sqab_tab-header")[0];
  tabIndicator = document.getElementsByClassName("sqab_tab-indicator")[0];
  tabBody = document.getElementsByClassName("sqab_tab-body")[0];
  tabsPane = tabHeader.getElementsByTagName("div");
  inputbar = document.getElementById("yayinput");
  inputbar.focus();
  loadingScreen = document.getElementById("loading-screen");
  inputPlaceholders = {     "#00acee": {"placeholder":"Enter Shortcut Name","type":"shortcuts"},
                            "#FFB562": {"placeholder":"Enter Object Label","type":"objs"},
                            "#6BCB77": {"placeholder":"Enter Object Label","type":"listview"},
                            "#FF6B6B": {"placeholder":"add","type":"add"}
                      }
  const searchInput = document.getElementById("yayinput");
  const suggestionsDropdown = document.getElementById("suggestions-dropdown");
  var filteredSuggestions = [];
  var selectedSuggestionIndex = 0;
  for(let i=0; i < tabsPane.length; i++){
    tabsPane[i].addEventListener("click",function(e){
      inputbar.value = "";
      tabHeader.getElementsByClassName("active")[0].classList.remove("active");
      tabsPane[i].classList.add("active");
      tabBody.getElementsByClassName("active")[0].classList.remove("active");
      console.log("tabsPane[i].innerText",tabsPane[i].innerText);
      if(tabsPane[i].innerText == 'ADD'){
        document.getElementById("alert-box").classList.remove("show");
        document.getElementById("sqab_add_section").classList.remove("hide");
          inputbar.value = window.location.href.substring(window.location.href.indexOf("com")+3);
          if(inputbar.value.includes("/setup/ObjectManager/")){
            const try2findDetailTable = findByClass("object-detail-column")[0];
            inputbar.value= try2findDetailTable.getElementsByTagName("ul")[0].getElementsByClassName("slds-form-element__static")[0].innerText;
            document.getElementById("option2").checked = true;
          }else{
            document.getElementById("option1").checked = true;
          }
          tabBody.getElementsByTagName("div")[1].classList.add("active");
          let targetList = document.getElementById("targetList");
          // targetList.innerHTML = '';
          let orgOptions = dataHandler.getDataFromLibrary("myorgs");
          console.log("orgOptions",orgOptions);
          let data = '<option>All Orgs</option>';
          orgOptions.forEach(org => {
            data+=  `<option>${org.name}</option>`;
          });
          targetList.innerHTML = data;
          let objOption = document.getElementById("option2");
          let shortcutOption = document.getElementById("option1"); 
          let addSave = document.getElementById("addSave"); 
          let type = "shortcuts";
          objOption.addEventListener("click",function(e){
            if(inputbar.value.includes("__c")){
              let obgInUrl = inputbar.value.split("/").filter(element => element.includes("__c"));
              inputbar.value = obgInUrl;
              document.getElementById("yaylabel").placeholder = obgInUrl;
            }
            document.getElementById("yaylabel").disabled =true;
            type = "objs";
          })
        shortcutOption.addEventListener("click",function(e){
          inputbar.value = window.location.href.substring(window.location.href.indexOf("com")+3);
          document.getElementById("yaylabel").placeholder = "Enter Label";
          document.getElementById("yaylabel").disabled =false;
          type = "shortcuts";
        })
        addSave.addEventListener("click", async function(e){
          loading_Start();
          await saveHandler.save(dataHandler,inputbar.value,document.getElementById("yaylabel").value,document.getElementById("targetList").value,type);
          await loadData();
          document.getElementById("alert-box").classList.add("show");
          document.getElementById("sqab_add_section").classList.add("hide");
          inputbar.value = "";
          loading_End();
        })  
      }else{
          tabBody.getElementsByTagName("div")[0].classList.add("active");
      }
      inputbar.placeholder = inputPlaceholders[tabsPane[i].dataset.color]["placeholder"];
      currentSelectedTab = inputPlaceholders[tabsPane[i].dataset.color]["type"];
      tabIndicator.style.left = `calc(calc(100%/${tabsPane.length})*${i})`;
      r.style.setProperty('--indicatorcolor', tabsPane[i].dataset.color);
    })
  }

  searchInput.addEventListener("input", function(event) {
    const inputValue = searchInput.value.toLowerCase();
    // filteredSuggestions = suggestions.filter(suggestion => suggestion.toLowerCase().includes(inputValue));
    if (inputValue != '') {
      filteredSuggestions = suggestionHandler.getSuggestions(dataHandler.getShortcuts(currentSelectedTab),inputValue);
      console.log("filteredSuggestions?.length",filteredSuggestions?.length);
      if(filteredSuggestions?.length != 0){
        suggestionsDropdown.style.display = "contents";
        suggestionsDropdown.innerHTML = "";
        const suggestionsHTML = suggestionHandler.buildSuggestionsHTML(filteredSuggestions, inputValue);
        console.log("suggestionsHTML",suggestionsHTML);
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

    } else {
      selectedSuggestionIndex = 0;
      suggestionsDropdown.style.display = "none";
    }
  });

  searchInput.addEventListener("keydown", function(event) {

    if (filteredSuggestions.length > 0) {
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
  });
  

  suggestionsDropdown.addEventListener("mouseover", function(event) {
    // Remove highlight from previously selected suggestion
    if (selectedSuggestionIndex >= 0) {
      suggestionsDropdown.children[selectedSuggestionIndex].style.backgroundColor = "";
    }
    selectedSuggestionIndex = Array.from(suggestionsDropdown.children).indexOf(event.target);
    event.target.style.backgroundColor = highlightColor;
  });

  suggestionsDropdown.addEventListener("click", function(event) {
    selectedShortcut();
  });

  function selectedShortcut(){
    // searchInput.value = filteredSuggestions[selectedSuggestionIndex];
    navigationHandler.redirectShortcuts(currentSelectedTab,filteredSuggestions[selectedSuggestionIndex],dataHandler,currentSettings);
    suggestionsDropdown.style.display = "none";
    selectedSuggestionIndex = 0;
    filteredSuggestions = [];
    deleteModal();
  }

  async function redirectTab() {
    const slideOutMenu = document.getElementById('slide-out-menu');
    if(slideOutMenu.style.right == "0px"){
      closeSidePanel();
      return;
    }else{
      const slideOutMenuBody = document.getElementById('slide-out-menu-body');
      let html = await dataHandler.loadModalIndex2();
      slideOutMenuBody.innerHTML = html;
      slideOutMenu.style.right = '0px'; /* Slide out the menu */
      popupHandler.initYay();
    }
  }

}
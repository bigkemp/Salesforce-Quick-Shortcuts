
injectbtns();


function injectbtns() {
    if(!window.location.href.substring(window.location.href.indexOf("com")+3).includes("setup/ObjectManager")) {
      return;
    }
    let findBar = document.querySelector(".bRight");
    console.log('findBar',findBar);
    if(findBar == null){
      observer2Addbtn.observe(document.body, { childList: true, subtree: true });
      return;
    }
    observer4ObjectsTable.observe(document.body, { childList: true, subtree: true });
    const newBtn = document.createElement('button');
    newBtn.innerText = "Add to Quick Access Bar";
    newBtn.id = "sfqab_Btn";
    newBtn.classList.add("setup-header-element-right")
    newBtn.onclick = addShortcutsBtn;
    findBar.insertBefore(newBtn,findBar.firstChild);
  }


  const observer2Addbtn = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      const bar = document.querySelector(".bRight");
      if (bar != null && !initied) {
        injectbtns();
        observer2Addbtn.disconnect();
        initied= true;
        return;
      }
    });
  });
  
  const observer4ObjectsTable = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if(document.getElementsByTagName("tbody") != undefined){
        checkWhatShortcutsAlreadyExists();
      }
    });
  });


  function checkWhatShortcutsAlreadyExists(){
    let myTable = document.getElementsByTagName("tbody");
    let possibleShortcuts = myTable[0].getElementsByTagName("tr");
    for (const possibleShortcut of possibleShortcuts) {
      let tdOfObj = possibleShortcut.getElementsByTagName("td")[0];
      let objnode = tdOfObj.innerText;
      if(tdOfObj.style.color != "green"){
        if(handlers["data"].getDataFromLibrary("myobjs").filter(obj => obj.value == objnode).length > 0){
          tdOfObj.style.color= "lightgreen";
        }else{
          tdOfObj.style.color= "red";
        }
      }
    }
  }
  
  function addShortcutsBtn(){
    let myTable = document.getElementsByTagName("tbody");
    let possibleShortcuts = myTable[0].getElementsByTagName("tr");
    for (const possibleShortcut of possibleShortcuts) {
      let possibleAPI = possibleShortcut.getElementsByTagName("td")[0];
      let result = handlers["save"].save(handlers,possibleAPI.innerText,possibleAPI.innerText,"All Orgs","objs");
    }
    checkWhatShortcutsAlreadyExists();
  }
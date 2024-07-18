export async function init(importedhandlers){
    handlers = importedhandlers
    const inputbar = document.getElementById("sqab_p_add_modalInput");
    inputbar.value = window.location.href.substring(window.location.href.indexOf("com")+3);
    const addlabel = document.getElementById("sqab_p_add_add_label_input"); 
    let possibleLabel = inputbar.value.split('/');
    addlabel.value = possibleLabel[possibleLabel.length -1];
    const targetList = document.getElementById("sqab_p_add_targetList");
    
    let orgOptions = handlers["data"].getDataFromLibrary("myorgs");
    let data = '<option>All Orgs</option>';
    orgOptions.forEach(org => {
      data+=  `<option>${org.name}</option>`;
    });
    if(!handlers["data"].orgExists.bool){
      data+=  `<option>${handlers["data"].orgExists.name}</option>`;
    }
    targetList.innerHTML = data;
  
  
    let addSave = document.getElementById("sqab_p_add_addSave"); 
    addSave.onclick = async function(e) {
      let result = await handlers["save"].save(handlers,inputbar.value,addlabel.value,targetList.value,"shortcuts");
      alert(result.message);
    }
}

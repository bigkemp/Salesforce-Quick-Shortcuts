export function save(dataHandler,value,label,targetorg,type){
    let record = {};
    record["org"] = targetorg == "All Orgs" ? undefined : [targetorg];
    record["name"] = type == "objs" ? value : label ;
    record["value"] = value;
    if(!dataHandler.orgExists.value){
        let orgRecord = {};
        orgRecord["name"] = dataHandler.orgExists.name;
        orgRecord["value"] = dataHandler.orgExists.value;
        dataHandler.saveData(orgRecord,"myorgs");
        dataHandler.orgExists.value = true;
    }
    console.log("record",record);
    // myMemory.push(record);
    dataHandler.saveData(record,"my"+type);
}
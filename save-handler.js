export function save(dataHandler,value,label,targetorg,type){
    let record = {};
    record["org"] = targetorg == "All Orgs" ? undefined : [targetorg];
    record["name"] = type == "objs" ? value : label ;
    record["value"] = value;
    if(!dataHandler.orgExists && targetorg != "All Orgs"){
        let orgRecord = {};
        orgRecord["name"] = targetorg;
        orgRecord["value"] = targetorg;
        dataHandler.saveData(orgRecord,"myorgs");
    }
    console.log("record",record);
    // myMemory.push(record);
    dataHandler.saveData(record,"my"+type);
}
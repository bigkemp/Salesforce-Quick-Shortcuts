export async function save(handlers,value,label,targetorg,type){
    let record = {};
    record["org"] = targetorg == "All Orgs" ? undefined : [targetorg];
    record["name"] = type == "objs" ? value : label ;
    record["value"] = value;
    if(!handlers["data"].orgExists.value){
        let orgRecord = {};
        orgRecord["name"] = handlers["data"].orgExists.name;
        orgRecord["value"] = handlers["data"].orgExists.value;
        await handlers["data"].saveData(orgRecord,"myorgs");
        handlers["data"].orgExists.value = true;
    }
    console.log("record",record);
    if(handlers["data"].checkIfExists(record,"my"+type)){
        return {success:false, message: "Already Exists"};
    }else{
        await handlers["data"].saveData(record,"my"+type);
        return {success:true, message: "Save was successful"};
    }
}



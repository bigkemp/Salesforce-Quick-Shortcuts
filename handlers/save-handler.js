
export async function save(handlers,value,label,targetorg,type){ // only modal
    let record = {};
    record["org"] = targetorg == "All Orgs" ? undefined : [targetorg];
    record["name"] = type == "objs" ? value : label ;
    record["value"] = value;
    record["custom"] = true;
    if(saveValidations(handlers,record,type)){
        return {success:false, message: "Already Exists"};
    }else{
        await checkOrg(handlers);
        await handlers["data"].saveData(record,type);
        return {success:true, message: "Save was successful"};
    }
}

export async function edit(handlers,record,oldrecord,type){ // only pop
    let targetData = handlers["data"].getDataFromLibrary(type);
    const index = targetData.findIndex(obj => obj.name === oldrecord.name);
    if (index !== -1) {
        targetData.splice(index, 1, record);
        await handlers["data"].saveData(null,type);
        await postProcessingOfSuccessfulEdit(handlers,record,oldrecord,type);
        return {success:true, message: "Save was successful"};
    }else{
        return {success:false, message: "Didnt find record to edit."};
    }
}


async function  postProcessingOfSuccessfulEdit(handlers,record,oldrecord,type){
    if(type == "myorgs"){
        let affectedDataTypes = ["myobjs","myshortcuts"];
        for (const affectedDataType of affectedDataTypes) {
            let need2Save = false;
            for (const data of handlers["data"].getDataFromLibrary(affectedDataType)) {
                if(data.org != undefined && data.org.includes(oldrecord.name)){
                    data.org.splice(data.org.indexOf(oldrecord.name), 1, record.name);
                    need2Save = true;
                }
            }
            if(need2Save){
                await handlers["data"].saveData(null,type);
                need2Save = false;
            }
        }
    }
}

function saveValidations(handlers,record,type) {
    return handlers["data"].checkIfExists(record,"my"+type);
}

async function checkOrg(handlers){
    if(!handlers["data"].orgExists.value){
        await handlers["data"].saveData(null,"myorgs");
    }
}
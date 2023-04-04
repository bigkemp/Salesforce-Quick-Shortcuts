
export async function save(handlers,value,label,targetorg,type){ // only modal
    let record = {};
    record["org"] = targetorg == "All Orgs" ? undefined : [targetorg];
    record["name"] = type == "objs" ? value : label ;
    record["value"] = value;
    record["custom"] = true;
    if(saveValidations(handlers,record,type)){
        return {success:false, message: "Already Exists"};
    }else{
        await saveDataOrgs(handlers);
        await handlers["data"].saveDataByAdd(record,type);
        return {success:true, message: "Save was successful"};
    }
}

export async function savePreferences(handlers,type,value){ // only popup
    let myprefrences = handlers["data"].getDataFromLibrary("mypreferences");
    myprefrences[type] = value;
    console.log('savePreferences',myprefrences);
    await handlers["data"].overrideManualData('mypreferences',myprefrences);
}

export async function edit(handlers,record,oldrecord,type){ // only pop
    let targetData = handlers["data"].getDataFromLibrary(type);
    const index = targetData.findIndex(obj => obj.name === oldrecord.name);
    if (index !== -1) {
        await handlers["data"].saveDataByReplace(index,record,type);
        return {success:true, message: "Edit was successful"};
    }else{
        return {success:false, message: "Didnt find record to edit."};
    }
}

export async function remove(handlers,label,type){ // only pop
    console.log('remove!!!');
    await handlers["data"].deleteData(label,type,'name');
    await postProcessingOfSuccessfulEdit(handlers,undefined,{name: label},type);
    return {success:true, message: "Delete was successful"};
}


async function  postProcessingOfSuccessfulEdit(handlers,record,oldrecord,type){
    if(type == "myorgs"){
        console.log('postProcessingOfSuccessfulEdit');
        let affectedDataTypes = ["myobjs","myshortcuts"];
        for (const affectedDataType of affectedDataTypes) {
            let need2Save = false;
            let datatype = handlers["data"].getDataFromLibrary(affectedDataType);
            for (const data of datatype) {
                if(data.org != undefined && data.org.includes(oldrecord.name) && record == undefined){
                    data.org.splice(data.org.indexOf(oldrecord.name), 1);
                    if(data.org.length == 0){
                        data.org = undefined;
                    }
                    need2Save = true;
                }
            }
            if(need2Save){
                handlers["data"].overrideManualData(affectedDataType,datatype);
                need2Save = false;
            }
        }
    }
}

function saveValidations(handlers,record,type) {
    return handlers["data"].checkIfExists(record,"my"+type);
}

async function saveDataOrgs(handlers){
    if(!handlers["data"].orgExists.bool){
        await handlers["data"].saveDataByAdd({name:handlers["data"].orgExists.name, value:handlers["data"].orgExists.value},"myorgs");
    }
}
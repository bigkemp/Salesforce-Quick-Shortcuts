
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
    await handlers["data"].overrideManualData('mypreferences',myprefrences);
}

export async function edit(handlers,record,oldrecord,type){ // only pop
    console.log('old',oldrecord);
    console.log('new',record);
    let targetData = handlers["data"].getDataFromLibrary(type);
    console.log('targetData',targetData);
    const index = targetData.findIndex(obj => obj.name === oldrecord.name);
    if (index !== -1) {
        console.log(JSON.stringify(targetData[index]));
        await handlers["data"].saveDataByReplace(index,record,type);
        await postProcessingOfSuccessfulEdit(handlers,record,oldrecord,type);
        return {success:true, message: "Edit was successful"};
    }else{
        return {success:false, message: "Didnt find record to edit."};
    }
}

export async function remove(handlers,name,type){ // only pop
    console.log('remove name');
    console.log('remove type');
    await handlers["data"].deleteData(name,type,'name');
    await postProcessingOfSuccessfulEdit(handlers,undefined,{name: name},type);
    return {success:true, message: "Delete was successful"};
}


async function  postProcessingOfSuccessfulEdit(handlers,record,oldrecord,type){

    if(type !== "myorgs"){return}
    let affectedDataTypes = ["myshortcuts"];
    let need2Save = false;
    for (const affectedDataType of affectedDataTypes) {
        let datatype = handlers["data"].getDataFromLibrary(affectedDataType);
        for (const data of datatype) {
            if(data.org != undefined && data.org.includes(oldrecord.name)){
                if(record != undefined){
                    console.log(data.org[data.org.indexOf(oldrecord.name)] );
                    data.org[data.org.indexOf(oldrecord.name)] = record.name ;
                }else{
                    data.org.splice(data.org.indexOf(oldrecord.name), 1);
                    if(data.org.length == 0){
                        data.org = undefined;
                    }
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

function saveValidations(handlers,record,type) {
    return handlers["data"].checkIfExists(record,"my"+type);
}

async function saveDataOrgs(handlers){
    if(!handlers["data"].orgExists.bool){
        await handlers["data"].saveDataByAdd({name:handlers["data"].orgExists.name, value:handlers["data"].orgExists.value},"myorgs");
    }
}
var instanceHostname;
var sessionId;
const apiVer = '52.0';

init();
function init(){
    if (location.host.endsWith("my.salesforce.com") || location.host.endsWith("lightning.force.com") || location.host.endsWith("visualforce.com")) {
        chrome.runtime.sendMessage({message: "getSfHost", url: location.href}, sfHost => {
          if (sfHost) {
            getSession(sfHost);
          }
        });
      }
}

function convertCustomMetadata2ResponseToMap(response) {
    const defaults = [];
    const urls = {};

    if (response && response.records) {
        response.records.forEach(record => {
            const MetadataDefinitionId = record.DurableId;
            const masterLabel = record.NamespacePrefix != null ? record.NamespacePrefix+' ' : '' + record.DeveloperName;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/CustomMetadata/page?address=%2F${MetadataDefinitionId}%3Fsetupid%3DCustomMetadata`;
            }
        });
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}

function convertFlow2ResponseToMap(response) {
    const defaults = [];
    const urls = {};

    if (response && response.records) {
        response.records.forEach(record => {
            const flowDefinitionId = record.Id;
            const masterLabel = record.ActiveVersion.MasterLabel;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/Flows/page?address=%2F${flowDefinitionId}%3FretUrl%3D%2Flightning%2Fsetup%2FFlows%2Fhome`;
            }
        });
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}

function convertUser2ResponseToMap(response) {
    const defaults = [];
    const urls = {};

    if (response && response.records) {
        response.records.forEach(record => {
            const userDefinitionId = record.Id;
            const masterLabel = record.Name;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/ManageUsers/page?address=%2F${userDefinitionId}%3Fnoredirect%3D1%26isUserEntityOverride%3D1`;
            }
        });
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}

function convertProfiles2ResponseToMap(response) {
    const defaults = [];
    const urls = {};

    if (response && response.records) {
        response.records.forEach(record => {
            const profileDefinitionId = record.Id;
            const masterLabel = record.Name;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/EnhancedProfiles/page?address=%2F${profileDefinitionId}`;
            }
        });
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}

function convertObj2ResponseToMap(response,type,togglerValue) {
    const defaults = [];
    const urls = {};
    console.log('togglerValue',togglerValue);
    if (response && response.records) {
      if(type == 'objs'){
        response.records.forEach(record => {
          const objectId = record.DurableId ;
          const masterLabel = togglerValue == "API" ? record.QualifiedApiName : record.MasterLabel;
          defaults.push({name: masterLabel});
          if (masterLabel) {
            urls[masterLabel.replaceAll(" ","-")] = objectId;
          }
        });
      }
      else{ //listview
        response.records.forEach(record => {
          const masterLabel = togglerValue == "API" ? record.QualifiedApiName : record.MasterLabel;
          defaults.push({name: masterLabel});
          if (masterLabel) {
            urls[masterLabel.replaceAll(" ","-")] = masterLabel;
          }
        });
      }
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}



 async function search_flows() {
    let query = `SELECT Id,ActiveVersion.MasterLabel FROM FlowDefinition WHERE ActiveVersion.ProcessType != null AND ActiveVersion.ProcessType != 'Workflow' `;
    let res = await rest("/services/data/v"+apiVer+"/tooling/query/?q=" + encodeURIComponent(query));
    return convertFlow2ResponseToMap(res);
 }

 async function search_users() {
    let query = `select Id,Name,Email FROM User`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertUser2ResponseToMap(res);
 }

 async function search_metadatas() {
    let query = `SELECT DurableId, DeveloperName, NamespacePrefix FROM EntityDefinition WHERE IsCustomSetting=false AND IsCustomizable=true AND QualifiedApiName LIKE '%__mdt'`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertCustomMetadata2ResponseToMap(res);
 }

 async function search_profiles() {
    let query = `SELECT Id, Name FROM Profile`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertProfiles2ResponseToMap(res);
 }

 async function search_monitors() {
    let res = await rest("/services/data/v"+apiVer+"/limits/");
    return res;
 }

 async function search_objects(type,togglerValue) {
    let query = `SELECT DurableId ,QualifiedApiName, MasterLabel FROM EntityDefinition WHERE IsCustomizable = true AND (NOT QualifiedApiName LIKE '%__mdt') `;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertObj2ResponseToMap(res,type,togglerValue);
 }


  async function getSession(sfHost) {

    let message = await new Promise(resolve => chrome.runtime.sendMessage({message: "getSession", sfHost}, resolve));
    if (message) {
      instanceHostname = message.hostname;
      sessionId = message.key;
    }
  }

  async function rest(url, {logErrors = true, body = undefined} = {}) {
    try {
      if (!instanceHostname || !sessionId) {
        throw new Error("Session not found");
      }
      let method = "GET";
      let xhr = new XMLHttpRequest();
      url += (url.includes("?") ? "&" : "?") + "cache=" + Math.random();
      xhr.open(method, "https://" + instanceHostname + url, true);
      if (body !== undefined) {
        body = JSON.stringify(body);
        method = "POST";
        xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
      }
      xhr.setRequestHeader("Accept", "application/json; charset=UTF-8");
      xhr.setRequestHeader("Authorization", "Bearer " + sessionId);
      xhr.responseType = "json";
      await new Promise((resolve, reject) => {
        xhr.onreadystatechange = () => {
          if (xhr.readyState == 4) {
            resolve();
          }
        };
        xhr.send(body);
      });

      if (xhr.status >= 200 && xhr.status < 300) {
        return xhr.response;
      }else{
        throw 'calling failed';
      }
    } catch (error) {
      throw error;
    }
  }

//TODO: need to support more then 2k records (next url from response)

  export async function search(type,togglerValue){
    switch (type) {
      case "flows":
        return await search_flows(togglerValue);
      case "users":
        return await search_users();
      case "profiles":
        return await search_profiles();
      case "metadatas":
        return await search_metadatas(togglerValue);
      case "objs":
        return await search_objects(type,togglerValue);
      case "listviews":
        return await search_objects(type,togglerValue);
      case "monitoring":
        return await search_monitors();
    }
  }


// var instanceHostname;
// var sessionId;
// const apiVer = '52.0';

// init();

// function init() {
//   const hosts = ["my.salesforce.com", "lightning.force.com", "visualforce.com"];
//   if (hosts.some(host => location.host.endsWith(host))) {
//     chrome.runtime.sendMessage({ message: "getSfHost", url: location.href }, sfHost => {
//       if (sfHost) {
//         getSession(sfHost);
//       }
//     });
//   }
// }

// function convertResponseToMap(response, { idField, labelField, urlTemplate }) {
//   const defaults = [];
//   const urls = {};

//   if (response && response.records) {
//     response.records.forEach(record => {
//       const id = record[idField];
//       const masterLabel = record[labelField];
//       defaults.push({ name: masterLabel });
//       if (masterLabel) {
//         urls[masterLabel.replaceAll(" ", "-")] = urlTemplate(id);
//       }
//     });
//   }

//   return { defaults, urls };
// }

// const responseMapConfig = {
//   customMetadata: {
//     idField: 'DurableId',
//     labelField: (record) => record.NamespacePrefix ? `${record.NamespacePrefix} ${record.DeveloperName}` : record.DeveloperName,
//     urlTemplate: (id) => `/lightning/setup/CustomMetadata/page?address=%2F${id}%3Fsetupid%3DCustomMetadata`
//   },
//   flows: {
//     idField: 'Id',
//     labelField: 'ActiveVersion.MasterLabel',
//     urlTemplate: (id) => `/lightning/setup/Flows/page?address=%2F${id}%3FretUrl%3D%2Flightning%2Fsetup%2FFlows%2Fhome`
//   },
//   users: {
//     idField: 'Id',
//     labelField: 'Name',
//     urlTemplate: (id) => `/lightning/setup/ManageUsers/page?address=%2F${id}%3Fnoredirect%3D1%26isUserEntityOverride%3D1`
//   },
//   profiles: {
//     idField: 'Id',
//     labelField: 'Name',
//     urlTemplate: (id) => `/lightning/setup/EnhancedProfiles/page?address=%2F${id}`
//   },
//   objs: {
//     idField: 'DurableId',
//     labelField: 'QualifiedApiName',
//     urlTemplate: (id) => id
//   },
//   listviews: {
//     idField: 'QualifiedApiName',
//     labelField: 'QualifiedApiName',
//     urlTemplate: (label) => label
//   }
// };

// async function search(query, type) {
//   const res = await rest(`/services/data/v${apiVer}/query/?q=${encodeURIComponent(query)}`);
//   return convertResponseToMap(res, responseMapConfig[type]);
// }

// async function searchFlows() {
//   const query = `SELECT Id, ActiveVersion.MasterLabel FROM FlowDefinition WHERE ActiveVersion.ProcessType != null AND ActiveVersion.ProcessType != 'Workflow'`;
//   return search(query, 'flows');
// }

// async function searchUsers() {
//   const query = `SELECT Id, Name, Email FROM User`;
//   return search(query, 'users');
// }

// async function searchMetadatas() {
//   const query = `SELECT DurableId, DeveloperName, NamespacePrefix FROM EntityDefinition WHERE IsCustomSetting=false AND IsCustomizable=true AND QualifiedApiName LIKE '%__mdt'`;
//   return search(query, 'customMetadata');
// }

// async function searchProfiles() {
//   const query = `SELECT Id, Name FROM Profile`;
//   return search(query, 'profiles');
// }

// async function searchMonitors() {
//   const res = await rest(`/services/data/v${apiVer}/limits/`);
//   return res;
// }

// async function searchObjects(type) {
//   const query = `SELECT DurableId, QualifiedApiName FROM EntityDefinition WHERE IsCustomizable = true AND (NOT QualifiedApiName LIKE '%__mdt')`;
//   return search(query, type);
// }

// async function getSession(sfHost) {
//   const message = await new Promise(resolve => chrome.runtime.sendMessage({ message: "getSession", sfHost }, resolve));
//   if (message) {
//     instanceHostname = message.hostname;
//     sessionId = message.key;
//   }
// }

// async function rest(url, { logErrors = true, body = undefined } = {}) {
//   try {
//     if (!instanceHostname || !sessionId) {
//       throw new Error("Session not found");
//     }
//     let method = "GET";
//     let xhr = new XMLHttpRequest();
//     url += (url.includes("?") ? "&" : "?") + "cache=" + Math.random();
//     xhr.open(method, `https://${instanceHostname}${url}`, true);
//     if (body !== undefined) {
//       body = JSON.stringify(body);
//       method = "POST";
//       xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
//     }
//     xhr.setRequestHeader("Accept", "application/json; charset=UTF-8");
//     xhr.setRequestHeader("Authorization", `Bearer ${sessionId}`);
//     xhr.responseType = "json";
//     await new Promise((resolve, reject) => {
//       xhr.onreadystatechange = () => {
//         if (xhr.readyState == 4) {
//           resolve();
//         }
//       };
//       xhr.send(body);
//     });

//     if (xhr.status >= 200 && xhr.status < 300) {
//       return xhr.response;
//     } else {
//       throw 'calling failed';
//     }
//   } catch (error) {
//     throw error;
//   }
// }

// export async function search(type) {
//   switch (type) {
//     case "flows":
//       return await searchFlows();
//     case "users":
//       return await searchUsers();
//     case "profiles":
//       return await searchProfiles();
//     case "metadatas":
//       return await searchMetadatas();
//     case "objs":
//       return await searchObjects(type);
//     case "listviews":
//       return await searchObjects(type);
//     case "monitoring":
//       return await searchMonitors();
//   }
// }

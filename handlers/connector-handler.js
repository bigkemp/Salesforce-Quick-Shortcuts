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

// Function to convert the response map of MasterLabel to Id
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

function convertObj2ResponseToMap(response,type) {
    const defaults = [];
    const urls = {};

    if (response && response.records) {
      if(type == 'objs'){
        response.records.forEach(record => {
          const objectId = record.DurableId ;
          const masterLabel = record.QualifiedApiName;
          defaults.push({name: masterLabel});
          if (masterLabel) {
            urls[masterLabel.replaceAll(" ","-")] = objectId;
          }
        });
      }else{
        response.records.forEach(record => {
          const masterLabel = record.QualifiedApiName;
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
// function convertObjManager2ResponseToMap(response) {
//     const defaults = [];
//     const urls = {};

//     if (response && response.records) {
//         response.records.forEach(record => {
//             const objectId = record.Id;
//             const masterLabel = record.Name;
//             defaults.push({name: masterLabel});
//             if (masterLabel) {
//               urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/ObjectManager/%2F${objectId}/Details/view`;
//             }
//         });
//     }
//     let idLabelMap = {defaults: defaults, urls: urls};
//     return idLabelMap;
// }



 async function search_flows() {
    let query = `SELECT Id,ActiveVersion.MasterLabel FROM FlowDefinition WHERE ActiveVersion.ProcessType != null AND ActiveVersion.ProcessType != 'Workflow' `;
    let res = await rest("/services/data/v"+apiVer+"/tooling/query/?q=" + encodeURIComponent(query));
    return convertFlow2ResponseToMap(res);
    // return res.records;
 }

 async function search_users() {
    let query = `select Id,Name,Email FROM User`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertUser2ResponseToMap(res);
    // return res.records;
 }

 async function search_metadata() {
    let query = `SELECT DurableId, DeveloperName, NamespacePrefix FROM EntityDefinition WHERE IsCustomSetting=false AND IsCustomizable=true AND QualifiedApiName LIKE '%__mdt'`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertCustomMetadata2ResponseToMap(res);
    // return res.records;
 }

 async function search_profiles() {
    let query = `SELECT Id, Name FROM Profile`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertProfiles2ResponseToMap(res);
    // return res.records;
 }

//  async function search_records(type) {
//     let query = `SELECT Id, Name FROM ${type}`;
//     let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
//     console.log('search results:',JSON.stringify(res));
//     return convertObjManager2ResponseToMap(res);
//     // return res.records;
//  }

 async function search_objects(type) {
    let query = `SELECT DurableId ,QualifiedApiName FROM EntityDefinition WHERE IsCustomizable = true AND (NOT QualifiedApiName LIKE '%__mdt') `;
    // let query = `SELECT DurableId ,QualifiedApiName FROM EntityDefinition WHERE IsCustomizable = true AND (NOT QualifiedApiName LIKE '%__mdt') AND QualifiedApiName LIKE '%__c'`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    return convertObj2ResponseToMap(res,type);
    // return res.records;
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

  export async function search(type){
    switch (type) {
      case "flows":
        return await search_flows();
      case "users":
        return await search_users();
      case "profiles":
        return await search_profiles();
      case "metadata":
        return await search_metadata();
      case "objs":
        return await search_objects(type);
      case "listviews":
        return await search_objects(type);
      // default:
      //   return await search_records(type);
    }
  }
//   chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {

//     switch (message.type) {
//         case "flow":
//             search_flows(message.by,message.type).then(sendResponse);
//             return true;
//         default:
//             return true;
//     }
//   });
  
//SELECT Id,DeveloperName FROM CustomObject


var instanceHostname;
var sessionId;
const apiVer = '52.0';

init();
function init(){
    console.log(location.host);
    if (location.host.endsWith("my.salesforce.com") || location.host.endsWith("lightning.force.com") || location.host.endsWith("visualforce.com")) {
        console.log('Starting');
        chrome.runtime.sendMessage({message: "getSfHost", url: location.href}, sfHost => {
            console.log('sfHost',sfHost);
          if (sfHost) {
            getSession(sfHost);
          }
        });
      }
}

// Function to convert the response map of MasterLabel to Id
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
            const flowDefinitionId = record.Id;
            const masterLabel = record.Name;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/ManageUsers/page?address=%2F${flowDefinitionId}%3Fnoredirect%3D1%26isUserEntityOverride%3D1`;
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
            const flowDefinitionId = record.Id;
            const masterLabel = record.Name;
            defaults.push({name: masterLabel});
            if (masterLabel) {
              urls[masterLabel.replaceAll(" ","-")] = `/lightning/setup/EnhancedProfiles/page?address=%2F${flowDefinitionId}`;
            }
        });
    }
    let idLabelMap = {defaults: defaults, urls: urls};
    return idLabelMap;
}



 async function search_flows() {
    let query = `SELECT Id,ActiveVersion.MasterLabel FROM FlowDefinition WHERE ActiveVersion.ProcessType != null AND ActiveVersion.ProcessType != 'Workflow' `;
    let res = await rest("/services/data/v"+apiVer+"/tooling/query/?q=" + encodeURIComponent(query));
    console.log('search results:',JSON.stringify(res));
    return convertFlow2ResponseToMap(res);
    // return res.records;
 }

 async function search_users() {
    let query = `select Id,Name FROM User`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    console.log('search results:',JSON.stringify(res));
    return convertUser2ResponseToMap(res);
    // return res.records;
 }
 async function search_profiles() {
    let query = `SELECT Id, Name FROM Profile`;
    let res = await rest("/services/data/v"+apiVer+"/query/?q=" + encodeURIComponent(query));
    console.log('search results:',JSON.stringify(res));
    return convertProfiles2ResponseToMap(res);
    // return res.records;
 }


  async function getSession(sfHost) {
    console.log('getting session');

    let message = await new Promise(resolve => chrome.runtime.sendMessage({message: "getSession", sfHost}, resolve));
    if (message) {
        console.log("getSession",message);

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



  export async function search(type){
    switch (type) {
      case "flows":
        return await search_flows();
      case "users":
        return await search_users();
      case "profiles":
        return await search_profiles();
    
      default:
        return true;
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


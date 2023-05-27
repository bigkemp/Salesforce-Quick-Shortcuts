export function redirectShortcuts(type, shortcut, handlers, preferences) {
    if (!shortcut) {
      return;
    }
  
    const url = getSpecificShortcut(type, shortcut, handlers);
  
    if (!url) {
      return;
    }
  
    window.open(url, preferences ? "_blank" : "_self");
  }

function getSpecificShortcut(type,shortcut,handlers){
    let finalURL = '';
    let targetUrl = '';
    if (typeof shortcut === "string") {
        targetUrl = shortcut.charAt(0) === "/" ? shortcut.substring(1) : shortcut;
        if(type == 'objs'){
            finalURL = `/lightning/setup/ObjectManager/${targetUrl}/Details/view`
        }else if(type == 'listview'){
            finalURL = `/lightning/o/${targetUrl}/list?filterName=Recent`
        }else{
            finalURL = '/'+targetUrl;
        }
    }else{
        if(shortcut?.custom){
            targetUrl = shortcut.value;
            finalURL = targetUrl
                if(type == 'objs'){
                    finalURL = `/lightning/setup/ObjectManager/${targetUrl}/Details/view`
                }else if(type == 'listview'){
                    finalURL = `/lightning/o/${targetUrl}/list?filterName=Recent`
                }else{
                    if (targetUrl.includes(".com") && !targetUrl.includes("http")) {
                        // if the url is https it will auto correct to https
                        finalURL = 'http://' + targetUrl;
                    }
                }
        }else{
            if(shortcut[0] === '/'){ //shortcut
                finalURL =  shortcut;
            }else{ //obj or listview
                const nameForJson = shortcut.name.replaceAll(' ', '-');
                const defaultShortcut = handlers["data"].findDefaultShortcut(type, nameForJson);
                finalURL = defaultShortcut || shortcut;
                if(defaultShortcut != undefined && type == 'objs'){
                    finalURL = `/lightning/setup/ObjectManager/${defaultShortcut}/Details/view`
                }else if(defaultShortcut != undefined && type == 'listview'){
                    finalURL = `/lightning/o/${defaultShortcut}/list?filterName=Recent`
                }
            }
        }
    }
    return finalURL;
}
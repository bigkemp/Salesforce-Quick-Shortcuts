export function redirectShortcuts(type,shortcut,handlers,preferences){
    console.log("preferences",preferences);
    if (typeof shortcut === "object") {
        window.open(getSpecificShortcut(type,shortcut,handlers), preferences === true ? '_blank' : '_self');
    } else if (typeof shortcut === "string") {
        shortcut = shortcut.charAt(0) === "/" ? shortcut.substring(1) : shortcut;
        window.open('/'+shortcut, preferences === true ? '_blank' : '_self');
    } else {
        return
      }
}

function getSpecificShortcut(type,shortcut,handlers){
    let finalURL = '';
    if(shortcut?.custom){
        let targetUrl = shortcut.value;
            if(type == 'objs'){
                targetUrl = `/lightning/setup/ObjectManager/${shortcut.value}/Details/view`
            }else if(type == 'listview'){
                targetUrl = `/lightning/o/${shortcut.value}/list?filterName=Recent`
            }else{
                if (targetUrl.includes(".com") && !targetUrl.includes("http")) {
                    // if the url is https it will auto correct to https
                    targetUrl = 'http://' + targetUrl;
                }
            }
         finalURL = targetUrl;
    }else{
        if(shortcut[0] === '/'){
            finalURL =  shortcut;
        }else{
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
    return finalURL;
}
const maxNumberOfFavs = 5;
export async function add2Favorites(type, shortcut,handlers) { 
    if(!shortcut || shortcut.custom ){//TODO: for now favorites only works for non customs
        return
    }
    let favorites = await handlers["data"].getData("favorites") || {};
    const orgKey = shortcut.org ? shortcut.org : "undefined";
    favorites[orgKey] = favorites[orgKey] || {};
    favorites[orgKey][type] = favorites[orgKey][type] || [];

    let shortcutExists = false;
    let usedShortcut = { shortcut, count: 1 };
    for (const item of favorites[orgKey][type]) {
      if (item.shortcut.name === shortcut.name && item.shortcut.value === shortcut.value) {
        item.count++;
        usedShortcut = item;
        shortcutExists = true;
        break;
      }
    }
    favorites[orgKey][type] = sortFavorites(favorites[orgKey][type], usedShortcut ,shortcutExists);
    handlers["data"].overrideManualData("favorites",favorites)
}

function sortFavorites(shortcuts, usedShortcut, shortcutExists) {
    if (shortcuts.length < maxNumberOfFavs && !shortcutExists) {
        shortcuts.push(usedShortcut);
    }else if(shortcuts.length >= maxNumberOfFavs && !shortcutExists)  {
        let lowestCountIndex = 0;
        for (let i = 1; i < shortcuts.length; i++) {
            if (shortcuts[i].count < shortcuts[lowestCountIndex].count) {
                lowestCountIndex = i;
            }
        }
        if (usedShortcut.count >= shortcuts[lowestCountIndex].count) {
            shortcuts[lowestCountIndex] = usedShortcut;
        }
    }
    
    return shortcuts.sort((a, b) => b.count - a.count);
}

export async function getFavorites(type, handlers){
    const showFavorites = handlers["data"].findDataByNode('alwaysShowFavorites','mypreferences');
    if(!showFavorites){
        return [];
    }
    let localmem = await chrome.storage.sync.get("favorites");
    let favorites = localmem["favorites"] || undefined;
    if (favorites == undefined ||  Object.keys(favorites).length === 0 ){
        return [];
    }
    let finalFavList = [];
    if (handlers["data"].orgExists.bool){
        if (favorites[handlers["data"].orgExists.name] != undefined &&  favorites[handlers["data"].orgExists.name][type] != undefined){
            let specificOrgFavs =  favorites[handlers["data"].orgExists.name][type];
            finalFavList = finalFavList.concat(specificOrgFavs);
        }
    }
    if (favorites[undefined] != undefined && favorites[undefined][type] != undefined){
        let nonOrgFavs = favorites[undefined][type]
        finalFavList = finalFavList.concat(nonOrgFavs);
    }
    return finalFavList;
}
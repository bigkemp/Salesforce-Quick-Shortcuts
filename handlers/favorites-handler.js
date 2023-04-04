export async function add2Favorites(type, shortcut,handlers) { // TODO: will later need to add the handlers to save in data handler instead of here.
    if(shortcut.custom){//TODO: for now favorites only works for non customs
        return
    }
    let localmem = await chrome.storage.sync.get("favorites");
    let favorites = localmem["favorites"] || {};
    const orgKey = shortcut.org ? shortcut.org : "undefined";
    favorites[orgKey] = favorites[orgKey] || {};
    favorites[orgKey][type] = favorites[orgKey][type] || [];

    let shortcutExists = false;
    for (const item of favorites[orgKey][type]) {
      if (item.shortcut.name === shortcut.name && item.shortcut.value === shortcut.value) {
        item.count++;
        shortcutExists = true;
        break;
      }
    }
    max10Favorites(favorites[orgKey][type], { shortcut, count: 1 },shortcutExists);
    await  chromeStorageSet(favorites, "favorites");
  }

function max10Favorites(shortcuts, newShortcut, shortcutExists) {
    if (shortcuts.length < 10 && !shortcutExists) {
        shortcuts.push(newShortcut);
    } else {
        let lowestCountIndex = 0;
        for (let i = 1; i < shortcuts.length; i++) {
            if (shortcuts[i].count < shortcuts[lowestCountIndex].count) {
                lowestCountIndex = i;
            }
        }
        if (newShortcut.count > shortcuts[lowestCountIndex].count) {
            shortcuts[lowestCountIndex] = newShortcut;
        }
    }
    shortcuts.sort((a, b) => b.count - a.count);
}

  export async function getFavorites(type, handlers){
    let localmem = await chrome.storage.sync.get("favorites");
    let favorites = localmem["favorites"] || undefined;
    if (favorites == undefined || !handlers["data"].findDataByNode('alwaysShowFavorites','mypreferences')){
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


   async function chromeStorageSet(data, type) {
     await chrome.storage.sync.set({[type]:data});
    }
  
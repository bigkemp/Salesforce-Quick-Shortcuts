const DIVIDER = '.';
export function getSuggestions(array_data, input) {
  if (!input) return []; 
  const suggestions = [];

  let isCustom = array_data.length == 2 ? true : false ;
  for (const element of array_data) {
    for (const shortcut of element) {
      const finalshortcutname = shortcut.name;
      if (!finalshortcutname.split('.')[finalshortcutname.split('.').length -1].toUpperCase().includes(input.toUpperCase())) continue;
      shortcut.custom = isCustom;
      suggestions.push(shortcut);
    }
    isCustom = !isCustom;
  }
  return suggestions
}

export function getFavoritesSuggestions(array_data) {
  const suggestions = [];
  for (const favorite of array_data) {
    favorite.shortcut.favorite = true;
    suggestions.push(favorite.shortcut);
  }
  return suggestions
}

export function buildSuggestionsHTML(shortcutFinding, inputValue) {
    const htmlStrings = shortcutFinding.map((shortcut, index) => {
      const modifiedName = formatModifiedName(shortcut, inputValue);
      let specialDivider;
      if(shortcut.favorite != undefined){
        specialDivider = shortcut.favorite ? `<span width="30px" height="30px">📌</span>` : '';
      }else{
        specialDivider = shortcut.custom ? `<span width="30px" height="30px">✏️</span>` : '';
      }
      return generateSuggestionHTML(index, specialDivider, modifiedName, shortcut.name);
    });
  
    return htmlStrings.join('');
  }
  
  function generateSuggestionHTML(index, customDivider, modifiedName, name) {
    const suggestionItem = document.createElement("li");
    suggestionItem.tabIndex = -1;
    suggestionItem.classList.add("sqab_suggestions");
    suggestionItem.dataset.index = index;
    suggestionItem.dataset.name = name;
    suggestionItem.innerHTML = `${customDivider}${modifiedName}`;
    return suggestionItem.outerHTML;
  }
  
  function formatModifiedName(shortcut, inputValue) {
    if (shortcut.name.includes(DIVIDER)) {
      let nameSplitted = shortcut.name.split('.');
      let suffix = nameSplitted.pop();
      if(shortcut.favorite != undefined && shortcut.favorite == true){
        return suffix;
      }
      let modifiedSuffix = '';
      for (const prefix_part of nameSplitted) {
        modifiedSuffix+= `<span tabIndex="-1" class="sqab_divider">${prefix_part}</span>`
      }
      modifiedSuffix+=`${boldRelevantChars(suffix, inputValue)}`;
      return `${modifiedSuffix}`;
    } else {
      return boldRelevantChars(shortcut.name, inputValue);
    }
  }
  
  function boldRelevantChars(rowNameMask, searchValue) {
    const regEx = new RegExp(searchValue, "ig");
    return rowNameMask.replace(regEx, '<b>$&</b>');
  }
  
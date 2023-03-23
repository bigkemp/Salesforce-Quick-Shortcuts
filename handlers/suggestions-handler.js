const DIVIDER = '.';
const customColor = '#bd5858';
const favoriteColor = '#00ee3b';
export function getSuggestions(array_data, input) {
  if (!input) return []; // handle empty input
  const suggestions = [];

  let isCustom = array_data.length == 2 ? true : false ;
  // loop through all array data
  for (const element of array_data) {
    // loop through all shortcuts of an element
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
  console
  const suggestions = [];
  for (const favorite of array_data) {
    favorite.shortcut.favorite = true;
    suggestions.push(favorite.shortcut);
  }
  return suggestions
}

export function buildSuggestionsHTML(shortcutFinding, inputValue) {
    const htmlStrings = shortcutFinding.map((shortcut, index) => {
      const modifiedName = formatModifiedName(shortcut.name, inputValue);
      let specialCSSColor;
      let specialDivider;
      if(shortcut.favorite != undefined){
        specialCSSColor = shortcut.favorite ? favoriteColor: undefined;
        specialDivider = shortcut.favorite ? '<span class="sqab_divider">Favorite</span>' : '';
      }else{
        specialCSSColor = shortcut.custom ? customColor: undefined;
        specialDivider = shortcut.custom ? '<span class="sqab_divider">Custom</span>' : '';
      }
      return generateSuggestionHTML(index, specialCSSColor, specialDivider, modifiedName, shortcut.name);
    });
  
    return htmlStrings.join('');
  }
  
  function generateSuggestionHTML(index, specialColor, customDivider, modifiedName, name) {
    const suggestionItem = document.createElement("li");
    suggestionItem.tabIndex = -1;
    suggestionItem.classList.add("sqab_suggestions");
    suggestionItem.dataset.index = index;
    suggestionItem.dataset.name = name;
    suggestionItem.innerHTML = `${customDivider}${modifiedName}`;
    if (specialColor != undefined) {
      suggestionItem.style.color = specialColor;
    }
    return suggestionItem.outerHTML;
  }
  
  function formatModifiedName(name, inputValue) {
    if (name.includes(DIVIDER)) {
      let nameSplitted = name.split('.');
      let suffix = nameSplitted.pop();
      let modifiedSuffix = '';
      for (const prefix_part of nameSplitted) {
        modifiedSuffix+= `<span tabIndex="-1" class="sqab_divider">${prefix_part}</span>`
      }
      modifiedSuffix+=`${boldRelevantChars(suffix, inputValue)}`;
      return `${modifiedSuffix}`;
    } else {
      return boldRelevantChars(name, inputValue);
    }
  }
  
  function boldRelevantChars(rowNameMask, searchValue) {
    const regEx = new RegExp(searchValue, "ig");
    return rowNameMask.replace(regEx, '<b>$&</b>');
  }
  
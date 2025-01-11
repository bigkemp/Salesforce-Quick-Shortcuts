export async function init(importedhandlers){
  handlers = importedhandlers;
  // Event listener for the button
  const domtabs = document.querySelectorAll('.sqab_p_settings_tab');
  let activeTab = null;

  domtabs.forEach(tab => {
    tab.addEventListener('click', () => {
        if (activeTab) {
            activeTab.classList.remove('active');
            const previousContentId = activeTab.getAttribute('data-target');
            document.getElementById(previousContentId).style.display = 'none';
        }
        tab.classList.add('active');
        const currentContentId = tab.getAttribute('data-target');
        document.getElementById(currentContentId).style.display = 'block';
        activeTab = tab;
        // buildContent(activeTab.getAttribute('data-target'));
    });

    tab.addEventListener('mouseover', () => {
        domtabs.forEach(t => {
            if (t !== tab) {
                t.style.flexGrow = '0.5';
            } else {
                t.style.flexGrow = '2';
            }
        });
    });

    // tab.addEventListener('mouseout', () => {
    //     tabs.forEach(t => {
    //         t.style.flexGrow = '1';
    //     });
    // });
});

  document.getElementById("prettify-button").addEventListener("click", determineFormat);
  let values = await getRemoteData('objs');
  const objectGlossaryData = values["defaults"].map(item => item.name);
  var fieldsGlossaryData = [];
  const soqlOperators = ['=', '!=', '<', '<=', '>', '>=', 'LIKE', 'IN', 'NOT IN'];

  const objectGlossary = document.getElementById('objectGlossary');
  const fieldsGlossary = document.getElementById('fieldsGlossary');
  const objectInput = document.getElementById('objectInput');
  const fieldsInput = document.getElementById('fieldsInput');
  const fieldsTags = document.getElementById('fieldsTags');
  const objTag = document.getElementById('objTag');
  const conditionsContainer = document.getElementById('conditionsContainer');
  const addConditionButton = document.getElementById('addConditionButton');
  const logicInput = document.getElementById('logicInput');
  const limitInput = document.getElementById('limitInput');
  const queryOutput = document.getElementById('queryOutput');
  const startButton = document.getElementById('startButton');
  const searchButton = document.getElementById('searchButton');
  runBase64();
  let selectedObject = '';
  let selectedFields = [];
  let conditionCount = 0;

  const renderGlossary = (data, container, callback) => {
    container.innerHTML = '';
    data.forEach(item => {
      const tag = document.createElement('div');
      tag.classList.add('tag-button');
      tag.textContent = item;
      tag.addEventListener('click', () => callback(item));
      container.appendChild(tag);
    });
  };

const updateLogic = () => {
  const conditions = Array.from(conditionsContainer.children);
  logicInput.value = conditions
    .filter(condition => !condition.classList.contains('glossary-row')) // Filter out "glossary" class
    .map((_, i) => `${i + 1}`)
    .join(' AND ');
};

  const createConditionRow = () => {
    conditionCount++;

    const row = document.createElement('div');
    row.classList.add('condition-row');

    const fieldInput = document.createElement('input');
    fieldInput.type = 'text';
    fieldInput.placeholder = 'Field';
    fieldInput.classList.add('condition-field-input');

    const operatorSelect = document.createElement('select');
    soqlOperators.forEach(op => {
      const option = document.createElement('option');
      option.value = op;
      option.textContent = op;
      operatorSelect.appendChild(option);
    });

    const valueInput = document.createElement('input');
    valueInput.type = 'text';
    valueInput.placeholder = 'Value';

    const fieldGlossary = document.createElement('div');
    fieldGlossary.classList.add('glossary');
    fieldGlossary.style.display = 'none';

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.classList.add('remove-button');
    removeButton.addEventListener('click', () => {
      row.remove();
      updateLogic();
    });

    fieldInput.addEventListener('input', () => {
      const query = fieldInput.value.toLowerCase();
      const filteredFields = fieldsGlossaryData.filter(f => f.toLowerCase().includes(query));
      fieldGlossary.style.display = filteredFields.length > 0 ? 'block' : 'none';
      renderGlossary(filteredFields, fieldGlossary, field => {
        fieldInput.value = field;
        fieldGlossary.style.display = 'none';
      });
    });

    fieldInput.addEventListener('focus', () => {
      const query = fieldInput.value.toLowerCase();
      const filteredFields = fieldsGlossaryData.filter(f => f.toLowerCase().includes(query));
      fieldGlossary.style.display = filteredFields.length > 0 ? 'block' : 'none';
      renderGlossary(filteredFields, fieldGlossary, field => {
        fieldInput.value = field;
        fieldGlossary.style.display = 'none';
      });
    });

    fieldInput.addEventListener('focus', () => {
      const query = fieldInput.value.toLowerCase();
      const filteredFields = fieldsGlossaryData.filter(f => f.toLowerCase().includes(query));
      fieldGlossary.style.display = filteredFields.length > 0 ? 'block' : 'none';
    });

    fieldInput.addEventListener('blur', () => {
      setTimeout(() => {
        fieldGlossary.style.display = 'none';
      }, 200);
    });

    row.appendChild(fieldInput);
    row.appendChild(fieldGlossary);
    row.appendChild(operatorSelect);
    row.appendChild(valueInput);
    row.appendChild(removeButton);

    conditionsContainer.appendChild(row);

    const glossaryRow = document.createElement('div');
    glossaryRow.classList.add('glossary-row');
    glossaryRow.appendChild(fieldGlossary);
    conditionsContainer.appendChild(glossaryRow);

    updateLogic();
  };


  const searchRecords = async () =>{
    const canIcontinue = buildSOQLQuery();
    if(canIcontinue){
      const records = await handlers["connector"].search_records({query:queryOutput.value, tooling: ""});
      addTab(records);
    }
  }

  const buildSOQLQuery = () => {
    if (!selectedObject) {
      queryOutput.value = 'Please select an Object.';
      return false;
    }
    if (selectedFields.length === 0) {
      queryOutput.value = 'Please select at least one Field.';
      return false;
    }
  
    const conditions = Array.from(conditionsContainer.children)
      .filter(row => row.classList.contains('condition-row'))
      .map(row => {
        const field = row.querySelector('.condition-field-input').value;
        const operator = row.querySelector('select').value;
        const value = row.querySelectorAll('input[type="text"]')[1].value;
        return `${field} ${operator} '${value}'`;
      });
  
    // Parse the logicInput value to map condition indices
    const logic = logicInput.value;
    const logicArray = logic.split(/\s+/); // Split by spaces (e.g., "1 AND 2")
    const conditionMapping = logicArray
      .map(token => (/\d+/.test(token) ? conditions[parseInt(token) - 1] : token))
      .filter(Boolean) // Remove undefined mappings
      .join(' ');
  
    const limit = limitInput.value ? ` LIMIT ${limitInput.value}` : '';
  
    const query = `SELECT ${selectedFields.join(', ')} FROM ${selectedObject}` +
                  (conditionMapping.length ? ` WHERE ${conditionMapping}` : '') +
                  limit;
  
    queryOutput.value = query;
    return true;
  };

  objectInput.addEventListener('input', () => {
    const query = objectInput.value.toLowerCase();
    const filteredObjects = objectGlossaryData.filter(obj => obj.toLowerCase().includes(query));
    objectGlossary.style.display = filteredObjects.length > 0 ? 'block' : 'none';
    renderGlossary(filteredObjects, objectGlossary, async (obj) => {
      queryOutput.value = "";
      conditionsContainer = [];
      updateLogic();
      selectedFields = [];
      fieldsTags.innerHTML = '';
      objectInput.value = "";
      objTag.innerHTML = '';
      const tag = document.createElement('div');
      tag.classList.add('tag');
      tag.textContent = obj;
      selectedObject = obj;
      tag.addEventListener('click', () => {
        queryOutput.value = "";
        selectedObject = "";
        conditionsContainer = [];
        updateLogic();
        selectedFields = [];
        fieldsTags.innerHTML = '';
        tag.remove();
      });
      objTag.appendChild(tag);
      objectGlossary.style.display = 'none';
      let values = await getRemoteData('fields',selectedObject);
      fieldsGlossaryData = values["defaults"].map(item => item.name);
    });
  });
  
  objectInput.addEventListener('focus', () => {
    const query = objectInput.value.toLowerCase();
    const filteredObjects = objectGlossaryData.filter(obj => obj.toLowerCase().includes(query));
    objectGlossary.style.display = filteredObjects.length > 0 ? 'block' : 'none';
    renderGlossary(filteredObjects, objectGlossary, async (obj) => {
      selectedFields = [];
      conditionsContainer = [];
      updateLogic();
      queryOutput.value = "";
      fieldsTags.innerHTML = '';
      objectInput.value = "";
      objTag.innerHTML = '';
      const tag = document.createElement('div');
      tag.classList.add('tag');
      tag.textContent = obj;
      selectedObject = obj;
      tag.addEventListener('click', () => {
        queryOutput.value = "";
        conditionsContainer = [];
        updateLogic();
        selectedObject = "";
        selectedFields = [];
        fieldsTags.innerHTML = '';
        tag.remove();
      });
      objTag.appendChild(tag);
      objectGlossary.style.display = 'none';
      let values = await getRemoteData('fields',selectedObject);
      fieldsGlossaryData = values["defaults"].map(item => item.name);
    });
  });

  fieldsInput.addEventListener('input', () => {
    const query = fieldsInput.value.toLowerCase();
    const filteredFields = fieldsGlossaryData.filter(f => f.toLowerCase().includes(query));
    fieldsGlossary.style.display = filteredFields.length > 0 ? 'block' : 'none';
    renderGlossary(filteredFields, fieldsGlossary, field => {
      if (!selectedFields.includes(field)) {
        queryOutput.value = "";
        selectedFields.push(field);
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.textContent = field;
        tag.addEventListener('click', () => {
          selectedFields = selectedFields.filter(f => f !== field);
          queryOutput.value = "";
          tag.remove();
        });
        fieldsTags.appendChild(tag);
      }
      fieldsGlossary.style.display = 'none';
      fieldsInput.value = '';
    });
  });

  fieldsInput.addEventListener('focus', () => {
    const query = fieldsInput.value.toLowerCase();
    const filteredFields = fieldsGlossaryData.filter(f => f.toLowerCase().includes(query));
    fieldsGlossary.style.display = filteredFields.length > 0 ? 'block' : 'none';
    renderGlossary(filteredFields, fieldsGlossary, field => {
      if (!selectedFields.includes(field)) {
        selectedFields.push(field);
        const tag = document.createElement('div');
        tag.classList.add('tag');
        tag.textContent = field;
        tag.addEventListener('click', () => {
          selectedFields = selectedFields.filter(f => f !== field);
          tag.remove();
        });
        fieldsTags.appendChild(tag);
      }
      fieldsGlossary.style.display = 'none';
      fieldsInput.value = '';
    });
  });

  addConditionButton.addEventListener('click', createConditionRow);
  searchButton.addEventListener('click', buildSOQLQuery);
  startButton.addEventListener('click', searchRecords);
};

async function getRemoteData(type,data = undefined){
  return await handlers["connector"].search(type,"API",data);
}
// Function to prettify the JSON
function syntaxHighlight(json) {
  if (typeof json !== 'string') {
      json = JSON.stringify(json, undefined, 4); // Indents with 4 spaces
  }
  json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, function (match) {
      let cls = 'json-value-number';
      if (/^"/.test(match)) {
          cls = /:$/.test(match) ? 'json-key' : 'json-value-string';
      } else if (/true|false/.test(match)) {
          cls = 'json-value-boolean';
      } else if (/null/.test(match)) {
          cls = 'json-value-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
  });
}

// Function to handle the prettification when the button is clicked
function prettifyJson() {
  const jsonInput = document.getElementById("json-input").value;
  const parsedJson = JSON.parse(jsonInput);
  document.getElementById("json-output").innerHTML = "<pre>" + syntaxHighlight(parsedJson) + "</pre>";
}


// Function to escape HTML characters in XML to display them as text
function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;")
               .replace(/</g, "&lt;")
               .replace(/>/g, "&gt;");
}

// Function to prettify and highlight XML
function prettifyXml(xmlString) {
  // Parse and format the XML with proper indentation
  const formattedXml = formatXml(xmlString);

  // Highlight XML with colors using regex for different parts
  return formattedXml
      .replace(/(<!--[\s\S]*?-->)|(<\?xml[^>]*\?>)|(<\/?[a-zA-Z][^>]*>)|("[^"]*")|([a-zA-Z0-9-:]+)(\s*=\s*)/g, function (match, comment, declaration, tag, value, attrName, equalSign) {
          if (comment) {
              return `<span class="xml-comment">${escapeHtml(comment)}</span>`;
          } else if (declaration) {
              return `<span class="xml-declaration">${escapeHtml(declaration)}</span>`;
          } else if (tag) {
              return `<span class="xml-tag">${escapeHtml(tag)}</span>`;
          } else if (value) {
              return `<span class="xml-attribute-value">${escapeHtml(value)}</span>`;
          } else if (attrName) {
              return `<span class="xml-attribute">${escapeHtml(attrName)}</span>${escapeHtml(equalSign)}`;
          }
          return escapeHtml(match);
      });
}

// Helper function to format XML with indentation
function formatXml(xml) {
  const PADDING = '    '; // 4 spaces padding for indentation
  const reg = /(>)(<)(\/*)/g;
  let formatted = '';
  let pad = 0;

  // Add newline between tags
  xml = xml.replace(reg, '$1\n$2$3');

  // Split by lines and add appropriate indentation
  xml.split('\n').forEach(function (node) {
      let indent = 0;
      if (node.match(/.+<\/\w[^>]*>$/)) {
          // If the tag is a self-contained single line tag (e.g., <tag>content</tag>)
          indent = 0;
      } else if (node.match(/^<\/\w/)) {
          // Closing tag, reduce padding
          if (pad !== 0) {
              pad -= 1;
          }
      } else if (node.match(/^<\w([^>]*[^\/])?>.*$/)) {
          // Opening tag, increase padding
          indent = 1;
      }

      // Apply the padding and format the node with line breaks
      formatted += PADDING.repeat(pad) + node + '\n';
      pad += indent;
  });

  return formatted.trim(); // Remove trailing whitespace
}


// Function to handle the prettification when the button is clicked
function prettifyXmlInput() {
  const xmlInput = document.getElementById("json-input").value.trim();
  if (!xmlInput) {
      document.getElementById("json-output").innerHTML = '<span style="color: red;">Please enter valid XML</span>';
      return;
  }

  try {
      // Try formatting and highlighting the XML
      const prettifiedXml = prettifyXml(xmlInput.replaceAll(/>\s+</g, '><'));
      document.getElementById("json-output").innerHTML = '<pre style="height: 80vh; overflow: auto;">' + prettifiedXml.trim() + "</pre>";
  } catch (e) {
      document.getElementById("json-output").innerHTML = '<span style="color: red;">Invalid XML input</span>';
  }
}


function determineFormat() {
  // Check if the input is a valid JSON
  let input = document.getElementById("json-input").value.trim();
  try {
      JSON.parse(input);
      prettifyJson();
  } catch (e) {
      try {
          if (typeof input === 'string' && (input.trim().startsWith('<') && input.trim().endsWith('>'))) {
              prettifyXmlInput();
          }else{
              document.getElementById("json-output").innerHTML = '<span style="color: red;">Invalid input</span>';
          }
      } catch (error) {
          document.getElementById("json-output").innerHTML = '<span style="color: red;">Invalid input</span>';
      }
  }
  
}

let tabCounter = 2; // Starts from 2 since "tab-1" exists in HTML

function activateTab(tabId) {
  document.querySelectorAll('.sqab_tools_query_tabs-nav li').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.sqab_tools_query_tabs-content > div').forEach(content => content.classList.remove('active'));

  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  document.getElementById(`sqab_tools_query_content-${tabId}`).classList.add('active');
}

function addTab(records) {
  const tabId = `tab-${tabCounter++}`;
  const tabList = document.getElementById('sqab_tools_query_tab-list');
  const tabContent = document.getElementById('sqab_tools_query_tab-content');

  const tabItem = document.createElement('li');
  tabItem.setAttribute('data-tab', tabId);

  const tabLink = document.createElement('span');
  tabLink.textContent = `Result`;
  tabLink.addEventListener('click', () => activateTab(tabId));

  const closeButton = document.createElement('button');
  closeButton.textContent = '×';
  closeButton.addEventListener('click', (event) => {
    event.stopPropagation();
    removeTab(tabId);
  });

  tabItem.appendChild(tabLink);
  tabItem.appendChild(closeButton);
  tabList.appendChild(tabItem);

  const contentItem = document.createElement('div');
  const contentItemCout = document.createElement('div');
  contentItem.id = `sqab_tools_query_content-${tabId}`;
  // contentItem.textContent = ` ${createTable(records)}`;
  contentItemCout.id = `sqab_tools_query_content-count-${tabId}`;
  contentItemCout.textContent = `Found ${records.length} Records`;
  contentItem.textContent = ``;
  tabContent.appendChild(contentItemCout);
  tabContent.appendChild(contentItem);
  if(records.length > 0){
    createTable(records,contentItem);
  }
  activateTab(tabId);
}

function removeTab(tabId) {
  const tabItem = document.querySelector(`[data-tab="${tabId}"]`);
  const contentItem = document.getElementById(`sqab_tools_query_content-${tabId}`);
  const contentItemCout = document.getElementById(`sqab_tools_query_content-count-${tabId}`);

  if (tabItem) tabItem.remove();
  if (contentItem) contentItem.remove();
  if (contentItemCout) contentItemCout.remove();

  const remainingTabs = document.querySelectorAll('.sqab_tools_query_tabs-nav li');
  tabCounter = remainingTabs.length +1;
  if (remainingTabs.length > 0) {
    activateTab(remainingTabs[0].getAttribute('data-tab'));
  }
}

// Function to create a dynamic table
function createTable(data,tabContent) {
  // Get the container where the table will be placed
  // const container = document.getElementById('sqab_tools_query_table-container');
  const container = tabContent;

  // Create the table element
  const table = document.createElement('table');
  table.id = 'sqab_tools_query_data-table'; // Prefix added to the table ID
  container.appendChild(table);

  // Extract keys dynamically, excluding the 'attributes' key
  const keys = Object.keys(data[0]).filter(key => key !== 'attributes');

  // Create table header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  keys.forEach(key => {
      const th = document.createElement('th');
      th.textContent = key;
      headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  // Create table body
  const tbody = document.createElement('tbody');
  data.forEach(item => {
      const row = document.createElement('tr');
      row.className = 'sqab_tools_query_row'; // Prefix added to the row class
      keys.forEach(key => {
          const td = document.createElement('td');
          td.textContent = item[key] || ''; // Handle missing keys gracefully
          row.appendChild(td);
      });
      tbody.appendChild(row);
  });
  table.appendChild(tbody);
}

function runBase64(){
  document.getElementById('tool-base64-process-button').addEventListener('click', () => {
    const inputField = document.getElementById('tool-base64-input');
    const resultField = document.getElementById('tool-base64-result-output');
    const inputText = inputField.value.trim();
  
    // Function to check if a string is valid Base64
    function isBase64(str) {
      try {
        return btoa(atob(str)) === str; // Try encoding it back and check if it's valid Base64
      } catch (e) {
        return false; // Not a valid base64 string
      }
    }
  
    // Process the input
    if (inputText === '') {
      resultField.textContent = 'Please enter a value to process.';
      return;
    }
  
    if (isBase64(inputText)) {
      // Decrypt (Decode base64 to original string)
      try {
        const decoded = atob(inputText);
        resultField.textContent = `Decoded: ${decoded}`;
      } catch (error) {
        resultField.textContent = 'Error decoding the base64 string.';
      }
    } else {
      // Encrypt (Encode string to base64)
      try {
        const encoded = btoa(inputText);
        resultField.textContent = `Encoded: ${encoded}`;
      } catch (error) {
        resultField.textContent = 'Error encoding the string.';
      }
    }
  });
}

var handlers;
export async function init(importedhandlers) {
    handlers = importedhandlers;
    // Event listener for the button
    document.getElementById("prettify-button").addEventListener("click", determineFormat);
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
        document.getElementById("json-output").innerHTML = "<pre>" + prettifiedXml.trim() + "</pre>";
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
            }
        } catch (error) {
            document.getElementById("json-output").innerHTML = '<span style="color: red;">Invalid input</span>';
        }
    }
    
}

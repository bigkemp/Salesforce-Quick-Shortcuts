
// const searchDropDown = document.getElementById("searchDropdown");
const resultContainer = document.getElementById("resultContainer");
const resultContent = document.getElementById("resultContent");
const itemsPerPage = 5; // Number of items per page
var currentPage = 1; 
var totalPages = 1; 

var activeTab;
var objectArray;
init();

function getPageData(pageNumber) {
  const startIndex = (pageNumber - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return objectArray.slice(startIndex, endIndex);
}

function createTable(jsonData) {
  // Create a table element
  var table = document.createElement("table");
  table.setAttribute("id", "jsonTable");

  // Create header row
  var headerRow = table.insertRow(0);
  var headerCell1 = headerRow.insertCell(0);
  var headerCell2 = headerRow.insertCell(1);
  var headerCell3 = headerRow.insertCell(2);
  var headerCell4 = headerRow.insertCell(3); // New column for percentage
  headerCell1.innerHTML = "Key";
  headerCell2.innerHTML = "Max";
  headerCell3.innerHTML = "Remaining";
  headerCell4.innerHTML = "Usage %";

  // Array to store rows for sorting
  var rowsArray = [];

  // Loop through the JSON data and populate the table
  for (var key in jsonData) {
      if (jsonData.hasOwnProperty(key)) {
          var max = jsonData[key].Max;
          var remaining = jsonData[key].Remaining;
          var percentage = ((max - remaining) / max) * 100;

          var row = table.insertRow(-1);
          var cell1 = row.insertCell(0);
          var cell2 = row.insertCell(1);
          var cell3 = row.insertCell(2);
          var cell4 = row.insertCell(3);

          var formattedKey = formatKeyWithSpaces(key);
          
          cell1.innerHTML = formattedKey;
          cell2.innerHTML = max;
          cell3.innerHTML = remaining;
          cell4.innerHTML = percentage.toFixed(2) + "%";

          // Add the row to the array for sorting
          rowsArray.push({ row: row, percentage: percentage });
      }
  }

  // Sort the table based on the percentage column
  rowsArray.sort(function (a, b) {
      return b.percentage - a.percentage;
  });

  // Append sorted rows to the table
  for (var i = 0; i < rowsArray.length; i++) {
      table.appendChild(rowsArray[i].row);
  }

  // Color code the percentage cells' background
  colorCodePercentageCells(table);

  // Append the table to the specified resultContent element
  resultContent.appendChild(table);

  // Add filtering input field
  var filterInput = document.createElement("input");
  filterInput.setAttribute("type", "text");
  filterInput.setAttribute("id", "filterInput");
  filterInput.setAttribute("placeholder", "Filter keys");
  filterInput.addEventListener("input", function () {
      filterTable(table, this.value);
  });
  filterInput.classList.add("filter-input"); // Add the CSS class

  resultContent.insertBefore(filterInput, table);
}

function formatKeyWithSpaces(key) {
  // Insert spaces in the Key column based on uppercase characters
  var formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  return formattedKey;
}

function colorCodePercentageCells(table) {
  // Color code the percentage cells' background
  var rows = table.rows;

  for (var i = 1; i < rows.length; i++) {
      var percentageCell = rows[i].cells[3];
      var percentage = parseFloat(percentageCell.innerHTML);

      if (percentage < 30) {
          percentageCell.classList.add("percentage-green");
      } else if (percentage >= 30 && percentage < 60) {
          percentageCell.classList.add("percentage-orange");
      } else {
          percentageCell.classList.add("percentage-red");
      }
  }
}

function filterTable(table, filter) {
  // Hide rows that do not contain the filter string
  var rows = table.rows;

  for (var i = 1; i < rows.length; i++) {
      var keyCell = rows[i].cells[0];
      var key = keyCell.innerHTML.toLowerCase();

      if (key.includes(filter.toLowerCase())) {
          rows[i].style.display = "";
      } else {
          rows[i].style.display = "none";
      }
  }
}

function init() {
  chrome.tabs.query({currentWindow: true, active: true}, async function (tabs) {
    activeTab = tabs[0];
    if(activeTab.url == undefined || !activeTab.url.includes(".force.com")){
      return;
    }else{
      chrome.tabs.sendMessage(activeTab.id, {"type": "active"},async   function(res) {
        document.getElementById("status-connector").innerText = activeTab.url.split('.')[0].replace('https://','');
        document.getElementById("status-connector").style.color = "green";
        chrome.tabs.sendMessage(activeTab.id, {"message": "","type":"search"}, function(res) {
          // resultContent.innerHTML = JSON.stringify(res);
          console.log(res);
          if(res == null){
            resultContent.innerText= "no results"
            return;
          }else{
            if (res instanceof Error) {
              resultContent.innerText= "no results"
            } else {
                // resultContent.innerHTML = JSON.stringify(res);
                createTable(res);
                // objectArray = res;
                // // Get the div where you want to inject the table
                // totalPages = Math.ceil(objectArray.length / itemsPerPage);
                // currentPage = 1;
                // createTable(getPageData(currentPage));
            }
          }
          resultContainer.style.display = "inline-block";
        });
      });

    }
  });
}


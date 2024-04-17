var resultContainer;
function createTable(jsonData) {
  resultContainer = document.getElementById("sqab_resultContainer");
  var resultContent = document.getElementById("sqab_resultContent");
  var table = document.createElement("table");
  table.setAttribute("id", "jsonTable");

  var headerRow = table.insertRow(0);
  var headerCell1 = headerRow.insertCell(0);
  var headerCell2 = headerRow.insertCell(1);
  var headerCell3 = headerRow.insertCell(2);
  var headerCell4 = headerRow.insertCell(3); 
  headerCell1.innerHTML = "Key";
  headerCell2.innerHTML = "Max";
  headerCell3.innerHTML = "Remaining";
  headerCell4.innerHTML = "Usage %";

  var rowsArray = [];

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

          rowsArray.push({ row: row, percentage: percentage });
      }
  }

  rowsArray.sort(function (a, b) {
      return b.percentage - a.percentage;
  });

  for (var i = 0; i < rowsArray.length; i++) {
      table.appendChild(rowsArray[i].row);
  }

  colorCodePercentageCells(table);

  resultContent.appendChild(table);

  var filterInput = document.createElement("input");
  filterInput.setAttribute("type", "text");
  filterInput.setAttribute("id", "filterInput");
  filterInput.setAttribute("placeholder", "Filter keys");
  filterInput.addEventListener("input", function () {
      filterTable(table, this.value);
  });
  filterInput.classList.add("filter-input"); 

  resultContent.insertBefore(filterInput, table);
}

function formatKeyWithSpaces(key) {
  var formattedKey = key.replace(/([a-z])([A-Z])/g, '$1 $2');
  return formattedKey;
}

function colorCodePercentageCells(table) {
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

export async function init(handlers) {
  let res = await handlers["connector"].search('monitoring');
  if(res == null){
    resultContent.innerText= "no results"
    return;
  }else{
    if (res instanceof Error) {
      resultContent.innerText= "no results"
    } else {
        createTable(res);
    }
  }
  resultContainer.style.display = "inline-block";
}

var removeAttr = jQuery.fn.removeAttr;
jQuery.fn.removeAttr = function() {
    if (!arguments.length) {
        this.each(function() {
            // Looping attributes array in reverse direction to avoid skipping items
            for (var i = this.attributes.length - 1; i >= 0; i--) {
                jQuery(this).removeAttr(this.attributes[i].name);
            }
        });
        return this;
    }
    return removeAttr.apply(this, arguments);
};

// Constants: Two URLs to fetch data from
const urls = [
    "https://contaste.pro/eng/9938?schedule&part=156172", // Replace with actual URL 1
    //"https://contaste.pro/eng/85724?schedule&part=109606"  // Replace with actual URL 2
];
const searchTerm = "Vision";

async function fetchAndMergeTables() {
  try {
      $("button").prop("disabled", true).text("Processing...");
      let allRows = [];
      let rowSource = 0; // Variable to keep track of which URL the rows come from
  
      // Fetch data from both URLs
      for (const url of urls) {
          const response = await fetch(url);
          const htmlText = await response.text();
  
          // Parse the HTML
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlText, "text/html");
  
          // Find the first table (adjust selector if needed)
          const table = doc.querySelector("table");
          if (!table) continue;
  
          // Filter rows
          //const rows = Array.from(table.querySelectorAll("tr")).filter(row => 
          //    row.textContent.includes(searchTerm)
          //);
  
          const rows = Array.from(table.querySelectorAll("tr")).filter(row => {
              const text = row.textContent.toLowerCase();
              return text.includes(searchTerm.toLowerCase()) || 
                     text.includes("awards ceremony") ||
                     text.includes("awards") && text.includes("ceremony");
          });
  
          // Add rows to allRows array and mark rows from the second URL
          rows.forEach((row, index) => {
              if (rowSource === 1) {
                  row.className = "table-primary"; // Replace current classes with "table-primary" for rows from the second URL
              }
              allRows.push(row);
          });
  
          rowSource++; // Increment to mark the next URL's rows
      }
  
      // Sort rows by time (3rd <td> which contains <time>)
      allRows.sort((rowA, rowB) => {
          const timeA = getTimeFromRow(rowA);
          const timeB = getTimeFromRow(rowB);
          return timeA - timeB;
      });
  
      // Display the results
      displayResults(allRows);
  } catch (error) {
      console.error("Error fetching data:", error);
      document.getElementById("filtered-results").innerHTML = `<p>Error fetching data.</p>`;
  } finally {
      // Re-enable the button after processing
      $("button").prop("disabled", false).text("Fetch Data"); // Restore the button text
  }
}

function getTimeFromRow(row) {
    const columns = row.querySelectorAll("td");
    if (columns.length < 3) return 0; // Ensure there's a 3rd column

    const timeElement = columns[2].querySelector("time"); // Extract <time> element
    if (!timeElement) return 0; // Fallback if no <time> tag is found

    const timeText = timeElement.textContent.trim();
    const [hours, minutes] = timeText.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return 0; // Fallback if time is invalid

    return new Date(1970, 0, 1, hours, minutes).getTime(); // Convert to timestamp
}

function displayResults(rows) {
    const resultsContainer = document.getElementById("filtered-results");

    if (rows.length === 0) {
        resultsContainer.innerHTML = "<p>No matching rows found.</p>";
        return;
    }

    // Create a new table with sorted & merged rows
    const tableHTML = `
        <table class="table table-bordered hide-column-2">
            <thead>
                <tr>
                    <th scope="col">#</th>
                    <th scope="col">Seq.</th>
                    <th scope="col">Start</th>
                    <th scope="col">Category</th>
                    <th scope="col">Studio</th>
                    <th scope="col">Group Name</th>
                </tr>
            </thead>
            <tbody>
                ${rows.map(row => row.outerHTML).join("")}
            </tbody>
        </table>
    `;

    resultsContainer.innerHTML = tableHTML;

    $("#filtered-results tbody tr").each(function() {
        const $row = $(this);
        const text = $row.text().toLowerCase();
        if (text.includes("awards") && text.includes("ceremony")) {
            $row.addClass("table-warning");     // or table-info, table-success, etc.
        }
    });
    // Remove the second column and all attributes from rows and cells
    $("table tbody tr").each(function() {
        //$(this).find("td:nth-child(2)").remove(); // Remove the second <td> in each row
        //$(this).removeAttr(); // Remove all attributes from the <tr> element
    });

    $("table tbody td").each(function() {
        $(this).removeAttr(); // Remove all attributes from <td> elements
    });
    addTableSearch();
}

function addTableSearch() {
    const searchInput = document.getElementById("searchInput");
    const clearBtn    = document.getElementById("clearSearch");
    const table       = document.querySelector("#filtered-results table");

    if (!searchInput || !table) return;

    function filterTable() {
        const filterValue = searchInput.value.trim().toLowerCase();
        const rows = table.querySelectorAll("tbody tr");

        rows.forEach(row => {
            const rowText = row.textContent.toLowerCase();
            if (filterValue === "") {
                row.style.display = "";           // show all
            } else {
                row.style.display = rowText.includes(filterValue) ? "": "none";
            }
        });
    }

    searchInput.addEventListener("input", filterTable);
    
    clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        filterTable();
    });

    // Optional: trigger once on load (in case you want the default filter)
    // filterTable();
}

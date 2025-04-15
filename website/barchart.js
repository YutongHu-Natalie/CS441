let margin = { top: 50, right: 40, bottom: 70, left: 50 };
const width = 650, height = 400;
const basePath = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? ""
    : "/CS441";

// Store the original data for filtering
let allBirthRateData = [];
let allLiteracyData = [];
let selectedCountries = new Set(); // To store user's country selections
const MAX_SELECTED_COUNTRIES = 5;





function initialiseSVG(containerId) {
    d3.select(containerId).selectAll("*").remove();
    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    
    let margin_left = containerId == "#abrbarchart" ? margin.left + 100 : margin.left;
    const chart = svg.append("g")
        .attr("transform", `translate(${margin_left}, ${margin.top})`)
        .attr("id", "abrchart");

    chart.append("g").attr("class", "x-axis");
    chart.append("g").attr("class", "y-axis");
    return { svg, chart };
    
}

function processLiteracyData(data) {
    const countryMap = new Map();

    data.forEach(d => {
        const country = d["Geographic Area Name"];
        const sex = d["Sex Code"];
        const value = +d["Value(%)"];

        if (!countryMap.has(country)) {
            countryMap.set(country, {});
        }
        countryMap.get(country)[sex] = value;
    });

    // Compute gender disparity (Male - Female)
    let disparityData = [];
    countryMap.forEach((values, country) => {
        if ("F" in values && "M" in values) {
            disparityData.push({ country, disparity: values.M - values.F });
        }
    });

    return disparityData;
}

function processBirthRateData(data) {
    return data.map(d => ({
        country: d["Geographic Area Name"],
        value: +d["Value(per 1,000 population)"]
    }));
}

// Modified to handle user selections
function selectTopOrRandom(data, key, count = 5) {
    // If user has selected countries, filter for those
    if (selectedCountries.size > 0) {
        const filteredData = data.filter(d => selectedCountries.has(d.country));
        return filteredData;
    }
    
    // Otherwise, use the default behavior
    return data.length > count
        ? data.sort((a, b) => b[key] - a[key]).slice(0, count) // Top 5
        : d3.shuffle(data).slice(0, count); // Random 5 if less data
}

// Create the country selector UI
function createCountrySelector(data, containerId, valueKey) {
    // Check if selector already exists to avoid duplication
    const existingSelector = document.getElementById(`${containerId.substring(1)}-selector`);
    if (existingSelector) return;
    
    // Get the visualization container instead of the SVG element
    const vizContainer = document.querySelector('.visualization-container');
    if (!vizContainer) {
        console.error('Visualization container not found');
        return;
    }
    
    // Create the container for the selector
    const selectorContainer = document.createElement("div");
    selectorContainer.id = `${containerId.substring(1)}-selector`;
    selectorContainer.className = "country-selector";
    selectorContainer.style.position = "absolute";
    selectorContainer.style.top = (window.innerHeight/10) + "px";
    selectorContainer.style.right = "60px";
    selectorContainer.style.background = "rgba(255, 255, 255, 0.9)";
    selectorContainer.style.padding = "10px";
    selectorContainer.style.borderRadius = "5px";
    selectorContainer.style.boxShadow = "0 0 10px rgba(0,0,0,0.1)";
    selectorContainer.style.zIndex = "1001"; // Higher than other elements
    selectorContainer.style.maxHeight = "300px";
    selectorContainer.style.overflow = "auto";
    selectorContainer.style.width = "250px";

    // Add header
    const header = document.createElement("h3");
    header.textContent = "Select Countries (max 5)";
    header.style.marginBottom = "10px";
    header.style.fontSize = "14px";
    header.style.color = "#333";
    selectorContainer.appendChild(header);
    
    // Create search box
    const searchContainer = document.createElement("div");
    searchContainer.style.marginBottom = "10px";
    
    const searchInput = document.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Search countries...";
    searchInput.style.width = "100%";
    searchInput.style.padding = "5px";
    searchInput.style.marginBottom = "10px";
    searchInput.style.border = "1px solid #ccc";
    searchInput.style.borderRadius = "4px";
    
    searchContainer.appendChild(searchInput);
    selectorContainer.appendChild(searchContainer);
    
    // Create the country list container
    const countryListContainer = document.createElement("div");
    countryListContainer.className = "country-list";
    countryListContainer.style.maxHeight = "200px";
    countryListContainer.style.overflowY = "auto";
    selectorContainer.appendChild(countryListContainer);
    
    // Get all country names for this visualization
    const allCountries = data.map(d => d.country).sort();
    
    // Add country checkboxes
    function renderCountryList(searchTerm = "") {
        countryListContainer.innerHTML = ""; // Clear existing list
        
        const filteredCountries = searchTerm 
            ? allCountries.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase()))
            : allCountries;
        
        filteredCountries.forEach(country => {
            const countryOption = document.createElement("div");
            countryOption.style.display = "flex";
            countryOption.style.alignItems = "center";
            countryOption.style.marginBottom = "5px";
            
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.id = `${containerId.substring(1)}-${country.replace(/\s+/g, '-')}`;
            checkbox.value = country;
            checkbox.checked = selectedCountries.has(country);
            checkbox.style.marginRight = "5px";
            
            checkbox.addEventListener('change', function() {
                if (this.checked) {
                    // Check if we've reached the maximum
                    if (selectedCountries.size >= MAX_SELECTED_COUNTRIES) {
                        alert(`You can select maximum ${MAX_SELECTED_COUNTRIES} countries.`);
                        this.checked = false;
                        return;
                    }
                    selectedCountries.add(country);
                } else {
                    selectedCountries.delete(country);
                }
                
                // Re-render the chart
                updateChart(containerId, valueKey);
            });
            
            const label = document.createElement("label");
            label.htmlFor = checkbox.id;
            label.textContent = country;
            label.style.fontSize = "12px";
            label.style.cursor = "pointer";
            
            countryOption.appendChild(checkbox);
            countryOption.appendChild(label);
            countryListContainer.appendChild(countryOption);
        });
        
        // Message if no countries match search
        if (filteredCountries.length === 0) {
            const noResults = document.createElement("p");
            noResults.textContent = "No countries found matching your search.";
            noResults.style.fontSize = "12px";
            noResults.style.color = "#666";
            noResults.style.fontStyle = "italic";
            countryListContainer.appendChild(noResults);
        }
    }
    
    // Add search functionality
    searchInput.addEventListener('input', function() {
        renderCountryList(this.value);
    });
    
    // Initially render all countries
    renderCountryList();
    
    // Add clear and reset buttons
    const buttonContainer = document.createElement("div");
    buttonContainer.style.display = "flex";
    buttonContainer.style.justifyContent = "space-between";
    buttonContainer.style.marginTop = "10px";
    
    const clearButton = document.createElement("button");
    clearButton.textContent = "Clear Selection";
    clearButton.style.padding = "5px 10px";
    clearButton.style.backgroundColor = "rgb(230, 178, 186)";
    clearButton.style.color = "rgb(137, 80, 51)";
    clearButton.style.border = "1px solid rgba(137, 80, 51, 0.2)";
    clearButton.style.borderRadius = "4px";
    clearButton.style.cursor = "pointer";
    
    clearButton.addEventListener('click', function() {
        selectedCountries.clear();
        updateChart(containerId, valueKey);
        renderCountryList(searchInput.value); // Update checkbox states
    });
    
    const defaultButton = document.createElement("button");
    defaultButton.textContent = "Default Top 5";
    defaultButton.style.padding = "5px 10px";
    defaultButton.style.backgroundColor = "rgb(230, 178, 186)";
    defaultButton.style.color = "rgb(137, 80, 51)";
    defaultButton.style.border = "1px solid rgba(137, 80, 51, 0.2)";
    defaultButton.style.borderRadius = "4px";
    defaultButton.style.cursor = "pointer";
    
    defaultButton.addEventListener('click', function() {
        selectedCountries.clear();
        updateChart(containerId, valueKey, true);
        renderCountryList(searchInput.value); // Update checkbox states
    });
    
    buttonContainer.appendChild(clearButton);
    buttonContainer.appendChild(defaultButton);
    selectorContainer.appendChild(buttonContainer);
    
    // Add the selector to the visualization container (not the SVG parent)
    vizContainer.appendChild(selectorContainer);
    
    // Initially hide/show based on active state
    selectorContainer.style.display = "none"; // Will be shown by toggleCountrySelector if active
    
    // Function to update the position of the selector
    window.addEventListener('resize', function() {
        const svgrect = document.getElementById("visualization-wrapper").getBoundingClientRect();
        const chartrect = document.getElementById("abrchart").getBoundingClientRect();
        
        
        function windowBigEnough() {
            const selectorWidth = selectorContainer.getBoundingClientRect().width;
            const chartWidth = chartrect.width;
            const svgwidth = svgrect.width;
            if (chartWidth*1.25 + selectorWidth > svgwidth) {
                return false;
            }
            else{
                return true;
            }
    
        }
        if (!windowBigEnough()) {
            selectorContainer.style.top = chartrect.top + chartrect.height + 50 + "px"; // Position below the chart
            selectorContainer.style.left = chartrect.left/2 + "px"; // Align with the left side of the chart
            selectorContainer.style.maxHeight = "220px";
        }
        else{

            selectorContainer.style.position = "absolute";
            selectorContainer.style.top = (window.innerHeight/6) + "px";
            selectorContainer.style.left = "";
            selectorContainer.style.right = "100px";
            selectorContainer.style.maxHeight = "300px";

        }
    });
}

// Function to update chart based on country selection
function updateChart(containerId, valueKey, forceDefault = false) {
    if (containerId === "#ylcbarchart") {
        let dataToShow;
        if (forceDefault || selectedCountries.size === 0) {
            dataToShow = selectTopOrRandom(allLiteracyData, "disparity");
        } else {
            dataToShow = allLiteracyData.filter(d => selectedCountries.has(d.country));
        }
        renderChart(dataToShow, containerId, "Youth Literacy Disparity (M - F)", "disparity", false);
    } else if (containerId === "#abrbarchart") {
        let dataToShow;
        if (forceDefault || selectedCountries.size === 0) {
            dataToShow = selectTopOrRandom(allBirthRateData, "value");
        } else {
            dataToShow = allBirthRateData.filter(d => selectedCountries.has(d.country));
        }
        renderChart(dataToShow, containerId, "Adolescent Birth Rate", "value", true);
    }
}

function renderChart(data, containerId, title, valueKey, isHorizontal) {
    const { svg, chart } = initialiseSVG(containerId);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = isHorizontal
        ? d3.scaleLinear().range([0, chartWidth])
        : d3.scaleBand().range([0, chartWidth]).padding(0.3);

    const yScale = isHorizontal
        ? d3.scaleBand().range([0, chartHeight]).padding(0.3)
        : d3.scaleLinear().range([chartHeight, 0]);

    if (isHorizontal) {
        xScale.domain([0, d3.max(data, d => d[valueKey])]);
        yScale.domain(data.map(d => d.country));
    } else {
        xScale.domain(data.map(d => d.country));
        
        // FIXED: Ensure y-scale properly accounts for negative values
        const minValue = Math.min(0, d3.min(data, d => d[valueKey]));
        const maxValue = Math.max(0, d3.max(data, d => d[valueKey]));
        yScale.domain([minValue, maxValue]).nice();
    }

    chart.select(".x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .transition().duration(500)
        .call(isHorizontal ? d3.axisBottom(xScale) : d3.axisBottom(xScale))
        .selectAll("text")
        .style("fill", "black");

    chart.select(".y-axis")
        .transition().duration(500)
        .call(isHorizontal ? d3.axisLeft(yScale) : d3.axisLeft(yScale))
        .selectAll("text")
        .style("fill", "black");
        
    // Add a zero line if we have negative values (for non-horizontal charts)
    if (!isHorizontal && yScale.domain()[0] < 0) {
        // Remove any existing zero line
        chart.selectAll(".zero-line").remove();
        
        // Add a horizontal line at y=0
        chart.append("line")
            .attr("class", "zero-line")
            .attr("x1", 0)
            .attr("x2", chartWidth)
            .attr("y1", yScale(0))
            .attr("y2", yScale(0))
            .attr("stroke", "#000")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "5,5");
    }

    // Handle bars - modified to properly handle negative values
    const bars = chart.selectAll(".bar").data(data, d => d.country);
    
    if (isHorizontal) {
        // Horizontal bars (no change needed)
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .transition().duration(500)
            .attr("x", 0)
            .attr("y", d => yScale(d.country))
            .attr("width", d => xScale(d[valueKey]))
            .attr("height", yScale.bandwidth())
            .style("fill", "rgb(220, 120, 140)")
            .style("cursor", "pointer");
    } else {
        // Vertical bars with fix for negative values

        const tooltip = d3.select(".tooltip");
        console.log(tooltip)
        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .merge(bars)
            .on("mouseover", function(event, d){
                tooltip.style("visibility", "visible").style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY + 10) + "px").text(`${d.country}: ${d[valueKey].toFixed(1)}%`);

            })
            .on("mousemove", function(event) {
                const [x, y] = d3.pointer(event);
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px");
            })
            .on("mouseout", function(){
                tooltip.style("visibility", "hidden");
            })
            .transition().duration(500)
            .attr("x", d => xScale(d.country))
            .attr("y", d => d[valueKey] < 0 ? yScale(0) : yScale(d[valueKey]))
            .attr("width", xScale.bandwidth())
            .attr("height", d => Math.abs(yScale(d[valueKey]) - yScale(0)))
            .style("fill", d => d[valueKey] < 0 ? "rgb(255, 150, 170)" : "rgb(220, 120, 140)")
            .style("cursor", "pointer")
            ; // Slightly different color for negative values
    }

    // Remove bars that no longer exist
    bars.exit().remove();

    // Add title
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "black").on("mouseover", function(){
            tooltip.style("visibility", "visible")
            .text(`from the UN Statistical Commission’s database pertaining to the Minimum Set of Gender Indicators`);
        })
        .on("mousemove", function(event) {
            const [x, y] = d3.pointer(event); // mouse position
            tooltip.style("left", (event.pageX + 10) + "px") 
            .style("top", (event.pageY + 10) + "px"); 
        })
        .on("mouseout", function(){
            tooltip.style("visibility", "hidden").style("left", (event.pageX + 10) + "px") 
            .style("top", (event.pageY + 10) + "px")
        })
        .text(title);
        
    let x_label_width = isHorizontal ? width / 2 + 50 : width / 2;
    
    // Add x-axis label
    svg.append("text")
        .attr("x", x_label_width)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text(isHorizontal ? "Value(per 1,000 population)" : "Country");

    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text(isHorizontal ? "Country" : valueKey === "disparity" ? "Gender Disparity (%)" : "Value(per 1,000 population)");

    // Update the note text based on selection
    const noteText = selectedCountries.size > 0 
        ? `Showing ${data.length} selected countries` 
        : "*Only the top 5 countries in the descending order will be presented initially by default";
        
    svg.append("text")
        .attr("x", width / 3 +100)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "gray")
        .text(noteText);
        
    // Create the country selector if it doesn't exist
    createCountrySelector(containerId === "#ylcbarchart" ? allLiteracyData : allBirthRateData, containerId, valueKey);
    
    // Make sure to update visibility after creating
    setTimeout(toggleCountrySelector, 50);
}

// Show/hide country selector based on slide visibility
function toggleCountrySelector() {
    const ylcSelector = document.getElementById('ylcbarchart-selector');
    const abrSelector = document.getElementById('abrbarchart-selector');
    
    // Check if charts are active using classList
    const ylcChartActive = document.getElementById('ylcbarchart').classList.contains('active');
    const abrChartActive = document.getElementById('abrbarchart').classList.contains('active');
    
    
    if (ylcSelector) {
        ylcSelector.style.display = ylcChartActive ? "block" : "none";
    }
    
    if (abrSelector) {
        abrSelector.style.display = abrChartActive ? "block" : "none";
    }
}

// Monitor slide changes to toggle the selector visibility
document.addEventListener('slideChanged', function(e) {
    // Small delay to ensure the visualization has been updated
    setTimeout(toggleCountrySelector, 100);
});

// Set up a periodic check for active charts
setInterval(function() {
    toggleCountrySelector();
}, 1000);

// Load datasets and render charts
Promise.all([
    d3.csv(`${basePath}/Data/Adolescent_birth_rate.csv`),
    d3.csv(`${basePath}/Data/final_youth_literacy.csv`)
]).then(([birthData, literacyData]) => {
    // Process and store all data
    allBirthRateData = processBirthRateData(birthData);
    allLiteracyData = processLiteracyData(literacyData);
    
    // Initial rendering with default selection
    const processedBirthData = selectTopOrRandom(allBirthRateData, "value");
    renderChart(processedBirthData, "#abrbarchart", "Adolescent Birth Rate", "value", true);

    const processedLiteracyData = selectTopOrRandom(allLiteracyData, "disparity");
    renderChart(processedLiteracyData, "#ylcbarchart", "Youth Literacy Disparity (M - F)", "disparity", false);
    
    // Check visibility on load
    setTimeout(toggleCountrySelector, 500);
    
    // Also force a check after 2 seconds in case the DOM is still settling
    setTimeout(toggleCountrySelector, 2000);
});

// Debug function to force selector visibility - can be called from console
window.forceSelectorsVisible = function() {
    const ylcSelector = document.getElementById('ylcbarchart-selector');
    const abrSelector = document.getElementById('abrbarchart-selector');
    
    if (ylcSelector) {
        ylcSelector.style.display = "block";
        ylcSelector.style.zIndex = "9999";
    }
    
    if (abrSelector) {
        abrSelector.style.display = "block";
        abrSelector.style.zIndex = "9999";
    }
};
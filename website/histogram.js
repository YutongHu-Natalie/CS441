// Adolescent Birth Rate Histogram using D3
// This script creates a histogram visualization for adolescent birth rates

// Define margins and dimensions
let histMargin = { top: 50, right: 40, bottom: 70, left: 60 };
const histWidth = 650, histHeight = 400;

// Define base path consistent with other visualizations
const baseHistPath = window.location.hostname === "localhost" || 
                    window.location.hostname === "127.0.0.1"
                    ? ""
                    : "/CS441";

// Create the SVG for the histogram
function initialiseHistogramSVG() {
    d3.select("#abr-histogram").selectAll("*").remove();
    console.log('initialize SVG for histogram');
    
    const svg = d3.select("#abr-histogram")
        .append("svg")
        .attr("width", "100%")
        .attr("height", histHeight)
        .attr("viewBox", `0 0 ${histWidth} ${histHeight+ 20}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("display", "block")
        .style("margin", "0 auto"); // Center the SVG horizontally
    
    const chart = svg.append("g")
        .attr("transform", `translate(${histMargin.left}, ${histMargin.top})`);

    chart.append("g").attr("class", "x-axis");
    chart.append("g").attr("class", "y-axis");

    return { svg, chart };
}

// Process birth rate data for histogram
function processBirthRateHistogramData(data) {
    console.log("Processing data for histogram:", data.length, "records");
    
    // Extract birth rate values with country names
    const birthRateData = data.map(d => ({
        country: d["Geographic Area Name"],
        value: +d["Value(per 1,000 population)"]
    })).filter(d => !isNaN(d.value));
    
    // Sort data by value for easier binning
    birthRateData.sort((a, b) => a.value - b.value);
    
    // Define histogram bins
    const minValue = 0;  // Start at 0 for better understanding
    const maxValue = Math.ceil(d3.max(birthRateData, d => d.value) / 10) * 10; // Round up to nearest 10
    const binCount = 10;
    const binWidth = maxValue / binCount;
    
    // Create empty bins
    const bins = Array(binCount).fill(0).map((_, i) => {
        const binStart = i * binWidth;
        const binEnd = (i + 1) * binWidth;
        return {
            binStart,
            binEnd,
            count: 0,
            countries: [] // Array to store countries in this bin
        };
    });
    
    // Assign countries to bins
    birthRateData.forEach(d => {
        for (let i = 0; i < bins.length; i++) {
            if (d.value >= bins[i].binStart && (i === bins.length - 1 || d.value < bins[i].binEnd)) {
                bins[i].count++;
                bins[i].countries.push({
                    name: d.country,
                    value: d.value
                });
                break;
            }
        }
    });
    
    // Sort countries within each bin
    bins.forEach(bin => {
        bin.countries.sort((a, b) => b.value - a.value); // Sort by value descending
    });
    
    console.log("Generated histogram bins:", bins.length);
    return bins;
}

// Render the histogram
function renderHistogram(bins) {
    const { svg, chart } = initialiseHistogramSVG();
    
    const chartWidth = histWidth - histMargin.left - histMargin.right;
    const chartHeight = histHeight - histMargin.top - histMargin.bottom;
    
    // Create tooltip
    const tooltip = d3.select("body").append("div")
        .attr("class", "histogram-tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.8)")
        .style("color", "white")
        .style("padding", "10px")
        .style("border-radius", "5px")
        .style("font-size", "12px")
        .style("max-width", "300px")
        .style("max-height", "250px")
        .style("overflow-y", "auto")
        .style("pointer-events", "none")
        .style("z-index", "9999");
    
    // X scale - for bin positions
    const xScale = d3.scaleLinear()
        .domain([bins[0].binStart, bins[bins.length - 1].binEnd])
        .range([0, chartWidth]);
    
    // Y scale - for bin heights
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.count)])
        .nice()
        .range([chartHeight, 0]);
    
    // X axis
    chart.select(".x-axis")
        .attr("transform", `translate(0, ${chartHeight})`)
        .call(d3.axisBottom(xScale)
            .tickFormat(d => d))
        .selectAll("text")
        .style("text-anchor", "middle")
        .style("fill", "black");
    
    // Y axis
    chart.select(".y-axis")
        .call(d3.axisLeft(yScale)
            .ticks(5)
            .tickFormat(d => Math.round(d)))
        .selectAll("text")
        .style("fill", "black");
    
    // Draw the bars
    chart.selectAll(".histogram-bar")
        .data(bins)
        .enter()
        .append("rect")
        .attr("class", "histogram-bar")
        .attr("x", d => xScale(d.binStart) + 1)
        .attr("y", d => yScale(d.count))
        .attr("width", d => Math.max(0, xScale(d.binEnd) - xScale(d.binStart) - 1))
        .attr("height", d => chartHeight - yScale(d.count))
        .style("fill", "rgb(220, 120, 140)") // Same color as bar chart
        .on("mouseover", function(event, d) {
            // Format tooltip content
            let tooltipContent = `<strong>${d.count} countries</strong> with birth rates between ${d.binStart.toFixed(0)} and ${d.binEnd.toFixed(0)}<br><br>`;
            
            // Add a section showing top countries in this bin
            const countriesToShow = d.countries.slice(0, 10); // Show top 10 countries at most
            
            if (countriesToShow.length > 0) {
                tooltipContent += "<strong>Top countries in this range:</strong><br>";
                countriesToShow.forEach(country => {
                    tooltipContent += `${country.name}: ${country.value.toFixed(1)} per 1,000<br>`;
                });
                
                // Indicate if there are more countries not shown
                if (d.countries.length > 10) {
                    tooltipContent += `<em>...and ${d.countries.length - 10} more countries</em>`;
                }
            } else {
                tooltipContent += "<em>No country data available</em>";
            }
            
            // Show and position the tooltip
            tooltip.html(tooltipContent)
                .style("visibility", "visible")
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            
            // Highlight the bar
            d3.select(this)
                .style("fill", "rgb(180, 90, 110)"); // Darker version of the original color
        })
        .on("mousemove", function(event) {
            // Move tooltip with the mouse
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            // Hide the tooltip
            tooltip.style("visibility", "hidden");
            
            // Restore the original bar color
            d3.select(this)
                .style("fill", "rgb(220, 120, 140)");
        });
    
    // Add bar count labels
    chart.selectAll(".bar-label")
        .data(bins)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.binStart) + (xScale(d.binEnd) - xScale(d.binStart)) / 2)
        .attr("y", d => yScale(d.count) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.count > 0 ? d.count : "")
        .style("fill", "black")
        .style("font-size", "10px")
        .style("opacity", d => d.count > 0 ? 1 : 0);
    
    // Add title
    svg.append("text")
        .attr("x", histWidth / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "black")
        .text("Distribution of Adolescent Birth Rates");
    
    // Add x-axis label
    svg.append("text")
        .attr("x", histWidth / 2)
        .attr("y", histHeight - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text("Birth Rate (per 1,000 population)");
    
    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(histHeight / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text("Number of Countries");
    
    // Add explanation note
    svg.append("text")
        .attr("x", histWidth / 2)
        .attr("y", histHeight+10 )
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("fill", "gray")
        .text("Distribution showing how many countries fall within each birth rate range");
}

// Main function to load data and render histogram
function loadAdolescentBirthRateHistogram() {
    console.log("Loading adolescent birth rate data for histogram");
    
    d3.csv(`${baseHistPath}/Data/Adolescent_birth_rate.csv`)
        .then(data => {
            console.log("Loaded birth rate data:", data.length, "records");
            const histogramBins = processBirthRateHistogramData(data);
            renderHistogram(histogramBins);
        })
        .catch(error => {
            console.error("Error loading adolescent birth rate data:", error);
            // Render a message in the SVG indicating the error
            const svg = d3.select("#abr-histogram")
                .append("svg")
                .attr("width", "100%")
                .attr("height", histHeight);
            
            svg.append("text")
                .attr("x", histWidth / 2)
                .attr("y", histHeight / 2)
                .attr("text-anchor", "middle")
                .style("fill", "red")
                .text("Error loading data. Please check console for details.");
        });
}

// Initialize the histogram when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check if container exists, create it if needed
    if (!document.getElementById("abr-histogram")) {
        console.log("Creating histogram container");
        const container = document.createElement("div");
        container.id = "abr-histogram";
        container.className = "viz-svg";
        
        // Apply styles to center horizontally and position much further downward
        container.style.width = "100%";
        container.style.display = "flex";
        container.style.justifyContent = "center";
        container.style.alignItems = "flex-start"; 
        container.style.paddingTop = "250px"; // Significantly increased padding to push content much lower
        container.style.position = "absolute";
        container.style.top = "0";
        container.style.left = "0";
        container.style.right = "0";
        container.style.bottom = "0";
        
        document.getElementById("visualization-wrapper").appendChild(container);
    }
    
    // Load the histogram data
    loadAdolescentBirthRateHistogram();
    
    // Set up listener for slide changes to show/hide the histogram
    document.addEventListener('slideChanged', function(e) {
        const slideIndex = e.detail.index;
        const histogramElement = document.getElementById("abr-histogram");
        
        // Show histogram on the appropriate slide (adjust index as needed)
        // Currently set to show on the same slide as the adolescent birth rate bar chart
        if (slideIndex === 6) { // Same as abrbarchart in your slides array
            histogramElement.classList.add("active");
        } else {
            histogramElement.classList.remove("active");
        }
    });
});
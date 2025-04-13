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
        .attr("viewBox", `0 0 ${histWidth} ${histHeight}`)
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
    
    // Extract birth rate values
    const birthRates = data.map(d => +d["Value(per 1,000 population)"]).filter(v => !isNaN(v));
    
    // Define histogram function
    const histogram = d3.histogram()
        .domain([0, Math.ceil(d3.max(birthRates) / 10) * 10]) // Round max to next 10
        .thresholds(10); // 10 bins
    
    // Generate bins
    const bins = histogram(birthRates);
    
    console.log("Generated histogram bins:", bins.length);
    return bins;
}

// Render the histogram
function renderHistogram(bins) {
    const { svg, chart } = initialiseHistogramSVG();
    
    const chartWidth = histWidth - histMargin.left - histMargin.right;
    const chartHeight = histHeight - histMargin.top - histMargin.bottom;
    
    // X scale - for bin positions
    const xScale = d3.scaleLinear()
        .domain([bins[0].x0, bins[bins.length - 1].x1])
        .range([0, chartWidth]);
    
    // Y scale - for bin heights
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
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
        .attr("x", d => xScale(d.x0) + 1)
        .attr("y", d => yScale(d.length))
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("height", d => chartHeight - yScale(d.length))
        .style("fill", "rgb(220, 120, 140)"); // Same color as bar chart
    
    // Add bar count labels
    chart.selectAll(".bar-label")
        .data(bins)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => xScale(d.x0) + (xScale(d.x1) - xScale(d.x0)) / 2)
        .attr("y", d => yScale(d.length) - 5)
        .attr("text-anchor", "middle")
        .text(d => d.length > 0 ? d.length : "")
        .style("fill", "black")
        .style("font-size", "10px")
        .style("opacity", d => d.length > 0 ? 1 : 0);
    
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
        .attr("y", histHeight - 30)
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
        container.style.paddingTop = "500px"; // Significantly increased padding to push content much lower
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
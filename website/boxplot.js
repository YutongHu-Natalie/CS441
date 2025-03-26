// Encapsulate everything in an IIFE to avoid global namespace pollution
(function() {
    const basePath = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" 
                ? "" 
                : "/Final_Project";

    // Define chart dimensions
    const margin = { top: 50, right: 40, bottom: 70, left: 200 };
    const width = 700, height = 400;
    
    function initialiseSVG() {
        d3.select("#fampboxw").selectAll("*").remove();
        const svg = d3.select("#fampboxw")
            .append("svg")
            .attr("width", "100%")
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        const chart = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
        chart.append("g").attr("class", "x-axis");
        chart.append("g").attr("class", "y-axis");
        return { svg, chart };
    }
    
    // Draw the boxplots
    function renderChart(data, title, isHorizontal = false) {
        const { svg, chart } = initialiseSVG();
        
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Define color scale for SDG regions
        const colorScale = d3.scaleOrdinal()
            .domain([...new Set(data.map(d => d.country))])
            .range(["#999999", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"]);
        
        const xScale = isHorizontal
            ? d3.scaleLinear().range([0, chartWidth])
            : d3.scaleBand().range([0, chartWidth]).padding(0.3);
        
        const yScale = isHorizontal
            ? d3.scaleBand().range([0, chartHeight]).padding(0.3)
            : d3.scaleLinear().range([chartHeight, 0]);
        
        if (isHorizontal) {
            // For horizontal boxplots
            xScale.domain([
                d3.min(data, d => Math.min(d.min, d.q1)),
                d3.max(data, d => Math.max(d.max, d.q3))
            ]);
            yScale.domain(data.map(d => d.country));
        } else {
            // For vertical boxplots
            xScale.domain(data.map(d => d.country));
            yScale.domain([
                d3.min(data, d => Math.min(d.min, d.q1)),
                d3.max(data, d => Math.max(d.max, d.q3))
            ]);
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
        
        // Create boxplot groups
        const boxplotGroups = chart.selectAll(".boxplot")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "boxplot")
            .attr("transform", d => {
                return isHorizontal
                    ? `translate(0, ${yScale(d.country) + yScale.bandwidth()/2})`
                    : `translate(${xScale(d.country) + xScale.bandwidth()/2}, 0)`;
            });
        
        if (isHorizontal) {
            // Draw horizontal boxplots
            
            // Draw the main box
            boxplotGroups.append("rect")
                .attr("x", d => xScale(d.q1))
                .attr("y", -10)
                .attr("width", d => xScale(d.q3) - xScale(d.q1))
                .attr("height", 20)
                .attr("fill", d => colorScale(d.country))
                .attr("opacity", 0.7);
                
            // Draw the median line
            boxplotGroups.append("line")
                .attr("x1", d => xScale(d.median))
                .attr("x2", d => xScale(d.median))
                .attr("y1", -10)
                .attr("y2", 10)
                .attr("stroke", "white")
                .attr("stroke-width", 2);
                
            // Draw min line
            boxplotGroups.append("line")
                .attr("x1", d => xScale(d.min))
                .attr("x2", d => xScale(d.min))
                .attr("y1", -5)
                .attr("y2", 5)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
                
            // Draw max line
            boxplotGroups.append("line")
                .attr("x1", d => xScale(d.max))
                .attr("x2", d => xScale(d.max))
                .attr("y1", -5)
                .attr("y2", 5)
                .attr("stroke", "black")
                .attr("stroke-width", 1);
                
            // Draw the whiskers
            boxplotGroups.append("line")
                .attr("x1", d => xScale(d.min))
                .attr("x2", d => xScale(d.q1))
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");
                
            boxplotGroups.append("line")
                .attr("x1", d => xScale(d.q3))
                .attr("x2", d => xScale(d.max))
                .attr("y1", 0)
                .attr("y2", 0)
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");
                
        } else {
            // Draw vertical boxplots
            
            // Draw the main box
            boxplotGroups.append("rect")
                .attr("x", -10)
                .attr("y", d => yScale(d.q3))
                .attr("width", 20)
                .attr("height", d => yScale(d.q1) - yScale(d.q3))
                .attr("fill", d => colorScale(d.country))
                .attr("opacity", 0.7);
                
            // Draw the median line
            boxplotGroups.append("line")
                .attr("x1", -10)
                .attr("x2", 10)
                .attr("y1", d => yScale(d.median))
                .attr("y2", d => yScale(d.median))
                .attr("stroke", "white")
                .attr("stroke-width", 2);
                
            // Draw min line
            boxplotGroups.append("line")
                .attr("x1", -5)
                .attr("x2", 5)
                .attr("y1", d => yScale(d.max))
                .attr("y2", d => yScale(d.max))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
                
            // Draw max line
            boxplotGroups.append("line")
                .attr("x1", -5)
                .attr("x2", 5)
                .attr("y1", d => yScale(d.min))
                .attr("y2", d => yScale(d.min))
                .attr("stroke", "black")
                .attr("stroke-width", 1);
                
            // Draw the whiskers
            boxplotGroups.append("line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", d => yScale(d.max))
                .attr("y2", d => yScale(d.q3))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");
                
            boxplotGroups.append("line")
                .attr("x1", 0)
                .attr("x2", 0)
                .attr("y1", d => yScale(d.q1))
                .attr("y2", d => yScale(d.min))
                .attr("stroke", "black")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");
        }
        
        // Add title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("fill", "black")
            .text(title);
        
        // Add x-axis label
        svg.append("text")
            .attr("x", width/2 + 50)
            .attr("y", height-10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text(isHorizontal ? "Value (%)" : "SDG Region");
        
        // Add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text(isHorizontal ? "SDG Region" : "Value (%)");
    }
    
    function processData(rawData) {
        // Group data by SDG Region to create boxplots
        const groupedData = d3.group(rawData, d => d["SDG Region"]);
        
        // Process each region group to calculate boxplot statistics
        const boxplotData = Array.from(groupedData, ([region, values]) => {
            // Extract numeric values
            const numericValues = values.map(d => +d["Value(%)"]).filter(v => !isNaN(v)).sort(d3.ascending);
            
            // Calculate statistics for boxplot
            const q1 = d3.quantile(numericValues, 0.25);
            const median = d3.quantile(numericValues, 0.5);
            const q3 = d3.quantile(numericValues, 0.75);
            const interQuantileRange = q3 - q1;
            const min = Math.max(d3.min(numericValues), q1 - 1.5 * interQuantileRange);
            const max = Math.min(d3.max(numericValues), q3 + 1.5 * interQuantileRange);
            
            return {
                country: region, // Using SDG Region as the category
                value: median, // Using median as the representative value
                q1: q1,
                median: median,
                q3: q3,
                interQuantileRange: interQuantileRange,
                min: min,
                max: max,
                outliers: numericValues.filter(v => v < min || v > max)
            };
        });
        
        return boxplotData;
    }
    
    async function initialize() {
        try {
            const data = await d3.csv(`${basePath}/Data/final_family_planning.csv`);
            const processedData = processData(data);
            renderChart(processedData, "Female Access to Family Planning by SDG Region", true);
        } catch (error) {
            console.error("Error loading or processing data:", error);
        }
    }
    
    // Call initialize to load data and render chart
    initialize();
    
})(); // End of IIFE
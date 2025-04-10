// boxplot-map-interaction.js - Combines the boxplot and map visualizations with interactive highlighting

// Self-executing function to avoid global namespace pollution
(function() {
    // Define base path for consistency with other files
    const basePath = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" 
                ? "" 
                : "/CS441";

    // Define shared dimensions for better layout control
    const boxplotMargin = { top: 50, right: 40, bottom: 70, left: 200 };
    const boxplotWidth = 700, boxplotHeight = 350; // Reduced height for boxplot
    
    const mapMargin = { top: 20, right: 40, bottom: 10, left: 50 };
    const mapWidth = 1000, mapHeight = 500; // Dimensions for map
    
    // Define projections for the map
    const myProjection = d3.geoNaturalEarth1()
        .scale(mapWidth / 8.5)
        .translate([mapWidth / 3, mapHeight / 3]);
    const path = d3.geoPath().projection(myProjection);
    const graticule = d3.geoGraticule();
    
    // Shared state
    let famPlanData;
    let worldData;
    let boxplotData;
    let selectedRegion = null;
    
    // Create color scales
    const boxplotColorScale = d3.scaleOrdinal()
        .range(["#999999", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"]);
    
    let mapColorScale;
    
    // Reference to SVG elements
    const boxplotSvg = d3.select("#fampboxw");
    if (!boxplotSvg.classed('active')) {
        return;
      }
    const mapSvg = d3.select("#famplanmap");
    
    // Main initialization function
    async function initialize() {
        try {
            // Load data
            await loadData();
            
            // Process data for boxplot
            boxplotData = processBoxplotData(famPlanData);
            
            // Set domain for color scale based on unique SDG regions
            boxplotColorScale.domain([...new Set(famPlanData.map(d => d["SDG Region"]))]);
            
            // Create map color scale
            mapColorScale = d3.scaleSequential(d3.interpolateRgb("white", "#AA336A"))
                .domain([0, d3.max(famPlanData, d => parseFloat(d['Value(%)']))]);
            
            // Initialize visualizations
            initializeBoxplotSVG();
            initializeMapSVG();
            
            // Render visualizations
            renderBoxplot(boxplotData);
            renderMap(worldData);
            
            // Make the visualizations visible
            boxplotSvg.style("display", "block");
            mapSvg.style("display", "block");
            
            // Log for debugging
            console.log("Boxplot-map interactive visualization initialized");
        } catch (error) {
            console.error("Error initializing visualizations:", error);
        }
    }
    
    // Load required data
    async function loadData() {
        try {
            // Load family planning data
            const famPlanResponse = await fetch(`${basePath}/Data/final_family_planning.csv`);
            const famPlanText = await famPlanResponse.text();
            famPlanData = d3.csvParse(famPlanText);
            
            // Clean up data
            famPlanData.forEach(d => {
                d['Value(%)'] = parseFloat(d['Value(%)']);
                if (isNaN(d['Value(%)'])) {
                    d['Value(%)'] = 0;
                }
            });
            
            // Load world map data
            const worldResponse = await fetch("https://unpkg.com/world-atlas@1.1.4/world/110m.json");
            worldData = await worldResponse.json();
            
            return true;
        } catch (error) {
            console.error("Error loading data:", error);
            return false;
        }
    }
    
    // Process data for boxplot
    function processBoxplotData(rawData) {
        // Group data by SDG Region
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
                region: region,
                value: median,
                q1: q1,
                median: median,
                q3: q3,
                interQuantileRange: interQuantileRange,
                min: min,
                max: max,
                outliers: numericValues.filter(v => v < min || v > max),
                // Store all countries in this region for highlighting
                countries: values.map(d => parseInt(d["Geographic Area Code"]))
            };
        });
        
        return boxplotData;
    }
    
    // Initialize boxplot SVG
    function initializeBoxplotSVG() {
        if (!boxplotSvg.classed('active')) {
  return;
}
        boxplotSvg.selectAll("*").remove();
        
        boxplotSvg
            .attr("width", "100%")
            .attr("height", boxplotHeight)
            .attr("viewBox", `0 0 ${boxplotWidth} ${boxplotHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        
        const chart = boxplotSvg.append("g")
            .attr("transform", `translate(${boxplotMargin.left}, ${boxplotMargin.top})`);
        
        chart.append("g").attr("class", "x-axis");
        chart.append("g").attr("class", "y-axis");
        
        // Add title
        boxplotSvg.append("text")
            .attr("class", "boxplot-title")
            .attr("x", boxplotWidth / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("fill", "black")
            .text("Female Access to Family Planning by SDG Region");
            
        console.log("Boxplot SVG initialized");
    }
    
    // Initialize map SVG
    function initializeMapSVG() {
        mapSvg.selectAll("*").remove();
        
        mapSvg
            .attr("width", "100%")
            .attr("height", mapHeight)
            .attr("viewBox", `0 0 ${mapWidth} ${mapHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        
        // Create defs for patterns
        const defs = mapSvg.append("defs");
        
        // Add diagonal pattern for countries with no data
        defs.append("pattern")
            .attr("id", "diagonal-stripes")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", 10)
            .attr("height", 10)
            .append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", "#fff");
        
        defs.select("#diagonal-stripes")
            .append("path")
            .attr("d", "M 0 0 L 10 10")
            .attr("stroke", "#000") 
            .attr("stroke-width", 0.5);
            
        // Add map title
        mapSvg.append("text")
            .attr("class", "map-title")
            .attr("x", mapWidth / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("fill", "black")
            .text("% of Women with Access to Adequate Family Planning");
            
        // Container for the map
        mapSvg.append("g")
            .attr("class", "map-container")
            .attr("transform", `translate(0, 50)`);
            
        console.log("Map SVG initialized");
    }
    
    // Render boxplot
    function renderBoxplot(data) {
        console.log("Rendering boxplot with data:", data);
        const chart = boxplotSvg.select("g");
        const chartWidth = boxplotWidth - boxplotMargin.left - boxplotMargin.right;
        const chartHeight = boxplotHeight - boxplotMargin.top - boxplotMargin.bottom;
        
        // Set up scales
        const xScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => Math.min(d.min, d.q1)),
                d3.max(data, d => Math.max(d.max, d.q3))
            ])
            .range([0, chartWidth]);
            
        const yScale = d3.scaleBand()
            .domain(data.map(d => d.region))
            .range([0, chartHeight])
            .padding(0.3);
        
        // Update axes
        chart.select(".x-axis")
            .attr("transform", `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .style("fill", "black");
            
        chart.select(".y-axis")
            .call(d3.axisLeft(yScale))
            .selectAll("text")
            .style("fill", "black");
        
        // Create boxplot groups
        const boxplotGroups = chart.selectAll(".boxplot-group")
            .data(data)
            .enter()
            .append("g")
            .attr("class", "boxplot-group")
            .attr("data-region", d => d.region)
            .attr("transform", d => `translate(0, ${yScale(d.region) + yScale.bandwidth()/2})`)
            .style("cursor", "pointer")
            .on("click", function(event, d) {
                event.preventDefault();
                // Toggle selection
                if (selectedRegion === d.region) {
                    selectedRegion = null;
                    resetMapHighlighting();
                } else {
                    selectedRegion = d.region;
                    highlightRegionOnMap(d.region);
                }
                updateBoxplotSelection();
                console.log("Selected region:", selectedRegion);
            });
            
        // Draw the main box
        boxplotGroups.append("rect")
            .attr("class", "boxplot-box")
            .attr("x", d => xScale(d.q1))
            .attr("y", -10)
            .attr("width", d => xScale(d.q3) - xScale(d.q1))
            .attr("height", 20)
            .attr("fill", d => boxplotColorScale(d.region))
            .attr("opacity", 0.7);
            
        // Draw the median line
        boxplotGroups.append("line")
            .attr("class", "boxplot-median")
            .attr("x1", d => xScale(d.median))
            .attr("x2", d => xScale(d.median))
            .attr("y1", -10)
            .attr("y2", 10)
            .attr("stroke", "white")
            .attr("stroke-width", 2);
            
        // Draw min line
        boxplotGroups.append("line")
            .attr("class", "boxplot-min")
            .attr("x1", d => xScale(d.min))
            .attr("x2", d => xScale(d.min))
            .attr("y1", -5)
            .attr("y2", 5)
            .attr("stroke", "black")
            .attr("stroke-width", 1);
            
        // Draw max line
        boxplotGroups.append("line")
            .attr("class", "boxplot-max")
            .attr("x1", d => xScale(d.max))
            .attr("x2", d => xScale(d.max))
            .attr("y1", -5)
            .attr("y2", 5)
            .attr("stroke", "black")
            .attr("stroke-width", 1);
            
        // Draw the whiskers
        boxplotGroups.append("line")
            .attr("class", "boxplot-whisker")
            .attr("x1", d => xScale(d.min))
            .attr("x2", d => xScale(d.q1))
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
            
        boxplotGroups.append("line")
            .attr("class", "boxplot-whisker")
            .attr("x1", d => xScale(d.q3))
            .attr("x2", d => xScale(d.max))
            .attr("y1", 0)
            .attr("y2", 0)
            .attr("stroke", "black")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");
            
        // Add hover effect to highlight both boxplot and map
        boxplotGroups
            .on("mouseover", function(event, d) {
                // Highlight boxplot
                d3.select(this).select(".boxplot-box").attr("opacity", 1);
                // Temporarily highlight map
                if (selectedRegion === null) {
                    temporaryHighlightOnMap(d.region);
                }
            })
            .on("mouseout", function(event, d) {
                // Reset boxplot if not selected
                if (selectedRegion !== d.region) {
                    d3.select(this).select(".boxplot-box").attr("opacity", 0.7);
                    // Reset map if no selection
                    if (selectedRegion === null) {
                        resetMapHighlighting();
                    } else {
                        // Reapply selection
                        highlightRegionOnMap(selectedRegion);
                    }
                }
            });
            
        // Add x-axis label
        boxplotSvg.append("text")
            .attr("x", boxplotWidth/2 + 50)
            .attr("y", boxplotHeight-10)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text("Value (%)");
        
        // Add y-axis label
        boxplotSvg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(boxplotHeight / 2))
            .attr("y", 15)
            .attr("text-anchor", "middle")
            .style("font-size", "14px")
            .style("fill", "black")
            .text("SDG Region");
    }
    
    // Render the world map
    function renderMap(world) {
        console.log("Rendering map with world data");
        const mapContainer = mapSvg.select(".map-container");
        
        // Draw graticules
        mapContainer.append("path")
            .datum(graticule)
            .attr("class", "graticule")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#76148e")
            .attr("stroke-width", 0.5);
            
        mapContainer.append("path")
            .datum(graticule.outline)
            .attr("class", "foreground")
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("stroke-width", 1.5);
        
        // Draw countries
        mapContainer.append("g")
            .attr("class", "countries")
            .selectAll("path")
            .data(topojson.feature(world, world.objects.countries).features)
            .enter().append("path")
            .attr("class", d => `country country-${d.id}`)
            .attr("d", path)
            .attr("fill", function(d) {
                const countryData = famPlanData.find(item => 
                    parseInt(item['Geographic Area Code']) === parseInt(d.id));
                if (countryData) {
                    return mapColorScale(countryData['Value(%)']);
                } else {
                    return "url(#diagonal-stripes)";
                }
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 0.5)
            .attr("data-id", d => d.id)
            .attr("data-region", function(d) {
                const countryData = famPlanData.find(item => 
                    parseInt(item['Geographic Area Code']) === parseInt(d.id));
                return countryData ? countryData['SDG Region'] : null;
            });
            
        // Add legend
        const legendWidth = 30;
        const legendHeight = 120;
        
        const legendGroup = mapSvg.append("g")
            .attr("transform", `translate(20, ${mapHeight - 150})`);
            
        legendGroup.append("rect")
            .attr("width", legendWidth*3)
            .attr("height", legendHeight*1.2)
            .style("fill", "#555")
            .style("opacity", "0.5");
            
        // Create legend gradient
        const linearGradient = mapSvg.select("defs").append("linearGradient")
            .attr("id", "map-color-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "0%")
            .attr("y2", "100%");
            
        linearGradient.selectAll("stop")
            .data([
                { offset: 0, color: mapColorScale.range()[0] },
                { offset: 1, color: mapColorScale.range()[1] }
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);
            
        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#map-color-gradient)")
            .attr("transform", `translate(${20}, 10)`);
            
        // Legend title
        legendGroup.append("text")
            .attr("x", 20)
            .attr("y", 0)
            .style("text-anchor", "start")
            .style("font-size", "0.8rem")
            .text("Legend"); 
            
        // Min value
        const minValue = d3.min(famPlanData, d => parseFloat(d['Value(%)']));
        legendGroup.append("text")
            .attr("x", 20 + legendWidth + 5)
            .attr("y", 15)
            .style("text-anchor", "start")
            .style("font-size", "0.8rem")
            .text(minValue + "%"); 
            
        // Max value
        const maxValue = d3.max(famPlanData, d => parseFloat(d['Value(%)']));
        legendGroup.append("text")
            .attr("x", 20 + legendWidth + 5)
            .attr("y", 10 + legendHeight)
            .style("text-anchor", "start")
            .style("font-size", "0.8rem")
            .text(maxValue + "%");
    }
    
    // Update boxplot appearance based on selection
    function updateBoxplotSelection() {
        boxplotSvg.selectAll(".boxplot-group").each(function(d) {
            const boxGroup = d3.select(this);
            const isSelected = selectedRegion === d.region;
            boxGroup.select(".boxplot-box")
                .attr("opacity", isSelected || selectedRegion === null ? 1 : 0.3);
        });
    }
    
    // Highlight a region on the map when boxplot is clicked
    function highlightRegionOnMap(region) {
        console.log("Highlighting region on map:", region);
        // Find all countries in this region
        const regionCountries = boxplotData.find(d => d.region === region)?.countries || [];
        
        // Update all countries
        mapSvg.selectAll(".country").each(function() {
            const country = d3.select(this);
            const countryRegion = country.attr("data-region");
            const countryId = parseInt(country.attr("data-id"));
            
            if (countryRegion === region) {
                // Highlight countries in selected region
                country
                    .style("opacity", 1)
                    .style("stroke", "#000")
                    .style("stroke-width", 1.5);
            } else {
                // Fade other countries
                country
                    .style("opacity", 0.2)
                    .style("stroke", "#fff")
                    .style("stroke-width", 0.5);
            }
        });
    }
    
    // Temporary highlight for hover
    function temporaryHighlightOnMap(region) {
        // Find all countries in this region
        const regionCountries = boxplotData.find(d => d.region === region)?.countries || [];
        
        // Update all countries
        mapSvg.selectAll(".country").each(function() {
            const country = d3.select(this);
            const countryRegion = country.attr("data-region");
            
            if (countryRegion === region) {
                // Highlight countries in hovered region
                country
                    .style("opacity", 1)
                    .style("stroke", "#000")
                    .style("stroke-width", 1);
            } else {
                // Slightly fade other countries
                country
                    .style("opacity", 0.5)
                    .style("stroke", "#fff")
                    .style("stroke-width", 0.5);
            }
        });
    }
    
    // Reset map highlighting
    function resetMapHighlighting() {
        mapSvg.selectAll(".country")
            .style("opacity", 1)
            .style("stroke", "#fff")
            .style("stroke-width", 0.5);
    }
    
    // Initialize the visualizations
    initialize();
    
    // Expose API for external access
    window.boxplotMapInteraction = {
        highlightRegion: function(region) {
            selectedRegion = region;
            updateBoxplotSelection();
            highlightRegionOnMap(region);
        },
        resetHighlighting: function() {
            selectedRegion = null;
            updateBoxplotSelection();
            resetMapHighlighting();
        }
    };
})();
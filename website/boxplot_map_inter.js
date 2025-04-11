// Fixed Interactive Visualization for Boxplot and Map
// This script properly initializes and displays both visualizations

document.addEventListener('DOMContentLoaded', function () {
    // Define base path for consistency with other files
    const basePath = window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1"
        ? ""
        : "/CS441";

    // Create tooltip similar to jiyacode.js
    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background-color", "rgba(0, 0, 0, 0.7)")
        .style("color", "white")
        .style("padding", "8px")
        .style("border-radius", "5px")
        .style("font-size", "0.8rem")
        .style("pointer-events", "none")
        .style("z-index", "9999");

    // Move tooltip with mouse
    d3.select("body").on("mousemove", function (event) {
        tooltip.style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
    });

    // Define shared dimensions for better layout control
    const boxplotMargin = { top: 50, right: 40, bottom: 70, left: 200 };
    const boxplotWidth = 700, boxplotHeight = 350;

    const mapMargin = { top: 20, right: 40, bottom: 10, left: 50 };
    const mapWidth = 1000, mapHeight = 500;

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
    let isInitialized = false;

    // Create color scales
    const boxplotColorScale = d3.scaleOrdinal()
        .range(["#999999", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"]);

    let mapColorScale;

    // Reference to SVG elements - select them every time they're needed to avoid problems
    const getBoxplotSvg = () => d3.select("#fampboxw");
    const getMapSvg = () => d3.select("#famplanmap");

    // Main initialization function
    async function initialize() {
        if (isInitialized) return; // Only initialize once

        try {
            console.log("Initializing boxplot-map interactive visualization");

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

            // Run these in parallel with Promise.all
            Promise.all([
                renderBoxplot(boxplotData),
                renderMap(worldData)
            ]).then(() => {
                console.log("Both visualizations rendered simultaneously");
            });

            // Make the visualizations visible when active
            isInitialized = true;
            console.log("Boxplot-map interactive visualization initialized successfully");

            // Listen for slide changes
            listenForSlideChanges();
        } catch (error) {
            console.error("Error initializing visualizations:", error);
        }
    }

    // Listen for slide changes to show or hide visualizations
    function listenForSlideChanges() {
        // Either use the existing event listener or create a new checking mechanism
        const checkVisibilityInterval = setInterval(() => {
            const boxplotSvg = getBoxplotSvg();
            const mapSvg = getMapSvg();

            if (boxplotSvg.classed('active') || mapSvg.classed('active')) {
                // Ensure both are properly displayed
                if (boxplotSvg.style("display") !== "block") {
                    boxplotSvg.style("display", "block");
                }
                if (mapSvg.style("display") !== "block") {
                    mapSvg.style("display", "block");
                }
            }
        }, 500);

        // Clean up interval after 30 seconds (or when appropriate)
        setTimeout(() => {
            clearInterval(checkVisibilityInterval);
        }, 30000);
    }

    // Load required data
    async function loadData() {
        try {
            console.log("Loading family planning data...");
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

            console.log("Loading world map data...");
            // Load world map data
            const worldResponse = await fetch("https://unpkg.com/world-atlas@1.1.4/world/110m.json");
            worldData = await worldResponse.json();

            console.log("Data loading complete");
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
        const boxplotSvg = getBoxplotSvg();
        console.log("Initializing boxplot SVG");

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
        const mapSvg = getMapSvg();
        console.log("Initializing map SVG");

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
        console.log("Rendering boxplot with data:", data.length, "regions");
        const boxplotSvg = getBoxplotSvg();
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
            .attr("transform", d => `translate(0, ${yScale(d.region) + yScale.bandwidth() / 2})`)
            .style("cursor", "pointer")
            .on("click", function (event, d) {
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
            .on("mouseover", function (event, d) {
                // Highlight boxplot
                d3.select(this).select(".boxplot-box").attr("opacity", 1);

                // Show tooltip with region statistics
                const stats = {
                    min: d3.format(".1f")(d.min),
                    q1: d3.format(".1f")(d.q1),
                    median: d3.format(".1f")(d.median),
                    q3: d3.format(".1f")(d.q3),
                    max: d3.format(".1f")(d.max)
                };

                tooltip.style("visibility", "visible")
                    .html(`
            <strong>${d.region}</strong><br>
            Median: ${stats.median}%<br>
            Range: ${stats.min}% - ${stats.max}%<br>
            Q1: ${stats.q1}%, Q3: ${stats.q3}%
          `);

                // Temporarily highlight map
                if (selectedRegion === null) {
                    temporaryHighlightOnMap(d.region);
                }
            })
            .on("mouseout", function (event, d) {
                // Hide tooltip
                tooltip.style("visibility", "hidden");

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
            .attr("x", boxplotWidth / 2 + 50)
            .attr("y", boxplotHeight - 10)
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
        const mapSvg = getMapSvg();
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
            .attr("fill", function (d) {
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
            .attr("data-region", function (d) {
                const countryData = famPlanData.find(item =>
                    parseInt(item['Geographic Area Code']) === parseInt(d.id));
                return countryData ? countryData['SDG Region'] : null;
            })
            .on("mouseover", function (event, d) {
                // Find country data for tooltip
                const countryData = famPlanData.find(item =>
                    parseInt(item['Geographic Area Code']) === parseInt(d.id));

                if (countryData) {
                    // Show tooltip with country information
                    tooltip.style("visibility", "visible")
                        .html(`
              <strong>${countryData['Geographic Area Name']}</strong><br>
              Family Planning Access: ${countryData['Value(%)']}%<br>
              Region: ${countryData['SDG Region']}
            `);

                    // Highlight country
                    d3.select(this)
                        .attr("stroke", "#000")
                        .attr("stroke-width", 2);
                }
            })
            .on("mouseout", function () {
                // Hide tooltip
                tooltip.style("visibility", "hidden");

                // Remove highlight unless country is part of selected region
                if (!selectedRegion || d3.select(this).attr("data-region") !== selectedRegion) {
                    d3.select(this)
                        .attr("stroke", "#fff")
                        .attr("stroke-width", 0.5);
                }
            })
            .on("click", function (event, d) {
                const countryData = famPlanData.find(item =>
                    parseInt(item['Geographic Area Code']) === parseInt(d.id));

                if (countryData) {
                    const region = countryData['SDG Region'];
                    // Toggle region selection
                    if (selectedRegion === region) {
                        selectedRegion = null;
                        resetMapHighlighting();
                    } else {
                        selectedRegion = region;
                        highlightRegionOnMap(region);
                    }
                    updateBoxplotSelection();
                }
            });

        // Add legend
        const legendWidth = 30;
        const legendHeight = 120;

        const legendGroup = mapSvg.append("g")
            .attr("transform", `translate(20, ${mapHeight - 150})`);

        legendGroup.append("rect")
            .attr("width", legendWidth * 3)
            .attr("height", legendHeight * 1.2)
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
        const boxplotSvg = getBoxplotSvg();
        boxplotSvg.selectAll(".boxplot-group").each(function (d) {
            const boxGroup = d3.select(this);
            const isSelected = selectedRegion === d.region;
            boxGroup.select(".boxplot-box")
                .attr("opacity", isSelected || selectedRegion === null ? 1 : 0.3);
        });
    }

    // Highlight a region on the map when boxplot is clicked
    function highlightRegionOnMap(region) {
        console.log("Highlighting region on map:", region);
        const mapSvg = getMapSvg();

        // Find all countries in this region
        const regionCountries = boxplotData.find(d => d.region === region)?.countries || [];

        // Update all countries
        mapSvg.selectAll(".country").each(function () {
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
        const mapSvg = getMapSvg();

        // Find all countries in this region
        const regionCountries = boxplotData.find(d => d.region === region)?.countries || [];

        // Update all countries
        mapSvg.selectAll(".country").each(function () {
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
        const mapSvg = getMapSvg();
        mapSvg.selectAll(".country")
            .style("opacity", 1)
            .style("stroke", "#fff")
            .style("stroke-width", 0.5);
    }

    // Check for active class and initialize on demand
    function checkAndInitialize() {
        const boxplotSvg = getBoxplotSvg();
        const mapSvg = getMapSvg();

        if ((boxplotSvg.classed('active') || mapSvg.classed('active')) && !isInitialized) {
            console.log("Boxplot or map is active, initializing...");
            initialize();
        }
    }

    // Set up an interval to check if the slide with our visualizations is active
    const checkInterval = setInterval(checkAndInitialize, 500);

    // Listen for slide changes via the custom event if available
    document.addEventListener('slideChanged', function (e) {
        const slideIndex = e.detail.index;
        // Check slide 4 (index 4) for the family planning visualizations
        if (slideIndex === 4) {  // Adjust index if needed
            console.log("Slide changed to family planning visualization");
            checkAndInitialize();
        }
    });

    // Clean up the interval after 30 seconds (or when navigation is done)
    setTimeout(() => {
        clearInterval(checkInterval);
    }, 30000);

    // Expose API for external access
    window.boxplotMapInteraction = {
        initialize: initialize,
        highlightRegion: function (region) {
            selectedRegion = region;
            updateBoxplotSelection();
            highlightRegionOnMap(region);
        },
        resetHighlighting: function () {
            selectedRegion = null;
            updateBoxplotSelection();
            resetMapHighlighting();
        }
    };

    // Initial check
    checkAndInitialize();
});
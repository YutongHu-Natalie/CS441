/*
NEXT LINES ARE ALL FOR THE SUBJECTED VIOLENCE MAP
*/
const basePath1 = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" 
                ? "" 
                : "/CS441";


let mapsvg;

    // tooltip
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
        .style("z-index", "9999");;
        d3.select("body").on("mousemove", function(event) { //move it to where the mouse is
            tooltip.style("left", (event.pageX + 10) + "px") 
                   .style("top", (event.pageY + 10) + "px"); 
        });

// CHANGE 1: Reduced map dimensions for better display
let mapwidth = 1000;
let mapheight = 500;

const myProjection = d3.geoNaturalEarth1()
    // CHANGE 2: Scale the projection to fit the reduced dimensions
    .scale(mapwidth / 7.5)
    .translate([mapwidth / 3, mapheight / 3]);
const path = d3.geoPath().projection(myProjection);
const graticule = d3.geoGraticule();

let dvMapData;
let adolBirthData;
let famPlanData;
let currDat;

let dvMapSvg = d3.select("#dvmap");

let dvMapTrue = false;

async function loadDVMapData(){
    await d3.csv(`${basePath1}/Data/Subjected_violence.csv`).then(data => {
        dvMapData = data;
    });
}

async function initializeMapSVG() {
    await loadDVMapData();
    
    dvMapTrue = true;
    
    // Set responsive attributes for violence map
    dvMapSvg.attr("width", "100%")
        .attr("height", mapheight)
        .attr("viewBox", `0 0 ${mapwidth} ${mapheight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
        
    dvColorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([0, d3.max(dvMapData, d => parseFloat(d['Value(%)']))]);

    // world map for subjected violence
    await d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json").then(world=> drawMap(world, dvMapSvg, dvMapData, dvColorScale))
    .catch((err) => console.error("Error loading map data:", err));
}

function drawMap(world, mapsvg, mapdata, mapcolorscale) {
    mapdata.forEach(d => {
        d['Value(%)'] = parseFloat(d['Value(%)']); 
        if (isNaN(d['Value(%)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(%)']}`);
        }
    });

    let titleMap;
    if(dvMapTrue){
        titleMap = "% of Women That Have Been Subjected to Intimate Partner Violence";
    }  
    else{
        titleMap = "% of Women with Access to Adequate Family Planning";
    } 

    // clear prev content
    mapsvg.selectAll("*").remove();

    //defs (for definition) element to your SVG
    var defs = mapsvg.append("defs");

    //title
    // Adjusted title positioning
    mapsvg.append("text")
    .style("background-color", "transparent")
    .attr("x", mapwidth/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "1.2rem")
    .text(titleMap); 
    
    // create map group to hold all map elements
    // Create a group for the map content with proper positioning
    const svgWidth = parseInt(mapsvg.style("width"));  // actual width of the SVG container
    const svgHeight = parseInt(mapsvg.style("height"));  // actual height of the SVG container

    // Translate the map group so it's centered in the SVG container
    const translateX = -(svgWidth - mapwidth) / 5;
    const translateY = -(svgHeight - mapheight) / 4;

    const mapGroup = mapsvg.append("g")
        .attr("transform", `translate(${translateX}, ${translateY})`);
        
    // graticules
    //for the lat/long lines
    mapGroup.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path);

    //for outline of whole map
    mapGroup.append("path")
      .datum(graticule.outline)
      .attr("class", "foreground")
      .attr("d", path);

    //diagonal fill for non-existent data
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

    let selectedCountries = []
    let countriesWithValueOverTwenty = dvMapData.filter(country => {
        return parseFloat(country['Value(%)']) > 20;
      });
    // countries topo-json
    mapGroup.append("g")
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", function(d){
        let countryData = mapdata.find(item=>parseInt(item['Geographic Area Code']) === parseInt(d.id));
        if (countryData){
            return mapcolorscale(countryData['Value(%)']);
        } else {
            return "url(#diagonal-stripes)";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("click", function(event, d) {
        let countryData = mapdata.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
        if(dvMapSvg.classed("active")){
            if (countryData) {
                // show the tooltip and update its content
                tooltip.style("visibility", "visible")
                    .text(`${countryData['Geographic Area Name']}: ${countryData['Value(%)']}%`);
        
                // toggle highlight (if already highlighted, remove the highlight)
                if (d3.select(this).classed("highlighted")) {
                    d3.select(this)
                        .classed("highlighted", false)
                        .classed("unhighlighted", true)
                        .attr("stroke", "#fff") // revert to original stroke color
                        .attr("stroke-width", 0.5); // revert to original stroke width
                        selectedCountries = selectedCountries.filter(country => country !== countryData['Geographic Area Name']);
                } else {
                    d3.select(this)
                        .classed("unhighlighted", false)
                        .classed("highlighted", true) 
                        .attr("stroke", "red") 
                        .attr("stroke-width", 2); 
                        selectedCountries.push(countryData['Geographic Area Name']);
                }
            }
            console.log(selectedCountries)

        }
    })
    .on("mouseover", function(event, d) {
        if (!d3.select(this).classed("highlighted")) {
            // only show hover highlight if not clicked (not already highlighted)
            let countryData = mapdata.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
            if (countryData) {
                // show tooltip and update its content
                tooltip.style("visibility", "visible")
                    .text(`${countryData['Geographic Area Name']}: ${countryData['Value(%)']}%`);
    
                // highlight on hover (if not already clicked)
                d3.select(this)
                    .attr("stroke", "#000") // change to black for hover effect
                    .attr("stroke-width", 2); // increase stroke width
            }
        }
    })
    .on("mouseout", function(event, d) {
        // hide the tooltip when mouse leaves
        tooltip.style("visibility", "hidden");
    
        // remove highlight on the country (if not clicked)
        if (!d3.select(this).classed("highlighted")) {
            d3.select(this)
                .attr("stroke", "#fff") // revert to original stroke color
                .attr("stroke-width", 0.5); // revert to original stroke width
        }
    });

    // Adjusted legend positioning and size
    legendWidth = 40;
    legendHeight = 120;
    
    const legendGroup = mapsvg.append("g")
        .attr("transform", `translate(20, ${mapheight - 150})`);
        
    legendGroup.append("rect")
        .attr("width", legendWidth*3)
        .attr("height", legendHeight*1.5)
        .attr("transform", `translate(${0}, ${-25})`)
        .style("fill", "#555")
        .style("opacity", "0.5");

    //linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append("linearGradient")
        .attr("id", `linear-gradient-${dvMapTrue ? 'dvmap' : 'fpmap'}`);

    linearGradient
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

    linearGradient.selectAll("stop")
        .data(mapcolorscale.range())
        .enter().append("stop")
        .attr("offset", function(d,i) { return i/(mapcolorscale.range().length-1); })
        .attr("stop-color", function(d) { return d; });

    legendGroup.append("rect")
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", `url(#linear-gradient-${dvMapTrue ? 'dvmap' : 'fpmap'})`)
        .attr("transform", `translate(${20}, 10)`);

    //legend title
    legendGroup.append("text")
        .attr("x", 20)
        .attr("y", 0)
        .style("text-anchor", "start")
        .style("font-size", "0.8rem")
        .text("legend"); 

    let minValue = d3.min(mapdata, d => d['Value(%)']);
    let maxValue = d3.max(mapdata, d => d['Value(%)']);
    
    //min value
    legendGroup.append("text")
        .attr("x", 20 + legendWidth + 5)
        .attr("y", 15)
        .style("text-anchor", "start")
        .style("font-size", "0.8rem")
        .text(minValue + "%"); 

    //max value
    legendGroup.append("text")
        .attr("x", 20 + legendWidth + 5)
        .attr("y", 10 + legendHeight)
        .style("text-anchor", "start")
        .style("font-size", "0.8rem")
        .text(maxValue + "%"); 
    }

/*
NEXT LINES ARE ALL FOR THE COMPARISON SCATTER PLOT
*/

let compsvg = d3.select("#compplot");

// CHANGE 8: Adjusted scatter plot dimensions to be 25% larger
let compWind = 1000;  
let compWidth = 850; 
let compHeight = 700; 

async function loadCompDatas(){
    await d3.csv(`${basePath1}/Data/Adolescent_birth_rate.csv`).then(data => {
        adolBirthData = data;
    });
    await d3.csv(`${basePath1}/Data/final_family_planning.csv`).then(data => {
        famPlanData = data;
    });
}

async function initializeCompSvg() {
    await loadCompDatas();
    drawCompPlot();
}

function drawCompPlot(xData=famPlanData, yData=adolBirthData){
    famPlanData.forEach(d => {
        d['Value(%)'] = parseFloat(d['Value(%)']);
        if (isNaN(d['Value(%)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(%)']}`);
        }
    });
    adolBirthData.forEach(d => {
        d['Value(per 1,000 population)'] = parseFloat(d['Value(per 1,000 population)']);
        if (isNaN(d['Value(per 1,000 population)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(per 1,000 population)']}`);
        }
    });

    // CHANGE 9: Set responsive attributes for scatter plot
    compsvg.attr("width", "100%")
        .attr("height", compHeight)
        .attr("viewBox", `0 0 ${compWidth} ${compHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // clear any existing elements
    compsvg.selectAll("*").remove();

    // Increased margins proportionally for the larger plot
    const margin = { top: 60, right: 60, bottom: 90, left: 90 };
    chartWidth = compWidth - margin.left - margin.right;
    chartHeight = compHeight - margin.top - margin.bottom;

    chart = compsvg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    //filter fam plan by countries in abr
    let countries1 = xData.map(d => d['ISO3']);  
    let countries2 = yData.map(d => d['ISO3']);  

    let commonCountries = countries1.filter(country => countries2.includes(country));
    let filteredFPData = xData.filter(d => commonCountries.includes(d['ISO3']));

    xScale = d3.scaleLinear()
    .domain([
        Math.min(0, d3.min(filteredFPData, d => parseFloat(d['Value(%)']))),  
        d3.max(filteredFPData, d => parseFloat(d['Value(%)'])), 
    ])
    .range([0, chartWidth]);

    // yscale based on adol birth data
    yScale = d3.scaleLinear()
    .domain(d3.extent(adolBirthData, d => parseFloat(d['Value(per 1,000 population)']))) 
    .nice()
    .range([chartHeight, 0]);

    // x-axis
    chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0,${chartHeight})`)
    .call(d3.axisBottom(xScale)
    .ticks(8)  
    .tickFormat(d3.format(".0f")))
    .selectAll("text")
    .style("fill", "black")
    .style("font-size", "0.75rem");

    // x-axis label
    chart.append("text")
    .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 50})`) 
    .style("text-anchor", "middle")
    .style("font-size", "1rem")
    .style("fill", "black")
    .text("% of Women With Adequate Access to Family Planning");

    // y-axis
    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale)
        .ticks(10)  
        .tickFormat(d3.format(".0f")))  
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "0.85rem");

    // y-axis label
    chart.append("text")
    .attr("transform", `translate(${-55}, ${chartHeight/2})rotate(-90)`) 
    .style("text-anchor", "middle")
    .style("font-size", "1rem")
    .style("fill", "black")
    .text("Adolescent Births per Thousand");
    
    //  title
    compsvg.append("text")
        .attr("id", "chart-title")
        .attr("x", compWidth / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .style("font-size", "1.2rem")
        .style("fill", "black")
        .text("Adolescent Birth Rate vs Family Planning Access by Country");

    let sdgRegions = [...new Set(famPlanData.map(d => d['SDG Region']))];
    
    // color by sdg region
    let colorScale = d3.scaleOrdinal() 
    .domain(sdgRegions)
    .range(["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#a65b85"]); 


    
        const selectxaxis = d3.select("body").append("div");

    //plot points
    chart.selectAll("circle")
    .data(filteredFPData)
    .enter()
    .append("circle")
    .attr("cx", function(d){
        return xScale(parseFloat(d['Value(%)']));
    })
    .attr("cy", function(d){
        let row = adolBirthData.find(abr=>abr['ISO3'] === d['ISO3'])
        return yScale(parseFloat(row['Value(per 1,000 population)']));
    })
    .attr("r", 5)
    .attr("fill", function(d){
        let color = colorScale(d['SDG Region']);
        return color;
    })
    .on("mouseover", function(event, d) {
        if(compsvg.classed('active')){ //if the svg is active
            let row = adolBirthData.find(abr => abr['ISO3'] === d['ISO3']);
            tooltip.style("visibility", "visible")
                .html(`
                    <strong>Country:</strong> ${d['Geographic Area Name']}<br>
                    <strong>SDG Region:</strong> ${d['SDG Region']}<br>
                    <strong>Family Planning Access:</strong> ${d['Value(%)']}%<br>
                    <strong>Adolescent Birth Rate:</strong> ${row ? row['Value(per 1,000 population)'] : "N/A"} per 1,000
            `);
        }
        
    })
    .on("mousemove", function(event) {
        const [x, y] = d3.pointer(event); // mouse position
        tooltip.style("top", (y + 10) + "px")
            .style("left", (x + 10) + "px");
    })
    .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
    })
    .style("pointer-events", "all");


    //regression line
    //combine data
    function regressionLine(sdgRegion = null){
        console.log('hi')
        let filteredData = filteredFPData;
        if (sdgRegion) {
            filteredData = filteredFPData.filter(d => d['SDG Region'] === sdgRegion);
        }

        let combinedData = filteredData.map(d => [
            d['Value(%)'],
            adolBirthData.find(abr => abr['ISO3'] === d['ISO3'])['Value(per 1,000 population)']
        ]);
    
        //simple statistics library to generate lbf
        let regression = ss.linearRegression(combinedData);
        let m = regression.m; 
        let b = regression.b;  
        
        let bestFitLine = d3.line()
            .x(d => xScale(d[0])) 
            .y(d => yScale(m * d[0] + b)); 
        
        //remove if exists
        chart.selectAll(".best-fit-line").remove();
        // draw the line of best fit
        chart.append("path")
            .data([combinedData])
            .attr("class", "best-fit-line")
            .attr("d", bestFitLine)
            .attr("fill", "none")
            .attr("stroke", "red")
            .attr("stroke-width", 2);
    
        //statistical measures
        let r2 = ss.rSquared(combinedData, ss.linearRegressionLine(regression));
    }
    regressionLine(); 
   

    let selectedRegion = null;
    // CHANGE 10: Repositioned and resized legend to account for larger plot
    const scaleFactor = 0.8;  

    let legend = compsvg.append("g")
        .attr("transform", `translate(${compWidth - 170}, 70)`);

    legend.append("rect")
        .attr("width", 300 * scaleFactor)  // scale width
        .attr("height", (25 + sdgRegions.length * 25) * scaleFactor)  //scale height
        .style("fill", "#000")
        .style("opacity", 0.15);

    legend.append("text")
        .attr("x", 12 * scaleFactor)  // scale text position
        .attr("y", 18 * scaleFactor) 
        .style("font-size", `${0.7 * scaleFactor}rem`)  // scale font size
        .style("fill", "black")
        .text("SDG Regions");

    function updatePlotOpacity() {
        chart.selectAll("circle")
            .transition()  // transition when changing opacity
            .style("opacity", function(d) {
                return selectedRegion && d['SDG Region'] !== selectedRegion ? 0.1 : 1;
            });
    }

    legend.selectAll("mydots")
        .data(sdgRegions)
        .enter()
        .append("circle")
        .attr("cx", 18 * scaleFactor) 
        .attr("cy", function(d, i) { 
            return (38 + i * 25) * scaleFactor; 
        })
        .attr("r", 6 * scaleFactor)  
        .style("fill", function(d) { return colorScale(d); })
        .on("click", function(event, d) {
            if(compsvg.classed("active")){
                if (selectedRegion === d) {
                    selectedRegion = null;  
                    regressionLine();
                } else {
                    selectedRegion = d;  
                    regressionLine(selectedRegion);
                }
                updatePlotOpacity();
            }
        })
        .on("mouseover", function(event, d) {
            if(compsvg.classed("active")){
                d3.select(this).style("cursor", "pointer");
                if (selectedRegion === null) {
                    chart.selectAll("circle")
                        .style("opacity", function(pointData) {
                            return pointData['SDG Region'] === d ? 1 : 0.1;  
                        });
                    regressionLine(d);
                }
            }
        })
        .on("mouseout", function(event, d) {
            if(compsvg.classed("active")){
                d3.select(this).style("cursor", "default");
                if (selectedRegion === null) {
                    chart.selectAll("circle")
                        .style("opacity", 1);  
                } else {
                    chart.selectAll("circle")
                        .style("opacity", function(pointData) {
                            return pointData['SDG Region'] === selectedRegion ? 1 : 0.1;
                        });
                }
                regressionLine();
            }
        });

    legend.selectAll("mylabels")
        .data(sdgRegions)
        .enter()
        .append("text")
        .attr("x", 30 * scaleFactor)  
        .attr("y", function(d, i) { 
            return (42 + i * 25) * scaleFactor; 
        })
        .style("font-size", `${0.8 * scaleFactor}rem`) 
        .style("fill", "black")
        .text(function(d) { return d; })
        .attr("text-anchor", "left")
        .on("click", function(event, d) {
            if(compsvg.classed("active")){
                if (selectedRegion === d) {
                    selectedRegion = null;  
                    regressionLine();
                } else {
                    selectedRegion = d;  
                    regressionLine(selectedRegion);
                }
                updatePlotOpacity();
            }
        })
        .on("mouseover", function(event, d) {
            if(compsvg.classed("active")){
                d3.select(this).style("cursor", "pointer");
                if (selectedRegion === null) {
                    chart.selectAll("circle")
                        .style("opacity", function(pointData) {
                            return pointData['SDG Region'] === d ? 1 : 0.1;  // opacity lower
                        })
                        .transition()
                        .duration(1000);
                    regressionLine(d); 
                }
            }
        })
        .on("mouseout", function(event, d) {
            if(compsvg.classed("active")){
                d3.select(this).style("cursor", "default");
                if (selectedRegion === null) {
                    chart.selectAll("circle")
                        .style("opacity", 1);  // reset opacity
                    regressionLine();
                } else {
                    chart.selectAll("circle")
                        .style("opacity", function(pointData) {
                            return pointData['SDG Region'] === selectedRegion ? 1 : 0.1;
                        });
                }
            }
        });
};

initializeMapSVG();
initializeCompSvg();
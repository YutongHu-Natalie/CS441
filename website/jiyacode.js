/*
NEXT LINES ARE ALL FOR THE SUBJECTED VIOLENCE MAP AND FAM PLANNING MAP
*/
const basePath1 = window.location.hostname === "localhost" || 
                window.location.hostname === "127.0.0.1" 
                ? "" 
                : "/CS441";


let mapsvg;

// CHANGE 1: Reduced map dimensions for better display
let mapwidth = 1000;
let mapheight = 500;

const myProjection = d3.geoNaturalEarth1()
    // CHANGE 2: Scale the projection to fit the reduced dimensions
    .scale(mapwidth / 8.5)
    .translate([mapwidth / 3, mapheight / 3]);
const path = d3.geoPath().projection(myProjection);
const graticule = d3.geoGraticule();

let dvMapData;
let famPlanData;
let currDat;

let dvMapSvg = d3.select("#dvmap");
let fpMapSVG = d3.select("#famplanmap");

let dvMapTrue = false;

async function loadDVMapData(){
    await d3.csv(`${basePath1}/Data/Subjected_violence.csv`).then(data => {
        dvMapData = data;
    });
    await d3.csv(`${basePath1}/Data/final_family_planning.csv`).then(data => {
        famPlanData = data;
    });
}

async function initializeMapSVG() {
    await loadDVMapData();
    
    // CHANGE 3: Set responsive attributes for family planning map
    fpMapSVG.attr("width", "100%")
        .attr("height", mapheight)
        .attr("viewBox", `0 0 ${mapwidth} ${mapheight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
        
    fpColorScale = d3.scaleSequential(d3.interpolateRgb("white", "#AA336A"))
        .domain([0, d3.max(famPlanData, d => parseFloat(d['Value(%)']))]);

    // world map for family planning
    await d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json").then(world=> drawMap(world, fpMapSVG, famPlanData, fpColorScale))
    .catch((err) => console.error("Error loading map data:", err));

    dvMapTrue = true;
    
    // CHANGE 4: Set responsive attributes for violence map
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
        mapsvg = d3.select("#famplanmap");
        titleMap = "% of Women with Access to Adequate Family Planning";
    } 

    // Clear previous content
    mapsvg.selectAll("*").remove();

    //defs (for definition) element to your SVG
    var defs = mapsvg.append("defs");

    //title
    // CHANGE 5: Adjusted title positioning
    mapsvg.append("text")
    .attr("x", mapwidth/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "1.2rem")
    .text(titleMap); 
    
    // Create a map group to hold all map elements
    // CHANGE 6: Create a group for the map content with proper positioning
    const mapGroup = mapsvg.append("g")
        .attr("transform", `translate(0, 50)`);
        
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
      .attr("stroke-width", 0.5);

    // CHANGE 7: Adjusted legend positioning and size
    legendWidth = 30;
    legendHeight = 120;
    
    const legendGroup = mapsvg.append("g")
        .attr("transform", `translate(20, ${mapheight - 150})`);
        
    legendGroup.append("rect")
        .attr("width", legendWidth*3)
        .attr("height", legendHeight*1.2)
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
let adolBirthData;

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

function drawCompPlot(){
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

    // Clear any existing elements
    compsvg.selectAll("*").remove();

    // Increased margins proportionally for the larger plot
    const margin = { top: 60, right: 60, bottom: 90, left: 90 };
    chartWidth = compWidth - margin.left - margin.right;
    chartHeight = compHeight - margin.top - margin.bottom;

    chart = compsvg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    //filter fam plan by countries in abr
    let countries1 = adolBirthData.map(d => d['ISO3']);  
    let countries2 = famPlanData.map(d => d['ISO3']);  

    let commonCountries = countries1.filter(country => countries2.includes(country));
    let filteredFPData = famPlanData.filter(d => commonCountries.includes(d['ISO3']));

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
    .range(["#999999", "#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#CC79A7"]); 

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
    });

    //regression line
    //combine data
    let combinedData = filteredFPData.map(d => [
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

    // CHANGE 10: Repositioned and resized legend to account for larger plot
    let legend = compsvg.append("g")
        .attr("transform", `translate(${compWidth - 170}, 70)`);

    legend.append("rect")
    .attr("width", 160)
    .attr("height", 25 + sdgRegions.length * 25)
    .style("fill", "#000")
    .style("opacity", 0.15);

    legend.append("text")
    .attr("x", 12)
    .attr("y", 18)
    .style("font-size", "0.9rem")
    .style("fill", "black")
    .text("SDG Regions");

    legend.selectAll("mydots")
    .data(sdgRegions)
    .enter()
    .append("circle")
    .attr("cx", 18)
    .attr("cy", function(d,i){ return 38 + i*25})
    .attr("r", 6)
    .style("fill", function(d){ return colorScale(d)});

    legend.selectAll("mylabels")
    .data(sdgRegions)
    .enter()
    .append("text")
    .attr("x", 30)
    .attr("y", function(d,i){ return 42 + i*25})
    .style("font-size", "0.8rem")
    .style("fill", "black")
    .text(function(d){ return d})
    .attr("text-anchor", "left");
};

// Initialize maps and scatter plot
initializeMapSVG();
initializeCompSvg();
/*
NEXT LINES ARE ALL FOR THE SUBJECTED VIOLENCE MAP
*/

let mapsvg = d3.select("#dvmap");

let mapwidth = 960;
let mapheight = 500;

const myProjection = d3.geoNaturalEarth1();
const path = d3.geoPath().projection(myProjection);
const graticule = d3.geoGraticule();

let dvMapData;

async function loadDVMapData(){
    // Because d3.json() uses promises we have to use the keyword await to make sure each line completes before moving on to the next line
    await d3.csv("../Data/Subjected_violence.csv").then(data => {
        // Inside the promise we set the global variable equal to the data being loaded from the file
        dvMapData = data;
    });

}

async function initializeMapSVG() {
    await loadDVMapData();
    mapsvg.attr("width", mapwidth);
    mapsvg.attr("height", mapheight+100);

    // Load the world map data and draw it
    d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json").then(drawMap)
    .catch((err) => console.error("Error loading map data:", err));
}

function drawMap(world) {
    // Check if the 'Value(%)' field exists and can be converted to numbers
    dvMapData.forEach(d => {
        // Make sure 'Value(%)' is a valid number
        d['Value(%)'] = parseFloat(d['Value(%)']);  // Convert to number (ignores non-numeric values)
        if (isNaN(d['Value(%)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(%)']}`);
        }
    });

    //defs (for definition) element to your SVG
    var defs = mapsvg.append("defs");

    //title
    mapsvg.append("text")
    .attr("x", mapwidth/8) // Positioning the text to the right of the legend
    .attr("y", 50) // Position it near the top of the legend
    .attr("dy", "-0.5em")
    .style("text-anchor", "start")
    .style("font-size", "1.5rem")
    .text("% of Women That Have Been Subjected to Intimate Partner Violence"); 

    //make colorScale based on value for level of dv experiences
    let dvColorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([0, d3.max(dvMapData, d => d['Value(%)'])]);
    
    // graticules
    //for the lat/long lines
    mapsvg.append("path")
      .datum(graticule)
      .attr("class", "graticule")
      .attr("d", path)
      .attr("transform", `translate(0,50)`);

    //for outline of whole map
    mapsvg.append("path")
      .datum(graticule.outline)
      .attr("class", "foreground")
      .attr("d", path)
      .attr("transform", `translate(0,50)`);

    //diagonal fill for non-existent data
      defs.append("pattern")
      .attr("id", "diagonal-stripes")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 10)
      .attr("height", 10)
      .append("rect") // Optional: to set the background color of the pattern
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", "#fff"); // Background color for the stripes (optional)
  
    defs.select("#diagonal-stripes")
        .append("path")
        .attr("d", "M 0 0 L 10 10") // diagonal hatchiing
        .attr("stroke", "#000") 
        .attr("stroke-width", 0.5); 

    // countries topo-json
    mapsvg.append("g")
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", function(d){ //fill not working why?
        let countryData = dvMapData.find(item=>parseInt(item['Geographic Area Code']) === parseInt(d.id));
        if (countryData ){
            return dvColorScale(countryData['Value(%)']);
        } else {
            return "url(#diagonal-stripes)"; //default
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .attr("transform", `translate(0,50)`);


    //LEGEND:
    legendWidth = 50;
    legendHeight = 150;
    //linearGradient element to the defs and give it a unique id
    var linearGradient = defs.append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");


    linearGradient.selectAll("stop")
    .data( dvColorScale.range() )
    .enter().append("stop")
    .attr("offset", function(d,i) { return i/(dvColorScale.range().length-1); })
    .attr("stop-color", function(d) { return d; });
    //append gradient

    mapsvg.append("rect")
    .attr("width", legendWidth*3)
    .attr("height", legendHeight*1.5)
    .style("fill", "#555")
    .style("opacity", "0.5")
    .attr("transform", `translate(75, 250)`);

    mapsvg.append("rect")
    .attr("width", legendWidth)
    .attr("height", legendHeight)
    .style("fill", "url(#linear-gradient)")
    .attr("transform", `translate(${100}, 300)`);

    //legend title
    mapsvg.append("text")
    .attr("x", 100 ) // Positioning the text to the right of the legend
    .attr("y", 290) // Position it near the top of the legend
    .attr("dy", "-0.5em")
    .style("text-anchor", "start")
    .text("legend"); 

    let minValue = d3.min(dvMapData, d => d['Value(%)']);
    let maxValue = d3.max(dvMapData, d => d['Value(%)']);
    
    //min value
    mapsvg.append("text")
    .attr("x", 100 + legendWidth + 10) // Positioning the text to the right of the legend
    .attr("y", 320) // Position it near the top of the legend
    .attr("dy", "-0.5em")
    .style("text-anchor", "start")
    .text(minValue + "%"); 

    //max value
    mapsvg.append("text")
    .attr("x", 100 + legendWidth + 10) 
    .attr("y", 300 + legendHeight -20) 
    .attr("dy", "1em")
    .style("text-anchor", "start")
    .text(maxValue + "%"); 
}

initializeMapSVG();


/*
NEXT LINES ARE ALL FOR THE COMPARISON SCATTER PLOT
*/

let compsvg = d3.select("#compplot");
let famPlanData;
let adolBirthData;

let compWind = 850;

let compWidth = 800;
let compHeight = 800;

async function loadCompDatas(){
    // Because d3.json() uses promises we have to use the keyword await to make sure each line completes before moving on to the next line
    await d3.csv("../Data/final_family_planning.csv").then(data => {
        // Inside the promise we set the global variable equal to the data being loaded from the file
        famPlanData = data;
        console.log("loaded 1");
    });
    await d3.csv("../Data/Adolescent_birth_rate.csv").then(data => {
        // Inside the promise we set the global variable equal to the data being loaded from the file
        adolBirthData = data;
        console.log("loaded2");
    });

}

async function initializeCompSvg() {
    await loadCompDatas();
    drawCompPlot();
}

initializeCompSvg();


function drawCompPlot(){
    famPlanData.forEach(d => {
        // Make sure 'Value(%)' is a valid number
        d['Value(%)'] = parseFloat(d['Value(%)']);  // Convert to number (ignores non-numeric values)
        if (isNaN(d['Value(%)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(%)']}`);
        }
    });
    adolBirthData.forEach(d => {
        // Make sure 'Value(%)' is a valid number
        d['Value(per 1,000 population)'] = parseFloat(d['Value(per 1,000 population)']);  // Convert to number (ignores non-numeric values)
        if (isNaN(d['Value(per 1,000 population)'])) {
            console.error(`Invalid Value(%) found in data: ${d['Value(per 1,000 population)']}`);
        }
    });

    compsvg.attr("width", compWind);
    compsvg.attr("height", compWind);


    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    chartWidth = compWidth - margin.left - margin.right;
    chartHeight = compHeight - margin.top - margin.bottom;

    chart = compsvg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //filter fam plan by countries in abr
    let countries1 = adolBirthData.map(d => d['ISO3']);  
    let countries2 = famPlanData.map(d => d['ISO3']);  

    let commonCountries = countries1.filter(country => countries2.includes(country));
    let filteredFPData = famPlanData.filter(d => commonCountries.includes(d['ISO3']));

    console.log(commonCountries);
    console.log(filteredFPData);

    xScale = d3.scaleLinear()
    .domain([
        Math.min(0, d3.min(filteredFPData, d => parseFloat(d['Value(%)']))),  // Ensure the domain starts from 0 or min value
        d3.max(filteredFPData, d => parseFloat(d['Value(%)'])),  // Max value from data
    ])
    .range([0, chartWidth]);
    console.log(d3.extent(filteredFPData, d => parseFloat(d['Value(%)'])));


    // yscale based on adol birth data
    yScale = d3.scaleLinear()
    .domain(d3.extent(adolBirthData, d => parseFloat(d['Value(per 1,000 population)']))) // Use the data points for per 1,000 population
    .nice()
    .range([chartHeight, 0]);

    // x-axis
    chart.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(${margin.left},${chartHeight})`)
    .call(d3.axisBottom(xScale)
    .ticks(10)  // Set the number of ticks (you can change this number)
    .tickFormat(d3.format(".0f")))
    .selectAll("text");

    // x-axis label
    compsvg.append("text")
    .attr("transform", `translate(${compWidth / 2 + margin.left/2}, ${compHeight - margin.bottom + 40})`) 
    .style("text-anchor", "middle")
    .style("font-size", "1rem")
    .style("fill", "white")
    .text("% of Women With Access to Family Planning");


    // y-axis
    chart.append("g")
        .attr("class", "y-axis")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale)
        .ticks(10)  // Set the number of ticks (you can change this number)
        .tickFormat(d3.format(".0f")))  // Format tick labels if needed (e.g., as integers))
        .selectAll("text");

    // y-axis label
    compsvg.append("text")
    .attr("transform", `translate(${margin.left/2}, ${compHeight/2})rotate(-90)`) 
    .style("text-anchor", "middle")
    .style("font-size", "1rem")
    .style("fill", "white")
    .text("Adolescent Births per Thousand");
    

    //  title
    compsvg.append("text")
        .attr("id", "chart-title")
        .attr("x", compWidth / 2 + margin.left)
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "1.20rem")
        .style("fill", "white")
        .text("Adolescent Birth Per Thousand Compared to Family Planning Access by Country");

    let sdgRegions = [...new Set(famPlanData.map(d => d['SDG Region']))]
    

    // color by sdg region
    let colorScale = d3.scaleOrdinal() 
    .domain(sdgRegions)
    .range(d3.schemeCategory10); 

    //plot points
    compsvg.selectAll("circle")
    .data(filteredFPData)
    .enter()
    .append("circle")
    .attr("cx", function(d){
        return xScale(parseFloat(d['Value(%)'])) + margin.left*2;
    })
    .attr("cy", function(d){
        let row = adolBirthData.find(abr=>abr['ISO3'] === d['ISO3'])
        return yScale(parseFloat(row['Value(per 1,000 population)']));
    })
    .attr("r", 5)
    .attr("fill", function(d){ //TODO set the fill of the rectangles
        let color = colorScale(d['SDG Region']);
        return color;
    });

    //regression line

    //combine data
    let combinedData = filteredFPData.map(d => [
        d['Value(%)'],
        adolBirthData.find(abr => abr['ISO3'] === d['ISO3'])['Value(per 1,000 population)']
    ]);
    console.log(combinedData)

    //simple statistics library to generate lbf
    let regression = ss.linearRegression(combinedData);
    let m = regression.m; 
    let b = regression.b;  
    
    let bestFitLine = d3.line()
        .x(d => xScale(d[0]) + margin.left*2) 
        .y(d => yScale(m * d[0] + b)); 

    // Draw the line of best fit
    compsvg.append("path")
        .data([combinedData])  // Use the regression data to plot the line
        .attr("class", "best-fit-line")
        .attr("d", bestFitLine)
        .attr("fill", "none")
        .attr("stroke", "red")  // Color of the line
        .attr("stroke-width", 2);

    //statistical measures
    
    //sum of squared differences -- higher the better
    let r2 = ss.rSquared(combinedData, ss.linearRegressionLine(regression));
    console.log(r2)

    //TODO: MAKE LEGEND FOR DOT COLORS!!

};






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

let mapwidth = 1000;
let mapheight = 500;

const myProjection = d3.geoNaturalEarth1()
    .scale(mapwidth / 7.5)
    .translate([mapwidth / 3, mapheight / 3]);
const path = d3.geoPath().projection(myProjection);
const graticule = d3.geoGraticule();

let dvMapData;
let adolBirthData;
let famPlanData;
let literDifData;
let currDat;
let worldDataCopy;

let countryPaths;
let dvMapSvg = d3.select("#dvmap");

let dvMapTrue = false;

async function loadDVMapData(){
    await d3.csv(`${basePath1}/Data/Subjected_violence.csv`).then(data => {
        dvMapData = data;
    });
    await d3.csv(`${basePath}/Data/final_youth_literacy.csv`).then(data => {
        literDifData = transformLiteracyData(data);
        console.log(literDifData)
    });
    
}
function transformLiteracyData(data) {
    const maleData = data.filter(d => d['Sex Code'] === 'M');
    const femaleData = data.filter(d => d['Sex Code'] === 'F');

    const disparityData = maleData.map(male => {
        const female = femaleData.find(f => f['ISO3'] === male['ISO3']);
        if (female) {
            const difference = parseFloat(male['Value(%)']) - parseFloat(female['Value(%)']);
            const roundedDifference = Math.round((difference + Number.EPSILON) * 100) / 100;

            return {
                ISO3: male['ISO3'],
                "Geographic Area Name": male['Geographic Area Name'],
                "SDG Region": male['SDG Region'],
                "Value(%)": roundedDifference
            };
        }
        return null;
    }).filter(d => d !== null);

    return disparityData;
}


async function initializeMapSVG() {
    await loadDVMapData();
    
    dvMapTrue = true;
    
    dvMapSvg.attr("width", "100%")
        .attr("height", mapheight)
        .attr("viewBox", `0 0 ${mapwidth} ${mapheight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
        
    dvColorScale = d3.scaleSequential(d3.interpolatePurples)
        .domain([0, d3.max(dvMapData, d => parseFloat(d['Value(%)']))]);

    // world map for subjected violence
    let worldDataCopy;
    await d3.json("https://unpkg.com/world-atlas@1.1.4/world/110m.json").then(world => {
        worldDataCopy = world;
        drawMap(world, dvMapSvg, dvMapData, dvColorScale);
    });

    guessingGame();

}
let guessed = false;

let selCountries = [];
let correctCountries = [];
function guessingGame(){
    let correctCountries = dvMapData
    .filter(country => parseFloat(country['Value(%)']) > 18)
    .map(country => country['Geographic Area Name']);

    dvMapSvg.append("text")
    .style("background-color", "transparent")
    .attr("x", mapwidth/2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "1.5rem")
    .text("In which countries have over 18% of women faced initimate partner violence?\nSelect below:"); 

    const submitBtn = dvMapSvg.append("foreignObject")
    .attr("x", mapwidth / 2 - 50)
    .attr("y", mapheight - 40)
    .attr("width", 80)
    .attr("height", 50)
    .append("xhtml:div")
    .attr("class", "selBtn")
    .style("text-align", "center")
    .style("font-family", "Futura, Trebuchet MS, Arial, sans-serif")
    .text("Submit")
    .on("click", function(event, d) {
        if (dvMapSvg.classed("active")) {

            d3.select(this.parentNode).transition()
            .duration(100).remove();
            guessed = true;
    
            dvMapSvg.selectAll(".countryGroup path")
                .transition()
                .duration(100)
                .attr("fill", function(d) {
                    const countryData = dvMapData.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
                    return countryData ? dvColorScale(countryData['Value(%)']) : "url(#diagonalHatch)";
                })
                .each(function(d) {
                    const countryData = dvMapData.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
                    if (!countryData) return;
            
                    const name = countryData['Geographic Area Name'];
                    const isSelected = selCountries.includes(name);
                    const isCorrect = correctCountries.includes(name);
            
                    const path = d3.select(this);
                    path.classed("highlighted", false); // clear prior highlight
            
                    if (isSelected && isCorrect) {
                        path.classed("corrAnswer", true)
                            .classed("incorrAnswer", false)
                            .classed("missedAnswer", false)
                            .attr("stroke", "#4caf50") // green
                            .attr("stroke-width", 2);
                    } else if (isSelected) {
                        path.classed("corrAnswer", false)
                            .classed("incorrAnswer", true)
                            .classed("missedAnswer", false)
                            .attr("stroke", "#f44336") // red
                            .attr("stroke-width", 2);
                    } else if (isCorrect) {
                        path.classed("corrAnswer", false)
                            .classed("incorrAnswer", false)
                            .classed("missedAnswer", true)
                            .attr("stroke", "#9c27b0") // purple
                            .attr("stroke-width", 2);
                    } else {
                        path.classed("corrAnswer", false)
                            .classed("incorrAnswer", false)
                            .classed("missedAnswer", false)
                            .attr("stroke", "#000")
                            .attr("stroke-width", 0.5);
                    }
                });
        }
    })

    
    
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
    mapsvg.append("text")
    .style("background-color", "transparent")
    .attr("x", mapwidth/2)
    .attr("y", 30)
    .attr("text-anchor", "middle")
    .style("font-size", "1.2rem")
    .text(titleMap); 
    
    // create map group to hold all map elements
    const svgWidth = parseInt(mapsvg.style("width"));  // actual width of the SVG container
    const svgHeight = parseInt(mapsvg.style("height"));  // actual height of the SVG container

    // translate the map group so it's centered in the SVG container
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
    const pattern = defs.append("pattern")
    .attr("id", "diagonal-stripes")
    .attr("patternUnits", "userSpaceOnUse")
    .attr("width", 10)
    .attr("height", 10);
  
    pattern.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "#ffffff");
    
    pattern.append("path")
        .attr("d", "M 0 0 L 10 10")
        .attr("stroke", "#000000")
        .attr("stroke-width", 0.5);
    
       
        
    const dvpattern = dvMapSvg.append("defs").append("pattern")
        .attr("id", "diagonalHatch")
        .attr("patternUnits", "userSpaceOnUse")
        .attr("width", 10)
        .attr("height", 10);
    
        dvpattern.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", "#ffffff");
    
        dvpattern.append("path")
        .attr("d", "M 0 0 L 10 10")
        .attr("stroke", "#000000")
        .attr("stroke-width", 0.5);
        
    // countries topo-json
    countryPaths = mapGroup.append("g")
    .attr("class", "countryGroup")
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .enter().append("path")
      .attr("d", path)
      .attr("fill", function(d){
        let countryData = mapdata.find(item=>parseInt(item['Geographic Area Code']) === parseInt(d.id));
        if (!guessed) {
            // before guessing: everything white or hatched
            return countryData ? "#ffffff" : "url(#diagonalHatch)";
        } else {
            // after guessing: show proper data
            return countryData ? mapcolorscale(countryData['Value(%)']) : "url(#diagonalHatch)";
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 0.5)
      .on("click", function(event, d) {
        let countryData = mapdata.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
        if(!guessed){
            if(dvMapSvg.classed("active")){
                if (countryData) {
                    // show the tooltip and update its content
                    tooltip.style("visibility", "visible")
                        .text(`${countryData['Geographic Area Name']}`);
            
                    // toggle highlight (if already highlighted, remove the highlight)
                    if (d3.select(this).classed("highlighted")) {
                        d3.select(this)
                            .classed("highlighted", false)
                            .classed("unhighlighted", true)
                            .attr("stroke", "#fff") // revert to original stroke color
                            .attr("stroke-width", 0.5); // revert to original stroke width
                            selCountries = selCountries.filter(country => country !== countryData['Geographic Area Name']);
                    } else {
                        d3.select(this)
                            .classed("unhighlighted", false)
                            .classed("highlighted", true) 
                            .attr("stroke", "red") 
                            .attr("stroke-width", 2); 
                            selCountries.push(countryData['Geographic Area Name']);
                    }
                }
        }
        }
    })
    .on("mouseover", function(event, d) {
            // only show hover highlight if not clicked (not already highlighted)
            let countryData = mapdata.find(item => parseInt(item['Geographic Area Code']) === parseInt(d.id));
            if (countryData) {
                if(guessed){
                    // show tooltip and update its content
                tooltip.style("visibility", "visible").style("left", (event.pageX + 10) + "px") 
                .style("top", (event.pageY + 10) + "px")
                    .text(`${countryData['Geographic Area Name']}: ${countryData['Value(%)']}%`);
    
                // highlight on hover (if not already clicked)
                
                }
                else{
                    tooltip.style("visibility", "visible").style("left", (event.pageX + 10) + "px") 
                    .style("top", (event.pageY + 10) + "px")
                        .text(`${countryData['Geographic Area Name']}`);

                }   
                d3.select(this)
                    .attr("stroke", "#000") // change to black for hover effect
                    .attr("stroke-width", 2); // increase stroke width
            }
    })
    .on("mousemove", function(event) {
        const [x, y] = d3.pointer(event); // mouse position
        tooltip.style("left", (event.pageX + 10) + "px") 
        .style("top", (event.pageY + 10) + "px"); 
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

    // legend positioning and size
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
}

async function initializeCompSvg() {
    await loadCompDatas();
    drawCompPlot();
}

function drawCompPlot(xData=famPlanData, yData=adolBirthData){
    let dropDownOpen = false;
    const dataOptions = {
        "Family Planning Access (%)": famPlanData,
        "Adolescent Birth Rate (per 1,000)": adolBirthData,
        "Women Subjected to Intimate Partner Violence (%)": dvMapData,
        "Disparity in Youth Literacy Rates (M-F)%": literDifData

    };

    function getDataLabelByValue(dataObj) {
        for (let [label, dataset] of Object.entries(dataOptions)) {
            if (dataset === dataObj) {
                return label;
            }
        }
        return null;
    }

    let xVal = "Value(%)";
    if (getDataLabelByValue(xData) == "Adolescent Birth Rate (per 1,000)"){
        xVal = 'Value(per 1,000 population)';
    }
    let yVal = "Value(%)";
    if (getDataLabelByValue(yData) == "Adolescent Birth Rate (per 1,000)"){
        yVal = 'Value(per 1,000 population)';
    }

    compsvg.attr("width", "100%")
        .attr("height", compHeight)
        .attr("viewBox", `0 0 ${compWidth} ${compHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // increased margins proportionally for the larger plot
    const margin = { top: 90, right: 90, bottom: 90, left: 90 };
    chartWidth = compWidth - margin.left - margin.right;
    chartHeight = compHeight - margin.top - margin.bottom;


    let chart = compsvg.select("g");
    if (chart.empty()) {
        chart = compsvg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top*1.5}) scale(0.8)`);
    }

    //filter xData by countries in yData
    let countries1 = xData.map(d => d['ISO3']);
    let countries2 = yData.map(d => d['ISO3']);  
    let commonCountries = countries1.filter(country => countries2.includes(country));
    let filteredFPData = xData.filter(d => commonCountries.includes(d['ISO3']));

    // recalculate the xScale and yScale based on filtered data
    let xScale = d3.scaleLinear()
        .domain([
            Math.min(0, d3.min(filteredFPData, d => parseFloat(d[xVal]))),
            d3.max(filteredFPData, d => parseFloat(d[xVal]))
        ])
        .range([0, chartWidth]);

    let yScale = d3.scaleLinear()
        .domain(d3.extent(yData, d => parseFloat(d[yVal])))
        .nice()
        .range([chartHeight, 0]);

    // x-axis
    let xAxis = chart.select(".x-axis");
    if (xAxis.empty()) {
        xAxis = chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale)
        .ticks(8)  
        .tickFormat(d3.format(".0f")))
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "0.75rem");
    }
    else{
        xAxis.transition()
        .duration(1000)
        .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format(".0f")))
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "0.75rem");
    }

    // x-axis label
    let xAxisLabel = chart.select(".x-axis-label");
    if (xAxisLabel.empty()) {
        chart.append("text")
        .attr("class", "x-axis-label")
        .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 50})`) 
        .style("text-anchor", "middle")
        .style("font-size", "1rem")
        .style("fill", "black")
        .style("cursor", "pointer")
        .text(getDataLabelByValue(xData));
    }
    else{
        xAxisLabel
        .text(getDataLabelByValue(xData));
    }

    
    d3.select(".x-axis-label").on("click", function(event) {
        if (compsvg.classed("active")) {
            if(dropDownOpen === false){
                dropDownOpen = true;
                const currentLabel = getDataLabelByValue(xData); // for x-axis
                createDropdown("x", currentLabel, (newLabel) => {
                drawCompPlot(dataOptions[newLabel], yData);
            });
            }
            else{
                d3.select(".axis-dropdown").remove();
                dropDownOpen = false;
            }
        }
    });
    

    // y-axis
    let yAxis = chart.select(".y-axis");
    if (yAxis.empty()) {
        yAxis = chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale)
        .ticks(10)  
        .tickFormat(d3.format(".0f")))  
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "0.85rem");
    }
    else{
        yAxis.transition()
        .duration(1000)
        .call(d3.axisLeft(yScale).ticks(10).tickFormat(d3.format(".0f")))
        .selectAll("text")
        .style("fill", "black")
        .style("font-size", "0.85rem");
    }


    // y-axis label
    yAxisLabel = chart.select(".y-axis-label");
    if(yAxisLabel.empty()){
        chart.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", `translate(${-55}, ${chartHeight/2})rotate(-90)`) 
        .style("text-anchor", "middle")
        .style("font-size", "1rem")
        .style("fill", "black")
        .style("cursor", "pointer")
        .text(getDataLabelByValue(yData));
    }
    else{
        yAxisLabel.transition()
        .duration(1000)
        .text(getDataLabelByValue(yData));
    }

    d3.select(".y-axis-label").on("click", function(event) {
        if (compsvg.classed("active")) {
            if(dropDownOpen === false){
                dropDownOpen = true;
                const currentLabel = getDataLabelByValue(yData); // for y-axis
                createDropdown("y", currentLabel, (newLabel) => {
                drawCompPlot(xData, dataOptions[newLabel]);
                });
            }
            else{
                d3.select(".axis-dropdown").remove();
                dropDownOpen = false;
            }
        }
    });

    

    function createDropdown(axis, currentValue, onSelect) {
        // remove prev dropdowns
        d3.select(".axis-dropdown").remove(); 
        
        let otherAxis = axis === "x" ? "y" : "x";
        let otherSelected = otherAxis === "x" ? getDataLabelByValue(xData) : getDataLabelByValue(yData);
        
        const availableOptions = Object.keys(dataOptions).filter(label => label !== otherSelected && label!== currentValue);
        console.log(availableOptions);
    
        // select axis label
        const axisLabel = d3.select(`.${axis}-axis-label`);
        
        // position of axis label
        const axisLabelBounds = axisLabel.node().getBoundingClientRect();
        
        //fixed position just below the label
        if (axis === "x") {
            fixedX = axisLabelBounds.left;
            fixedY = axisLabelBounds.bottom + 10; 
        } else if (axis === "y") {
            fixedX = axisLabelBounds.left - axisLabelBounds.height - 10; 
            fixedY = axisLabelBounds.top + axisLabelBounds.height / 2 + 10;
            console.log("HELLO Y")
        }
    
        //div to hold the options
        const dropdown = d3.select("body")
            .append("div")
            .attr("class", "axis-dropdown")
            .style("position", "absolute")
            .style("left", `${fixedX}px`)
            .style("top", `${fixedY}px`) 
            .style("z-index", 101)
            .style("background-color", "#ffffff")
            .style("border", "1px solid #ccc")
            .style("border-radius", "5px")
            .style("box-shadow", "0 0 10px rgba(0, 0, 0, 0.2)")
            .style("padding", "5px 0px");
    
        // list of options as clickable divs
        availableOptions.forEach(label => {
            dropdown.append("div")
                .attr("class", "dropdown-option")
                .style("padding", "8px")
                .style("cursor", "pointer")
                .style("border-bottom", "1px solid #eee")
                .style("font-size", "0.9rem")
                .text(label)
                .on("click", function () {
                    dropDownOpen = false;
                    onSelect(label);  // update plot with the selected label
                    dropdown.remove();
                });
        });
    }

    //  title
    let plotTitle = compsvg.select("#chart-title");
    if (plotTitle.empty()) {
        compsvg.append("text")
        .attr("id", "chart-title")
        .attr("x", compWidth / 2)
        .attr("y", margin.top*1.5 -30)
        .attr("text-anchor", "middle")
        .style("font-size", "1.2rem")
        .style("fill", "black")
        .text(`${getDataLabelByValue(xData)} vs ${getDataLabelByValue(yData)}`);
    }
    else{  
        plotTitle.transition()
        .duration(1000)
        .text(`${getDataLabelByValue(xData)} vs ${getDataLabelByValue(yData)}`);
    }

    let sdgRegions = [...new Set(famPlanData.map(d => d['SDG Region']))];
    
    // color by sdg region
    let colorScale = d3.scaleOrdinal() 
    .domain(sdgRegions)
    .range(["#E69F00", "#56B4E9", "#009E73", "#F0E442", "#0072B2", "#D55E00", "#a65b85"]); 

    //plot points
    let circles = chart.selectAll("circle")
    .data(filteredFPData);

    //transition circles to new points
    circles.transition()
    .duration(1000)
    .attr("cx", d => xScale(parseFloat(d[xVal])))
    .attr("cy", d => yScale(parseFloat(yData.find(abr => abr['ISO3'] === d['ISO3'])[yVal])))
    .attr("fill", d => colorScale(d['SDG Region']))
    .attr("r", 5);

    // add new if needed
    circles.enter().append("circle")
        .attr("cx", d => xScale(parseFloat(d[xVal])))
        .attr("cy", d => yScale(parseFloat(yData.find(abr => abr['ISO3'] === d['ISO3'])[yVal])))
        .attr("r", 5)
        .attr("fill", d => colorScale(d['SDG Region']))
        .on("mouseover", function(event, d) {
            if (compsvg.classed('active')) {
                let row = yData.find(abr => abr['ISO3'] === d['ISO3']);
                tooltip.style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY + 10) + "px").style("visibility", "visible")
                    .html(`
                        <strong>Country:</strong> ${d['Geographic Area Name']}<br>
                        <strong>SDG Region:</strong> ${d['SDG Region']}<br>
                        <strong>${getDataLabelByValue(xData)}</strong>: ${d[xVal]}%<br>
                        <strong>${getDataLabelByValue(yData)}</strong>: ${row ? row[yVal] : "N/A"} per 1,000
                    `);
            }
        })
        .on("mousemove", function(event) {
            const [x, y] = d3.pointer(event);
            tooltip.style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY + 10) + "px");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
        })
        .style("pointer-events", "all");

    // remove non-existent
    circles.exit().remove();

    //regression line
    function regressionLine(sdgRegion = null){
        let filteredData = filteredFPData;
        if (sdgRegion) {
            filteredData = filteredFPData.filter(d => d['SDG Region'] === sdgRegion);
        }

        let combinedData = filteredData.map(d => {
            let match = yData.find(abr => abr['ISO3'] === d['ISO3']);
            if (match) {
                let x = parseFloat(d[xVal]);
                let y = parseFloat(match[yVal]);
                if (!isNaN(x) && !isNaN(y)) {
                    return [x, y];
                }
            }
            return null;
        }).filter(d => d !== null);
              
    
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
    }
    regressionLine(); 
   

    let selectedRegion = null;
    
    const scaleFactor = 0.7;  

    compsvg.select("#scatterlegend").remove();
    
    let legend = compsvg.append("g")
    .attr("id", "scatterlegend")
    .attr("transform", `translate(${compWidth - 230}, ${margin.top*1.5})`);
    

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
            .transition()
            .duration(400)  // transition when changing opacity
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
                    .transition()
                    .duration(200) 
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
                    .transition()
                    .duration(200) 
                        .style("opacity", 1);  
                } else {
                    chart.selectAll("circle")
                    .transition()
                    .duration(200) 
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
                    .transition()
                    .duration(200) 
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
                    .transition()
                    .duration(200) 
                        .style("opacity", 1);  // reset opacity
                    regressionLine();
                } else {
                    chart.selectAll("circle")
                    .transition()
                    .duration(200) 
                        .style("opacity", function(pointData) {
                            return pointData['SDG Region'] === selectedRegion ? 1 : 0.1;
                        });
                }
            }
        });
    }
initializeMapSVG();
initializeCompSvg();
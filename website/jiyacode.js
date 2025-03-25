// Set up the map dimensions
let mapsvg = d3.select("#dvmap");

let mapwidth = 960;
let mapheight = 500;

const myProjection = d3.geoNaturalEarth1();
const path = d3.geoPath().projection(myProjection);
const graticule = d3.geoGraticule();

let dvMapData;

async function loadDVMapData(){
    // Because d3.json() uses promises we have to use the keyword await to make sure each line completes before moving on to the next line
    await d3.csv("../../Data/Subjected_violence.csv").then(data => {
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

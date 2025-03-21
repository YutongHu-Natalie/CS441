// THIS CODE IS MY OWN WORK, IT WAS WRITTEN WITHOUT CONSULTING
// A TUTOR OR CODE WRITTEN BY OTHER STUDENTS - Jiya Shah

let keyframeIndex = 0;
// TODO add svgUpdate fields to keyframes
let keyframes = [
    {
        activeVerse: 1,
        activeLines: [1, 2, 3, 4],
        svgUpdate: drawRoseColours
    },
    {
        activeVerse: 2,
        activeLines: [1, 2, 3, 4],
        svgUpdate: drawVioletColours
    },
    {
        activeVerse: 3,
        activeLines: [1],
        svgUpdate: drawRoseColours
    },
    {
        activeVerse: 3,
        activeLines: [2],
        svgUpdate: () => highlightColour("Red", "red")
    },
    {
        activeVerse: 3,
        activeLines: [3],
        svgUpdate: () => highlightColour("White", "white")
    },
    {
        activeVerse: 3,
        activeLines: [4],
        svgUpdate: () => highlightBars()
    },
    {
        // TODO update keyframes for verse 4 to show each line one by one
        activeVerse: 4,
        activeLines: [1], 
        svgUpdate: drawRoseColours
    },
    {
        activeVerse: 4,
        activeLines: [2], 
        svgUpdate: drawRoseColours
    },
    {
        activeVerse: 4,
        activeLines: [3],
        svgUpdate: () => sortedRoseData()
    },
    {
        activeVerse: 4,
        activeLines: [4], 
        svgUpdate: () => sortedRoseData()
    },
    {
        // TODO update keyframes for verse 4 to show each line one by one
        activeVerse: 5,
        activeLines: [1,2,3,4], 
        svgUpdate: drawVioletPie
    },
]

let roseChartData;
let violetChartData;

const width = 500;
const height = 400;


// TODO write a function that highlights every bar in the colour it represents
function highlightEveryBar(colorName, highlightColor){
    svg.selectAll(".bar") // TODO select bar that has the right value
    .filter(d=> d.colour === colorName)
    .transition()
    .duration(500)
    .attr("fill", highlightColor);
}


// TODO update the keyframe displaying the 4th line of the 3rd verse so that every bar gets highlighted in its respective colour
function highlightBars(){

    colorBars={
        "Red":"red",
        "White":"white",
        "Pink": "pink",
        "Yellow": "yellow",
        "Orange": "orange"
    }
    
    for (const key in colorBars){
        highlightEveryBar(key, colorBars[key]);
    }

}



// TODO write a function which will display the rose data sorted from highest to lowest
function sortedRoseData(){
    sortedRose = roseChartData.toSorted((a, b) => b.count - a.count) // HINT Be careful when sorting the data that you don't change the rosechartData variable itself, otherwise when you a user clicks back to the start it will always be sorted
    // HINT If you have correctly implemented your updateBarchart function then you won't need to do anything extra to make sure it animates smoothly (just pass a sorted version of the data to updateBarchart) 
    updateBarChart(sortedRose, "Distribution of Rose Colours");
    if(svg.select(".x-axis").empty() && svg.select(".y-axis").empty()){ //if we just did pie chart -- redo the axes and all
        //remove piechart
        svg.selectAll(".slice")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();
        console.log(svg.selectAll(".text"))
        svg.selectAll(".text")
        .transition()
        .duration(500)
        .style("opacity", 0)
        .remove();

        chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text");

        // Add y-axis
        chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text");

        
        
    }
}

// TODO define global variables
let svg = d3.select("#svg");

// TODO add event listeners to the buttons
document.getElementById("forward-button").addEventListener("click", forwardClicked);
document.getElementById("backward-button").addEventListener("click", backwardClicked);


// TODO write an asynchronous loadData function
async function loadData(){
    // Because d3.json() uses promises we have to use the keyword await to make sure each line completes before moving on to the next line
    await d3.json("../../assets/data/rose_colours.json").then(data => {
        // Inside the promise we set the global variable equal to the data being loaded from the file
        roseChartData = data;
    });

    await d3.json("../../assets/data/violet_colours.json").then(data => {
        violetChartData = data;
    });
}
// TODO call loadData in our initalise function
async function initialise() {
    // TODO load the data
    await loadData(); 
    // TODO initalise the SVG
    initializeSVG();
    // TODO draw the first keyframe
    drawKeyframe(keyframeIndex);
    // TODO make the word red clickable
    makeRedAndPurpleHoverable();
}

// TODO draw a bar chart from the rose dataset
function drawRoseColours() {
    updateBarChart(roseChartData, "Distribution of Rose Colours");
    
    makeRedBarHoverable();
}

// TODO draw a bar chart from the violet dataset
function drawVioletColours() {
    updateBarChart(violetChartData, "Distribution of Violet Colours");
}

function highlightColour(colourName, highlightColour) {
    svg.selectAll(".bar") // TODO select bar that has the right value
    .transition() //TODO add a transition to make it smooth
    .duration(500)
    .attr("fill", d => (d.colour === colourName ? highlightColour : "#999")); // TODO update it's fill colour
}

// TODO recreate the updateBarchart function from the tutorial
function updateBarChart(data, title) {
    // TODO Update the xScale domain to match new order
    xScale.domain(data.map(d => d.colour));
    // TODO Update the yScale domain for new values
    yScale.domain([0, d3.max(data, d => d.count)]).nice();
    // TODO select all the existing bars
    const bars = chart.selectAll(".bar")
    .data(data, d => d.colour);
    // TODO add animation to ALL aspects of updating the bar chart (removing bars, moving bars, adding bars, updating axes, updating the title)
    // HINTS for adding animation remember to call .transition().duration(num_of_ms) immediately before the fields you change
   
    // TODO remove any bars no longer in the dataset
    // for removing bars - you want the height to go down to 0 and the y value to change too. Then you can call .remove()
    bars.exit()
    .transition()
    .duration(1000)
    .attr("height", 0)
    .attr("y", 0);
    
    //remove
    bars.exit().remove();
    // TODO move any bars that already existed to their correct spot - transition for moving existing bars - you'll have to update their x, y, and height values
    bars
    .transition()
    .duration(1000)
    .attr("x", d => xScale(d.colour))
    .attr("y", d => yScale(d.count))
    .attr("height", d => chartHeight - yScale(d.count));


    // TODO Add any new bars - transition for adding new bars - see the tutorial
     bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.colour))
        .attr("y", chartHeight) //set initial y position below chart so we cant see it
        .attr("width", xScale.bandwidth())
        .attr("height", 0) // Set initial height to 0 so there is nothing to display
        .attr("fill", "#999")
        .transition() // Declare we want to do a transition
        .duration(1000) // This one is going to last for one second
        .attr("y", d => yScale(d.count))
        .attr("height", d => chartHeight - yScale(d.count));
    // TODO update the x and y axis - transition for the axes all you need to do is add a transition before the .call function we use in the tutorial
    
    chart.select(".x-axis")    
    .transition()
    .duration(1000).call(d3.axisBottom(xScale));

    chart.select(".y-axis")
    .transition()
    .duration(1000).call(d3.axisLeft(yScale));

    // TODO update the title - transition -  for the title .text is the function that actually changes the title
    if(title.length>0){
        svg.select("#chart-title")
        .transition()
        .duration(1000).text(title);
    }
    
}



function forwardClicked() {
    // TODO define behaviour when the forwards button is clicked
    if (keyframeIndex < keyframes.length - 1) {
        keyframeIndex++;
        drawKeyframe(keyframeIndex);
    }
}

function backwardClicked() {
    // TODO define behaviour when the backwards button is clicked
    if (keyframeIndex > 0) {
        keyframeIndex--;
        drawKeyframe(keyframeIndex);
    }
}   

function drawKeyframe(kfi) {
    // TODO get keyframe at index position
    let kf = keyframes[kfi]
    // TODO reset any active lines
    resetActiveLines();

    // TODO update the active verse
    updateActiveVerse(kf.activeVerse);

    // TODO update any active lines
    for (line of kf.activeLines){
        updateActiveLine(kf.activeVerse, line);
    }

    // TODO update the svg
    if(kf.svgUpdate){
        // If there is we call it like this
        kf.svgUpdate();
    }
}

// TODO write a function to reset any active lines
function resetActiveLines() {
    d3.selectAll(".line").classed("active-line", false); 
}


// TODO write a function to scroll the left column to the right place
function scrollLeftColumnToActiveVerse(id){
    console.log("hai!!")
    let leftColumn = document.querySelector(".left-column-content");
   
    // TODO select the verse we want to display
    let activeVerse = document.getElementById("verse" + id);

    // TODO calculate the bounding rectangles of both of these elements
    let verseRect = activeVerse.getBoundingClientRect();
    let leftColumnRect = leftColumn.getBoundingClientRect();

    // TODO calculate the desired scroll position
    let desiredScrollTop = verseRect.top + leftColumn.scrollTop - leftColumnRect.top - (leftColumnRect.height - verseRect.height) / 2;

    // TODO scroll to the desired position
    console.log(desiredScrollTop)
    leftColumn.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth',
    })
}

// TODO call this function when updating the active verse
// TODO write a function to update the active verse
function updateActiveVerse(id) {
    d3.selectAll(".verse").classed("active-verse", false); //removing "active" from class of all verses
    d3.select("#verse"+id).classed("active-verse", true); //making the id verse = the active verse
    scrollLeftColumnToActiveVerse(id);
}

// TODO write a function to update the active line
function updateActiveLine(vid, lid) {
    let thisVerse = d3.select("#verse"+vid);
    thisVerse.select("#line"+lid).classed("active-line", true);
}


// TODO write a function to initialise the svg properly
function initializeSVG(){
    svg.attr("width", width);
    svg.attr("height", height);


    const margin = { top: 30, right: 30, bottom: 50, left: 50 };
    chartWidth = width - margin.left - margin.right;
    chartHeight = height - margin.top - margin.bottom;

    chart = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    xScale = d3.scaleBand()
        .domain([])
        .range([0, chartWidth])
        .padding(0.1);

    yScale = d3.scaleLinear()
        .domain([])
        .nice()
        .range([chartHeight, 0]);

    // Add x-axis
    chart.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${chartHeight})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text");

    // Add y-axis
    chart.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(yScale))
        .selectAll("text");

    // Add title
    svg.append("text")
        .attr("id", "chart-title")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "white")
        .text("");
}

// TODO write a function to make every instance of "red" and "purple" in the poem hoverable. When you hover the corresponding bar in the chart (if it exists) should be highlighted in its colour
// HINT when you 'mouseout' of the word the bar should return to it's original colour
// HINT you will want to edit the html and css files to achieve this
// HINT this behaviour should be global at all times so make sure you call it when you intialise everything

function makeRedAndPurpleHoverable() {
    d3.selectAll(".red-span").on("mouseover", () => highlightColour("Red", "red"));
    d3.selectAll(".red-span").on("mouseout", () => highlightColour("None", "red"));
    d3.selectAll(".purple-span").on("mouseover", () => highlightColour("Purple", "purple"));
    d3.selectAll(".purple-span").on("mouseout", () => highlightColour("None", "red"));
}



// TODO write a function so that when you click on the red bar when verse 4 is displayed (and only when verse 4 is displayed) every instance of the word red in the poem are highlighted in red
// HINT you will need to update the keyframes to do this and ensure it isn't global behaviour
// HINT you will again have to edit the html and css
let redspan = false;
function makeRedBarHoverable() {
    // Select the bar associated with the "red" value
    const redBar = chart.selectAll(".bar").filter(d => d.colour === "Red"); //allows you to filter only ones that match certain value
    // Add a mouseover event listener
    redBar.on("click", () => {
        if(keyframes[keyframeIndex].activeVerse == 4){
            if (redspan === false){
                d3.selectAll(".red-span").classed("red-text", true);
                redspan = true;
            }
            else{
                d3.selectAll(".red-span").classed("red-text", false);
                redspan = false;
            }
        } 
    });
};



let radius =  Math.min(width, height) / 2;
// TODO update the html to add a fifth verse
// TODO add keyframe(s) for your new fifth verse
// TODO the first keyframe should update the svg and display a pie chart of either the roses or violets dataset
function drawVioletPie() {
    
    const bars = svg.selectAll(".bar");
    const pie = d3.pie().value(d => d.count); 
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    // transition bars to nothing
    bars.transition()
        .duration(500)
        .attr("height", 0) //shrink
        .style("fill-opacity", 0) // fade out
        .on("end", function() {
            // remove
            d3.select(this).remove();
            svg.select(".x-axis").remove();
            svg.select(".y-axis").remove();

            //update chart title
            svg.select("#chart-title")
            .transition()
            .duration(1000).text("Distribution of Violet Colours");
            //group element to hold the pie chart and center in svg
            const pieGroup = svg.append("g")
                .attr("transform", `translate(${width / 2}, ${height / 2})`); // move to center

            // pie chart
            const slices = pieGroup.selectAll(".slice")
                .data(pie(violetChartData)); 

            colorSlices={
                "Lavender":"lavender",
                "Purple":"purple",
                "Blue": "blue",
                "Pink": "pink",
                "White": "white"
            }

            slices.enter().append("path")
                .attr("class", "slice")
                .attr("d", arc)
                .attr("fill", (d, i) => {
                    console.log(d.data.colour)
                    return colorSlices[d.data.colour]}) //color slice by its name
                .attr("transform", "scale(0)") // transition from 0
                .transition()
                .duration(500)
                .attr("transform", "scale(0.85)"); // to full scale

            // labels
            slices.enter().append("text")
            .transition()
            .duration(500)
            .attr("class", "text") 
            .attr("transform", d => "translate(" + arc.centroid(d) + ")")  //positioning
            .attr("dy", ".35em") 
            .attr("text-anchor", "middle")
            .style("fill", "black") //text color
            .style("font-size", "14px") // font-size
            .text(d => {
                return d.data.colour; //label = color
            })
            .transition()
            .duration(500)
            .attr("transform", d => "translate(" + arc.centroid(d) + ") scale(1)"); //transition
                });
}
initialise();


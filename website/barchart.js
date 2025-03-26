
let margin = { top: 50, right: 40, bottom: 70, left: 50 };
const width = 650, height = 400;
const basePath = window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
    ? ""
    : "/CS441";
function initialiseSVG(containerId) {
    d3.select(containerId).selectAll("*").remove();
    console.log('initialize SVG for', containerId)
    const svg = d3.select(containerId)
        .append("svg")
        .attr("width", "100%")
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");
    let margin_left = containerId == "#abrbarchart" ? margin.left + 100 : margin.left
    const chart = svg.append("g")
        .attr("transform", `translate(${margin_left}, ${margin.top})`);

    chart.append("g").attr("class", "x-axis");
    chart.append("g").attr("class", "y-axis");

    return { svg, chart };
}

function processLiteracyData(data) {
    console.log(data);
    const countryMap = new Map();

    data.forEach(d => {
        const country = d["Geographic Area Name"];
        const sex = d["Sex Code"];
        const value = +d["Value(%)"];

        if (!countryMap.has(country)) {
            countryMap.set(country, {});
        }
        countryMap.get(country)[sex] = value;
    });

    // Compute gender disparity (Male - Female)
    let disparityData = [];
    countryMap.forEach((values, country) => {
        if ("F" in values && "M" in values) {
            disparityData.push({ country, disparity: values.M - values.F });
        }
    });

    return disparityData;
}

function processBirthRateData(data) {
    console.log(data);
    return data.map(d => ({
        country: d["Geographic Area Name"],
        value: +d["Value(per 1,000 population)"]
    }));
}
//only show 5 countries by default
function selectTopOrRandom(data, key, count = 5) {
    return data.length > count
        ? data.sort((a, b) => b[key] - a[key]).slice(0, count) // Top 5
        : d3.shuffle(data).slice(0, count); // Random 5 if less data
}
//draw the charts
function renderChart(data, containerId, title, valueKey, isHorizontal) {
    const { svg, chart } = initialiseSVG(containerId);

    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const xScale = isHorizontal
        ? d3.scaleLinear().range([0, chartWidth])
        : d3.scaleBand().range([0, chartWidth]).padding(0.3);

    const yScale = isHorizontal
        ? d3.scaleBand().range([0, chartHeight]).padding(0.3)
        : d3.scaleLinear().range([chartHeight, 0]);


    if (isHorizontal) {
        xScale.domain([0, d3.max(data, d => d[valueKey])]);
        yScale.domain(data.map(d => d.country));
    } else {
        xScale.domain(data.map(d => d.country));
        // For non-horizontal charts, allow negative values
        const minValue = Math.min(0, d3.min(data, d => d[valueKey]));
        const maxValue = Math.max(0, d3.max(data, d => d[valueKey]));
        yScale.domain([minValue, maxValue]);
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

    const bars = chart.selectAll(".bar").data(data, d => d.country);

    bars.enter()
        .append("rect")
        .attr("class", "bar")
        .merge(bars)
        .transition().duration(500)
        .attr("x", d => isHorizontal ? 0 : xScale(d.country))
        .attr("y", d => isHorizontal ? yScale(d.country) : yScale(d[valueKey]))
        .attr("width", d => isHorizontal ? xScale(d[valueKey]) : xScale.bandwidth())
        .attr("height", d => isHorizontal ? yScale.bandwidth() : chartHeight - yScale(d[valueKey]))
        .style("fill", "rgb(220, 120, 140)");

    bars.exit().remove();

    svg.append("text")
        .attr("x", width / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("fill", "black")
        .text(title);
    let x_label_width = isHorizontal ? width / 2 + 50 : width / 2;
    // Add x-axis label
    svg.append("text")
        .attr("x", x_label_width)
        .attr("y", height - 30)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text(isHorizontal ? "Value(per 1,000 population)" : "Country");


    // Add y-axis label
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -(height / 2))
        .attr("y", 15)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text(isHorizontal ? "Country" : valueKey === "disparity" ? "Gender Disparity (%)" : "Value(per 1,000 population)");

    svg.append("text")
        .attr("x", width / 3)
        .attr("y", height - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "gray")
        .text("Only the top 5 countries in the descending order will be presented initially by default");
}

// Load datasets and render charts
Promise.all([
    d3.csv(`${basePath}/Data/Adolescent_birth_rate.csv`),
    d3.csv(`${basePath}/Data/final_youth_literacy.csv`)
]).then(([birthData, literacyData]) => {
    const processedBirthData = selectTopOrRandom(processBirthRateData(birthData), "value");
    console.log(processedBirthData);
    renderChart(processedBirthData, "#abrbarchart", "Adolescent Birth Rate", "value", true);

    const processedLiteracyData = selectTopOrRandom(processLiteracyData(literacyData), "disparity");
    console.log(processedLiteracyData);
    renderChart(processedLiteracyData, "#ylcbarchart", "Youth Literacy Disparity (M - F)", "disparity", false);
});


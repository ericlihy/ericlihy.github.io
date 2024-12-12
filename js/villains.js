// Margin conventions and SVG drawing area
// Global variable for slider values
let sliderValues = [];


let margin = {top: 60, right: 40, bottom: 80, left: 80};
let width = 600 - margin.left - margin.right;
let height = 500 - margin.top - margin.bottom;

let svg = d3.select("#chart-area").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

// Add plot title
svg.append("text")
    .attr("x", width / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .attr("class", "plot-title")
    .text("Cumulative Number of Villains Over the Years")
    .style("font-size", "18px")
    .style("font-weight", "bold");

// Add x-axis label
svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 50)
    .attr("text-anchor", "middle")
    .attr("class", "x-axis-label")
    .text("Years");

// Add y-axis label
svg.append("text")
    .attr("x", -height / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("class", "y-axis-label")
    .text("Number of Villains");

// Date parser
let formatDate = d3.timeFormat("%Y");
let parseDate = d3.timeParse("%Y");

// Initialize data
loadData();

// Superheroes dataset
let data;

// Load CSV file
function loadData() {
    d3.csv("data/superheroes.csv", row => {
        row.Year = parseDate(row.Year);
        row.Villain = +row.Villain;
        row["Avg. Intelligence"] = +row["Avg. Intelligence"];
        row["Avg. Strength"] = +row["Avg. Strength"];
        row["Avg. Speed"] = +row["Avg. Speed"];
        row["Avg. Durability"] = +row["Avg. Durability"];
        return row;
    }).then(csv => {
        data = csv;

        let minYear = d3.min(data, d => +formatDate(d.Year));
        let maxYear = d3.max(data, d => +formatDate(d.Year));

        // Initialize the slider
        let slider = document.getElementById('slider');
        noUiSlider.create(slider, {
            start: [minYear, maxYear],
            connect: true,
            range: {
                'min': minYear,
                'max': maxYear
            },
            tooltips: true,
            format: {
                to: value => Math.round(value),
                from: value => Number(value)
            }
        });

        slider.noUiSlider.on('update', function(values) {
            sliderValues = [parseDate(values[0].toString()), parseDate(values[1].toString())];
            updateVisualization();
        });

        // Draw visualization initially
        updateVisualization();
    });
}

let xScale = d3.scaleTime()
    .range([0, width]);

let yScale = d3.scaleLinear()
    .range([height, 0]);

let xAxis = d3.axisBottom(xScale)
    .ticks(d3.timeYear.every(5));

let yAxis = d3.axisLeft(yScale);

svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")");

svg.append("g")
    .attr("class", "y-axis");

let linePath = svg.append("path")
    .attr("class", "line")
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2);

let selectedAttribute = "Villain";

function updateVisualization() {
    let filteredData = data.filter(d => d.Year >= sliderValues[0] && d.Year <= sliderValues[1]);

    xScale.domain(d3.extent(filteredData, d => d.Year));
    yScale.domain([0, d3.max(filteredData, d => d[selectedAttribute])]);

    svg.select(".x-axis")
        .transition().duration(1000)
        .call(xAxis);

    svg.select(".y-axis")
        .transition().duration(1000)
        .call(yAxis);

    linePath
        .datum(filteredData)
        .transition().duration(1000)
        .attr("d", d3.line()
            .x(d => xScale(d.Year))
            .y(d => yScale(d[selectedAttribute]))
            .curve(d3.curveLinear)
        );

    let circles = svg.selectAll("circle")
        .data(filteredData, d => d.Year);

    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.Year))
        .attr("cy", d => yScale(d[selectedAttribute]))
        .attr("r", 4)
        .attr("fill", "#000080")
        .on("click", function(event, d) {
            showDetails(d);
        })
        .on("mouseover", function() {
            d3.select(this).attr("r", 8);
        })
        .on("mouseout", function() {
            d3.select(this).attr("r", 5);
        })
        .merge(circles)
        .transition().duration(1000)
        .attr("cx", d => xScale(d.Year))
        .attr("cy", d => yScale(d[selectedAttribute]));

    circles.exit().remove();

    // Update details dynamically
    let avgIntelligence = d3.mean(filteredData, d => d["Avg. Intelligence"]);
    let avgStrength = d3.mean(filteredData, d => d["Avg. Strength"]);
    let avgSpeed = d3.mean(filteredData, d => d["Avg. Speed"]);
    let avgDurability = d3.mean(filteredData, d => d["Avg. Durability"]);
    let cumulativeVillains = d3.max(filteredData, d => d.Villain);

    d3.select("#details-number").text(cumulativeVillains || "N/A");
    d3.select("#details-intelligence").text(avgIntelligence ? avgIntelligence.toFixed(2) : "N/A");
    d3.select("#details-strength").text(avgStrength ? avgStrength.toFixed(2) : "N/A");
    d3.select("#details-speed").text(avgSpeed ? avgSpeed.toFixed(2) : "N/A");
    d3.select("#details-durability").text(avgDurability ? avgDurability.toFixed(2) : "N/A");
}

function showDetails(d) {
    d3.select("#details-number").text(d.Villain);
    d3.select("#details-intelligence").text(d["Avg. Intelligence"]);
    d3.select("#details-strength").text(d["Avg. Strength"]);
    d3.select("#details-speed").text(d["Avg. Speed"]);
    d3.select("#details-durability").text(d["Avg. Durability"]);
}

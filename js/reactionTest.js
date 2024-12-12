class ReactionTest {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.trialResults = [];
        this.isWaiting = false;
        this.startTime = null;
        this.currentTrial = 0;
        this.totalTrials = 5; // Default number of trials

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Create a flexible container
        vis.container = d3.select("#" + vis.parentContainer)
            .append("div")
            .style("width", "100%")
            .style("height", "auto")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("padding", "2rem");

        vis.button = vis.container.append("button")
            .attr("class", "reaction-button")
            .style("padding", "1rem 2rem")
            .style("font-size", "1rem")
            .style("cursor", "pointer")
            .text("Start Test")
            .on("click", () => vis.handleClick());

        // Text elements can also scale; just use relative units like em or rem in CSS.
        vis.textDisplay = vis.container.append("div")
            .style("text-align", "center")
            .style("font-size", "1.5rem")
            .style("margin", "1rem")
            .text("Press the button to begin test");

        vis.resultsDisplay = vis.container.append("div")
            .style("text-align", "center")
            .style("margin", "1rem");
    }


    startTrial() {
        let vis = this;
        vis.button.text("Wait...");
        vis.button.style("background-color", "#cccccc");
        vis.textDisplay.text(`Trial ${vis.currentTrial + 1} of ${vis.totalTrials} - Wait for the button to say "Click!"`);

        // Random delay between 1-5 seconds
        let delay = 1000 + Math.random() * 4000;

        vis.isWaiting = true;
        setTimeout(() => {
            if (vis.isWaiting) {
                vis.button.text("Click!");
                vis.button.style("background-color", "#4CAF50");
                vis.startTime = Date.now();
            }
        }, delay);
    }

    handleClick() {
        let vis = this;

        if (!vis.isWaiting) {
            // Start new trial
            vis.startTrial();
        } else if (vis.startTime === null) {
            // Clicked too early
            vis.button.text("Start Again");
            vis.button.style("background-color", "#f44336");
            vis.textDisplay.text("Too early! Click to try again");
            vis.isWaiting = false;
        } else {
            // Valid click - record reaction time
            let reactionTime = Date.now() - vis.startTime;
            vis.trialResults.push(reactionTime);

            vis.currentTrial++;
            vis.isWaiting = false;
            vis.startTime = null;

            if (vis.currentTrial < vis.totalTrials) {
                // More trials to go
                vis.button.text("Next Trial");
                vis.button.style("background-color", "#2196F3");
                vis.textDisplay.text(`${reactionTime}ms - Click for next trial`);

                // Update running results
                vis.updateResults();
            } else {
                // Test complete
                vis.button.text("Test Complete");
                vis.button.style("background-color", "#9C27B0");
                vis.button.style("cursor", "default");
                vis.button.on("click", null); // Remove click handler
                vis.finalizeResults();
            }
        }
    }

    updateResults() {
        let vis = this;
        let resultText = "Results so far: " +
            vis.trialResults.map(t => t + "ms").join(", ");
        vis.resultsDisplay.text(resultText);
    }

    finalizeResults() {
        let vis = this;
        let avg = Math.round(vis.trialResults.reduce((a, b) => a + b, 0) / vis.trialResults.length);
        let best = Math.min(...vis.trialResults);

        let speedPercentage = Math.round((325 / avg) * 100);
        if (speedPercentage > 100) speedPercentage = 100;

        vis.textDisplay.text(`Test Complete! Average: ${avg}ms, Best: ${best}ms (Speed: ${speedPercentage}%)`);
        vis.updateResults();

        // Create chart container
        vis.chartContainer = vis.container.append("svg")
            .attr("width", 500)
            .attr("height", 300)
            .style("margin-top", "2rem");

        // Define chart dimensions
        let margin = { top: 20, right: 20, bottom: 40, left: 50 };
        let width = 500 - margin.left - margin.right;
        let height = 300 - margin.top - margin.bottom;

        let chart = vis.chartContainer.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Create scales
        let xScale = d3.scaleLinear()
            .domain([1, vis.trialResults.length])
            .range([0, width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(vis.trialResults.concat(450))])
            .range([height, 0]);

        // Add axes
        let xAxis = d3.axisBottom(xScale).ticks(vis.trialResults.length);
        let yAxis = d3.axisLeft(yScale);

        chart.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(xAxis)
            .append("text")
            .attr("x", width / 2)
            .attr("y", 35)
            .style("text-anchor", "middle")
            .text("Trial Number");

        chart.append("g")
            .call(yAxis)
            .attr("class", "y-axis");

        chart.select(".y-axis text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .style("text-anchor", "middle")
            .text("Reaction Time (ms)");

        // Add reaction time bars
        chart.selectAll(".bar")
            .data(vis.trialResults)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d, i) => xScale(i + 1) - 15)
            .attr("y", d => yScale(d))
            .attr("width", 30)
            .attr("height", d => height - yScale(d))
            .style("fill", "#4CAF50");

        // Ensure y-axis is in front of bars
        chart.select(".y-axis").raise();

        // Add average reaction time line
        chart.append("line")
            .attr("x1", xScale(1))
            .attr("y1", yScale(450))
            .attr("x2", xScale(vis.trialResults.length))
            .attr("y2", yScale(450))
            .style("stroke", "#FF5722")
            .style("stroke-width", 2)
            .style("stroke-dasharray", "4,4");

        chart.append("text")
            .attr("x", xScale(vis.trialResults.length) - 150)
            .attr("y", yScale(450) - 10)
            .style("fill", "#FF5722")
            .style("font-size", "12px")
            .text("Typical Human Average");

        // Update scores manager instead of directly updating radar chart
        if (window.userScoresManager) {
            window.userScoresManager.updateScore('speed', speedPercentage);
        }
    }
}
class DurabilityTest {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.isTestActive = false;
        this.testCompleted = false;
        this.clickCount = 0;
        this.timeRemaining = 30;
        this.testResults = [];
        this.testDuration = 30; // seconds
        this.clickTimestamps = [];
        this.spacebarPressed = false; // Track spacebar state

        this.initVis();
    }

    initVis() {
        let test = this;

        test.container = d3.select("#" + test.parentContainer)
            .append("div")
            .style("width", "100%")
            .style("height", "auto")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("padding", "2rem");

        test.button = test.container.append("button")
            .attr("class", "durability-button")
            .style("padding", "1rem 2rem")
            .style("font-size", "1rem")
            .style("margin", "1rem")
            .style("cursor", "pointer")
            .text("Start Test")
            .on("click", () => test.startTest());

        test.textDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("font-size", "1.5rem")
            .style("margin", "1rem")
            .text("Press the spacebar as many times as you can in 30 seconds!");

        test.timerDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("font-size", "2rem")
            .style("margin", "1rem")
            .text("Time: 30s");

        test.counterDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("font-size", "2rem")
            .style("margin", "1rem")
            .text("Clicks: 0");

        test.progressBarContainer = test.container.append("div")
            .style("width", "80%")
            .style("height", "30px")
            .style("background-color", "#f3f3f3")
            .style("border", "1px solid #ccc")
            .style("border-radius", "15px")
            .style("overflow", "hidden")
            .style("margin", "1rem 0");

        test.progressBar = test.progressBarContainer.append("div")
            .style("width", "0%")
            .style("height", "100%")
            .style("background-color", "#4caf50")
            .style("border-radius", "15px");

        test.resultsDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("margin", "1rem");

        // Handle keydown - only register first press
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                event.preventDefault(); // Always prevent scrolling
                if (test.isTestActive && !test.spacebarPressed) {
                    test.spacebarPressed = true;
                    test.handleSpacebar();
                }
            }
        });

        // Handle keyup - reset spacebar state
        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space') {
                event.preventDefault();
                test.spacebarPressed = false;
            }
        });
    }

    startTest() {
        let test = this;

        // If test already completed, do nothing
        if (test.testCompleted) return;

        // Reset values
        test.isTestActive = false; // Initially false to prevent clicks during pre-test countdown
        test.clickCount = 0;
        test.timeRemaining = test.testDuration;
        test.clickTimestamps = [];
        test.spacebarPressed = false;

        // Update button and text to indicate the test is about to start
        test.button.text("Get Ready...")
            .style("background-color", "#cccccc")
            .style("cursor", "default");
        test.counterDisplay.text("Clicks: 0");
        test.textDisplay.text("Test will start in 3 seconds...");
        test.timerDisplay.text("Starting in: 3s");

        let preTestTime = 3;
        let preTestInterval = setInterval(() => {
            preTestTime--;
            test.timerDisplay.text(`Starting in: ${preTestTime}s`);

            if (preTestTime <= 0) {
                clearInterval(preTestInterval);
                test.beginActualTest();
            }
        }, 1000);
    }

    beginActualTest() {
        let test = this;

        // Reset spacebar state
        test.spacebarPressed = false;

        // Now allow clicks
        test.isTestActive = true;
        test.textDisplay.text("Press the spacebar!");
        test.button.text("Test in Progress");

        // Start the 30-second timer
        let timer = setInterval(() => {
            test.timeRemaining--;
            test.timerDisplay.text(`Time: ${test.timeRemaining}s`);

            if (test.timeRemaining <= 0) {
                clearInterval(timer);
                test.endTest();
            }
        }, 1000);
    }

    handleSpacebar() {
        let test = this;

        if (test.isTestActive) {
            test.clickCount++;
            test.counterDisplay.text(`Clicks: ${test.clickCount}`);

            // Update progress bar based on clicks
            const progressPercentage = Math.min(100, (test.clickCount / 400) * 100); // Assuming 400 clicks is the max
            const spectrumColor = d3.interpolateRdYlGn(progressPercentage / 100); // Map progress to a color spectrum
            test.progressBar.transition().duration(100)
                .style("width", `${progressPercentage}%`)
                .style("background-color", spectrumColor);

            test.clickTimestamps.push(Date.now());
        }
    }

    endTest() {
        let test = this;

        // Stop test
        test.isTestActive = false;
        test.testCompleted = true;

        // Calculate clicks per second
        const clicksPerSecond = (test.clickCount / test.testDuration).toFixed(2);

        // Analyze deceleration
        const startTime = test.clickTimestamps.length > 0 ? test.clickTimestamps[0] : null;
        let firstSegmentCount = 0, secondSegmentCount = 0, thirdSegmentCount = 0;
        if (startTime) {
            test.clickTimestamps.forEach(t => {
                const elapsed = (t - startTime) / 1000;
                if (elapsed <= 10) {
                    firstSegmentCount++;
                } else if (elapsed <= 20) {
                    secondSegmentCount++;
                } else {
                    thirdSegmentCount++;
                }
            });
        }

        const avgFirst = (firstSegmentCount / 10).toFixed(2);
        const avgSecond = (secondSegmentCount / 10).toFixed(2);
        const avgThird = (thirdSegmentCount / 10).toFixed(2);

        // Deceleration calculation
        let deceleration = 0;
        if (avgFirst > 0) {
            deceleration = ((parseFloat(avgFirst) - parseFloat(avgThird)) / parseFloat(avgFirst)) * 100;
            deceleration = Math.max(0, Math.min(100, parseFloat(deceleration.toFixed(1))));
        }

        // Compute final score
        const baseline = 400; // Adjusted to 400 clicks
        let clicksRatio = test.clickCount / baseline;
        if (clicksRatio > 1) clicksRatio = 1;
        const clickScore = clicksRatio * 30;
        const decelerationScore = ((100 - deceleration) / 100) * 70;
        let finalScore = Math.min(100, Math.max(0, clickScore + decelerationScore));
        finalScore = finalScore.toFixed(2);

        // Store result
        test.testResults.push({
            totalClicks: test.clickCount,
            clicksPerSecond: clicksPerSecond,
            deceleration: deceleration,
            finalScore: finalScore
        });

        // Update displays
        test.button.text("Test Completed")
            .style("background-color", "#cccccc")
            .style("cursor", "not-allowed");

        test.textDisplay.text(`Test Complete! ${test.clickCount} clicks (${clicksPerSecond} clicks/second)`);

        window.userDurabilityScore = parseFloat(finalScore);
        if (window.userScoresManager) {
            window.userScoresManager.updateScore('durability', window.userDurabilityScore);
        }

        // Display rate breakdown as text
        test.resultsDisplay.html(`
            <p><strong>Rate Breakdown:</strong></p>
            <p>First 10s: ${firstSegmentCount} clicks (${avgFirst}/s)</p>
            <p>Second 10s: ${secondSegmentCount} clicks (${avgSecond}/s)</p>
            <p>Third 10s: ${thirdSegmentCount} clicks (${avgThird}/s)</p>
            <p>Deceleration: ${deceleration}%</p>
            <hr>
            <p><strong>Final Score: ${finalScore}%</strong></p>
        `);
    }

    getResults() {
        return this.testResults;
    }
}

class IntelligenceTest {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;
        this.currentQuestionIndex = 0;
        this.quizScore = 0;
        this.hanoiScore = 0;
        this.selectedOption = null;
        this.hanoiStartTime = null;
        this.hanoiSolved = false;

        // Ensure we have access to the score manager
        if (!window.userScoresManager) {
            window.userScoresManager = new UserScoresManager();
        }

        // Four quiz questions
        this.questions = [
            {
                question: "What comes next in the sequence: 1, 6, 21, 66, ?",
                options: ["201", "198", "120", "157"],
                answer: "201"
            },
            {
                question: "If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?",
                options: ["Yes", "No"],
                answer: "Yes"
            },
            {
                question: "Which number is missing: 1, 1, 2, 3, 5, ?",
                options: ["7", "8", "6", "9"],
                answer: "8"
            },
            {
                question: "Which shape does not belong in this group? Triangle, Square, Hexagon, Octagon",
                options: ["Triangle", "Square", "Hexagon", "Octagon"],
                answer: "Triangle"
            }
        ];

        this.initVis();
    }

    initVis() {
        let test = this;

        test.container = d3.select("#" + test.parentContainer)
            .append("div")
            .style("width", "100%")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center")
            .style("justify-content", "center")
            .style("padding", "2rem");

        test.questionDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("font-size", "1.5rem")
            .style("margin", "1rem");

        test.optionsContainer = test.container.append("div")
            .style("display", "flex")
            .style("flex-direction", "column")
            .style("align-items", "center");

        test.visualizationContainer = test.container.append("div")
            .attr("id", "visualization-container")
            .style("width", "100%")
            .style("margin", "1rem");

        const hanoiTitle = document.querySelector("#tower-of-hanoi-puzzle");
        if (hanoiTitle) {
            hanoiTitle.remove();
        }

        test.hanoiContainer = test.container.append("div")
            .attr("id", "hanoi-puzzle-container")
            .style("display", "none")
            .style("width", "100%")
            .style("text-align", "center")
            .style("margin", "2rem auto");

        test.resultsDisplay = test.container.append("div")
            .style("text-align", "center")
            .style("margin", "1rem");

        test.submitButton = test.container.append("button")
            .attr("class", "intelligence-button")
            .style("padding", "1rem 2rem")
            .style("font-size", "1rem")
            .style("cursor", "pointer")
            .text("Submit Answer")
            .style("visibility", "hidden")
            .on("click", () => test.nextQuestion());

        test.nextButton = test.container.append("button")
            .attr("class", "intelligence-button")
            .style("padding", "1rem 2rem")
            .style("font-size", "1rem")
            .style("cursor", "pointer")
            .style("margin-top", "1rem")
            .text("Start Test")
            .on("click", () => test.showQuestion());
    }

    showQuestion() {
        let test = this;

        // Clear previous contents
        test.questionDisplay.text("");
        test.optionsContainer.selectAll("button").remove();
        test.visualizationContainer.html("");
        test.resultsDisplay.text("");

        // Hide both containers initially
        const hanoiContainer = document.getElementById('hanoi-puzzle-container');
        if (hanoiContainer) {
            hanoiContainer.style.display = 'none';
        }
        test.visualizationContainer.style("display", "none");

        // Section 1: Quiz Questions (indices 0-3)
        if (test.currentQuestionIndex < test.questions.length) {
            const currentQuestion = test.questions[test.currentQuestionIndex];
            test.questionDisplay.text(`Question ${test.currentQuestionIndex + 1}: ${currentQuestion.question}`);

            // Remove any previously selected class from all buttons
            test.optionsContainer.selectAll("button").classed("selected", false);

            currentQuestion.options.forEach(option => {
                test.optionsContainer.append("button")
                    .attr("class", "quiz-option")
                    .style("margin", "0.5rem")
                    .style("padding", "0.5rem 1rem")
                    .style("cursor", "pointer")
                    .style("background-color", "#f0f0f0")
                    .style("border", "2px solid #ddd")
                    .style("border-radius", "4px")
                    .style("transition", "all 0.3s ease")
                    .text(option)
                    .on("mouseover", function () {
                        if (!d3.select(this).classed("selected")) {
                            d3.select(this)
                                .style("background-color", "#e0e0e0")
                                .style("border-color", "#ccc");
                        }
                    })
                    .on("mouseout", function () {
                        if (!d3.select(this).classed("selected")) {
                            d3.select(this)
                                .style("background-color", "#f0f0f0")
                                .style("border-color", "#ddd");
                        }
                    })
                    .on("click", function () {
                        // Remove selected class and styling from all buttons
                        test.optionsContainer.selectAll("button")
                            .classed("selected", false)
                            .style("background-color", "#f0f0f0")
                            .style("border-color", "#ddd")
                            .style("color", "black");

                        // Add selected class and styling to clicked button
                        d3.select(this)
                            .classed("selected", true)
                            .style("background-color", "#4CAF50")
                            .style("border-color", "#45a049")
                            .style("color", "white");

                        test.selectedOption = option;
                        test.submitButton.style("visibility", "visible");
                    });
            });

            test.nextButton.style("visibility", "hidden");
            test.submitButton.style("visibility", "hidden");

        } else if (test.currentQuestionIndex === test.questions.length) {
            // Tower of Hanoi section remains the same
            test.questionDisplay
                .text("Tower of Hanoi Puzzle")
                .style("margin-bottom", "0.25rem");
            test.resultsDisplay
                .text("Move all the discs from the left tower to the right tower. One disc at a time, and no larger disc on top of a smaller one.")
                .style("margin", "0.25rem 0");

            if (hanoiContainer) {
                hanoiContainer.style.display = 'block';
            }

            test.showHanoiPuzzle();
            test.submitButton.style("visibility", "hidden");
            test.nextButton
                .text("Next")
                .style("visibility", "hidden")
                .on("click", () => test.nextQuestion());

        } else {
            test.endTest();
        }
    }

    showHanoiPuzzle() {
        let test = this;

        // Show the puzzle container with proper styling
        const hanoiContainer = document.getElementById('hanoi-puzzle-container');
        hanoiContainer.innerHTML = ''; // Clear any existing content
        hanoiContainer.style.display = 'block';
        hanoiContainer.style.position = 'relative';
        hanoiContainer.style.margin = '1rem auto';
        hanoiContainer.style.padding = '0.5rem';

        // Create message div
        const messageDiv = document.createElement('div');
        messageDiv.id = 'message';
        messageDiv.style.marginBottom = '1rem';
        hanoiContainer.appendChild(messageDiv);

        // Create towers container
        const towersContainer = document.createElement('div');
        towersContainer.id = 'towers';
        towersContainer.style.display = 'flex';
        towersContainer.style.justifyContent = 'center';
        towersContainer.style.alignItems = 'flex-end';
        towersContainer.style.gap = '2rem';
        towersContainer.style.margin = '1rem auto';
        towersContainer.style.minHeight = '150px';
        hanoiContainer.appendChild(towersContainer);

        // Create three towers
        for (let i = 0; i < 3; i++) {
            const tower = document.createElement('ul');
            tower.className = 'tower';
            tower.dataset.tower = i;
            tower.style.listStyle = 'none';
            tower.style.padding = '0';
            tower.style.margin = '0';
            tower.style.minHeight = '120px';
            tower.style.width = '150px';
            tower.style.display = 'flex';
            tower.style.flexDirection = 'column-reverse';
            tower.style.alignItems = 'center';
            tower.style.position = 'relative';
            towersContainer.appendChild(tower);
        }

        // Create buttons container with centered styling
        const buttonsContainer = document.createElement('div');
        buttonsContainer.id = 'buttons';
        buttonsContainer.style.display = 'flex';
        buttonsContainer.style.gap = '2rem';
        buttonsContainer.style.justifyContent = 'center';
        buttonsContainer.style.alignItems = 'center';
        buttonsContainer.style.marginTop = '2rem';
        buttonsContainer.style.width = '100%';
        hanoiContainer.appendChild(buttonsContainer);

        // Create solve button
        const solveBtn = document.createElement('button');
        solveBtn.className = 'solve';
        solveBtn.textContent = 'I Give Up';
        solveBtn.style.cursor = 'pointer';
        solveBtn.style.padding = '0.75rem 1.5rem';
        solveBtn.style.backgroundColor = 'indianred';
        solveBtn.style.border = 'none';
        solveBtn.style.borderRadius = '4px';
        solveBtn.style.fontSize = '1rem';
        buttonsContainer.appendChild(solveBtn);

        // Create restart button
        const restartBtn = document.createElement('button');
        restartBtn.className = 'restart';
        restartBtn.textContent = 'Restart';
        restartBtn.style.cursor = 'pointer';
        restartBtn.style.padding = '0.75rem 1.5rem';
        restartBtn.style.backgroundColor = 'lightblue';
        restartBtn.style.border = 'none';
        restartBtn.style.borderRadius = '4px';
        restartBtn.style.fontSize = '1rem';
        buttonsContainer.appendChild(restartBtn);

        // Get the elements after creation
        const towers = hanoiContainer.querySelectorAll(".tower");

        // Hide the done button initially
        test.nextButton.style("visibility", "hidden");

        // Add CSS for discs
        const style = document.createElement('style');
        style.textContent = `
            .tower li {
                height: 20px;
                margin: 2px;
                background-color: blue;
                border-radius: 5px;
            }
            #disc-1 { width: 50px; }
            #disc-2 { width: 75px; }
            #disc-3 { width: 100px; }
        `;
        document.head.appendChild(style);

        // Initialize the Tower of Hanoi game
        new TowersOfHanoi(3, towers, solveBtn, restartBtn, (solvedManually, moves) => {
            // When puzzle is solved, show Next button
            test.nextButton.style("visibility", "visible")
                .text("Next")
                .on("click", () => test.nextQuestion());

            // Calculate and store Hanoi score based on manual solving and moves
            let hanoiScore;
            if (solvedManually) {
                // If solved manually, score based on number of moves (optimal is 7)
                const optimalMoves = 7;
                hanoiScore = Math.max(0, 100 - ((moves - optimalMoves) * 10));
            } else {
                // If used "I Give Up", score is 0
                hanoiScore = 0;
            }
            test.hanoiScore = hanoiScore;
        });
    }

    nextQuestion() {
        let test = this;

        if (test.currentQuestionIndex < test.questions.length) {
            test.checkAnswer(test.selectedOption);
        }

        test.currentQuestionIndex++;
        test.showQuestion();
    }

    checkAnswer(selectedOption) {
        const question = this.questions[this.currentQuestionIndex];
        if (selectedOption === question.answer) {
            this.quizScore++;
        }
    }

    calculateFinalScore() {
        // Convert quiz score to percentage (out of 4 questions)
        const quizPercentage = (this.quizScore / 4) * 100;

        // Hanoi score is already a percentage
        const hanoiPercentage = this.hanoiScore;

        // Calculate final score (each part worth 1/2)
        return (quizPercentage + hanoiPercentage) / 2;
    }

    endTest() {
        let test = this;

        // Calculate quiz percentage
        const quizPercentage = (this.quizScore / 4) * 100;

        // Calculate final score
        const finalScore = Math.round((quizPercentage + this.hanoiScore) / 2);

        // Save to user scores manager
        if (window.userScoresManager) {
            window.userScoresManager.updateScore('intelligence', finalScore);
        }

        test.questionDisplay.text(`Test Complete! Final Score: ${Math.round(finalScore)}%`);
        test.resultsDisplay.html(`
            Quiz Score: ${Math.round(quizPercentage)}%<br>
            Tower of Hanoi Score: ${Math.round(this.hanoiScore)}%<br>
            Final Score: ${Math.round(finalScore)}%
        `);

        test.optionsContainer.selectAll("button").remove();
        test.nextButton.text("Test Completed")
            .style("cursor", "not-allowed")
            .on("click", null);

        // Force update of visualizations
        if (window.myRadarChart) {
            window.myRadarChart.updateUserData();
        }
    }
}
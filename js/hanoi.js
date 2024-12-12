/**
 * Tower of Hanoi Implementation
 * Copyright (c) 2024 by Avery (https://codepen.io/avery/pen/wWwYqd)
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/** I made a lot of changes to the existing code so that it would merge well
 * with our project but above is the citation for the original code that influenced
 * the implementation.
 */

class TowersOfHanoi {
    constructor(discs, towerEls, solveBtn, restartBtn, onWinCallback = null) {
        this.discs = discs;
        this.towerEls = towerEls;
        this.solveBtn = solveBtn;
        this.restartBtn = restartBtn;
        this.onWinCallback = onWinCallback;
        this.moves = 0;
        this.solvedManually = true;
        this.startTime = Date.now(); // Track when puzzle started

        this.bindFunctions();
        this.initGame();
    }

    bindFunctions() {
        this.handleSolveFunc = this.handleSolve.bind(this);
        this.initGameFunc = this.initGame.bind(this);
        this.handleDiscClickFunc = this.handleDiscClick.bind(this);
    }

    initGame() {
        this.backtrackState = [];
        this.holdTower = null;
        this.moves = 0;
        this.movesHistory = [];
        this.start = null;
        this.solvedManually = true;
        this.startTime = Date.now(); // Reset start time on game init

        this.initButtons();
        this.initTowers();

        this.drawTowers();
        this.displayMessage(
            "Move all the discs from the left tower to the right one at a time. A disc cannot be on top of a smaller disc."
        );
    }


    calculateScore() {
        const timeTaken = (Date.now() - this.startTime) / 1000; // Convert to seconds
        const optimalMoves = 7; // Optimal number of moves for 3 discs
        const targetTime = 30; // Target time in seconds

        // Calculate move efficiency (100% if moves = optimal, decreasing for more moves)
        const moveScore = Math.max(0, 100 * (optimalMoves / Math.max(this.moves, optimalMoves)));

        // Calculate time efficiency (100% if time <= target, decreasing for longer times)
        const timeScore = Math.max(0, 100 * (targetTime / Math.max(timeTaken, targetTime)));

        // If solved automatically, cap the score at 10%
        const baseScore = (moveScore + timeScore) / 2;
        const finalScore = this.solvedManually ? baseScore : Math.min(baseScore, 10);

        return Math.round(finalScore);
    }

    async handleSolve() {
        this.solvedManually = false;  // Mark as solved automatically
        this.voidButtons();

        this.displayMessage("Solving...");
        let solved;

        if (!this.moves) {
            solved = this.solve(this.discs, 0, 1, 2);

            solved.then(() => {
                this.postWinCleanUp("Solved Automatically");
            });
        } else {
            solved = this.backtrack();
        }
    }

    handleDiscClick(e) {
        const clickedElement =
            e.target.nodeName === "LI" ? e.target.parentNode : e.target;
        const clickedTower = clickedElement.dataset.tower;

        if (!this.holdTower) {
            if (this.isTowerEmpty(this.towers[clickedTower])) {
                return false;
            }

            this.holdTower = clickedTower;
            this.highlightHoldDisc(true);
            return true;
        } else {
            this.highlightHoldDisc(false);
        }

        const validMove = this.isDiscMoveValid(this.holdTower, clickedTower);

        if (!validMove) {
            const message = validMove !== undefined ? "Invalid move" : `${this.moves} ${this.moves > 1 ? "moves" : "move"}`;
            this.displayMessage(message);
            this.holdTower = null;
            return false;
        }

        this.executeUserMove(this.holdTower, clickedTower);

        if (this.isSolved()) {
            console.log('Puzzle solved manually with moves:', this.moves);
            this.solvedManually = true;  // Ensure it's marked as solved manually
            this.postWinCleanUp(`You solved with ${this.moves} moves!`);
        }
    }

    postWinCleanUp(withMessage) {
        console.log('Post win cleanup, solved manually:', this.solvedManually);
        this.voidTowers();
        this.voidButtons();
        this.displayMessage(withMessage);
        this.initButtons(true);

        // Calculate score and update global score manager
        const score = this.calculateScore();
        if (window.userScoresManager) {
            // Get current scores
            const currentScores = window.userScoresManager.getScores();

            // Update intelligence score only if the new score is higher
            if (score > currentScores.intelligence) {
                window.userScoresManager.updateScore('intelligence', score);
            }
        }

        if (this.onWinCallback) {
            this.onWinCallback(this.solvedManually, this.moves);
        }
    }

    initButtons(onlyRestart = false) {
        this.restartBtn.classList.add("clickable");
        this.restartBtn.addEventListener("click", this.initGameFunc);

        if (!onlyRestart) {
            this.solveBtn.classList.add("clickable");
            this.solveBtn.addEventListener("click", this.handleSolveFunc);
        }
    }

    initTowers() {
        this.towers = [[], [], []];

        for (let i = this.discs; i > 0; i--) {
            this.towers[0].push(i);
        }

        this.voidTowers();
        this.towerEls.forEach(towerEl => {
            towerEl.classList.add("clickable");
            towerEl.addEventListener("click", this.handleDiscClickFunc);
        });

        this.toString();
    }

    voidButtons() {
        this.solveBtn.classList.remove("clickable");
        this.solveBtn.removeEventListener("click", this.handleSolveFunc);
        this.restartBtn.classList.remove("clickable");
        this.restartBtn.removeEventListener("click", this.initGameFunc);
    }

    voidTowers() {
        this.towerEls.forEach(towerEl => {
            towerEl.removeEventListener("click", this.handleDiscClickFunc);
            towerEl.classList.remove("clickable");
        });
    }


    executeUserMove(fromTower, toTower) {
        const fromIdx = parseInt(fromTower);
        const toIdx = parseInt(toTower);

        this.moveDisc(fromIdx, toIdx);
        this.moves += 1;
        this.movesHistory.push([fromIdx, toIdx]);

        this.drawTowers();
        this.displayMessage(`${this.moves} ${this.moves > 1 ? "moves" : "move"}`);

        this.holdTower = null;
    }

    highlightHoldDisc(toggle) {
        const targetDiscEl = this.towerEls[this.holdTower].lastChild;
        targetDiscEl.style.backgroundColor = toggle ? "black" : "blue";
    }

    async backtrack() {
        this.saveTowersOrder();

        this.displayMessage("Solving...");
        const solved = this.solve(this.discs, 0, 1, 2);

        solved.then(async (value) => {
            if (value) {
                this.postWinCleanUp(`${this.moves} attempted. Solved automatically`);
                return true;
            }

            this.displayMessage("Solving...");

            const prevState = this.backtrackState;
            this.restoreTowersOrder(prevState);
            this.drawTowers();

            const prevMove = this.movesHistory.pop();
            await this.animateMovingDiscs(prevMove[1], prevMove[0], 500);

            this.backtrack();
        });
    }

    async solve(t, a, b, c) {
        if (t === 1) {
            await this.animateMovingDiscs(a, c, 50);
        } else {
            await this.solve(t - 1, a, c, b);
            await this.solve(1, a, b, c);
            await this.solve(t - 1, b, a, c);
        }

        return this.isSolved();
    }

    moveDisc(fromIdx, toIdx) {
        this.towers[toIdx].push(this.towers[fromIdx].pop());
    }

    saveTowersOrder() {
        this.backtrackState = [];
        this.towers.forEach(tower => {
            this.backtrackState.push(tower.slice(0));
        });
    }

    restoreTowersOrder(order) {
        this.towers = [];
        order.forEach(tower => {
            this.towers.push(tower.slice(0));
        });
    }

    getTopDiscValue(tower) {
        return this.isTowerEmpty(tower) ? undefined : tower[tower.length - 1];
    }

    isTowerEmpty(tower) {
        return !tower.length;
    }

    isDiscMoveValid(fromIdx, toIdx) {
        if (fromIdx === toIdx) {
            return undefined;
        }

        if (
            this.isTowerEmpty(this.towers[fromIdx]) ||
            this.getTopDiscValue(this.towers[fromIdx]) > this.getTopDiscValue(this.towers[toIdx])
        ) {
            return false;
        }

        return true;
    }

    isSolved() {
        return (
            this.towers[1].length === this.discs ||
            this.towers[2].length === this.discs
        );
    }

    toString() {
        console.log({
            1: this.towers[0],
            2: this.towers[1],
            3: this.towers[2]
        });
    }

    drawTowers() {
        this.towerEls.forEach((towerEl, index) => {
            while (towerEl.lastChild) {
                towerEl.removeChild(towerEl.lastChild);
            }

            this.towers[index].forEach(disc => {
                let li = document.createElement("LI");
                li.id = `disc-${disc}`;
                towerEl.appendChild(li);
            });
        });
    }

    async animateMovingDiscs(fromIdx, toIdx, delay) {
        const promise = new Promise(resolve => setTimeout(resolve, delay));
        await promise;

        if (this.isDiscMoveValid(fromIdx, toIdx)) {
            this.moveDisc(fromIdx, toIdx);
        }
        this.drawTowers();
    }

    displayMessage(message) {
        const messageBox = document.querySelector("#message");
        if (messageBox) {
            messageBox.innerHTML = message;
        }
    }
}
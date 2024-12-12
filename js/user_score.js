class UserScoresManager {
    constructor() {
        this._scores = {
            intelligence: 30,  // Fixed score as per requirements
            strength: 0,
            speed: 0,
            durability: 0
        };

        this._subscribers = [];
    }

    // Update individual scores
    updateScore(category, value) {
        if (category in this._scores) {
            this._scores[category] = Math.min(100, Math.max(0, value)); // Clamp between 0-100
            this._notifySubscribers();
        }
    }

    // Get all scores
    getScores() {
        return { ...this._scores };
    }

    // Subscribe to score changes
    subscribe(callback) {
        this._subscribers.push(callback);
    }

    // Notify all subscribers of changes
    _notifySubscribers() {
        this._subscribers.forEach(callback => callback(this.getScores()));
    }
}

// Create a global instance
window.userScoresManager = new UserScoresManager();
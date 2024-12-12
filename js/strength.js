// Initialize strength values and percentages
const strengthValues = {
    bench: 150, // Default values
    deadlift: 250,
    squat: 200,
};

const strengthPercentages = {
    bench: 50,
    deadlift: 50,
    squat: 50,
};

// Max values for normalization
const maxStrengths = {
    bench: 300,
    deadlift: 500,
    squat: 400,
};

// Initialize average score
document.getElementById('average-strength').textContent = '50%';
document.getElementById('average-strength').style.color = getColor(50);

let savedAverageScore = null; // Variable to store the rounded average score

function updateStrength(type, value) {
    const maxValues = {
        bench: 300,
        deadlift: 500,
        squat: 400,
    };

    const percent = Math.round((value / maxValues[type]) * 100);

    // Update the value and percentage display
    document.getElementById(`${type}-value`).textContent = `${value} lbs`;
    document.getElementById(`${type}-percent`).textContent = `${percent}%`;

    // Calculate the average score
    const benchPercent = parseInt(document.getElementById('bench-percent').textContent) || 0;
    const deadliftPercent = parseInt(document.getElementById('deadlift-percent').textContent) || 0;
    const squatPercent = parseInt(document.getElementById('squat-percent').textContent) || 0;

    const average = ((benchPercent + deadliftPercent + squatPercent) / 3).toFixed(2);

    // Update the average strength score
    const averageElement = document.getElementById('average-strength');
    averageElement.textContent = `${average}%`;
    averageElement.style.color = getColor(average); // Apply color scale
}

document.getElementById('submit-button').addEventListener('click', () => {
    const averageText = document.getElementById('average-strength').textContent;
    savedAverageScore = Math.round(parseFloat(averageText)); // Save as a rounded whole number

    // Log the score for debugging
    console.log('Average Strength Score Saved:', savedAverageScore);

    // Update the button and display a "Test Completed" message
    const submitButton = document.getElementById('submit-button');
    submitButton.textContent = 'Test Completed';
    submitButton.disabled = true; // Disable the button after submission
    submitButton.style.backgroundColor = '#e2a936'; // Change color to indicate completion
});

// Function to get a color based on percentage
function getColor(percent) {
    if (percent <= 25) return '#e23636'; // Red
    if (percent <= 50) return '#e2a936'; // Orange
    if (percent <= 75) return '#e2d836'; // Yellow
    return '#36e236'; // Green
}

// Function to access the percentages later
function getStrengthPercentages() {
    return strengthPercentages;
}

// Example: Logging initial percentages
document.getElementById('submit-button').addEventListener('click', () => {
    const averageText = document.getElementById('average-strength').textContent;
    savedAverageScore = Math.round(parseFloat(averageText));

    // Update scores manager instead of directly updating radar chart
    if (window.userScoresManager) {
        window.userScoresManager.updateScore('strength', savedAverageScore);
    }

    // Update UI
    const submitButton = document.getElementById('submit-button');
    submitButton.textContent = 'Test Completed';
    submitButton.disabled = true;
    submitButton.style.backgroundColor = '#e2a936';
});
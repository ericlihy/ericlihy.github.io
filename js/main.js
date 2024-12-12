class SuperheroVis {
    constructor() {
        this.loadData()
            .then(() => this.initVisualizations());
    }

    async loadData() {
        this.data = await d3.csv('data/superhero_data.csv', d => {
            // Parse release date - expecting MM/DD/YYYY format
            let releaseDate = null;
            if (d['Release Date'] && d['Release Date'] !== 'Unknown' && d['Release Date'] !== 'NA') {
                const [month, day, year] = d['Release Date'].split('/').map(Number);
                releaseDate = new Date(year, month - 1, day);

                // Validate the date is valid
                if (isNaN(releaseDate.getTime())) {
                    releaseDate = null;
                }
            }

            return {
                name: d.name,
                intelligence: +d.intelligence || 0,
                strength: +d.strength || 0,
                speed: +d.speed || 0,
                durability: +d.durability || 0,
                power: +d.power || 0,
                combat: +d.combat || 0,
                publisher: d.publisher,
                release_date: releaseDate,
                alignment: d.alignment
            };
        });

        return this.data;
    }

    initVisualizations() {
        // Initialize radar charts with data
        this.radarChart = new RadarChart('#radar-comparison');
        this.timeline = new Timeline('#timeline', this.data);

        // Set up event listeners for linked views
        document.addEventListener('timerangeselected', event => {
            const { years } = event.detail;
            this.updateTimeRange(years);
        });

        // Initialize character selector for hero comparison
        this.initializeCharacterSelector();
    }

    initializeCharacterSelector() {
        // Get sorted list of character names
        const characterNames = ['Select a hero...', ...this.data.map(d => d.name).sort()];

        // Initialize hero selector
        const select = d3.select('#hero-select');

        // Add options
        select.selectAll('option')
            .data(characterNames)
            .enter()
            .append('option')
            .text(d => d)
            .property('value', d => d === 'Select a hero...' ? '' : d);

        // Add change listener
        select.on('change', (event) => {
            const selectedHero = event.target.value;
            this.radarChart.updateVis(2, selectedHero);  // Update hero side of comparison
        });
    }

    updateTimeRange(years) {
        const filteredData = this.data.filter(d => {
            if (!d.release_date) return false;
            return d.release_date >= years[0] && d.release_date <= years[1];
        });

        if (filteredData.length > 0) {
            this.radarChart.updateVis(2, filteredData[0].name);
        }
    }
}

// Initialize application
let myIntelligenceTest = new IntelligenceTest("intelligence-test-container");

document.addEventListener('DOMContentLoaded', async () => {
    // First, initialize the user scores manager
    if (!window.userScoresManager) {
        window.userScoresManager = new UserScoresManager();
    }

    // Then create the radar chart instance
    window.myRadarChart = new RadarChart('#radar-comparison');

    // Now initialize the visualization and tests
    const app = new SuperheroVis();
    window.myReactionTest = new ReactionTest("reactionTestContainer");
    window.myDurabilityTest = new DurabilityTest("durabilityTestContainer");

    // Initialize network graph if container exists
    if (document.querySelector("#network-graph-container")) {
        const networkGraph = new NetworkGraph(
            "#network-graph-container",
            "data/graph_data.json",
            "data/superhero_data.csv",
        );
    }

    // Initialize villains visualization if container exists
    if (document.querySelector("#chart-area")) {
        loadData(); // Ensure villains.js is properly initialized
    }

});

// Initialize Durability Test if container exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector("#durability-test-container")) {
        window.myDurabilityTest = new DurabilityTest("durability-test-container");
    }
});

// Handle power attributes interactivity
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quadrant').forEach(quadrant => {
        const imageContainer = quadrant.querySelector('.image-container');
        const description = quadrant.querySelector('.description');
        const image = quadrant.querySelector('.attribute-image');

        if (imageContainer && description && image) {
            imageContainer.addEventListener('click', () => {
                image.classList.add('hidden');
                description.classList.add('visible');
            });
        }
    });
});

let myMapVis;

// Load data using promises
let promises = [
    d3.json("data/superhero_locations.json"), // Superhero data
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json") // World map data
];

Promise.all(promises)
    .then(function (data) {
        initMainPage(data);
    })
    .catch(function (err) {
        console.log(err);
    });

// Initialize the map visualization
function initMainPage(allDataArray) {
    myMapVis = new MapVis('mapDiv', allDataArray[0], allDataArray[1]); // Pass superhero and world map data
}
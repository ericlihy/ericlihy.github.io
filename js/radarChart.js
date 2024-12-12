class RadarChart {
    constructor(selector) {
        this.selector = selector;
        this.width = 2000;
        this.height = 800;
        this.margin = {
            top: 100,
            right: 200,
            bottom: 100,
            left: 200
        };

        // Calculate dimensions for each radar chart
        this.radarWidth = (this.width - this.margin.left - this.margin.right) / 3;
        this.radarHeight = this.height - this.margin.top - this.margin.bottom;
        this.radius = Math.min(this.radarWidth, this.radarHeight) / 3;

        // Features to display
        this.features = ['intelligence', 'strength', 'speed', 'durability'];

        // Colors for user and hero charts
        this.colors = {
            user: '#e23636',   // Red for user
            hero: '#0476F2'    // Blue for hero
        };

        // Initialize with default user data
        this.userData = {
            name: 'User',
            intelligence: 30,
            strength: 0,
            speed: 0,
            durability: 0
        };

        // Subscribe to user score updates if manager exists
        if (window.userScoresManager) {
            window.userScoresManager.subscribe((scores) => {
                this.userData = {
                    name: 'User',
                    ...scores
                };
                this.updateVis(1, 'User');
            });

            // Get initial scores
            const initialScores = window.userScoresManager.getScores();
            this.userData = {
                name: 'User',
                ...initialScores
            };
        }

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Clear existing content
        d3.select(vis.selector).selectAll("*").remove();

        // Create container div
        const containerDiv = d3.select(vis.selector)
            .style('width', '100%')
            .style('text-align', 'center');

        // Create row for titles and dropdowns
        const controlsDiv = containerDiv.append('div')
            .attr('class', 'row mb-4')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'center');

        // User title (left side)
        const userDiv = controlsDiv.append('div')
            .attr('class', 'col-5')
            .style('text-align', 'center');

        userDiv.append('h3')
            .text('Your Stats')
            .style('color', this.colors.user);

        // VS text in middle
        controlsDiv.append('div')
            .attr('class', 'col-2')
            .append('h3')
            .style('text-align', 'center')
            .text('VS');

        // Hero selection (right side)
        const heroDiv = controlsDiv.append('div')
            .attr('class', 'col-5')
            .style('text-align', 'center');

        heroDiv.append('h3')
            .text('Hero Stats')
            .style('color', this.colors.hero);

        // Add hero selection dropdown
        const heroSelect = heroDiv.append('select')
            .attr('class', 'form-select mx-auto')
            .style('width', '90%')
            .style('max-width', '400px')
            .style('margin-top', '10px')
            .on('change', function() {
                vis.updateVis(2, this.value);
            });

        heroSelect.append('option')
            .text('Select a hero...')
            .attr('value', '');

        // Set up main SVG
        vis.svg = containerDiv.append('svg')
            .attr('viewBox', `0 0 ${vis.width} ${vis.height}`)
            .style('width', '100%')
            .style('height', 'auto');

        // Create groups for each radar chart
        const userX = vis.margin.left + vis.radarWidth/2;
        const heroX = vis.width - (vis.margin.right + vis.radarWidth/2);
        const centerY = vis.height/2;

        vis.userGroup = vis.svg.append('g')
            .attr('transform', `translate(${userX}, ${centerY})`);

        vis.heroGroup = vis.svg.append('g')
            .attr('transform', `translate(${heroX}, ${centerY})`);

        // Set up scales
        vis.radiusScale = d3.scaleLinear()
            .domain([0, 100])
            .range([0, vis.radius]);

        // Calculate angles for each feature
        vis.angles = {};
        vis.features.forEach((feature, i) => {
            vis.angles[feature] = (i * 2 * Math.PI / vis.features.length) - Math.PI/2;
        });

        // Create radar axes for both charts
        vis.createRadarAxes(vis.userGroup);
        vis.createRadarAxes(vis.heroGroup);

        // Initialize paths for both charts
        vis.userGroup.append('path')
            .attr('class', 'radar-path user')
            .style('fill', vis.colors.user)
            .style('fill-opacity', 0.5)
            .style('stroke', vis.colors.user)
            .style('stroke-width', 2);

        vis.heroGroup.append('path')
            .attr('class', 'radar-path hero')
            .style('fill', vis.colors.hero)
            .style('fill-opacity', 0.5)
            .style('stroke', vis.colors.hero)
            .style('stroke-width', 2);

        // Load hero data and populate dropdown
        d3.csv('data/superhero_data.csv').then(data => {
            vis.data = data;

            // Sort heroes alphabetically and add to dropdown
            const sortedHeroes = data.map(d => d.name).sort();
            heroSelect.selectAll('option.hero-option')
                .data(sortedHeroes)
                .enter()
                .append('option')
                .attr('class', 'hero-option')
                .attr('value', d => d)
                .text(d => d);

            // Update user chart with initial data
            this.updateVis(1, 'User');
        });
    }

    createRadarAxes(group) {
        let vis = this;

        // Create axes lines and labels
        vis.features.forEach(feature => {
            const angle = vis.angles[feature];
            const lineEnd = {
                x: vis.radius * Math.cos(angle),
                y: vis.radius * Math.sin(angle)
            };

            // Draw axis line
            group.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', lineEnd.x)
                .attr('y2', lineEnd.y)
                .style('stroke', '#999')
                .style('stroke-width', 1);

            // Position and add label
            const labelPadding = 1.35;
            const labelPos = {
                x: vis.radius * labelPadding * Math.cos(angle),
                y: vis.radius * labelPadding * Math.sin(angle)
            };

            let textAnchor = 'middle';
            let dx = 0;

            // Adjust label positioning based on angle
            if (angle === -Math.PI/2) {
                labelPos.y -= 10;
            } else if (angle === Math.PI/2) {
                labelPos.y += 30;
            } else if (angle === 0) {
                textAnchor = 'start';
                dx = 10;
            } else if (Math.abs(angle) === Math.PI) {
                textAnchor = 'end';
                dx = -10;
            }

            group.append('text')
                .attr('x', labelPos.x)
                .attr('y', labelPos.y)
                .attr('dx', dx)
                .attr('text-anchor', textAnchor)
                .attr('dy', '0.35em')
                .style('font-size', '28px')
                .style('font-weight', 'bold')
                .style('fill', '#333')
                .text(feature.charAt(0).toUpperCase() + feature.slice(1));
        });

        // Create circular grid lines
        const gridValues = [20, 40, 60, 80, 100];
        gridValues.forEach(value => {
            // Create points for grid circle
            const points = vis.features.map(feature => {
                const angle = vis.angles[feature];
                const radius = vis.radiusScale(value);
                return [
                    radius * Math.cos(angle),
                    radius * Math.sin(angle)
                ];
            });

            // Create path for grid circle
            const pathData = points.map((point, i) =>
                (i === 0 ? 'M' : 'L') + point[0] + ',' + point[1]
            ).join(' ') + 'Z';

            group.append('path')
                .attr('d', pathData)
                .style('fill', 'none')
                .style('stroke', '#ddd')
                .style('stroke-dasharray', '4,4');

            // Add value labels (except for outermost circle)
            if (value < 100) {
                group.append('text')
                    .attr('x', 5)
                    .attr('y', -vis.radiusScale(value))
                    .style('font-size', '18px')
                    .style('fill', '#666')
                    .text(value);
            }
        });
    }

    updateVis(radarIndex, characterName) {
        let vis = this;
        const group = radarIndex === 1 ? vis.userGroup : vis.heroGroup;

        // Clear chart if no selection
        if (!characterName || characterName === 'Select a hero...') {
            group.select('.radar-path')
                .transition()
                .duration(1000)
                .attr('d', '');
            return;
        }

        // Get data for selected character
        let dataPoint;
        if (characterName === 'User') {
            dataPoint = window.userScoresManager.getScores();
        } else {
            const heroData = vis.data.find(d => d.name === characterName);
            if (!heroData) return;

            dataPoint = {
                intelligence: +heroData.intelligence || 0,
                strength: +heroData.strength || 0,
                speed: +heroData.speed || 0,
                durability: +heroData.durability || 0
            };
        }

        // Calculate path coordinates
        const pathCoords = vis.features.map(feature => {
            const angle = vis.angles[feature];
            const value = dataPoint[feature] || 0;
            const radius = vis.radiusScale(value);
            return [
                radius * Math.cos(angle),
                radius * Math.sin(angle)
            ];
        });

        // Create SVG path
        const pathData = pathCoords.map((point, i) =>
            (i === 0 ? 'M' : 'L') + point[0] + ',' + point[1]
        ).join(' ') + 'Z';

        // Update the path with animation
        group.select('.radar-path')
            .transition()
            .duration(1000)
            .attr('d', pathData);
    }

    // Method to update user data
    updateUserData() {
        if (window.userScoresManager) {
            const scores = window.userScoresManager.getScores();
            this.userData = {
                name: 'User',
                ...scores
            };
            this.updateVis(1, 'User');
        }
    }
}
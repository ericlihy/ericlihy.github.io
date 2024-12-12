class MapVis {

    constructor(parentElement, superheroData, geoData) {
        this.parentElement = parentElement;
        this.geoData = geoData;
        this.superheroData = superheroData;

        // Define colors
        this.colors = ['#fddbc7', '#f4a582', '#d6604d', '#b2182b'];

        // Call initVis method
        this.initVis();
    }

    initVis() {
        let vis = this;

        vis.margin = { top: 20, right: 20, bottom: 20, left: 20 };
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // Initialize drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Add title
        vis.svg.append('g')
            .attr('class', 'title')
            .attr('id', 'map-title')
            .append('text')
            .attr('transform', `translate(${vis.width / 2}, 20)`)
            .attr('text-anchor', 'middle');

        // Create projection
        vis.projection = d3.geoOrthographic()
            .scale(vis.height / 2.2) // Adjust scale based on height
            .translate([vis.width / 2, vis.height / 2]);

        // Define geo generator and pass projection
        vis.path = d3.geoPath()
            .projection(vis.projection);

        // Convert TopoJSON to GeoJSON
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.countries).features;

        // Append sphere and graticule to mimic the ocean and the globe
        vis.svg.append("path")
            .datum({ type: "Sphere" })
            .attr("class", "graticule")
            .attr('fill', '#ADDEFF')
            .attr("stroke", "rgba(129,129,129,0.35)")
            .attr("d", vis.path);

        // Draw countries
        vis.countries = vis.svg.selectAll(".country")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'country')
            .attr("d", vis.path)
            .attr('fill', 'lightgray')
            .attr('stroke', 'black')
            .attr('stroke-width', 0.5);

        // Append tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', 'mapTooltip')
            .style("position", "absolute")
            .style("opacity", 0);

        // Add user input for city selection
        d3.select("#" + vis.parentElement)
            .append("div")
            .attr("class", "user-input")
            .html(`
                <label for="city-input">Select Your City: </label>
                <input type="text" id="city-input" placeholder="Enter city name" list="city-suggestions">
                <datalist id="city-suggestions"></datalist>
                <button id="add-city">Add City</button>
                <div id="closest-hero" style="margin-top: 20px; font-size: 16px; color: #333;"></div>
            `);

        // Load city data from worldcities.csv
        d3.csv("data/worldcities.csv").then(data => {
            vis.cityData = data; // Save city data for later lookup

            // Populate datalist for city suggestions using the "city" column
            const datalist = d3.select("#city-suggestions");
            data.forEach(row => {
                if (row.city) {
                    datalist.append("option").attr("value", row.city);
                }
            });
        }).catch(error => console.error("Error loading city data:", error));

        // Event listener for adding user city
        d3.select("#add-city").on("click", function () {
            const cityName = document.getElementById("city-input").value.trim();
            vis.addUserCity(cityName);
        });

        // Make the map draggable/rotatable
        vis.svg.call(
            d3.drag()
                .on("start", function (event) {
                    let lastRotationParams = vis.projection.rotate();
                    vis.m0 = [event.x, event.y];
                    vis.o0 = [-lastRotationParams[0], -lastRotationParams[1]];
                })
                .on("drag", function (event) {
                    if (vis.m0) {
                        let m1 = [event.x, event.y],
                            o1 = [vis.o0[0] + (vis.m0[0] - m1[0]) / 4, vis.o0[1] + (m1[1] - vis.m0[1]) / 4];
                        vis.projection.rotate([-o1[0], -o1[1]]);
                    }

                    // Update map paths and superhero positions
                    vis.path = d3.geoPath().projection(vis.projection);
                    vis.countries.attr("d", vis.path);
                    vis.svg.selectAll(".graticule").attr("d", vis.path);

                    // Re-project superhero nodes
                    vis.updateProjection();
                })
        );

        // Call wrangleData method
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;

        // Map superhero data to usable format
        vis.displayData = vis.superheroData.nodes.map(node => ({
            id: node.id,
            name: node.name,
            latitude: node.latitude,
            longitude: node.longitude,
            city: node.city,
            publisher: node.publisher
        }));

        vis.links = vis.superheroData.links; // Include links if needed for network connections
        vis.updateVis();
    }

    updateVis() {
        let vis = this;

        // Clear existing elements
        vis.svg.selectAll(".superhero-node").remove();
        vis.svg.selectAll(".user-city-node").remove();

        // Draw or update circles representing superheroes
        vis.svg.selectAll(".superhero-node")
            .data(vis.displayData)
            .enter().append("circle")
            .attr("class", "superhero-node")
            .attr("r", 5) // Radius of the superhero dots
            .attr("fill", "blue") // Color of the dots
            .attr("stroke", "black") // Border color
            .attr("stroke-width", 1)
            .on("mouseover", function (event, d) {
                // Show tooltip on hover
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px") // Position tooltip near the mouse pointer
                    .style("top", event.pageY + "px")
                    .html(`
                        <strong>${d.name}</strong><br>
                        City: ${d.city || "Unknown"}<br>
                        Publisher: ${d.publisher || "Unknown"}
                    `); // Display superhero name, city, and publisher
            })
            .on("mouseout", function () {
                // Hide tooltip when mouse leaves
                vis.tooltip.style("opacity", 0);
            });

        // Re-project superhero locations based on current map rotation
        vis.updateProjection();
    }

    addUserCity(cityName) {
        let vis = this;

        // Search for the city in the dataset
        const city = vis.cityData.find(row => row.city.toLowerCase() === cityName.toLowerCase());

        if (city) {
            const latitude = +city.lat; // Convert to numbers
            const longitude = +city.lng;

            // Add a marker for the city
            vis.svg.append("circle")
                .datum({ latitude, longitude }) // Attach data for later re-projection
                .attr("class", "user-city-node")
                .attr("r", 7)
                .attr("fill", "red")
                .attr("stroke", "black")
                .attr("stroke-width", 1.5)
                .attr("cx", vis.projection([longitude, latitude])[0])
                .attr("cy", vis.projection([longitude, latitude])[1])
                .on("mouseover", function () {
                    vis.tooltip
                        .style("opacity", 1)
                        .style("left", event.pageX + 20 + "px")
                        .style("top", event.pageY + "px")
                        .html(`<strong>${cityName}</strong><br>Latitude: ${latitude}<br>Longitude: ${longitude}`);
                })
                .on("mouseout", function () {
                    vis.tooltip.style("opacity", 0);
                });

            // Find the closest superhero
            let closestHero = null;
            let minDistance = Infinity;

            vis.displayData.forEach(hero => {
                const distance = vis.getDistance(latitude, longitude, hero.latitude, hero.longitude);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestHero = hero;
                }
            });

            // Display the closest superhero
            if (closestHero) {
                d3.select("#closest-hero").html(
                    `The closest superhero to <strong>${cityName}</strong> is <strong>${closestHero.name}</strong> (<em>${minDistance.toFixed(2)} km away</em>).`
                );

                // Highlight the closest superhero on the map
                vis.svg.selectAll(".superhero-node")
                    .filter(d => d.id === closestHero.id)
                    .attr("fill", "gold") // Highlight the closest superhero
                    .attr("r", 10); // Increase the size of the dot
            } else {
                d3.select("#closest-hero").html("No superheroes found.");
            }
        } else {
            d3.select("#closest-hero").html("City not found in the dataset. Please try another city.");
        }
    }

    getDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in kilometers
    }

    updateProjection() {
        let vis = this;

        vis.svg.selectAll(".superhero-node")
            .attr("cx", d => vis.projection([d.longitude, d.latitude])[0]) // X-coordinate based on projection
            .attr("cy", d => vis.projection([d.longitude, d.latitude])[1]) // Y-coordinate based on projection
            .style("opacity", d => {
                // Calculate the angle between the point and the current map center
                let point = [d.longitude, d.latitude];
                let center = vis.projection.invert([vis.width / 2, vis.height / 2]); // Current map center
                let angle = d3.geoDistance(point, center); // Angular distance

                // Set opacity: 0 for back side, 1 for front side
                return angle > Math.PI / 2 ? 0 : 1;
            });

        vis.svg.selectAll(".user-city-node")
            .attr("cx", d => vis.projection([d.longitude, d.latitude])[0])
            .attr("cy", d => vis.projection([d.longitude, d.latitude])[1]);
    }
}

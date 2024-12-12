class NetworkGraph {
    constructor(containerId, graphDataPath, csvDataPath) {
        this.containerId = containerId;
        this.graphDataPath = graphDataPath;
        this.csvDataPath = csvDataPath;
        this.coloringMode = "traits"; // Default coloring mode

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
                this.initVis();
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

    async initVis() {
        // Load graph JSON and superhero CSV data
        const [graphData, superheroData] = await Promise.all([
            d3.json(this.graphDataPath),
            d3.csv(this.csvDataPath)
        ]);

        // Map superhero stats by name for quick lookup
        const superheroMap = new Map(
            superheroData.map(d => [
                d.name,
                {
                    intelligence: +d.intelligence || 0,
                    strength: +d.strength || 0,
                    speed: +d.speed || 0,
                    durability: +d.durability || 0,
                    alignment: d.alignment.toLowerCase(),
                }
            ])
        );

        // Set dimensions
        const width = 928;
        const height = 600;

        // Color scales
        const traitColor = d3.scaleOrdinal(d3.schemeCategory10);
        const alignmentColor = d3.scaleOrdinal()
            .domain(["good", "bad", "neutral", "unknown"])
            .range(["green", "red", "gray", "yellow"]);

        // Copy data
        const links = graphData.links.map(d => ({ ...d }));
        const nodes = graphData.nodes.map(d => ({ ...d }));

        // Add user node
        const userNode = {
            id: this.userData.name,
            group: 5 // Assign a unique group for the user
        };
        nodes.push(userNode);

        // Add links for user node
        ["intelligence", "strength", "speed", "durability"].forEach(trait => {
            if (this.userData[trait] > 50) {
                links.push({
                    source: this.userData.name,
                    target: trait,
                    value: 1
                });
            } else {
                const closestTrait = Object.keys(this.userData)
                    .filter(t => ["intelligence", "strength", "speed", "durability"].includes(t))
                    .reduce((max, current) =>
                        this.userData[current] > this.userData[max] ? current : max
                    );
                links.push({
                    source: this.userData.name,
                    target: closestTrait,
                    value: 1
                });
            }
        });

        // Clear any existing visualization
        d3.select(this.containerId).select("svg").remove();
        d3.select("body").selectAll(".networktooltip").remove();

        // Tooltip div
        const tooltip = d3.select("body")
            .append("div")
            .attr("class", "networktooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background", "rgba(0,0,0,0.7)")
            .style("color", "#fff")
            .style("padding", "10px")
            .style("border-radius", "5px")
            .style("font-size", "12px");

        // Create the simulation
        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(d => d.source === this.userData.name || d.target === this.userData.name ? 100 : 50))
            .force("charge", d3.forceManyBody())
            .force("center", d3.forceCenter(width / 2, height / 2))
            .on("tick", ticked);

        // Create the SVG container
        const svg = d3.select(this.containerId)
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", [0, 0, width, height])
            .attr("style", "max-width: 100%; height: auto;");

        // Add a line for each link
        const link = svg.append("g")
            .attr("stroke", "#999")
            .attr("stroke-opacity", 0.6)
            .selectAll("line")
            .data(links)
            .join("line")
            .attr("stroke-width", d => Math.sqrt(d.value));

        // Add nodes (user node rendered as a rectangle, others as circles)
        const node = svg.append("g")
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5)
            .selectAll(".node")
            .data(nodes)
            .join("g")
            .attr("class", "node")
            .call(d3.drag()
                .on("start", dragstarted)
                .on("drag", dragged)
                .on("end", dragended))
            .each(function (d) {
                if (d.id === "User") {
                    d3.select(this)
                        .append("rect")
                        .attr("x", -10)
                        .attr("y", -10)
                        .attr("width", 20)
                        .attr("height", 20)
                        .attr("fill", "orange");
                } else {
                    d3.select(this)
                        .append("circle")
                        .attr("r", 5)
                        .attr("fill", d => traitColor(d.group));
                }
            });

        // Add tooltip interaction
        const that = this; // Store reference to NetworkGraph instance
        node.on("mouseover", function (event, d) {
            tooltip.style("visibility", "visible").html(() => {
                if (["intelligence", "strength", "speed", "durability"].includes(d.id)) {
                    return `<strong>${d.id.charAt(0).toUpperCase() + d.id.slice(1)}</strong>`;
                } else if (d.id === "User") {
                    return `<strong>User</strong><br>
                        ${["intelligence", "strength", "speed", "durability"].map(trait => {
                        const value = that.userData[trait];
                        return `<span>${trait}: ${value}</span>`;
                    }).join("<br>")}`;
                } else {
                    const stats = superheroMap.get(d.id) || {};
                    return `<strong>${d.id}</strong><br>
                        ${["intelligence", "strength", "speed", "durability"].map(stat => {
                        const value = stats[stat] || 0;
                        return `<span>${stat}: ${value}</span>`;
                    }).join("<br>")}
                        <br><strong>Alignment:</strong> ${stats.alignment || "unknown"}`;
                }
            });
        })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", `${event.pageY + 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function () {
                tooltip.style("visibility", "hidden");
            });

        // Update positions on each tick
        function ticked() {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        }

        // Drag event functions
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }

        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }

        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
            event.subject.fx = null;
            event.subject.fy = null;
        }

        // Key for traits and alignment
        const updateKey = () => {
            const keySvg = svg.selectAll(".key").remove();
            const key = svg.append("g")
                .attr("class", "key")
                .attr("transform", `translate(${width - 150}, 10)`);

            const keyData = this.coloringMode === "traits"
                ? ["Intelligence", "Strength", "Speed", "Durability"].map((trait, i) => ({
                    label: trait,
                    color: traitColor(i + 1)
                }))
                : [
                    { label: "Good", color: "green" },
                    { label: "Bad", color: "red" },
                    { label: "Neutral", color: "gray" },
                    { label: "Unknown", color: "yellow" }
                ];

            key.selectAll("circle")
                .data(keyData)
                .enter()
                .append("circle")
                .attr("cx", 0)
                .attr("cy", (_, i) => i * 20)
                .attr("r", 5)
                .attr("fill", d => d.color);

            key.selectAll("text")
                .data(keyData)
                .enter()
                .append("text")
                .attr("x", 10)
                .attr("y", (_, i) => i * 20 + 4)
                .text(d => d.label)
                .style("font-size", "12px")
                .style("alignment-baseline", "middle");
        };

        // Initial key
        updateKey();

        // Button to toggle coloring mode
        d3.select(this.containerId)
            .append("button")
            .text("Toggle Alignment/Trait Colors")
            .style("position", "absolute")
            .style("top", "25px")
            .style("right", "450px")
            .style("z-index", "10")
            .style("padding", "7px 7px")
            .style("background-color", "#007bff")
            .style("color", "#fff")
            .style("border", "none")
            .style("border-radius", "5px")
            .style("cursor", "pointer")
            .on("click", () => {
                this.coloringMode = this.coloringMode === "traits" ? "alignment" : "traits";
                node.select("circle, rect").attr("fill", d => this.coloringMode === "traits"
                    ? traitColor(d.group)
                    : alignmentColor(superheroMap.get(d.id)?.alignment || "unknown")
                );
                updateKey(); // Update the key to reflect the new coloring mode
            });
    }
}
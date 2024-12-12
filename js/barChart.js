class BarChart {
    constructor(selector, data) {
        this.selector = selector;
        this.data = data;

        this.characterCounts = {};

        // Dimensions and margins
        this.margin = { top: 20, right: 20, bottom: 50, left: 60 };
        this.width = 500 - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;

        // Attributes to visualize
        this.attributes = ['intelligence', 'strength', 'speed', 'durability'];

        // Colors for alignments
        this.colorMap = {
            Good: '#28a745', // Green
            Bad: '#dc3545', // Red
            Neutral: '#007bff' // Blue
        };

        this.initVis();
    }

    initVis() {
        let vis = this;

        // Set up SVG
        vis.svg = d3.select(vis.selector)
            .append('svg')
            .attr('width', vis.width + vis.margin.left + vis.margin.right)
            .attr('height', vis.height + vis.margin.top + vis.margin.bottom);

        vis.chartGroup = vis.svg.append('g')
            .attr('transform', `translate(${vis.margin.left}, ${vis.margin.top})`);

        // Set up scales
        vis.xScale = d3.scaleBand()
            .range([0, vis.width])
            .padding(0.2);

        vis.yScale = d3.scaleLinear()
            .range([vis.height, 0]);

        // Add axes
        vis.xAxisGroup = vis.chartGroup.append('g')
            .attr('transform', `translate(0, ${vis.height})`);

        vis.yAxisGroup = vis.chartGroup.append('g');

        // Add axis labels
        vis.chartGroup.append('text')
            .attr('class', 'x-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', vis.width / 2)
            .attr('y', vis.height + vis.margin.bottom - 10)
            .text('Alignment');

        vis.chartGroup.append('text')
            .attr('class', 'y-axis-label')
            .attr('text-anchor', 'middle')
            .attr('x', -vis.height / 2)
            .attr('y', -vis.margin.left + 15)
            .attr('transform', 'rotate(-90)')
            .text('Average Value');

        // Add subtle hover effect
        vis.chartGroup.selectAll('.bar')
            .on('mouseover', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 0.7);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('opacity', 1);
            });

        vis.updateVis('intelligence'); // Default attribute to display
    }

    wrangleData(attribute) {
        let vis = this;

        // Compute average attribute value per alignment and count total characters
        const groupedData = d3.group(vis.data, d => d.alignment?.toLowerCase());
        vis.displayData = Array.from(groupedData, ([alignment, entries]) => {
            const formattedAlignment = alignment
                ? alignment.charAt(0).toUpperCase() + alignment.slice(1)
                : 'Neutral'; // Default to Neutral if missing
            return {
                alignment: formattedAlignment,
                average: d3.mean(entries, d => +d[attribute] || 0),
                total: entries.length // Total number of characters with this alignment
            };
        }).filter(d => ['Good', 'Bad', 'Neutral'].includes(d.alignment)); // Exclude unknown
    }

    updateVis(attribute) {
        let vis = this;

        vis.wrangleData(attribute);

        // Update scales
        vis.xScale.domain(vis.displayData.map(d => d.alignment));
        vis.yScale.domain([0, d3.max(vis.displayData, d => d.average)]);

        // Tooltip setup
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip')
            .style('position', 'absolute')
            .style('background', '#f4f4f4')
            .style('padding', '8px')
            .style('border', '1px solid #ddd')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Bind data to bars
        const bars = vis.chartGroup.selectAll('.bar')
            .data(vis.displayData, d => d.alignment);

        // Enter
        const barsEnter = bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .style('fill', d => vis.colorMap[d.alignment] || '#999')
            .attr('x', d => vis.xScale(d.alignment))
            .attr('width', vis.xScale.bandwidth())
            .attr('y', vis.height)
            .attr('height', 0);

        // Add hover interactions with tooltip
        barsEnter.merge(bars)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('fill', d3.color(vis.colorMap[d.alignment]).darker(0.5));

                tooltip.style('opacity', 1)
                    .html(`
                    <strong>Alignment:</strong> ${d.alignment}<br>
                    <strong>Total Characters:</strong> ${d.total}<br>
                    <strong>Average:</strong> ${d.average.toFixed(2)}
                `)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mousemove', function(event) {
                tooltip.style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 28}px`);
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .style('fill', d => vis.colorMap[d.alignment] || '#999');

                tooltip.style('opacity', 0);
            });

        // Transition bars
        barsEnter.merge(bars)
            .transition()
            .duration(800)
            .attr('x', d => vis.xScale(d.alignment))
            .attr('y', d => vis.yScale(d.average))
            .attr('width', vis.xScale.bandwidth())
            .attr('height', d => vis.height - vis.yScale(d.average));

        // Exit
        bars.exit()
            .transition()
            .duration(400)
            .attr('y', vis.height)
            .attr('height', 0)
            .remove();

        // Update axes
        vis.xAxisGroup
            .transition()
            .duration(800)
            .call(d3.axisBottom(vis.xScale));

        vis.yAxisGroup
            .transition()
            .duration(800)
            .call(d3.axisLeft(vis.yScale)
                .tickFormat(d3.format('.2f'))
            );

        // Add value labels
        const valueLabels = vis.chartGroup.selectAll('.value-label')
            .data(vis.displayData);

        valueLabels.enter()
            .append('text')
            .attr('class', 'value-label')
            .merge(valueLabels)
            .transition()
            .duration(800)
            .attr('x', d => vis.xScale(d.alignment) + vis.xScale.bandwidth() / 2)
            .attr('y', d => vis.yScale(d.average) - 5)
            .attr('text-anchor', 'middle')
            .text(d => d.average.toFixed(2))
            .style('font-size', '10px')
            .style('fill', 'black');

        valueLabels.exit().remove();
    }
}

// Example Usage
document.addEventListener('DOMContentLoaded', () => {
    d3.csv('data/superhero_data.csv').then(data => {
        const barChart = new BarChart('#bar-chart', data);

        // Populate dropdown menu
        const dropdown = d3.select('#attribute-select');
        barChart.attributes.forEach(attr => {
            dropdown.append('option')
                .attr('value', attr)
                .text(attr.charAt(0).toUpperCase() + attr.slice(1)); // Capitalize first letter
        });

        // Dropdown to change attribute
        dropdown.on('change', event => {
            const selectedAttribute = event.target.value;
            barChart.updateVis(selectedAttribute.toLowerCase());
        });
    });
});

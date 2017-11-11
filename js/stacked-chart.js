
StackedPlot = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
}

StackedPlot.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 20, right: 100, bottom: 20, left: 50 };

    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 120 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select('#' + vis.parentElement)
        .append('svg')
        .attr('width', vis.width + vis.margin.left + vis.margin.right)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .attr('class', 'scatter-plot')
        .append('g')
        .attr('transform', "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.yScale = d3.scaleBand()
        .rangeRound([0, vis.height])
        .paddingInner(0.05)
        .align(0.1)
        .domain(vis.data.map(function(d) { return d.group; }));

    vis.xScale = d3.scaleLinear()
        .rangeRound([0, vis.width]);

    vis.colorScale = d3.scaleOrdinal()
        .range(standardColors)
        .domain(['Mass', 'Boston', 'Dr. Neel']);

    vis.numFormat = d3.format(",.2f");

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale)
        .tickFormat(d3.format('.0%'));

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.toolTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0]);

    vis.wrangleData();

}

StackedPlot.prototype.wrangleData = function(){
    var vis = this;

    var procedureType = $('#procedure-type').find(':selected').val();

    vis.displayData = vis.data.filter(function(d) {
        return d.procedure === procedureType;
    });

    console.log('bar data');
    console.log(vis.displayData);

    // Update the visualization
    vis.updateVis();
}

StackedPlot.prototype.updateVis = function() {
    var vis = this;

    var metricType = $('#metric-type').find(':selected').val() + '_diff';
    var xScaleDomain =  Math.max(d3.max(vis.data, function(d) { return d[metricType];}), .20);
    vis.xScale.domain([-xScaleDomain, xScaleDomain]);

    vis.toolTip.html(function(d) { return d3.format('.0%')(d.chosen_metric); });

    vis.svg.call(vis.toolTip);

    var bars = vis.svg.selectAll('.bar')
        .data(vis.displayData);

    bars.enter()
        .append('rect')
        .attr('class', 'bar')
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) {
            return vis.colorScale(d.group);
        })
        .attr("y", function(d) {return vis.yScale(d.group);})
        .attr("x", function(d) {return vis.xScale(Math.min(0, d[metricType])); })
        .attr("width", function(d) { return Math.abs(vis.xScale(d[metricType]) - vis.xScale(0)); })
        .attr("height", vis.yScale.bandwidth());

    bars.exit().remove();

    vis.svg.select(".x-axis").transition().duration(200).call(vis.xAxis);

    var lineMarker = vis.svg.selectAll('.vlines')
        .data([{name:'threshold', value:.20}, {name:'zero_marker', value:0}]);

    lineMarker.enter()
        .append('line')
        .attr('class', 'vlines')
        .merge(lineMarker)
        .transition()
        .duration(1000)
        .attr('x1', function(d) {return vis.xScale(d.value); })
        .attr('x2', function(d) {return vis.xScale(d.value); })
        .attr('y1', 0)
        .attr('y2', vis.height)
        .attr('stroke', function(d) {
            if (d.name === 'threshold') {
                if (d3.max(vis.displayData, function(d) { return d[metricType];}) > d.value) {
                    return 'white';
                } else {
                    return 'black';
                }
            } else {
                return 'white';
            }
        });

    lineMarker.exit().remove();

    var thresholdLabel = vis.svg.selectAll('.thresholdLabel')
        .data([{name:'MGH Premium', value:.20}]);

    thresholdLabel.enter()
        .append('text')
        .attr('class', 'thresholdLabel')
        .merge(thresholdLabel)
        .transition()
        .duration(1000)
        .attr('x', function(d) {return vis.xScale(d.value) - 40})
        .attr('y', -5)
        .text(function(d) { return d.name;} );

    thresholdLabel.exit().remove();
}
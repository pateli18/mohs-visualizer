
StackedPlot = function(_parentElement, _data, _comparisonSet) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.comparisonSet = _comparisonSet

    this.initVis();
}

StackedPlot.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 20, right: 100, bottom: 20, left: 80 };

    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right,
        vis.height = 180 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select('#' + vis.parentElement)
        .append('svg')
        .attr('width', vis.width + vis.margin.left + vis.margin.right)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .attr('class', 'stacked-chart')
        .append('g')
        .attr('transform', "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.yScale = d3.scaleLinear()
        .rangeRound([vis.height, 0])
        .domain([-.2, .4]);

    vis.x0Scale = d3.scaleBand()
        .rangeRound([0, vis.width])
        .paddingInner(0.1)
        .domain([2012, 2013, 2014, 2015]);

    vis.x1Scale = d3.scaleBand()
        .padding(0.05)
        .domain(['Mass', 'Boston'])
        .rangeRound([0, vis.x0Scale.bandwidth()]);

    vis.colorScale = d3.scaleOrdinal()
        .range(standardColors)
        .domain(['Mass', 'Boston', 'Dr. Neel']);

    vis.xAxis = d3.axisBottom()
        .scale(vis.x0Scale)
        .tickFormat(d3.format('.0f'));

    vis.yAxis = d3.axisLeft()
        .scale(vis.yScale)
        .tickFormat(d3.format('.0%'));

    vis.svg.append("g")
        .attr("class", "x-axis axis no-line")
        .attr("transform", "translate(0," + vis.height + ")");

    vis.svg.append("g")
        .attr("class", "y-axis axis");

    vis.toolTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0]);

    vis.zeroAxis = vis.svg.append("g")
        .attr("class", "zero-axis")
        .append("line")
        .attr("y1", vis.yScale(0))
        .attr("y2", vis.yScale(0))
        .attr("x1", 0)
        .attr("x2", vis.width);

    vis.chartTitle = vis.svg.append("text")
        .attr("class", "sub-chart-title")
        .attr("transform", "translate(" + (vis.width / 3.5) + ", " + (0 - 10) + ")");

    vis.wrangleData();

}

StackedPlot.prototype.wrangleData = function(){
    var vis = this;

    var procedureType = $('#procedure-type').find(':selected').val();
    var metricType = $('#metric-type').find(':selected').val();

    vis.displayData = vis.data.filter(function(d) {
        return d.procedure === procedureType;
    });

    vis.displayData.forEach(function(d) {
        d.differential = d[metricType] - vis.comparisonSet[d.year][procedureType][metricType];
    });

    // Update the visualization
    vis.updateVis();
}

StackedPlot.prototype.updateVis = function() {
    var vis = this;

    vis.toolTip.html(function(d) {
        return d.differential;
    });

    vis.svg.call(vis.toolTip);

    console.log(vis.displayData)
    var barGroup = vis.svg.selectAll('.bar-group')
        .data(vis.displayData);

    barGroup.enter().append("g")
        .attr('class', 'bar-group');

    barGroup.exit().remove();

    vis.svg.selectAll(".bar-group").transition().duration(1000)
        .attr("transform", function(d) { return "translate(" + vis.x0Scale(d.year) + ",0)"; });


    var bars = vis.svg.selectAll(".bar-group").selectAll("rect")
        .data(function(d) {
            var subData = vis.displayData.filter(function(x) {
                return x.year === d.year;
            });
            return subData;
        });

    bars.enter().append("rect")
        .attr("fill", function(d) { return vis.colorScale(d.group); })
        .attr("width", vis.x1Scale.bandwidth())
        .transition()
        .duration(1000)
        .attr("x", function(d) { return vis.x1Scale(d.group); })
        .attr("y", function(d) {
            if (d.differential > 0) {
                return vis.yScale(d.differential);
            } else {
                return vis.yScale(0);
            }
        })
        .attr("height", function(d) { return Math.abs(vis.yScale(d.differential) - vis.yScale(0)); });

    bars
        .transition().duration(1000)
        .attr("y", function(d) {
            if (d.differential > 0) {
                return vis.yScale(d.differential);
            } else {
                return vis.yScale(0);
            }
        })
        .attr("height", function(d) { return Math.abs(vis.yScale(d.differential) - vis.yScale(0)); });

    bars.exit().remove();

    vis.svg.select(".x-axis").transition().duration(200).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(200).call(vis.yAxis);

    vis.svg.select(".y-label").text('% Greater (Lower)' + metricType +  'Than Dr. Neel')

    var metricType = $('#metric-type').find(':selected').text();
    vis.chartTitle.text(metricType + ' Premium (Discount) to Dr. Neel');

    var mghThreshold = vis.svg.selectAll('.mgh-threshold')
        .data([0, .2]);

    mghThreshold.enter()
        .append('line')
        .attr('class', 'mgh-threshold')
        .merge(mghThreshold)
        .transition()
        .duration(1000)
        .attr('x1', 0)
        .attr('x2', vis.width)
        .attr('y1', vis.yScale(.20))
        .attr('y2', vis.yScale(.20));

    mghThreshold.exit().remove();

    var mghThresholdLabel = vis.svg.selectAll('.mgh-threshold-label')
        .data([.2]);

    mghThresholdLabel.enter()
        .append('text')
        .attr('class', 'mgh-threshold-label')
        .merge(mghThresholdLabel)
        .transition()
        .duration(1000)
        .attr('x', vis.width)
        .attr('y', vis.yScale(.20))
        .text('MGH Premium');
    /*
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
    */
}
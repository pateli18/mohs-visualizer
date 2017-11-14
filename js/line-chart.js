
LinePlot = function(_parentElement, _data) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;

    this.initVis();
}


LinePlot.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 50, right: 100, bottom: 100, left: 80 };

    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    vis.height = 300 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select('#' + vis.parentElement)
        .append('svg')
        .attr('width', vis.width + vis.margin.left + vis.margin.right)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .attr('class', 'scatter-plot')
        .append('g')
        .attr('transform', "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.xScale = d3.scalePoint()
        .domain([2012, 2013, 2014, 2015])
        .rangeRound([0, vis.width])
        .padding(.1);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0]);

    vis.colorScale = d3.scaleOrdinal()
        .range(standardColors)
        .domain(['Mass', 'Boston', 'Dr. Neel']);

    vis.line = d3.line()
        .x(function(d) { return vis.xScale(d.year); } )
        .y(function(d) { return vis.yScale(d.chosen_metric); });

    vis.area = d3.area()
        .x(function(d) { return vis.xScale(d.year);})
        .y0(function(d) { return vis.yScale(d.chosen_metric - d.chosen_std); })
        .y1(function(d) { return vis.yScale(d.chosen_metric + d.chosen_std); });

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale)
        .tickFormat(d3.format('.0f'));

    vis.yAxis = d3.axisLeft()
        .scale(vis.yScale)
        .tickFormat(d3.format('.0%'));

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .append('text')
        .attr('transform', "translate(" + (vis.width - 20) + ",-5)")
        .attr('class', 'axis-label')
        .text('Year');

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .append('text')
        .attr('class', 'y-label')
        .attr("text-anchor", "middle")  // this makes it easy to centre the text as the transform is applied to the anchor
        .attr("transform", "translate("+ (-50) +","+(vis.height/2)+")rotate(-90)")  // text is drawn off the screen top left, move down and out and rotate
        .text("(Additional Stages + Closure) / Initial Stage");

    vis.toolTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0]);

    vis.svg.append("g")
        .attr("class", "legendOrdinal")
        .attr("transform", "translate(" + (vis.width / 2.3) + ", " + (vis.height + 50) + ")");

    vis.legendOrdinal = d3.legendColor()
        .shape('circle')
        .shapePadding(30)
        .orient('horizontal')
        .scale(vis.colorScale);

    vis.chartTitle = vis.svg.append("text")
                        .attr("class", "chart-title")
                        .attr("transform", "translate(" + (vis.width / 3.5) + ", " + (0 - 10) + ")");

    vis.wrangleData();

}

LinePlot.prototype.wrangleData = function(){
    var vis = this;

    var metricType = $('#metric-type').find(':selected').val();
    var metricTypeStd = metricType.replace('mean', 'std');
    var procedureType = $('#procedure-type').find(':selected').val();

    vis.displayData = vis.data.filter(function(d) {
       return d.procedure === procedureType;
    });

    vis.displayData.forEach(function(d) {
        d.chosen_metric = d[metricType];
        d.chosen_std = d[metricTypeStd];
    });

    //var yScaleValues = d3.extent(vis.displayData, function(d) { return d.chosen_metric; });
    //var yScalar = 0.2;
    //vis.yScale.domain([Math.max(yScaleValues[0] - yScalar, 0), yScaleValues[1] + yScalar]);
    vis.yScale.domain([0, 1.5])

    vis.displayData = d3.nest()
            .key(function(d) {return d.group;})
            .entries(vis.displayData);

    // Update the visualization
    vis.updateVis();
}

LinePlot.prototype.updateVis = function() {
    var vis = this;

    vis.toolTip.html(function(d) { return d3.format('.0%')(d.chosen_metric); });

    vis.svg.call(vis.toolTip);

    /*
    var metricArea = vis.svg.selectAll('.metric-area')
        .data(vis.displayData);

    metricArea.enter()
        .append('path')
        .attr('class', 'metric-area')
        .merge(metricArea)
        .transition()
        .duration(1000)
        .attr('d', function(d) { return vis.area(d.values); })
        .style('fill', function(d) {
            return vis.colorScale(d.key);
        });

    metricArea.exit().remove();
    */

    var metricLine = vis.svg.selectAll('.metric-line')
        .data(vis.displayData);

    metricLine.enter()
        .append('path')
        .attr('class', 'metric-line')
        .merge(metricLine)
        .transition()
        .duration(1000)
        .attr('d', function(d) { return vis.line(d.values); })
        .style("stroke", function(d) {
            return vis.colorScale(d.key);
        });

    metricLine.exit().remove();

    var circles_data = [];
    vis.displayData.forEach(function(subelements) {
        subelements.values.forEach(function(d) {
            circles_data.push(d);
        });
    });

    var metricPoint = vis.svg.selectAll('.metric-point')
        .data(circles_data);

    metricPoint.enter()
        .append('circle')
        .attr('class', 'metric-point')
        .on('mouseover', vis.toolTip.show)
        .on('mouseout', vis.toolTip.hide)
        .merge(metricPoint)
        .transition()
        .duration(1000)
        .attr('r', 3)
        .attr('cx', function(d) {
            return vis.xScale(d.year);
        })
        .attr('cy', function(d) {
            return vis.yScale(d.chosen_metric);
        })
        .attr('fill', function(d) {
            return vis.colorScale(d.group);
        });

    metricPoint.exit().remove();

    var label_data = [];
    vis.displayData.forEach(function(d) {
        if (d.key === 'Dr. Neel') {
            label_data.push(d.values[d.values.length - 1]);
        }
    });

    var lineLabel = vis.svg.selectAll('.line-label')
        .data(label_data);

    lineLabel.enter()
        .append('text')
        .attr('class', 'line-label')
        .merge(lineLabel)
        .transition()
        .duration(1000)
        .attr('x', vis.width)
        .attr('y', function(d) {
            return vis.yScale(d.chosen_metric);
        })
        .attr('fill', function(d) { return vis.colorScale(d.group); })
        .text(function(d) {return d.group; });

    vis.svg.select(".x-axis").transition().duration(200).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(200).call(vis.yAxis);

    vis.svg.select(".legendOrdinal").call(vis.legendOrdinal);

    var chartTitle = $('#metric-type').find(':selected').text();
    chartTitle = chartTitle.replace('Procedure ', '');
    chartTitle = 'Additional ' + chartTitle + ' per Procedure';
    vis.chartTitle.text(chartTitle);
}

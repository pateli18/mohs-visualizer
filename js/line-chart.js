
LinePlot = function(_parentElement, _data, _title) {
    this.parentElement = _parentElement;
    this.data = _data;
    this.displayData = _data;
    this.title = _title;

    this.initVis();
}


LinePlot.prototype.initVis = function() {
    var vis = this;

    vis.margin = { top: 50, right: 200, bottom: 20, left: 30 };

    vis.width = $('#' + vis.parentElement).width() - vis.margin.left - vis.margin.right,
    vis.height = 400 - vis.margin.top - vis.margin.bottom;

    vis.svg = d3.select('#' + vis.parentElement)
        .append('svg')
        .attr('width', vis.width + vis.margin.left + vis.margin.right)
        .attr('height', vis.height + vis.margin.top + vis.margin.bottom)
        .attr('class', 'scatter-plot')
        .append('g')
        .attr('transform', "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.xScale = d3.scaleLog()
        .range([0, vis.width]);

    vis.yScale = d3.scaleLinear()
        .range([vis.height, 0])
        .domain([0, 100]);

    vis.radiusScale = d3.scaleQuantize()
        .range([3, 6, 9, 12, 15, 18, 21]);

    vis.colorScale = d3.scaleOrdinal(d3.schemeCategory10);

    vis.numFormat = d3.format(",.0f");

    vis.xAxis = d3.axisBottom()
        .scale(vis.xScale)
        .tickFormat(vis.numFormat);

    vis.yAxis = d3.axisLeft()
        .scale(vis.yScale);

    vis.svg.append("g")
        .attr("class", "x-axis axis")
        .attr("transform", "translate(0," + vis.height + ")")
        .append('text')
        .attr('transform', "translate(" + (vis.width - 20) + ",-5)")
        .attr('class', 'axis-label')
        .text('Population');

    vis.svg.append("g")
        .attr("class", "y-axis axis")
        .append('text')
        .attr('transform', "translate(15,0) rotate(270)")
        .attr('class', 'axis-label');

    vis.toolTip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([-8, 0]);

    vis.svg.append("g")
        .attr("class", "legendSequential")
        .attr("transform", "translate(" + (vis.width + 30) + ", " + (vis.height / 1.65) + ")");

    vis.legendRegion = d3.legendColor()
        .shapeWidth(30)
        .cells(6)
        .orient("vertical")
        .title('Region');

    vis.svg.append("g")
        .attr("class", "legendSize")
        .attr("transform", "translate(" + (vis.width + 30) + ", " + 0 + ")");

    vis.legendSize = d3.legendSize()
        .shape('circle')
        .shapePadding(1)
        .labelOffset(20)
        .orient('vertical')
        .labelFormat(function(d) {
            return d3.format('.0f')(d / 1000000) + 'M';
        });

    add_data_footnote('#scatter-plot');

    vis.wrangleData('all', 'At_high_risk', 'Malaria_cases');

}

LinePlot.prototype.wrangleData = function(region_filter, risk_metric, case_metric){
    var vis = this;

    if (region_filter != 'all') {
        vis.displayData = vis.data.filter(function(d) {
            return d.WHO_region == region_filter;
        });
    } else {
        vis.displayData = vis.data;
    }

    vis.displayData = vis.displayData.filter(function(d) {
        return !(isNaN(d[risk_metric])) && !(isNaN(d.UN_population)) && !(isNaN(d[case_metric]));
    });

    vis.displayData.forEach(function(d) {
        d['population_at_risk'] = d[risk_metric] / 100 * d.UN_population;
    });

    vis.displayData.sort(function(a, b) {
       return b[case_metric] - a[case_metric];
    });

    // Update the visualization
    vis.updateVis(risk_metric, case_metric);
}

function format_case_metric_text(value) {
    if (value == 'Malaria_cases') {
        return 'Diagnosed Cases';
    } else if (value == 'Suspected_malaria_cases') {
        return 'Suspected Cases';
    } else {
        return 'Population at Risk';
    }
}

LinePlot.prototype.updateVis = function(risk_metric, case_metric) {
    var vis = this;

    var xScaleDomain = d3.extent(vis.displayData, function(d) { return d.UN_population; });
    vis.xScale.domain([xScaleDomain[0] - 50000, xScaleDomain[1] + 50000]);

    var tickValues;
    if (xScaleDomain[1] < 1000000000) {
        tickValues = [250000,1000000, 10000000, 100000000];
    } else {
        tickValues = [250000,1000000, 10000000, 100000000,1000000000];
    }

    vis.radiusScale.domain(d3.extent(vis.displayData, function(d) { return d[case_metric]; }));

    var risk_metric_text = risk_metric.replace('At_', '% at ').replace('_', ' ');
    var case_metric_text = format_case_metric_text(case_metric);

    vis.toolTip.html(function(d) {
        return  '<div style="text-align: center";>'
                + '<strong>' + d.Country + '</strong><br>'
                + '<span style="color:' + vis.colorScale(d.WHO_region) + '";>' + d.WHO_region + '</span><br>'
                + '</div>'
                + '<span><strong>Population</strong>: ' + vis.numFormat(d.UN_population) + '</span><br>'
                + '<span><strong>' + risk_metric_text + '</strong>: ' + d[risk_metric] + '%</span><br>'
                + '<span><strong>' + case_metric_text + '</strong>: ' + vis.numFormat(d[case_metric]) + '</span>';
    });

    vis.svg.call(vis.toolTip);

    var point = vis.svg.selectAll('.point')
        .data(vis.displayData)

    point.enter()
        .append('circle')
        .attr('class', 'point')
        .on('mouseover', vis.toolTip.show)
        .on('mouseout', vis.toolTip.hide)
        .merge(point)
        .transition()
        .duration(1000)
        .attr('cx', function(d) {
            return vis.xScale(d.UN_population);
        })
        .attr('cy', function(d) {
            return vis.yScale(d[risk_metric]);
        })
        .attr('r', function(d) {
            return vis.radiusScale(d[case_metric]);
        })
        .attr('fill', function(d) {
            return vis.colorScale(d.WHO_region);
        })
        .attr('stroke', 'black');

    point.exit().remove();

    vis.xAxis.tickValues(tickValues);
    vis.svg.select(".x-axis").transition().duration(200).call(vis.xAxis);
    vis.svg.select(".y-axis").transition().duration(200).call(vis.yAxis);
    vis.svg.select(".y-axis").select('text').text(risk_metric_text);

    vis.legendRegion.scale(vis.colorScale);
    vis.svg.select(".legendSequential").call(vis.legendRegion);

    vis.legendSize.scale(vis.radiusScale).title(case_metric_text);
    vis.svg.select(".legendSize").call(vis.legendSize);

    update_case_count(vis.numFormat(d3.sum(vis.displayData, function(d) { return d[case_metric]})));
}


var line_plot;
var stacked_plot;

var baseTableData;
var displayTableData;
var tableHeaders = ['hcpcs_code', 'hcpcs_description'];

var standardColors = ['#43956f', '#fb4d42', '#228eae'];

d3.csv("data/line_chart_data.csv", function(data) {

    // Analyze the dataset in the web console

    data.forEach(function(d) {
        d.count_mean = +d.count_mean;
        d.count_std = +d.count_std;
        d.premium_mean = +d.premium_mean;
        d.premium_std = +d.premium_std;
        d.year = +d.year;
    });

    line_plot = new LinePlot('line-chart', data);

    var drNeelComparisonSet = data.filter(function(d) {
        return d.group === 'Dr. Neel';
    });

    var bostonMassSet = data.filter(function(d) {
       return d.group != 'Dr. Neel';
    });

    var drNeelComparisons = {2012:{}, 2013:{}, 2014:{}, 2015:{}};
    drNeelComparisonSet.forEach(function(d) {
        drNeelComparisons[d.year][d.procedure] = {premium_mean:d.premium_mean, count_mean:d.count_mean};
    });

    stacked_plot = new StackedPlot('stacked-chart', bostonMassSet, drNeelComparisons);

});

d3.csv('data/procedure_description.csv', function(data) {

    baseTableData = data;
    updateTable();
});

function updatePlots() {
    line_plot.wrangleData();
    stacked_plot.wrangleData();
    updateTable();
}

function updateTable() {
    var procedureType = $('#procedure-type').find(':selected').val();

    displayTableData = baseTableData.filter(function(d) {
        return d[procedureType] === 'True';
    });

    displayTableData.sort(function(a, b) {
        return b.hcpcs_code - a.hcpcs_code;
    });

    var table_body = document.getElementById('data-table-body');

    while (table_body.firstChild) {
        table_body.removeChild(table_body.firstChild);
    }

    displayTableData.forEach(function(d) {
        var table_row = document.createElement("TR");
        for (j = 0; j < tableHeaders.length; j++) {
            var table_cell = document.createElement("TD");
            table_cell.innerHTML = d[tableHeaders[j]];
            table_row.appendChild(table_cell);
        }
        table_body.appendChild(table_row)
    });
}

